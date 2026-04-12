import type { OutreachMatchAnalysisV2 } from '@/lib/api/outreach';
import { OutreachErrorState } from './error-state';
import { OutreachLoadingState } from './loading-state';

interface MatchAnalysisCardProps {
  title: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  data: OutreachMatchAnalysisV2 | null;
  error: string | null;
  onRetry: () => void;
  labels: {
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
}

export function MatchAnalysisCard({
  title,
  status,
  data,
  error,
  onRetry,
  labels,
}: MatchAnalysisCardProps) {
  return (
    <section className="space-y-4 border border-black bg-white p-6">
      <h2 className="font-mono text-sm font-bold uppercase">{title}</h2>

      {status === 'loading' ? <OutreachLoadingState message={labels.loadingMessage} /> : null}
      {status === 'error' && error ? (
        <OutreachErrorState message={error} retryLabel={labels.retryLabel} onRetry={onRetry} />
      ) : null}
      {status === 'idle' ? <p className="text-sm text-gray-500">{labels.emptyMessage}</p> : null}

      {status === 'success' && data ? (
        <div className="space-y-4">
          <div className="font-serif text-4xl">{Math.round(data.match_percentage)}%</div>

          {data.requirement_matches.length > 0 ? (
            <div>
              <h3 className="font-mono text-xs font-bold uppercase">
                {labels.requirementsMatchLabel}
              </h3>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {data.requirement_matches.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.requirement_gaps.length > 0 ? (
            <div>
              <h3 className="font-mono text-xs font-bold uppercase">
                {labels.requirementsGapLabel}
              </h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
                {data.requirement_gaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.bonus_matches.length > 0 ? (
            <div>
              <h3 className="font-mono text-xs font-bold uppercase">{labels.bonusMatchLabel}</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-green-700">
                {data.bonus_matches.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <h3 className="font-mono text-xs font-bold uppercase">{labels.strengthsLabel}</h3>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {data.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs font-bold uppercase">{labels.weaknessesLabel}</h3>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {data.weaknesses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs font-bold uppercase">{labels.summaryLabel}</h3>
            <p className="mt-2 text-sm">{data.analysis_summary}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
