import type { ReactNode } from 'react';

import { cn } from '~/lib/utils';

import type { BadgeTone } from './types';

const toneClasses: Record<BadgeTone, string> = {
  blue: 'border-[var(--accent-dim)] text-[var(--accent)]',
  green: 'border-[var(--green-soft)] text-[var(--green)]',
  red: 'border-[var(--red-soft)] text-[var(--red)]',
  dim: 'border-[var(--border)] text-[var(--text-dim)]',
};

type BadgeProps = {
  tone: BadgeTone;
  children: ReactNode;
  className?: string;
};

export const Badge = ({ tone, children, className }: BadgeProps) => {
  return (
    <span
      className={cn(
        'badge inline-flex items-center border px-2 py-1 text-[calc(10px+var(--font-size-offset))] uppercase tracking-[0.2em]',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
};
