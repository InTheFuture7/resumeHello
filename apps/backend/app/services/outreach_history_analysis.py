"""Outreach history analysis service.

This module provides the business logic for the history analysis feature:
- Deduplication of outreach records
- First-stage LLM analysis: grouping job types
- Second-stage LLM analysis: job type detail analysis
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.llm import complete_json
from app.prompts.templates import get_language_name
from app.schemas.models import (
    AnalysisJobInput,
    DedupedJobItem,
    GroupDetailResponse,
    GroupsAnalysisResponse,
    JobGroupItem,
    UnparsedJobItem,
)

logger = logging.getLogger(__name__)

# Maximum number of jobs sent to the LLM in either analysis stage.
MAX_ANALYSIS_JOB_LIMIT = 30

# ------------------------------------------------------------------ #
# Text normalization                                                   #
# ------------------------------------------------------------------ #

_MULTI_SPACE_RE = re.compile(r"\s+")


def normalize_text(text: str) -> str:
    """Normalize a string: strip, collapse whitespace, lower-case."""
    return _MULTI_SPACE_RE.sub(" ", text.strip()).lower()


def generate_job_key(company_name: str, job_title: str) -> str:
    """Build a stable job_key from company and title.

    The ``::`` separator is escaped inside each component to avoid
    ambiguity when splitting later.
    """
    safe_company = normalize_text(company_name).replace("::", " ")
    safe_title = normalize_text(job_title).replace("::", " ")
    return f"{safe_company}::{safe_title}"


# ------------------------------------------------------------------ #
# Deduplication                                                        #
# ------------------------------------------------------------------ #


def dedup_outreach_records(
    records: list[dict[str, Any]],
) -> tuple[list[DedupedJobItem], list[UnparsedJobItem]]:
    """Split and deduplicate raw outreach records.

    Returns:
        (jobs, unparsed_jobs):
          - jobs: deduplicated list sorted by latest_applied_at desc
          - unparsed_jobs: records missing company_name or job_title,
            kept in full (no dedup), sorted by created_at desc
    """
    parsed_groups: dict[str, list[dict[str, Any]]] = {}
    unparsed: list[dict[str, Any]] = []

    for record in records:
        parsed_job: dict[str, Any] = record.get("parsed_job") or {}
        raw_company = parsed_job.get("company_name") or ""
        raw_title = parsed_job.get("job_title") or ""

        norm_company = normalize_text(raw_company)
        norm_title = normalize_text(raw_title)

        if not norm_company or not norm_title:
            unparsed.append(record)
            continue

        key = generate_job_key(raw_company, raw_title)
        parsed_groups.setdefault(key, []).append(record)

    # Build deduplicated job items
    jobs: list[DedupedJobItem] = []
    for job_key, group in parsed_groups.items():
        # Most recent first within the group
        group_sorted = sorted(
            group, key=lambda r: r.get("created_at", ""), reverse=True
        )
        representative = group_sorted[0]
        parsed_job = representative.get("parsed_job") or {}

        jobs.append(
            DedupedJobItem(
                job_key=job_key,
                sample_record_id=representative.get("record_id", ""),
                company_name=parsed_job.get("company_name", ""),
                job_title=parsed_job.get("job_title", ""),
                job_description=parsed_job.get("job_description", ""),
                requirements=parsed_job.get("requirements") or [],
                bonus_items=parsed_job.get("bonus_items") or [],
                duplicate_count=len(group),
                latest_applied_at=representative.get("created_at", ""),
            )
        )

    # Sort deduped jobs by latest_applied_at desc
    jobs.sort(key=lambda j: j.latest_applied_at, reverse=True)

    # Build unparsed items (no dedup, sorted by created_at desc)
    unparsed_sorted = sorted(
        unparsed, key=lambda r: r.get("created_at", ""), reverse=True
    )
    unparsed_items: list[UnparsedJobItem] = []
    for record in unparsed_sorted:
        parsed_job = record.get("parsed_job") or {}
        raw_text = parsed_job.get("raw_text") or parsed_job.get("job_description") or ""
        unparsed_items.append(
            UnparsedJobItem(
                record_id=record.get("record_id", ""),
                company_name=parsed_job.get("company_name", ""),
                job_title=parsed_job.get("job_title", ""),
                raw_text_preview=raw_text[:200],
                created_at=record.get("created_at", ""),
            )
        )

    return jobs, unparsed_items


# ------------------------------------------------------------------ #
# Stage 1: group-type analysis                                         #
# ------------------------------------------------------------------ #

_GROUPS_SYSTEM_PROMPT = (
    "You are an expert career analyst. "
    "Analyze job posting lists and group semantically similar roles. "
    "Respond with strict JSON only."
)

_GROUPS_PROMPT_TEMPLATE = """\
You are given a list of deduplicated job postings that a candidate has applied for.
Your task: group these jobs into semantic job-type categories.

