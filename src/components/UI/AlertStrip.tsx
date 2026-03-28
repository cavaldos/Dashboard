import { cn } from '~/lib/utils';

import type { AlertTone } from './types';

const toneClasses: Record<AlertTone, string> = {
  info: 'border-[var(--accent)]',
  success: 'border-[var(--green)]',
  warning: 'border-[var(--yellow)]',
  error: 'border-[var(--red)]',
};

const iconToneClasses: Record<AlertTone, string> = {
  info: 'text-[var(--accent)]',
  success: 'text-[var(--green)]',
  warning: 'text-[var(--yellow)]',
  error: 'text-[var(--red)]',
};

type AlertStripProps = {
  tone: AlertTone;
  icon: string;
  message: string;
};

export const AlertStrip = ({ tone, icon, message }: AlertStripProps) => {
  return (
    <div
      className={cn(
        'alert flex items-center gap-3 border-l-2 bg-[var(--bg-card)] px-4 py-3 text-[calc(13px+var(--font-size-offset))] tracking-[0.05em] text-[var(--text-primary)]',
        toneClasses[tone],
      )}
    >
      <span className={cn('alert-icon min-w-10 text-[calc(12px+var(--font-size-offset))] tracking-[0.2em]', iconToneClasses[tone])}>{icon}</span>
      {message}
    </div>
  );
};
