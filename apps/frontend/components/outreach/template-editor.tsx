'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { OutreachTemplateData } from '@/lib/api/outreach';

interface TemplateEditorProps {
  template: OutreachTemplateData;
  isSaving: boolean;
  saveError: string | null;
  onSave: (template: OutreachTemplateData) => void;
  labels: {
    title: string;
    openingLabel: string;
    middleRulesLabel: string;
    closingLabel: string;
    saveLabel: string;
    savingLabel: string;
    expandLabel: string;
    collapseLabel: string;
  };
}

export function TemplateEditor({
  template,
  isSaving,
  saveError,
  onSave,
  labels,
}: TemplateEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [opening, setOpening] = useState(template.opening);
  const [middleRules, setMiddleRules] = useState(template.middle_rules);
  const [closing, setClosing] = useState(template.closing);

  useEffect(() => {
    setOpening(template.opening);
    setMiddleRules(template.middle_rules);
    setClosing(template.closing);
  }, [
    template.opening,
    template.middle_rules,
    template.closing,
    template.template_id,
    template.updated_at,
  ]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      event.stopPropagation();
    }
  };

  const handleSave = () => {
    onSave({
      ...template,
      opening,
      middle_rules: middleRules,
      closing,
    });
  };

  return (
    <div className="border border-black bg-white">
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="font-mono text-sm font-bold uppercase">{labels.title}</span>
        <span className="font-mono text-xs">
          {isExpanded ? labels.collapseLabel : labels.expandLabel}
        </span>
      </button>

      {isExpanded ? (
        <div className="space-y-4 border-t border-black p-4">
          <div className="space-y-1">
            <label
              htmlFor="outreach-template-opening"
              className="block font-mono text-xs font-bold uppercase"
            >
              {labels.openingLabel}
            </label>
            <Textarea
              id="outreach-template-opening"
              aria-label={labels.openingLabel}
              value={opening}
              onChange={(event) => setOpening(event.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] bg-[#F5F5F0] font-mono text-sm"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="outreach-template-middle-rules"
              className="block font-mono text-xs font-bold uppercase"
            >
              {labels.middleRulesLabel}
            </label>
            <Textarea
              id="outreach-template-middle-rules"
              aria-label={labels.middleRulesLabel}
              value={middleRules}
              onChange={(event) => setMiddleRules(event.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] bg-[#F5F5F0] font-mono text-sm"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="outreach-template-closing"
              className="block font-mono text-xs font-bold uppercase"
            >
              {labels.closingLabel}
            </label>
            <Textarea
              id="outreach-template-closing"
              aria-label={labels.closingLabel}
              value={closing}
              onChange={(event) => setClosing(event.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] bg-[#F5F5F0] font-mono text-sm"
            />
          </div>

          {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? labels.savingLabel : labels.saveLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
