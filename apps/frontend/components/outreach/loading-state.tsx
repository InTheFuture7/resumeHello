import { cn } from '@/lib/utils';

interface OutreachLoadingStateProps {
  message: string;
  className?: string;
}

export function OutreachLoadingState({ message, className }: OutreachLoadingStateProps) {
  return (
    <div
      className={cn(
        'border border-black bg-[#F5F5F0] px-4 py-6 font-mono text-sm text-gray-600',
        className
      )}
    >
      {message}
    </div>
  );
}
