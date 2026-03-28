import { Badge } from './Badge';
import type { BadgeTone } from './types';

type FeatureCardProps = {
  title: string;
  body: string;
  badge: string;
  badgeTone: BadgeTone;
  status: string;
};

const cornerClass = 'absolute h-2.5 w-2.5 border-[var(--accent)]';

export const FeatureCard = ({ title, body, badge, badgeTone, status }: FeatureCardProps) => {
  return (
    <article className="card relative cursor-default border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-colors duration-200 hover:border-[var(--border-bright)] hover:bg-[var(--bg-card-hover)]">
      <span className={`${cornerClass} left-[-1px] top-[-1px] border-l border-t`} aria-hidden="true" />
      <span className={`${cornerClass} right-[-1px] top-[-1px] border-r border-t`} aria-hidden="true" />
      <span className={`${cornerClass} bottom-[-1px] left-[-1px] border-b border-l`} aria-hidden="true" />
      <span className={`${cornerClass} bottom-[-1px] right-[-1px] border-b border-r`} aria-hidden="true" />

      <h3 className="card-title mb-3.5 text-[calc(13px+var(--font-size-offset))] uppercase tracking-[0.25em] text-[var(--text-secondary)]">
        {title}
      </h3>
      <p className="card-body text-[calc(14px+var(--font-size-offset))] leading-[1.8] text-[var(--text-primary)] opacity-85">{body}</p>

      <footer className="card-footer mt-5 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-[calc(11px+var(--font-size-offset))] uppercase tracking-[0.2em] text-[var(--text-dim)]">
        <span className="flex items-center gap-1.5">
          <span
            className="status-dot inline-block h-[5px] w-[5px] rounded-full bg-[var(--green)] shadow-[0_0_6px_var(--green)]"
            style={{ animation: 'blink 2s ease-in-out infinite' }}
            aria-hidden="true"
          />
          {status}
        </span>
        <Badge tone={badgeTone}>{badge}</Badge>
      </footer>
    </article>
  );
};
