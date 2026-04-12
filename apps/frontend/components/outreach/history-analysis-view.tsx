'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from '@/lib/i18n';
import {
  DedupedJob,
  UnparsedJob,
  GroupsAnalysisResult,
  GroupDetailResult,
  fetchDedupedHistory,
  analyzeJobGroups,
  analyzeGroupDetail,
} from '@/lib/api/outreach';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { DedupedHistoryList } from './deduped-history-list';
import { RoleTypeGroups } from './role-type-groups';
import { RoleTypeDetail } from './role-type-detail';

export function HistoryAnalysisView() {
  const { t, locale } = useTranslations();

  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<DedupedJob[]>([]);
  const [unparsedJobs, setUnparsedJobs] = useState<UnparsedJob[]>([]);

  const [isAnalyzingGroups, setIsAnalyzingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [groupsResult, setGroupsResult] = useState<GroupsAnalysisResult | null>(null);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isAnalyzingDetail, setIsAnalyzingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, GroupDetailResult>>({});

  // 1. Load deduped history on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchDedupedHistory();
        setJobs(data.jobs);
        setUnparsedJobs(data.unparsed_jobs);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load history.');
      } finally {
        setIsLoadingHistory(false);
      }
    }
    load();
  }, []);

  // 2. Stage-1: group analysis
  const handleAnalyzeGroups = useCallback(async () => {
    setIsAnalyzingGroups(true);
    setGroupsError(null);
    setGroupsResult(null);
    setSelectedGroupId(null);
    setDetailCache({});
    setDetailError(null);

    try {
      const res = await analyzeJobGroups(jobs, locale);
      setGroupsResult(res);
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setIsAnalyzingGroups(false);
    }
  }, [jobs, locale]);

  // 3. Stage-2: detail analysis per group
  const handleSelectGroup = useCallback(
    async (groupId: string) => {
      setSelectedGroupId(groupId);
      setDetailError(null);

      if (detailCache[groupId]) {
        return; // cache hit
      }

      if (!groupsResult) return;

      const group = groupsResult.groups.find((g) => g.group_id === groupId);
      if (!group) return;

      const matchedJobs = jobs.filter((j) => group.job_keys.includes(j.job_key));

      setIsAnalyzingDetail(true);
      try {
        const detailResult = await analyzeGroupDetail(group.group_name, matchedJobs, locale);
        setDetailCache((prev) => ({ ...prev, [groupId]: detailResult }));
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : 'Detail analysis failed.');
        setSelectedGroupId(null);
      } finally {
        setIsAnalyzingDetail(false);
      }
    },
    [detailCache, groupsResult, jobs, locale]
  );

  if (isLoadingHistory) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="border-2 border-red-400 bg-red-50 p-6 font-mono text-sm text-red-700">
        <p>{loadError}</p>
        <button className="mt-3 underline text-xs" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  const selectedDetail = selectedGroupId ? detailCache[selectedGroupId] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left: job list + stage-1 trigger */}
      <div className="lg:col-span-1 space-y-4">
        {jobs.length > 0 && (
          <Button
            className="w-full font-semibold"
            onClick={handleAnalyzeGroups}
            disabled={isAnalyzingGroups || isAnalyzingDetail}
          >
            {isAnalyzingGroups ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('historyAnalysis.analyzeRoleTypesLoading')}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('historyAnalysis.analyzeRoleTypes')}
              </>
            )}
          </Button>
        )}
        <DedupedHistoryList jobs={jobs} unparsedJobs={unparsedJobs} />
      </div>

      {/* Right: stage-1 + stage-2 results */}
      <div className="lg:col-span-3 space-y-6">
        {groupsError && (
          <div className="border-2 border-red-400 bg-red-50 p-4 font-mono text-sm text-red-700 flex justify-between items-center">
            <span>{groupsError}</span>
            <button className="underline text-xs" onClick={handleAnalyzeGroups}>
              Retry
            </button>
          </div>
        )}

        {groupsResult && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              1. {t('historyAnalysis.analyzeRoleTypes')}
            </h2>
            <RoleTypeGroups
              result={groupsResult}
              selectedGroupId={selectedGroupId}
              onSelectGroup={handleSelectGroup}
            />
          </div>
        )}

        {isAnalyzingDetail && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="font-mono text-sm">{t('historyAnalysis.analyzeFeatureLoading')}</p>
          </div>
        )}

        {detailError && (
          <div className="border-2 border-red-400 bg-red-50 p-4 font-mono text-sm text-red-700">
            {detailError}
          </div>
        )}

        {selectedDetail && !isAnalyzingDetail && (
          <div className="mt-8 pt-6 border-t border-dashed border-gray-300">
            <h2 className="text-xl font-semibold mb-4">2. {t('historyAnalysis.analyzeFeature')}</h2>
            <RoleTypeDetail detail={selectedDetail} />
          </div>
        )}
      </div>
    </div>
  );
}
