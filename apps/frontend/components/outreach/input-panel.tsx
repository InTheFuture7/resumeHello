import type { KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { OutreachResumeListItem, OutreachTemplateData } from '@/lib/api/outreach';
import { OutreachErrorState } from './error-state';
import { OutreachLoadingState } from './loading-state';
import { ResumeSelector } from './resume-selector';
import { TemplateEditor } from './template-editor';

interface OutreachInputPanelProps {
  title: string;
  description: string;
  resumeLabel: string;
  resumePlaceholder: string;
  loadingResumesLabel: string;
  noResumesLabel: string;
  jobInfoLabel: string;
  jobInfoPlaceholder: string;
  resumes: OutreachResumeListItem[];
  resumesLoading: boolean;
  resumesError: string | null;
  selectedResumeId: string;
  jobInfo: string;
  validationError: string | null;
  generateLabel: string;
  generatingLabel: string;
  retryLoadLabel: string;
  template: OutreachTemplateData;
  isSavingTemplate: boolean;
  saveTemplateError: string | null;
  onResumeChange: (resumeId: string) => void;
  onJobInfoChange: (jobInfo: string) => void;
  onGenerate: () => void;
  onRetryLoadResumes: () => void;
  onSaveTemplate: (template: OutreachTemplateData) => void;
  isGenerating: boolean;
  templateLabels: {
    title: string;
    openingLabel: string;
    middleRulesLabel: string;
    closingLabel: string;
    saveLabel: string;
    savingLabel: string;
    expandLabel: string;
    collapseLabel: string;
  };
}

export function OutreachInputPanel({
  title,
  description,
  resumeLabel,
  resumePlaceholder,
  loadingResumesLabel,
  noResumesLabel,
  jobInfoLabel,
  jobInfoPlaceholder,
  resumes,
  resumesLoading,
  resumesError,
  selectedResumeId,
  jobInfo,
  validationError,
  generateLabel,
  generatingLabel,
  retryLoadLabel,
  template,
  isSavingTemplate,
  saveTemplateError,
  onResumeChange,
  onJobInfoChange,
  onGenerate,
  onRetryLoadResumes,
  onSaveTemplate,
  isGenerating,
  templateLabels,
}: OutreachInputPanelProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      event.stopPropagation();
    }
  };

  return (
    <section className="space-y-6 border border-black bg-white p-6">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl uppercase tracking-tight">{title}</h1>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {resumesLoading ? (
        <OutreachLoadingState message={loadingResumesLabel} />
      ) : resumesError ? (
        <OutreachErrorState
          message={resumesError}
          retryLabel={retryLoadLabel}
          onRetry={onRetryLoadResumes}
        />
      ) : resumes.length === 0 ? (
        <OutreachErrorState message={noResumesLabel} />
      ) : (
        <ResumeSelector
          label={resumeLabel}
          placeholder={resumePlaceholder}
          resumes={resumes}
          value={selectedResumeId}
          onChange={onResumeChange}
          disabled={isGenerating}
        />
      )}

      <div className="space-y-2">
        <label htmlFor="outreach-job-info" className="block font-mono text-sm font-bold">
          {jobInfoLabel}
        </label>
        <Textarea
          id="outreach-job-info"
          aria-label={jobInfoLabel}
          value={jobInfo}
          onChange={(event) => onJobInfoChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={jobInfoPlaceholder}
          className="min-h-[220px] bg-[#F5F5F0] font-mono"
          disabled={isGenerating}
        />
      </div>

      <TemplateEditor
        template={template}
        isSaving={isSavingTemplate}
        saveError={saveTemplateError}
        onSave={onSaveTemplate}
        labels={templateLabels}
      />

      {validationError ? <OutreachErrorState message={validationError} /> : null}

      <Button
        onClick={onGenerate}
        disabled={isGenerating || resumesLoading || !resumes.length}
        className="w-full"
      >
        {isGenerating ? generatingLabel : generateLabel}
      </Button>
    </section>
  );
}
