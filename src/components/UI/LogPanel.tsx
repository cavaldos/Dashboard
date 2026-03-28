import type { ReactNode } from 'react';

import { cn } from '~/lib/utils';

type LogTag = {
  label: string;
  dim?: boolean;
};

type LogPanelProps = {
  title: string;
  tags?: LogTag[];
  children: ReactNode;
  padded?: boolean;
  className?: string;
};

export const LogPanel = ({ title, tags, children, padded = false, className }: LogPanelProps) => {
  return (
    <section className={cn('log-panel overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]', className)}>
      <div className="log-header flex items-center gap-3 border-b border-[var(--border)] bg-black/20 px-4 py-2.5">
        <span className="log-header-title flex-1 text-[calc(11px+var(--font-size-offset))] uppercase tracking-[0.25em] text-[var(--text-secondary)]">
          {title}
        </span>

        {tags?.map((tag) => (
          <span
            key={tag.label}
            className={cn(
              'log-header-tag border px-1.5 py-0.5 text-[calc(10px+var(--font-size-offset))] uppercase tracking-[0.15em]',
              tag.dim ? 'border-[var(--border)] text-[var(--text-dim)]' : 'border-[var(--accent-dim)] text-[var(--accent)]',
            )}
          >
            {tag.label}
          </span>
        ))}
      </div>

      <div className={cn(padded && 'panel-padded p-5')}>{children}</div>
    </section>
  );
};
