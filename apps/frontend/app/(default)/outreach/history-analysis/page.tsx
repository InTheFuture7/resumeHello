'use client';

import { useTranslations } from '@/lib/i18n';
import { HistoryAnalysisView } from '@/components/outreach/history-analysis-view';

export default function HistoryAnalysisPage() {
  const { t } = useTranslations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('historyAnalysis.title')}</h1>
      </div>

      <HistoryAnalysisView />
    </div>
  );
}
