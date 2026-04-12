'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { OutreachGenerateResult } from '@/lib/api/outreach';
import { OutreachErrorState } from './error-state';
import { OutreachLoadingState } from './loading-state';

interface GeneratedMessageCardProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: OutreachGenerateResult | null;
  error: string | null;
  onRetry: () => void;
  labels: {
    title: string;
    copyLabel: string;
    copiedLabel: string;
    loadingMessage: string;
    emptyMessage: string;
    retryLabel: string;
  };
}

export function GeneratedMessageCard({
  status,
  data,
  error,
  onRetry,
  labels,
}: GeneratedMessageCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!data?.message || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(data.message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="space-y-4 border border-black bg-white p-6">
      <h2 className="font-mono text-sm font-bold uppercase">{labels.title}</h2>

      {status === 'loading' ? <OutreachLoadingState message={labels.loadingMessage} /> : null}
      {status === 'error' && error ? (
        <OutreachErrorState message={error} retryLabel={labels.retryLabel} onRetry={onRetry} />
      ) : null}
      {status === 'idle' ? <p className="text-sm text-gray-500">{labels.emptyMessage}</p> : null}

      {status === 'success' && data ? (
        <div className="space-y-3">
          <pre className="whitespace-pre-wrap bg-[#F5F5F0] p-4 font-sans text-sm leading-relaxed">
            {data.message}
          </pre>
          <Button variant="outline" onClick={handleCopy} className="w-full">
            {copied ? labels.copiedLabel : labels.copyLabel}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
