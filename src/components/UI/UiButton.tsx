import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '~/lib/utils';

import type { ButtonTone } from './types';

const toneClasses: Record<ButtonTone, string> = {
  primary:
    'border-[var(--accent-dim)] text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--accent-glow)] hover:shadow-[0_0_16px_var(--accent-glow),inset_0_0_16px_var(--accent-glow)]',
  ghost: 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-bright)] hover:text-[var(--text-primary)]',
  danger:
    'border-[var(--red-soft)] text-[var(--red)] hover:border-[var(--red)] hover:bg-[var(--red-muted)] hover:shadow-[0_0_12px_var(--red-shadow)]',
};

type UiButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone: ButtonTone;
  children: ReactNode;
};

export const UiButton = ({ tone, children, className, type = 'button', ...props }: UiButtonProps) => {
  return (
    <button
      type={type}
      className={cn(
        'btn inline-flex items-center justify-center border bg-transparent px-5 py-2.5 font-[var(--mono)] text-[calc(12px+var(--font-size-offset))] uppercase tracking-[0.2em] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
