'use client';

import { useEffect, useId, useRef } from 'react';
import { LABEL_CANCEL, LABEL_CONFIRM } from '@/lib/messages';
import { Button } from './Button';
import { AlertCircle, AlertTriangle, HelpCircle } from './Icons';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = LABEL_CONFIRM,
  cancelLabel = LABEL_CANCEL,
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      dialog.showModal();
    } else {
      dialog.close();
      previousActiveElement.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
        return;
      }

      // フォーカストラップ
      if (e.key === 'Tab') {
        const focusableElements = dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  const iconColors = {
    danger: 'text-red-400 bg-red-900/30',
    warning: 'text-yellow-400 bg-yellow-900/30',
    default: 'text-blue-400 bg-blue-900/30',
  };

  const confirmVariants = {
    danger: 'danger' as const,
    warning: 'primary' as const,
    default: 'primary' as const,
  };

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/60 bg-transparent p-0 m-auto"
      aria-labelledby={titleId}
      aria-describedby={descId}
      aria-modal="true"
      onClick={(e) => {
        if (e.target === dialogRef.current && !loading) {
          onCancel();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !loading) {
          onCancel();
        }
      }}
    >
      <div
        className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-[400px] max-w-[90vw]"
        role="document"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColors[variant]}`}
            aria-hidden="true"
          >
            {variant === 'danger' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : variant === 'warning' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <HelpCircle className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <h3 id={titleId} className="text-lg font-semibold mb-2">
              {title}
            </h3>
            <p id={descId} className="text-gray-400 text-sm">
              {message}
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-3 mt-6">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariants[variant]}
            onClick={onConfirm}
            loading={loading}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
