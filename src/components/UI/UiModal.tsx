import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

type UiModalProps = {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
};

export const UiModal = ({ isOpen, title, children, onClose, footer }: UiModalProps) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="ui-modal-overlay fixed inset-0 z-[11000] grid place-items-center bg-[rgba(4,8,12,0.78)] p-5 backdrop-blur-[4px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="ui-modal w-full max-w-[560px] border border-[var(--border-bright)] bg-[linear-gradient(180deg,var(--bg-card),var(--bg-base))] shadow-[0_0_18px_var(--accent-glow),0_20px_44px_rgba(2,8,16,0.55)]"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ui-modal-header flex items-center justify-between gap-2.5 border-b border-[var(--border)] px-4 py-3">
          <h3 className="ui-modal-title font-[var(--sans)] text-[calc(14px+var(--font-size-offset))] uppercase tracking-[0.12em] text-[var(--text-primary)]">
            {title}
          </h3>

          <button
            type="button"
            className="ui-modal-close flex h-7 w-7 items-center justify-center border border-[var(--border)] bg-transparent font-[var(--mono)] text-[calc(12px+var(--font-size-offset))] text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-bright)] hover:text-[var(--text-primary)]"
            onClick={onClose}
            aria-label="Close modal"
          >
            x
          </button>
        </header>

        <div className="ui-modal-body p-4">{children}</div>
        {footer ? <footer className="ui-modal-footer flex justify-end gap-2 border-t border-[var(--border)] px-4 py-3">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
};
