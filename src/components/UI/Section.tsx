import type { ReactNode } from 'react';

import { cn } from '~/lib/utils';

type SectionProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export const Section = ({ label, children, className }: SectionProps) => {
  return (
    <section className={cn('section mb-12', className)}>
      <h2 className="section-label mb-4 pl-1 text-[calc(12px+var(--font-size-offset))] uppercase tracking-[0.3em] text-[var(--text-dim)]">
        {label}
      </h2>
      {children}
    </section>
  );
};
