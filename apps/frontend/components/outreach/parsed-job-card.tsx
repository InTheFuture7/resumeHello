'use client';

import type { ParsedJobInfo } from '@/lib/api/outreach';
import { OutreachErrorState } from './error-state';
import { OutreachLoadingState } from './loading-state';

interface ParsedJobCardProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: ParsedJobInfo | null;
  error: string | null;
  onRetry: () => void;
  labels: {
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
}

export function ParsedJobCard({ status, data, error, onRetry, labels }: ParsedJobCardProps) {
  return (
    <section className="space-y-4 border border-black bg-white p-6">
      <h2 className="font-mono text-sm font-bold uppercase">{labels.title}</h2>

      {status === 'loading' ? <OutreachLoadingState message={labels.loadingMessage} /> : null}
      {status === 'error' && error ? (
        <OutreachErrorState message={error} retryLabel={labels.retryLabel} onRetry={onRetry} />
      ) : null}
      {status === 'idle' ? <p className="text-sm text-gray-500">{labels.emptyMessage}</p> : null}

      {status === 'success' && data ? (
        <div className="space-y-4 text-sm">
          <div>
            <span className="font-mono text-xs font-bold uppercase">{labels.companyLabel}: </span>
            <span>{data.company_name}</span>
          </div>

          <div>
            <span className="font-mono text-xs font-bold uppercase">{labels.jobTitleLabel}: </span>
            <span>{data.job_title}</span>
          </div>

          {data.company_info ? (
            <div>
              <p className="font-mono text-xs font-bold uppercase">{labels.companyInfoLabel}</p>
              <p className="mt-1 text-sm text-gray-700">{data.company_info}</p>
            </div>
          ) : null}

          {data.job_description ? (
            <div>
              <p className="font-mono text-xs font-bold uppercase">{labels.jobDescriptionLabel}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                {data.job_description}
              </p>
            </div>
          ) : null}

          {data.requirements.length > 0 ? (
            <div>
              <p className="font-mono text-xs font-bold uppercase">{labels.requirementsLabel}</p>
              <ul className="mt-1 list-disc pl-5">
                {data.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.bonus_items.length > 0 ? (
            <div>
              <p className="font-mono text-xs font-bold uppercase">{labels.bonusLabel}</p>
              <ul className="mt-1 list-disc pl-5 text-gray-600">
                {data.bonus_items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.required_materials.length > 0 ? (
            <div>
              <p className="font-mono text-xs font-bold uppercase">
                {labels.requiredMaterialsLabel}
              </p>
              <ul className="mt-1 list-disc pl-5 text-gray-700">
                {data.required_materials.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