IMPORTANT:
- output_language = {output_language}
- All text you generate (group_name, summary) MUST be in {output_language}.
- Group jobs by their actual role essence, not just the literal title.
- Merge roles that are different in name but equivalent in substance into one group.
- Avoid over-splitting similar roles into separate groups.
- Each input job_key MUST appear in exactly one group's job_keys list.
- If a job truly cannot be categorized, omit it from all groups (the caller handles uncategorized jobs).
- Only use job_keys that exist in the input list.

Input jobs (JSON array):
{jobs_json}

Return strict JSON in this exact format:
{{
  "groups": [
    {{
      "group_id": "group-1",
      "group_name": "...",
      "summary": "...",
      "job_keys": ["..."],
      "sample_titles": ["..."],
      "count": <number of job_keys in this group>
    }}
  ]
}}
"""


def _truncate_jobs_for_analysis(jobs: list[AnalysisJobInput]) -> list[AnalysisJobInput]:
    """Sort by latest_applied_at desc and keep at most MAX_ANALYSIS_JOB_LIMIT."""
    sorted_jobs = sorted(jobs, key=lambda j: j.latest_applied_at, reverse=True)
    return sorted_jobs[:MAX_ANALYSIS_JOB_LIMIT]


def _build_jobs_payload_for_prompt(jobs: list[AnalysisJobInput]) -> list[dict[str, Any]]:
    """Strip auxiliary fields not needed in the LLM prompt."""
    return [
        {
            "job_key": j.job_key,
            "company_name": j.company_name,
            "job_title": j.job_title,
            "job_description": j.job_description,
            "requirements": j.requirements,
            "bonus_items": j.bonus_items,
        }
        for j in jobs
    ]


async def analyze_job_groups(
    jobs: list[AnalysisJobInput],
    language: str = "zh",
) -> GroupsAnalysisResponse:
    """Call the LLM to group jobs into role types (stage 1).

    The backend truncates the input to MAX_ANALYSIS_JOB_LIMIT before sending
    to the LLM. Coverage and exclusivity constraints are enforced here.
    """
    truncated_from_total = len(jobs)
    analyzed_jobs = _truncate_jobs_for_analysis(jobs)
    analyzed_job_count = len(analyzed_jobs)

    output_language = get_language_name(language)
    prompt = _GROUPS_PROMPT_TEMPLATE.format(
        output_language=output_language,
        jobs_json=json.dumps(_build_jobs_payload_for_prompt(analyzed_jobs), ensure_ascii=False),
    )

    raw_result = await complete_json(
        prompt=prompt,
        system_prompt=_GROUPS_SYSTEM_PROMPT,
        max_tokens=2048,
    )

    # --- Parse and validate LLM output ---
    input_keys: set[str] = {j.job_key for j in analyzed_jobs}
    assigned_keys: set[str] = set()
    groups: list[JobGroupItem] = []

    raw_groups = raw_result.get("groups") if isinstance(raw_result, dict) else []
    if not isinstance(raw_groups, list):
        raw_groups = []

    for i, raw_group in enumerate(raw_groups):
        if not isinstance(raw_group, dict):
            continue

        # Filter to only valid, unassigned job_keys
        raw_keys: list[str] = raw_group.get("job_keys") or []
        valid_keys: list[str] = []
        for k in raw_keys:
            if k in input_keys and k not in assigned_keys:
                valid_keys.append(k)
                assigned_keys.add(k)

        if not valid_keys:
            continue

        group_id = raw_group.get("group_id") or f"group-{i + 1}"
        sample_titles: list[str] = raw_group.get("sample_titles") or []
        if not sample_titles:
            # Derive sample titles from the matched job items
            sample_titles = [
                j.job_title for j in analyzed_jobs if j.job_key in valid_keys
            ][:3]

        groups.append(
            JobGroupItem(
                group_id=group_id,
                group_name=raw_group.get("group_name") or group_id,
                summary=raw_group.get("summary") or "",
                job_keys=valid_keys,
                sample_titles=sample_titles,
                count=len(valid_keys),
            )
        )

    # Enforce coverage: any unassigned key goes to uncategorized
    uncategorized_job_keys = sorted(input_keys - assigned_keys)

    # Sort groups: count desc, group_name asc
    groups.sort(key=lambda g: (-g.count, g.group_name))

    return GroupsAnalysisResponse(
        analyzed_job_count=analyzed_job_count,
        truncated_from_total=truncated_from_total,
        groups=groups,
        uncategorized_job_keys=uncategorized_job_keys,
    )


# ------------------------------------------------------------------ #
# Stage 2: group-detail analysis                                       #
# ------------------------------------------------------------------ #

_DETAIL_SYSTEM_PROMPT = (
    "You are an expert career analyst. "
    "Analyze a set of similar job postings and extract common patterns. "
    "Respond with strict JSON only."
)

_DETAIL_PROMPT_TEMPLATE = """\
You are analyzing job postings for the role type: "{group_name}".

