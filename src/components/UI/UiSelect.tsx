import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '~/lib/utils';

import type { SelectOption } from './types';

type UiSelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

export const UiSelect = ({ value, options, onChange, ariaLabel, className }: UiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const selectRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const updateMenuPosition = () => {
    if (!triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const isInsideTrigger = selectRef.current?.contains(target);
      const isInsideMenu = menuRef.current?.contains(target);

      if (!isInsideTrigger && !isInsideMenu) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    updateMenuPosition();

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen]);

  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

  return (
    <div className={cn('ui-selectbox relative z-[120]', isOpen && 'is-open z-[1300]', className)} ref={selectRef}>
      <button
        ref={triggerRef}
        type="button"
        className="ui-selectbox-trigger w-full border border-[var(--accent-dim)] bg-[var(--bg-card)] bg-[linear-gradient(45deg,transparent_50%,var(--accent)_50%),linear-gradient(135deg,var(--accent)_50%,transparent_50%)] bg-[length:6px_6px,6px_6px] bg-[position:calc(100%-16px)_50%,calc(100%-11px)_50%] bg-no-repeat px-3 py-2.5 pr-8 text-left font-[var(--mono)] text-[calc(12px+var(--font-size-offset))] uppercase tracking-[0.16em] text-[var(--text-primary)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-[var(--accent)] hover:bg-[var(--bg-card-hover)] hover:shadow-[0_0_10px_var(--accent-glow),inset_0_0_10px_var(--accent-glow)]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {selectedLabel}
      </button>

      {isOpen &&
        menuPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className="ui-selectbox-menu z-[1310] flex flex-col overflow-hidden border border-[var(--accent-dim)] bg-[linear-gradient(180deg,var(--bg-card),var(--bg-base))] shadow-[0_0_10px_var(--accent-glow),0_14px_28px_rgba(2,8,16,0.45)]"
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
            }}
          >
            {options.map((option) => {
              const isActive = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={cn(
                    'ui-selectbox-option flex w-full items-center gap-2 border-b border-[var(--table-border-soft)] bg-transparent px-2.5 py-2 text-left font-[var(--mono)] text-[calc(12px+var(--font-size-offset))] uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors duration-150 last:border-b-0 hover:bg-[var(--table-row-hover)] hover:text-[var(--text-primary)]',
                    isActive && 'is-active bg-[var(--accent-glow)] text-[var(--accent)]',
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="ui-selectbox-marker w-2.5 text-[var(--accent)]">{isActive ? '>' : ''}</span>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
};
