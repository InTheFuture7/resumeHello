"""Standalone outreach message generation service."""

import json
from typing import Any

from app.llm import complete, complete_json
from app.prompts import get_language_name
from app.prompts.templates import OUTREACH_GENERATE_V2_PROMPT, OUTREACH_MULTI_STYLE_PROMPT

REQUIRED_VARIANTS = ("professional", "casual", "direct")


async def generate_outreach_messages(
    resume_data: dict[str, Any],
    job_info: str,
    language: str = "en",
) -> dict[str, str]:
    """Generate three outreach message variants in one LLM call."""
    output_language = get_language_name(language)
    prompt = OUTREACH_MULTI_STYLE_PROMPT.format(
        job_info=job_info,
        resume_data=json.dumps(resume_data, ensure_ascii=False),
        output_language=output_language,
    )

    result = await complete_json(
        prompt=prompt,
        system_prompt=(
            "You write concise, truthful outreach messages for job applications. "
            "Respond with JSON only."
        ),
        max_tokens=1536,
    )

    if not isinstance(result, dict):
        raise ValueError("LLM response must be a JSON object")

    messages: dict[str, str] = {}
    for variant in REQUIRED_VARIANTS:
        content = result.get(variant)
        if not isinstance(content, str) or not content.strip():
            raise ValueError(f"LLM response missing required variant: {variant}")
        messages[variant] = content.strip()

    return messages


async def generate_outreach_message(
    resume_data: dict[str, Any],
    parsed_job: "ParsedJobInfo",
    match_analysis: "MatchAnalysisV2Response",
    template: "OutreachTemplateData",
    language: str = "en",
) -> str:
    """Generate a single template-based outreach message for V2."""
    opening = template.opening.replace("{job_title}", parsed_job.job_title)
    opening = opening.replace("{company_name}", parsed_job.company_name)

    output_language = get_language_name(language)
    prompt = OUTREACH_GENERATE_V2_PROMPT.format(
        match_analysis=json.dumps(match_analysis.model_dump(), ensure_ascii=False),
        parsed_job=json.dumps(parsed_job.model_dump(), ensure_ascii=False),
        resume_data=json.dumps(resume_data, ensure_ascii=False),
        middle_rules=template.middle_rules,
        output_language=output_language,
        template_opening=opening.strip(),
        template_closing=template.closing.strip(),
    )

    middle_content = await complete(
        prompt=prompt,
        system_prompt=(
            "You write outreach message paragraphs for job applications. "
            "Output plain text only. No JSON and no markdown."
        ),
        max_tokens=512,
    )

    parts = [opening.strip(), middle_content.strip(), template.closing.strip()]
    return "\n".join(part for part in parts if part)
