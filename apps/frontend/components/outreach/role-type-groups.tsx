'use client';

import { useTranslations } from '@/lib/i18n';
import { GroupsAnalysisResult } from '@/lib/api/outreach';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface RoleTypeGroupsProps {
  result: GroupsAnalysisResult;
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
}

export function RoleTypeGroups({ result, selectedGroupId, onSelectGroup }: RoleTypeGroupsProps) {
  const { t } = useTranslations();

  const hasTruncation = result.truncated_from_total > result.analyzed_job_count;

  return (
    <div className="space-y-4">
      {hasTruncation && (
        <div className="border-2 border-blue-400 bg-blue-50 p-3">
          <p className="font-mono text-xs text-blue-700">
            {t('historyAnalysis.groupLimitWarning', {
              analyzed: result.analyzed_job_count,
              total: result.truncated_from_total,
            })}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {result.groups.map((group) => {
          const isSelected = selectedGroupId === group.group_id;
          return (
            <Card
              key={group.group_id}
              variant="interactive"
              className={isSelected ? 'border-2 border-ink shadow-sw-default' : ''}
              onClick={() => onSelectGroup(group.group_id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base leading-tight break-words pr-6">
                    {group.group_name}
                  </CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono text-sm border border-ink px-1.5 py-0.5">
                      {group.count}
                    </span>
                    {isSelected && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm line-clamp-2">{group.summary}</CardDescription>
                <div className="mt-4 flex items-center text-xs font-mono font-semibold">
                  {t('historyAnalysis.analyzeFeature')}
                  <ChevronRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {result.uncategorized_job_keys.length > 0 && (
        <div className="border border-dashed border-gray-300 p-3 flex items-center justify-between text-sm font-mono">
          <span className="text-gray-500">{t('historyAnalysis.uncategorizedHeader')}</span>
          <span className="border border-gray-300 px-2 py-0.5 text-xs">
            {result.uncategorized_job_keys.length}
          </span>
        </div>
      )}
    </div>
  );
}