IMPORTANT:
- output_language = {output_language}
- All generated text MUST be in {output_language}.
- Base your analysis ONLY on the provided job postings.
- Do not invent information not present in the input.

Job postings (JSON array):
{jobs_json}

Return strict JSON in this exact format:
{{
  "analysis_summary": "...",
  "technology_stack": ["..."],
  "common_requirements": ["..."],
  "common_bonus_points": ["..."],
  "common_responsibilities": ["..."],
  "representative_titles": ["..."]
}}
"""


async def analyze_group_detail(
    group_name: str,
    jobs: list[AnalysisJobInput],
    language: str = "zh",
) -> GroupDetailResponse:
    """Call the LLM to analyze a specific job-type group (stage 2)."""
    analyzed_jobs = _truncate_jobs_for_analysis(jobs)

    output_language = get_language_name(language)
    prompt = _DETAIL_PROMPT_TEMPLATE.format(
        group_name=group_name,
        output_language=output_language,
        jobs_json=json.dumps(_build_jobs_payload_for_prompt(analyzed_jobs), ensure_ascii=False),
    )

    raw_result = await complete_json(
        prompt=prompt,
        system_prompt=_DETAIL_SYSTEM_PROMPT,
        max_tokens=2048,
    )

    if not isinstance(raw_result, dict):
        raw_result = {}

    def _str_list(key: str) -> list[str]:
        val = raw_result.get(key)
        if isinstance(val, list):
            return [str(item) for item in val if item]
        return []

    return GroupDetailResponse(
        group_name=group_name,
        analysis_summary=str(raw_result.get("analysis_summary") or ""),
        technology_stack=_str_list("technology_stack"),
        common_requirements=_str_list("common_requirements"),
        common_bonus_points=_str_list("common_bonus_points"),
        common_responsibilities=_str_list("common_responsibilities"),
        representative_titles=_str_list("representative_titles"),
    )
