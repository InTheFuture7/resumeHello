'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  deleteOutreachRecord,
  fetchOutreachHistory,
  fetchOutreachResumeList,
  fetchOutreachTemplate,
  generateMatchAnalysis,
  generateOutreachMessage,
  parseJobInfo,
  saveOutreachTemplate,
  type OutreachGenerateResult,
  type OutreachMatchAnalysisV2,
  type OutreachRecord,
  type OutreachResumeListItem,
  type OutreachTemplateData,
  type ParsedJobInfo,
} from '@/lib/api/outreach';
import { useTranslations } from '@/lib/i18n';
import { OutreachHistory } from '@/components/outreach/outreach-history';
import { OutreachInputPanel } from '@/components/outreach/input-panel';
import { OutreachResultPanel } from '@/components/outreach/result-panel';

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}

const idle = <T,>(): AsyncState<T> => ({ status: 'idle', data: null, error: null });

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export default function OutreachPage() {
  const { t } = useTranslations();

  const [resumes, setResumes] = useState<OutreachResumeListItem[]>([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [resumesError, setResumesError] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');

  const [jobInfo, setJobInfo] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [template, setTemplate] = useState<OutreachTemplateData>({
    opening: '',
    middle_rules: '',
    closing: '',
  });
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [saveTemplateError, setSaveTemplateError] = useState<string | null>(null);

  const [parseState, setParseState] = useState<AsyncState<ParsedJobInfo>>(idle);
  const [analysisState, setAnalysisState] = useState<AsyncState<OutreachMatchAnalysisV2>>(idle);
  const [generateState, setGenerateState] = useState<AsyncState<OutreachGenerateResult>>(idle);

  const [history, setHistory] = useState<OutreachRecord[]>([]);

  const loadResumes = useCallback(async () => {
    setResumesLoading(true);
    setResumesError(null);

    try {
      const loaded = await fetchOutreachResumeList();
      setResumes(loaded);
      setSelectedResumeId((current) => current || loaded[0]?.resume_id || '');
    } catch (error) {
      setResumesError(getErrorMessage(error, t('outreachPage.error.loadResumes')));
    } finally {
      setResumesLoading(false);
    }
  }, [t]);

  const loadTemplate = useCallback(async () => {
    try {
      const loaded = await fetchOutreachTemplate();
      setTemplate(loaded);
    } catch {
      // Non-fatal: the user can still type a template manually.
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const records = await fetchOutreachHistory();
      setHistory(records);
    } catch {
      // Non-fatal: keep history empty.
    }
  }, []);

  useEffect(() => {
    void loadResumes();
    void loadTemplate();
    void loadHistory();
  }, [loadHistory, loadResumes, loadTemplate]);

  useEffect(() => {
    if (!selectedResumeId && resumes.length > 0) {
      setSelectedResumeId(resumes[0].resume_id);
    }
  }, [resumes, selectedResumeId]);

  const handleSaveTemplate = async (updated: OutreachTemplateData) => {
    setIsSavingTemplate(true);
    setSaveTemplateError(null);

    try {
      const saved = await saveOutreachTemplate(updated);
      setTemplate(saved);
    } catch (error) {
      setSaveTemplateError(getErrorMessage(error, t('outreachPage.error.generic')));
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const validate = () => {
    if (!selectedResumeId) return t('outreachPage.validation.resumeRequired');
    if (!jobInfo.trim()) return t('outreachPage.validation.jobInfoRequired');
    return null;
  };

  const runParse = useCallback(
    async (rawJobInfo: string): Promise<ParsedJobInfo | null> => {
      setParseState({ status: 'loading', data: null, error: null });
      setAnalysisState(idle());
      setGenerateState(idle());

      try {
        const data = await parseJobInfo(rawJobInfo);
        setParseState({ status: 'success', data, error: null });
        return data;
      } catch (error) {
        setParseState({
          status: 'error',
          data: null,
          error: getErrorMessage(error, t('outreachPage.error.generic')),
        });
        return null;
      }
    },
    [t]
  );

  const runAnalysis = useCallback(
    async (resumeId: string, parsed: ParsedJobInfo): Promise<OutreachMatchAnalysisV2 | null> => {
      setAnalysisState({ status: 'loading', data: null, error: null });
      setGenerateState(idle());

      try {
        const data = await generateMatchAnalysis(resumeId, parsed);
        setAnalysisState({ status: 'success', data, error: null });
        return data;
      } catch (error) {
        setAnalysisState({
          status: 'error',
          data: null,
          error: getErrorMessage(error, t('outreachPage.error.generic')),
        });
        return null;
      }
    },
    [t]
  );

  const runGenerate = useCallback(
    async (
      resumeId: string,
      parsed: ParsedJobInfo,
      analysis: OutreachMatchAnalysisV2
    ): Promise<void> => {
      setGenerateState({ status: 'loading', data: null, error: null });

      try {
        const data = await generateOutreachMessage(resumeId, parsed, analysis, template);
        setGenerateState({ status: 'success', data, error: null });
        void loadHistory();
      } catch (error) {
        setGenerateState({
          status: 'error',
          data: null,
          error: getErrorMessage(error, t('outreachPage.error.generic')),
        });
      }
    },
    [loadHistory, t, template]
  );

  const handleGenerate = async () => {
    const error = validate();
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    const resumeId = selectedResumeId;
    const rawJobInfo = jobInfo.trim();

    const parsed = await runParse(rawJobInfo);
    if (!parsed) return;

    const analysis = await runAnalysis(resumeId, parsed);
    if (!analysis) return;

    await runGenerate(resumeId, parsed, analysis);
  };

  const handleRetryParse = async () => {
    const error = validate();
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    const parsed = await runParse(jobInfo.trim());
    if (!parsed) return;

    const analysis = await runAnalysis(selectedResumeId, parsed);
    if (!analysis) return;

    await runGenerate(selectedResumeId, parsed, analysis);
  };

  const handleRetryAnalysis = async () => {
    if (!parseState.data) return;

    const analysis = await runAnalysis(selectedResumeId, parseState.data);
    if (!analysis) return;

    await runGenerate(selectedResumeId, parseState.data, analysis);
  };

  const handleRetryGenerate = async () => {
    if (!parseState.data || !analysisState.data) return;
    await runGenerate(selectedResumeId, parseState.data, analysisState.data);
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      await deleteOutreachRecord(recordId);
      setHistory((current) => current.filter((record) => record.record_id !== recordId));
    } catch {
      // Non-fatal: keep existing history list.
    }
  };

  const isGenerating =
    parseState.status === 'loading' ||
    analysisState.status === 'loading' ||
    generateState.status === 'loading';

  return (
    <div className="min-h-screen bg-[#F0F0E8] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
          <OutreachInputPanel
            title={t('outreachPage.title')}
            description={t('outreachPage.description')}
            resumeLabel={t('outreachPage.resumeLabel')}
            resumePlaceholder={t('outreachPage.resumePlaceholder')}
            loadingResumesLabel={t('outreachPage.loadingResumes')}
            noResumesLabel={t('outreachPage.noResumes')}
            jobInfoLabel={t('outreachPage.jobInfoLabel')}
            jobInfoPlaceholder={t('outreachPage.jobInfoPlaceholder')}
            resumes={resumes}
            resumesLoading={resumesLoading}
            resumesError={resumesError}
            selectedResumeId={selectedResumeId}
            jobInfo={jobInfo}
            validationError={validationError}
            generateLabel={t('outreachPage.generate')}
            generatingLabel={t('outreachPage.generating')}
            retryLoadLabel={t('outreachPage.retry.loadResumes')}
            template={template}
            isSavingTemplate={isSavingTemplate}
            saveTemplateError={saveTemplateError}
            onResumeChange={setSelectedResumeId}
            onJobInfoChange={setJobInfo}
            onGenerate={handleGenerate}
            onRetryLoadResumes={loadResumes}
            onSaveTemplate={handleSaveTemplate}
            isGenerating={isGenerating}
            templateLabels={{
              title: t('outreachPage.template.title'),
              openingLabel: t('outreachPage.template.openingLabel'),
              middleRulesLabel: t('outreachPage.template.middleRulesLabel'),
              closingLabel: t('outreachPage.template.closingLabel'),
              saveLabel: t('outreachPage.template.saveLabel'),
              savingLabel: t('outreachPage.template.savingLabel'),
              expandLabel: t('outreachPage.template.expandLabel'),
              collapseLabel: t('outreachPage.template.collapseLabel'),
            }}
          />

          <OutreachResultPanel
            parseState={parseState}
            analysisState={analysisState}
            generateState={generateState}
            onRetryParse={handleRetryParse}
            onRetryAnalysis={handleRetryAnalysis}
            onRetryGenerate={handleRetryGenerate}
            parsedJobLabels={{
              title: t('outreachPage.parsedJob.title'),
              companyLabel: t('outreachPage.parsedJob.companyLabel'),
              jobTitleLabel: t('outreachPage.parsedJob.jobTitleLabel'),
              companyInfoLabel: t('outreachPage.parsedJob.companyInfoLabel'),
              jobDescriptionLabel: t('outreachPage.parsedJob.jobDescriptionLabel'),
              requirementsLabel: t('outreachPage.parsedJob.requirementsLabel'),
              bonusLabel: t('outreachPage.parsedJob.bonusLabel'),
              requiredMaterialsLabel: t('outreachPage.parsedJob.requiredMaterialsLabel'),
              loadingMessage: t('outreachPage.parsedJob.loadingMessage'),
              emptyMessage: t('outreachPage.parsedJob.emptyMessage'),
              retryLabel: t('outreachPage.parsedJob.retryLabel'),
            }}
            analysisLabels={{
              title: t('outreachPage.analysis.title'),
              requirementsMatchLabel: t('outreachPage.analysis.requirementsMatchLabel'),
              requirementsGapLabel: t('outreachPage.analysis.requirementsGapLabel'),
              bonusMatchLabel: t('outreachPage.analysis.bonusMatchLabel'),
              strengthsLabel: t('outreachPage.analysis.strengthsLabel'),
              weaknessesLabel: t('outreachPage.analysis.weaknessesLabel'),
              summaryLabel: t('outreachPage.analysis.summaryLabel'),
              loadingMessage: t('outreachPage.analysis.loadingMessage'),
              emptyMessage: t('outreachPage.analysis.emptyMessage'),
              retryLabel: t('outreachPage.analysis.retryLabel'),
            }}
            messageLabels={{
              title: t('outreachPage.message.title'),
              copyLabel: t('outreachPage.message.copy'),
              copiedLabel: t('outreachPage.message.copied'),
              loadingMessage: t('outreachPage.message.loadingMessage'),
              emptyMessage: t('outreachPage.message.emptyMessage'),
              retryLabel: t('outreachPage.message.retryLabel'),
            }}
          />
        </div>

        <OutreachHistory
          records={history}
          onDelete={handleDeleteRecord}
          labels={{
            title: t('outreachPage.history.title'),
            emptyMessage: t('outreachPage.history.emptyMessage'),
            deleteLabel: t('outreachPage.history.deleteLabel'),
            expandLabel: t('outreachPage.history.expandLabel'),
            collapseLabel: t('outreachPage.history.collapseLabel'),
            matchLabel: t('outreachPage.history.matchLabel'),
            parsedJob: {
              title: t('outreachPage.parsedJob.title'),
              companyLabel: t('outreachPage.parsedJob.companyLabel'),
              jobTitleLabel: t('outreachPage.parsedJob.jobTitleLabel'),
              companyInfoLabel: t('outreachPage.parsedJob.companyInfoLabel'),
              jobDescriptionLabel: t('outreachPage.parsedJob.jobDescriptionLabel'),
              requirementsLabel: t('outreachPage.parsedJob.requirementsLabel'),
              bonusLabel: t('outreachPage.parsedJob.bonusLabel'),
              requiredMaterialsLabel: t('outreachPage.parsedJob.requiredMaterialsLabel'),
            },
            analysis: {
              title: t('outreachPage.analysis.title'),
              requirementsMatchLabel: t('outreachPage.analysis.requirementsMatchLabel'),
              requirementsGapLabel: t('outreachPage.analysis.requirementsGapLabel'),
              bonusMatchLabel: t('outreachPage.analysis.bonusMatchLabel'),
              strengthsLabel: t('outreachPage.analysis.strengthsLabel'),
              weaknessesLabel: t('outreachPage.analysis.weaknessesLabel'),
              summaryLabel: t('outreachPage.analysis.summaryLabel'),
            },
            message: {
              title: t('outreachPage.message.title'),
            },
          }}
        />
      </div>
    </div>
  );
}
