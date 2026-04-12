import { apiDelete, apiFetch, apiPost, apiPut } from './client';
import type { ResumeListItem } from './resume';

export type OutreachResumeListItem = ResumeListItem;

export interface ParsedJobInfo {
  company_name: string;
  company_info: string;
  job_title: string;
  job_description: string;
  requirements: string[];
  bonus_items: string[];
  required_materials: string[];
  raw_text: string;
}

export interface OutreachMatchAnalysisV2 {
  match_percentage: number;
  requirement_matches: string[];
  requirement_gaps: string[];
  bonus_matches: string[];
  bonus_gaps: string[];
  strengths: string[];
  weaknesses: string[];
  analysis_summary: string;
}

export interface OutreachTemplateData {
  template_id?: string;
  opening: string;
  middle_rules: string;
  closing: string;
  created_at?: string;
  updated_at?: string;
}

export interface OutreachGenerateResult {
  message: string;
  record_id: string;
}

export interface OutreachRecord {
  record_id: string;
  resume_id: string;
  parsed_job: ParsedJobInfo;
  match_analysis: OutreachMatchAnalysisV2;
  generated_message: string;
  template_snapshot: OutreachTemplateData;
  created_at: string;
}

async function readError(response: Response, fallback: string): Promise<string> {
  const raw = await response.text().catch(() => '');
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as { detail?: string };
    if (typeof parsed.detail === 'string' && parsed.detail.trim()) {
      return parsed.detail;
    }
  } catch {
    // Fall back to raw text.
  }

  return raw;
}

export async function fetchOutreachResumeList(): Promise<OutreachResumeListItem[]> {
  const response = await apiFetch('/resumes/list?include_master=true');
  if (!response.ok) {
    throw new Error(
      await readError(response, `Failed to load resumes (status ${response.status}).`)
    );
  }

  const payload = (await response.json()) as { data: OutreachResumeListItem[] };
  return payload.data;
}

export async function parseJobInfo(jobInfo: string): Promise<ParsedJobInfo> {
  const response = await apiPost('/outreach/parse-job', { job_info: jobInfo });
  if (!response.ok) {
    throw new Error(
      await readError(response, `Failed to parse job info (status ${response.status}).`)
    );
  }

  return (await response.json()) as ParsedJobInfo;
}

export async function generateMatchAnalysis(
  resumeId: string,
  parsedJob: ParsedJobInfo
): Promise<OutreachMatchAnalysisV2> {
  const response = await apiPost('/outreach/match-analysis', {
    resume_id: resumeId,
    parsed_job: parsedJob,
  });
  if (!response.ok) {
    throw new Error(
      await readError(response, `Failed to analyze match (status ${response.status}).`)
    );
  }

  return (await response.json()) as OutreachMatchAnalysisV2;
}

export async function generateOutreachMessage(
  resumeId: string,
  parsedJob: ParsedJobInfo,
  matchAnalysis: OutreachMatchAnalysisV2,
  template: OutreachTemplateData
): Promise<OutreachGenerateResult> {
  const response = await apiPost('/outreach/generate', {
    resume_id: resumeId,
    parsed_job: parsedJob,
    match_analysis: matchAnalysis,
    template: {
      opening: template.opening,
      middle_rules: template.middle_rules,
      closing: template.closing,
    },
  });
  if (!response.ok) {
    throw new Error(
      await readError(response, `Failed to generate message (status ${response.status}).`)
    );
  }

  return (await response.json()) as OutreachGenerateResult;
}

export async function fetchOutreachHistory(): Promise<OutreachRecord[]> {
  const response = await apiFetch('/outreach/history');
  if (!response.ok) {
    throw new Error(
      await readError(response, `Failed to load history (status ${response.status}).`)
    );
  }

  const payload = (await response.json()) as { records: OutreachRecord[] };
  return payload.records;
}

export async function deleteOutreachRecord(recordId: string): Promise<void> {
  const response = await apiDelete(`/outreach/history/${recordId}`);
  if (!response.ok) {
    throw new Error(
      await readError(response, `Failed to delete record (status ${response.status}).`)
    );
  }
}

export async function fetchOutreachTemplate(): Promise<OutreachTemplateData> {
  const response = await apiFetch('/outreach/template');
  if (!response.ok) {
    throw new Error(
      await readError(response, `Failed to load template (status ${response.status}).`)
    );
  }

  return (await response.json()) as OutreachTemplateData;
}

export async function saveOutreachTemplate(
  template: OutreachTemplateData
): Promise<OutreachTemplateData> {
  const response = await apiPut('/outreach/template', {
    opening: template.opening,
    middle_rules: template.middle_rules,
    closing: template.closing,
  });
  if (!response.ok) {
    throw new Error(
      await readError(response, `Failed to save template (status ${response.status}).`)
    );
  }

  return (await response.json()) as OutreachTemplateData;
}

// ---------------------------------------------------------------------------
// History Analysis Types
// ---------------------------------------------------------------------------

export interface DedupedJob {
  job_key: string;
  sample_record_id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  requirements: string[];
  bonus_items: string[];
  duplicate_count: number;
  latest_applied_at: string;
}

export interface UnparsedJob {
  record_id: string;
  company_name: string;
  job_title: string;
  raw_text_preview: string;
  created_at: string;
}

export interface DedupedHistoryData {
  jobs: DedupedJob[];
  unparsed_jobs: UnparsedJob[];
}

export interface JobGroup {
  group_id: string;
  group_name: string;
  summary: string;
  job_keys: string[];
  sample_titles: string[];
  count: number;
}

export interface GroupsAnalysisResult {
  analyzed_job_count: number;
  truncated_from_total: number;
  groups: JobGroup[];
  uncategorized_job_keys: string[];
}

export interface GroupDetailResult {
  group_name: string;
  analysis_summary: string;
  technology_stack: string[];
  common_requirements: string[];
  common_bonus_points: string[];
  common_responsibilities: string[];
  representative_titles: string[];
}

// ---------------------------------------------------------------------------
// History Analysis API Functions
// ---------------------------------------------------------------------------

export async function fetchDedupedHistory(): Promise<DedupedHistoryData> {
  const response = await apiFetch('/outreach/history/deduped');
  if (!response.ok) {
    throw new Error(
      await readError(response, `Failed to load history (status ${response.status}).`)
    );
  }
  return (await response.json()) as DedupedHistoryData;
}

export async function analyzeJobGroups(
  jobs: DedupedJob[],
  contentLanguage: string
): Promise<GroupsAnalysisResult> {
  const response = await apiPost('/outreach/history-analysis/groups', {
    content_language: contentLanguage,
    jobs,
  });
  if (!response.ok) {
    throw new Error(
      await readError(response, `Failed to analyze job groups (status ${response.status}).`)
    );
  }
  return (await response.json()) as GroupsAnalysisResult;
}

export async function analyzeGroupDetail(
  groupName: string,
  jobs: DedupedJob[],
  contentLanguage: string
): Promise<GroupDetailResult> {
  const response = await apiPost('/outreach/history-analysis/group-detail', {
    group_name: groupName,
    content_language: contentLanguage,
    jobs,
  });
  if (!response.ok) {
    throw new Error(
      await readError(response, `Failed to analyze group detail (status ${response.status}).`)
    );
  }
  return (await response.json()) as GroupDetailResult;
}
