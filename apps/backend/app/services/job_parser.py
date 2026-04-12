"""Job description parser service for outreach V2."""

from typing import Any

from app.llm import complete_json
from app.prompts.templates import JOB_PARSE_PROMPT
from app.schemas.models import ParsedJobInfo


async def parse_job_info(job_info: str) -> ParsedJobInfo:
    """Parse raw job text into structured job information."""
    prompt = JOB_PARSE_PROMPT.format(job_info=job_info)
    result: Any = await complete_json(
        prompt=prompt,
        system_prompt=(
            "You parse job descriptions into structured JSON. "
            "Respond with JSON only. Follow the field definitions exactly."
        ),
        max_tokens=1024,
    )

    if not isinstance(result, dict):
        raise ValueError("LLM response must be a JSON object")

    return ParsedJobInfo(
        company_name=result.get("company_name", ""),
        company_info=result.get("company_info", ""),
        job_title=result.get("job_title", ""),
        job_description=result.get("job_description", ""),
        requirements=result.get("requirements", []),
        bonus_items=result.get("bonus_items", []),
        required_materials=result.get("required_materials", []),
        raw_text=job_info,
    )
