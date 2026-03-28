import type { InputHTMLAttributes } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export const TextField = ({ label, type = 'text', ...props }: TextFieldProps) => {
  return (
    <label className="ui-field flex flex-col gap-1.5">
      <span className="text-[calc(11px+var(--font-size-offset))] uppercase tracking-[0.2em] text-[var(--text-dim)]">{label}</span>
      <input
        type={type}
        className="border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 font-[var(--mono)] text-[calc(14px+var(--font-size-offset))] tracking-[0.05em] text-[var(--text-primary)] outline-none transition-colors duration-200 placeholder:text-[var(--text-dim)] focus:border-[var(--accent)]"
        {...props}
      />
    </label>
  );
};
