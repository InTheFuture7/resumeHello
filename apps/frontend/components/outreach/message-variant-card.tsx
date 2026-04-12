'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MessageVariantCardProps {
  title: string;
  content: string;
  copyLabel: string;
  copiedLabel: string;
}

export function MessageVariantCard({
  title,
  content,
  copyLabel,
  copiedLabel,
}: MessageVariantCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="space-y-3 border border-black bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-mono text-xs font-bold uppercase">{title}</h3>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6">{content}</p>
    </article>
  );
}
