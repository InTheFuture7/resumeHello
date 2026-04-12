'use client';

import { useTranslations } from '@/lib/i18n';
import { DedupedJob, UnparsedJob } from '@/lib/api/outreach';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
interface DedupedHistoryListProps {
  jobs: DedupedJob[];
  unparsedJobs: UnparsedJob[];
}

const _fmt = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function DedupedHistoryList({ jobs, unparsedJobs }: DedupedHistoryListProps) {
  const { t } = useTranslations();

  const formatDate = (dateString: string) => {
    try {
      return _fmt.format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  if (jobs.length === 0 && unparsedJobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-gray-400">
          <p className="font-mono text-sm">{t('historyAnalysis.emptyState')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>{t('historyAnalysis.listHeader')}</span>
            <span className="font-mono text-sm border border-ink px-2 py-0.5">{jobs.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-y-auto max-h-[600px] divide-y divide-gray-200">
            {jobs.map((job) => (
              <div key={job.job_key} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="font-semibold text-sm">{job.job_title}</div>
                    <div className="text-xs text-gray-500 font-mono">{job.company_name}</div>
                  </div>
                  {job.duplicate_count > 1 && (
                    <span className="font-mono text-xs border border-gray-300 px-1.5 py-0.5 shrink-0 ml-2">
                      {t('historyAnalysis.duplicateCount', { count: job.duplicate_count })}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 font-mono text-right">
                  {t('historyAnalysis.latestAppliedAt', {
                    date: formatDate(job.latest_applied_at),
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {unparsedJobs.length > 0 && (
        <div className="border-2 border-amber-400 bg-amber-50 p-4">
          <div className="font-semibold text-amber-800 text-sm mb-1">
            {t('historyAnalysis.unparsedWarningTitle')}
          </div>
          <p className="font-mono text-xs text-amber-700">
            {t('historyAnalysis.unparsedRecords', { count: unparsedJobs.length })}
          </p>
          <p className="font-mono text-xs text-amber-600 mt-1 opacity-80">
            {t('historyAnalysis.unparsedWarning')}
          </p>
        </div>
      )}
    </div>
  );
}
