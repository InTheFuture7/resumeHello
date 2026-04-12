'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { OutreachRecord } from '@/lib/api/outreach';

interface OutreachHistoryItemProps {
  record: OutreachRecord;
  onDelete: (recordId: string) => void;
  labels: {
    deleteLabel: string;
    expandLabel: string;
    collapseLabel: string;
    matchLabel: string;
    parsedJob: {
      title: string;
      companyLabel: string;
      jobTitleLabel: string;
      companyInfoLabel: string;
      jobDescriptionLabel: string;
      requirementsLabel: string;
      bonusLabel: string;
      requiredMaterialsLabel: string;
    };
    analysis: {
      title: string;
      requirementsMatchLabel: string;
      requirementsGapLabel: string;
      bonusMatchLabel: string;
      strengthsLabel: string;
      weaknessesLabel: string;
      summaryLabel: string;
    };
    message: {
      title: string;
    };
  };
}

export function OutreachHistoryItem({ record, onDelete, labels }: OutreachHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const matchPct = Math.round(record.match_analysis.match_percentage);
  const date = new Date(record.created_at).toLocaleDateString();

  return (
    <div className="border border-black bg-white">
      <div className="flex items-center justify-between gap-4 p-4">
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          className="flex-1 text-left"
          aria-expanded={isExpanded}
        >
          <p className="font-mono text-sm">
            {record.parsed_job.job_title} @ {record.parsed_job.company_name}
          </p>
          <p className="mt-1 font-mono text-xs text-gray-500">
            {labels.matchLabel}: {matchPct}% | {date}
          </p>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gray-400">
            {isExpanded ? labels.collapseLabel : labels.expandLabel}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(record.record_id)}
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            {labels.deleteLabel}
          </Button>
        </div>
      </div>

      {isExpanded ? (
        <div className="space-y-6 border-t border-black p-4 text-sm">
          <section className="space-y-4">
            <p className="font-mono text-xs font-bold uppercase">{labels.parsedJob.title}</p>

            <div>
              <span className="font-mono text-xs font-bold uppercase">
                {labels.parsedJob.companyLabel}:{' '}
              </span>
              <span>{record.parsed_job.company_name}</span>
            </div>

            <div>
              <span className="font-mono text-xs font-bold uppercase">
                {labels.parsedJob.jobTitleLabel}:{' '}
              </span>
              <span>{record.parsed_job.job_title}</span>
            </div>

            {record.parsed_job.company_info ? (
              <div>
                <p className="font-mono text-xs font-bold uppercase">
                  {labels.parsedJob.companyInfoLabel}
                </p>
                <p className="mt-1 text-sm text-gray-700">{record.parsed_job.company_info}</p>
              </div>
            ) : null}

            {record.parsed_job.job_description ? (
              <div>
                <p className="font-mono text-xs font-bold uppercase">
                  {labels.parsedJob.jobDescriptionLabel}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {record.parsed_job.job_description}
                </p>
              </div>
            ) : null}

            {record.parsed_job.requirements.length > 0 ? (
              <div>
                <p className="font-mono text-xs font-bold uppercase">
                  {labels.parsedJob.requirementsLabel}
                </p>
                <ul className="mt-1 list-disc pl-5">
                  {record.parsed_job.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {record.parsed_job.bonus_items.length > 0 ? (
              <div>
                <p className="font-mono text-xs font-bold uppercase">
                  {labels.parsedJob.bonusLabel}
                </p>
                <ul className="mt-1 list-disc pl-5 text-gray-600">
                  {record.parsed_job.bonus_items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {record.parsed_job.required_materials.length > 0 ? (
              <div>
                <p className="font-mono text-xs font-bold uppercase">
                  {labels.parsedJob.requiredMaterialsLabel}
                </p>
                <ul className="mt-1 list-disc pl-5 text-gray-700">
                  {record.parsed_job.required_materials.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="space-y-4">
            <p className="font-mono text-xs font-bold uppercase">{labels.analysis.title}</p>

            <div className="font-serif text-3xl">{matchPct}%</div>

            {record.match_analysis.requirement_matches.length > 0 ? (
              <div>
                <p className="font-mono text-xs font-bold uppercase">
                  {labels.analysis.requirementsMatchLabel}
                </p>
                <ul className="mt-1 list-disc pl-5">
                  {record.match_analysis.requirement_matches.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {record.match_analysis.requirement_gaps.length > 0 ? (
              <div>
                <p className="font-mono text-xs font-bold uppercase">
                  {labels.analysis.requirementsGapLabel}
                </p>
                <ul className="mt-1 list-disc pl-5 text-red-700">
                  {record.match_analysis.requirement_gaps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {record.match_analysis.bonus_matches.length > 0 ? (
              <div>
                <p className="font-mono text-xs font-bold uppercase">
                  {labels.analysis.bonusMatchLabel}
                </p>
                <ul className="mt-1 list-disc pl-5 text-green-700">
                  {record.match_analysis.bonus_matches.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {record.match_analysis.strengths.length > 0 ? (
              <div>
                <p className="font-mono text-xs font-bold uppercase">
                  {labels.analysis.strengthsLabel}
                </p>
                <ul className="mt-1 list-disc pl-5">
                  {record.match_analysis.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {record.match_analysis.weaknesses.length > 0 ? (
              <div>
                <p className="font-mono text-xs font-bold uppercase">
                  {labels.analysis.weaknessesLabel}
                </p>
                <ul className="mt-1 list-disc pl-5">
                  {record.match_analysis.weaknesses.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {record.match_analysis.analysis_summary ? (
              <div>
                <p className="font-mono text-xs font-bold uppercase">
                  {labels.analysis.summaryLabel}
                </p>
                <p className="mt-1 text-sm">{record.match_analysis.analysis_summary}</p>
              </div>
            ) : null}
          </section>

          <section>
            <p className="font-mono text-xs font-bold uppercase">{labels.message.title}</p>
            <pre className="mt-2 whitespace-pre-wrap bg-[#F5F5F0] p-3 font-sans leading-relaxed">
              {record.generated_message}
            </pre>
          </section>
        </div>
      ) : null}
    </div>
  );
}
