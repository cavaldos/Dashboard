import { cn } from '~/lib/utils';

import type { StatTone } from './types';

const valueToneClasses: Record<StatTone, string> = {
  blue: 'text-[var(--accent)]',
  green: 'text-[var(--green)]',
  red: 'text-[var(--red)]',
  yellow: 'text-[var(--yellow)]',
};

const progressToneClasses: Record<StatTone, string> = {
  blue: 'bg-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]',
  green: 'bg-[var(--green)] shadow-[0_0_12px_var(--green-soft)]',
  red: 'bg-[var(--red)] shadow-[0_0_12px_var(--red-soft)]',
  yellow: 'bg-[var(--yellow)] shadow-[0_0_12px_rgba(255,204,68,0.22)]',
};

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  tone: StatTone;
  progress: number;
};

export const StatCard = ({ label, value, sub, tone, progress }: StatCardProps) => {
  return (
    <article className="stat-card relative border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors duration-200 hover:border-[var(--border-bright)]">
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-[linear-gradient(90deg,transparent,var(--accent-dim),transparent)]" aria-hidden="true" />
      <p className="stat-label mb-2.5 text-[calc(11px+var(--font-size-offset))] uppercase tracking-[0.25em] text-[var(--text-dim)]">{label}</p>
      <p className={cn('stat-value mb-1 text-[calc(30px+var(--font-size-offset))] leading-none tracking-[0.05em]', valueToneClasses[tone])}>
        {value}
      </p>
      <p className="stat-sub text-[calc(11px+var(--font-size-offset))] tracking-[0.1em] text-[var(--text-dim)]">{sub}</p>

      <div className="progress-bar-track relative mt-2.5 h-0.5 overflow-hidden bg-[var(--border)]">
        <div
          className={cn('progress-bar-fill h-full transition-[width] duration-700 ease-out', progressToneClasses[tone])}
          style={{ width: `${progress}%` }}
        />
      </div>
    </article>
  );
};
