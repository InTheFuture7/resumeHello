"""Standalone resume/job match analysis service."""

import json
from typing import Any

from app.llm import complete_json
from app.prompts import get_language_name
from app.prompts.templates import MATCH_ANALYSIS_PROMPT, MATCH_ANALYSIS_V2_PROMPT


async def analyze_match(
    resume_data: dict[str, Any],
    job_info: str,
    language: str = "en",
) -> dict[str, Any]:
    """Generate match analysis for a resume against a job description."""
    output_language = get_language_name(language)
    prompt = MATCH_ANALYSIS_PROMPT.format(
        job_info=job_info,
        resume_data=json.dumps(resume_data, ensure_ascii=False),
        output_language=output_language,
    )

    result = await complete_json(
        prompt=prompt,
        system_prompt=(
            "You analyze candidate-to-role fit and return structured JSON only. "
            "Keep the analysis concise and grounded in the resume."
        ),
        max_tokens=1024,
    )

    if not isinstance(result, dict):
        raise ValueError("LLM response must be a JSON object")

    required_keys = ("match_percentage", "strengths", "weaknesses", "analysis_summary")
    missing = [key for key in required_keys if key not in result]
    if missing:
        raise ValueError(f"LLM response missing required analysis keys: {', '.join(missing)}")

    return result


async def analyze_match_v2(
    resume_data: dict[str, Any],
    parsed_job: "ParsedJobInfo",
    language: str = "en",
) -> dict[str, Any]:
    """Generate V2 match analysis with required/bonus separation."""
    output_language = get_language_name(language)
    prompt = MATCH_ANALYSIS_V2_PROMPT.format(
        parsed_job=json.dumps(parsed_job.model_dump(), ensure_ascii=False),
        resume_data=json.dumps(resume_data, ensure_ascii=False),
        output_language=output_language,
    )

    result = await complete_json(
        prompt=prompt,
        system_prompt=(
            "You analyze candidate-to-role fit and return structured JSON only. "
            "Keep the analysis concise and grounded in the resume."
        ),
        max_tokens=1024,
    )

    if not isinstance(result, dict):
        raise ValueError("LLM response must be a JSON object")

    required_keys = (
        "match_percentage",
        "requirement_matches",
        "requirement_gaps",
        "bonus_matches",
        "bonus_gaps",
        "strengths",
        "weaknesses",
        "analysis_summary",
    )
    missing = [key for key in required_keys if key not in result]
    if missing:
        raise ValueError(f"LLM response missing required keys: {', '.join(missing)}")

    return result
