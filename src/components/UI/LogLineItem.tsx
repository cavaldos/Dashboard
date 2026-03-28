import { cn } from '~/lib/utils';

import type { LogLevel } from './types';

const levelClasses: Record<Lowercase<LogLevel>, string> = {
  ok: 'text-[var(--green)]',
  warn: 'text-[var(--yellow)]',
  err: 'text-[var(--red)]',
};

type LogLineItemProps = {
  timestamp: string;
  level: LogLevel;
  message: string;
};

export const LogLineItem = ({ timestamp, level, message }: LogLineItemProps) => {
  const tone = level.toLowerCase() as Lowercase<LogLevel>;

  return (
    <div className="log-line flex gap-3 text-[calc(13px+var(--font-size-offset))] leading-[1.9] text-[var(--text-secondary)] max-[900px]:flex-wrap max-[900px]:gap-x-2.5 max-[900px]:gap-y-1.5">
      <span className="ts min-w-[85px] text-[var(--text-dim)] max-[900px]:min-w-fit">{timestamp}</span>
      <span className={cn('level min-w-[30px] max-[900px]:min-w-fit', levelClasses[tone])}>{level}</span>
      <span className="msg text-[var(--text-primary)] opacity-80">{message}</span>
    </div>
  );
};
