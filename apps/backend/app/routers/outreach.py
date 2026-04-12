"""Outreach endpoints for V2 parsing, analysis, generation, history, and templates."""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException

from app.config_cache import get_content_language
from app.database import db
from app.schemas.models import (
    AnalysisJobInput,
    DedupedHistoryResponse,
    GroupDetailRequest,
    GroupDetailResponse,
    GroupsAnalysisRequest,
    GroupsAnalysisResponse,
    MatchAnalysisV2Request,
    MatchAnalysisV2Response,
    OutreachGenerateV2Request,
    OutreachGenerateV2Response,
    OutreachHistoryResponse,
    OutreachRecordResponse,
    OutreachTemplateResponse,
    ParseJobRequest,
    ParsedJobInfo,
    SaveTemplateRequest,
)
from app.services import job_parser, match_analysis, outreach_generator
from app.services import outreach_history_analysis as history_analysis_svc


router = APIRouter(prefix="/outreach", tags=["Outreach"])
logger = logging.getLogger(__name__)


def _get_processed_resume_data(resume_id: str) -> dict[str, Any]:
    """Fetch structured resume data for standalone outreach features."""
    resume = db.get_resume(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    processed_data = resume.get("processed_data")
    if not processed_data:
        raise HTTPException(
            status_code=409,
            detail="Resume has no processed data and is not ready for outreach generation.",
        )

    return processed_data


@router.post("/parse-job", response_model=ParsedJobInfo)
async def parse_job(request: ParseJobRequest) -> ParsedJobInfo:
    """Parse raw job description text into structured data via LLM."""
    try:
        return await job_parser.parse_job_info(request.job_info)
    except Exception as exc:
        logger.error("Job parsing failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to parse job info. Please try again.",
        ) from exc


@router.post("/match-analysis", response_model=MatchAnalysisV2Response)
async def generate_match_analysis(
    request: MatchAnalysisV2Request,
) -> MatchAnalysisV2Response:
    """Analyze resume/job fit using structured job info."""
    processed_data = _get_processed_resume_data(request.resume_id)
    language = get_content_language()
    try:
        analysis = await match_analysis.analyze_match_v2(
            processed_data,
            request.parsed_job,
            language=language,
        )
        return MatchAnalysisV2Response(**analysis)
    except Exception as exc:
        logger.error("Match analysis V2 failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze match. Please try again.",
        ) from exc


@router.post("/generate", response_model=OutreachGenerateV2Response)
async def generate_outreach(
    request: OutreachGenerateV2Request,
) -> OutreachGenerateV2Response:
    """Generate a template-based outreach message and persist it to history."""
    processed_data = _get_processed_resume_data(request.resume_id)
    language = get_content_language()

    try:
        message = await outreach_generator.generate_outreach_message(
            processed_data,
            request.parsed_job,
            request.match_analysis,
            request.template,
            language=language,
        )
    except Exception as exc:
        logger.error("Outreach generation failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate message. Please try again.",
        ) from exc

    record = db.create_outreach_record(
        resume_id=request.resume_id,
        parsed_job=request.parsed_job.model_dump(),
        match_analysis=request.match_analysis.model_dump(),
        generated_message=message,
        template_snapshot=request.template.model_dump(),
    )
    return OutreachGenerateV2Response(message=message, record_id=record["record_id"])


@router.get("/history", response_model=OutreachHistoryResponse)
def list_history() -> OutreachHistoryResponse:
    """Return all outreach history records, newest first."""
    records = db.list_outreach_records()
    return OutreachHistoryResponse(records=[OutreachRecordResponse(**record) for record in records])


@router.delete("/history/{record_id}")
def delete_history_record(record_id: str) -> dict[str, str]:
    """Delete a history record by ID."""
    deleted = db.delete_outreach_record(record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"message": "Record deleted"}


@router.get("/template", response_model=OutreachTemplateResponse)
def get_template() -> OutreachTemplateResponse:
    """Return the saved template or default values."""
    template = db.get_outreach_template()
    if template:
        return OutreachTemplateResponse(**template)

    return OutreachTemplateResponse(**db.DEFAULT_OUTREACH_TEMPLATE)


@router.put("/template", response_model=OutreachTemplateResponse)
def save_template(request: SaveTemplateRequest) -> OutreachTemplateResponse:
    """Save or update the single active outreach template."""
    template = db.save_outreach_template(
        opening=request.opening,
        middle_rules=request.middle_rules,
        closing=request.closing,
    )
    return OutreachTemplateResponse(**template)


# ---------------------------------------------------------------------------
# History Analysis Endpoints
# ---------------------------------------------------------------------------


@router.get("/history/deduped", response_model=DedupedHistoryResponse)
def get_deduped_history() -> DedupedHistoryResponse:
    """Return deduplicated outreach history for the analysis page.

    Deduplication is performed on company_name + job_title (normalized).
    Records with missing fields are returned in the unparsed_jobs bucket.
    No LLM is called.
    """
    records = db.list_all_outreach_records()
    jobs, unparsed_jobs = history_analysis_svc.dedup_outreach_records(records)
    return DedupedHistoryResponse(jobs=jobs, unparsed_jobs=unparsed_jobs)


@router.post("/history-analysis/groups", response_model=GroupsAnalysisResponse)
async def analyze_groups(request: GroupsAnalysisRequest) -> GroupsAnalysisResponse:
    """Stage-1 analysis: group deduplicated jobs into role types via LLM.

    The request body must contain the same deduplicated job list currently
    held by the frontend page snapshot (from GET /history/deduped).
    Duplicate job_keys in the request are rejected with HTTP 400.
    """
    # Uniqueness constraint: job_keys must not repeat within the request
    seen: set[str] = set()
    for job in request.jobs:
        if job.job_key in seen:
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate job_key in request: {job.job_key}",
            )
        seen.add(job.job_key)

    try:
        return await history_analysis_svc.analyze_job_groups(
            request.jobs, language=request.content_language
        )
    except Exception as exc:
        logger.error("Stage-1 history analysis failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze job groups. Please try again.",
        ) from exc


@router.post("/history-analysis/group-detail", response_model=GroupDetailResponse)
async def analyze_group_detail(request: GroupDetailRequest) -> GroupDetailResponse:
    """Stage-2 analysis: extract common traits for a specific role type via LLM.

    The jobs in the request body must be pre-filtered by the frontend
    (using group.job_keys against the page snapshot).
    """
    try:
        return await history_analysis_svc.analyze_group_detail(
            group_name=request.group_name,
            jobs=request.jobs,
            language=request.content_language,
        )
    except Exception as exc:
        logger.error("Stage-2 history analysis failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze group detail. Please try again.",
        ) from exc
