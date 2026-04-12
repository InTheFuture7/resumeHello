import type {
  OutreachGenerateResult,
  OutreachMatchAnalysisV2,
  ParsedJobInfo,
} from '@/lib/api/outreach';
import { GeneratedMessageCard } from './generated-message-card';
import { MatchAnalysisCard } from './match-analysis-card';
import { ParsedJobCard } from './parsed-job-card';

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}

interface OutreachResultPanelProps {
  parseState: AsyncState<ParsedJobInfo>;
  analysisState: AsyncState<OutreachMatchAnalysisV2>;
  generateState: AsyncState<OutreachGenerateResult>;
  onRetryParse: () => void;
  onRetryAnalysis: () => void;
  onRetryGenerate: () => void;
  parsedJobLabels: {
    title: string;
    companyLabel: string;
    jobTitleLabel: string;
    companyInfoLabel: string;
    jobDescriptionLabel: string;
    requirementsLabel: string;
    bonusLabel: string;
    requiredMaterialsLabel: string;
    loadingMessage: string;
    emptyMessage: string;
    retryLabel: string;
  };
  analysisLabels: {
    title: string;
    requirementsMatchLabel: string;
    requirementsGapLabel: string;
    bonusMatchLabel: string;
    strengthsLabel: string;
    weaknessesLabel: string;
    summaryLabel: string;
    loadingMessage: string;
    emptyMessage: string;
    retryLabel: string;
  };
  messageLabels: {
    title: string;
    copyLabel: string;
    copiedLabel: string;
    loadingMessage: string;
    emptyMessage: string;
    retryLabel: string;
  };
}

export function OutreachResultPanel({
  parseState,
  analysisState,
  generateState,
  onRetryParse,
  onRetryAnalysis,
  onRetryGenerate,
  parsedJobLabels,
  analysisLabels,
  messageLabels,
}: OutreachResultPanelProps) {
  return (
    <div className="space-y-6">
      <ParsedJobCard
        status={parseState.status}
        data={parseState.data}
        error={parseState.error}
        onRetry={onRetryParse}
        labels={parsedJobLabels}
      />

      <MatchAnalysisCard
        title={analysisLabels.title}
        status={analysisState.status}
        data={analysisState.data}
        error={analysisState.error}
        onRetry={onRetryAnalysis}
        labels={analysisLabels}
      />

      <GeneratedMessageCard
        status={generateState.status}
        data={generateState.data}
        error={generateState.error}
        onRetry={onRetryGenerate}
        labels={messageLabels}
      />
    </div>
  );
}
