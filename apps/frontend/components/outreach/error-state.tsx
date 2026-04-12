import { Button } from '@/components/ui/button';

interface OutreachErrorStateProps {
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function OutreachErrorState({ message, retryLabel, onRetry }: OutreachErrorStateProps) {
  return (
    <div className="border border-red-300 bg-red-50 px-4 py-4 text-sm">
      <p className="font-mono text-red-700">{message}</p>
      {retryLabel && onRetry ? (
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
