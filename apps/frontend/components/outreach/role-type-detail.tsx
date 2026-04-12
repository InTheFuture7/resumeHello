'use client';

import { useTranslations } from '@/lib/i18n';
import { GroupDetailResult } from '@/lib/api/outreach';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Code2, Target, Trophy, Briefcase, Tag } from 'lucide-react';

interface RoleTypeDetailProps {
  detail: GroupDetailResult;
}

const SECTIONS = [
  { key: 'techStack', dataKey: 'technology_stack', Icon: Code2 },
  { key: 'requirements', dataKey: 'common_requirements', Icon: Target },
  { key: 'bonusPoints', dataKey: 'common_bonus_points', Icon: Trophy },
  { key: 'responsibilities', dataKey: 'common_responsibilities', Icon: Briefcase },
  { key: 'sampleTitles', dataKey: 'representative_titles', Icon: Tag },
] as const;

export function RoleTypeDetail({ detail }: RoleTypeDetailProps) {
  const { t } = useTranslations();

  return (
    <Card variant="outline">
      <CardHeader>
        <CardTitle className="text-xl">{detail.group_name}</CardTitle>
        <CardDescription className="text-base mt-1">{detail.analysis_summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {SECTIONS.map(({ key, dataKey, Icon }, idx) => {
          const items = detail[dataKey];
          if (!items || items.length === 0) return null;

          return (
            <div key={key}>
              {idx > 0 && <div className="border-t border-gray-200 mb-4" />}
              <h4 className="flex items-center font-mono font-semibold text-xs uppercase tracking-wider text-gray-500 mb-3">
                <Icon className="h-4 w-4 mr-2" />
                {t('historyAnalysis.' + key)}
              </h4>
              <div className="flex flex-wrap gap-2">
                {items.map((item, id) => (
                  <span
                    key={id}
                    className="font-mono text-xs border border-ink px-2 py-1 bg-canvas"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
