import Link from 'next/link';
import type { OutreachRecord } from '@/lib/api/outreach';
import { OutreachHistoryItem } from './outreach-history-item';

interface OutreachHistoryProps {
  records: OutreachRecord[];
  onDelete: (recordId: string) => void;
  labels: {
    title: string;
    emptyMessage: string;
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

export function OutreachHistory({ records, onDelete, labels }: OutreachHistoryProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm font-bold uppercase">{labels.title}</h2>
        <Link
          href="/outreach/history-analysis"
          className="font-mono text-xs uppercase tracking-wide border border-blue-700 bg-blue-700 text-white px-3 py-1 hover:bg-blue-800 hover:border-blue-800 transition-colors"
        >
          History Analysis →
        </Link>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-gray-500">{labels.emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <OutreachHistoryItem
              key={record.record_id}
              record={record}
              onDelete={onDelete}
              labels={labels}
            />
          ))}
        </div>
      )}
    </section>
  );
}
