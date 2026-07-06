import type { ReactNode } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from './ui';

export interface ConfirmDetail {
  label: string;
  value: ReactNode;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  details = [],
  confirmLabel,
  cancelLabel,
  confirmVariant = 'primary',
  isLoading = false,
  processingLabel,
  icon,
  warning,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: ReactNode;
  details?: ConfirmDetail[];
  confirmLabel: string;
  cancelLabel: string;
  processingLabel?: string;
  confirmVariant?: 'primary' | 'outline' | 'ghost' | 'gold' | 'danger';
  isLoading?: boolean;
  icon?: ReactNode;
  warning?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-[scale-in_0.25s_ease-out] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            {icon ?? <AlertCircle size={22} className="text-rose-deep" />}
            <h2 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4">
          {message && <p className="text-sm text-gray-500 leading-relaxed">{message}</p>}

          {details.length > 0 && (
            <dl className="mt-4 rounded-xl bg-blush-50/70 border border-rose-soft divide-y divide-rose-soft/70">
              {details.map((d, i) => (
                <div key={i} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <dt className="text-xs text-gray-500 pt-0.5 shrink-0">{d.label}</dt>
                  <dd className="text-sm font-medium text-gray-800 text-right break-words">{d.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {warning && (
            <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              {warning}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={confirmVariant} className="flex-1" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? processingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
