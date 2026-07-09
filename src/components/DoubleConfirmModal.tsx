import { useState } from 'react';
import type { ReactNode } from 'react';
import { X, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from './ui';
import type { ConfirmDetail } from './ConfirmModal';

export default function DoubleConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  details = [],
  confirmLabel,
  cancelLabel,
  continueLabel,
  finalWarning,
  finalTitle,
  processingLabel,
  confirmVariant = 'danger',
  isLoading = false,
  icon,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: ReactNode;
  details?: ConfirmDetail[];
  confirmLabel: string;
  cancelLabel: string;
  continueLabel: string;
  finalWarning: ReactNode;
  finalTitle?: string;
  processingLabel?: string;
  confirmVariant?: 'primary' | 'outline' | 'ghost' | 'gold' | 'danger';
  isLoading?: boolean;
  icon?: ReactNode;
}) {
  const [step, setStep] = useState(1);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setStep(1);
  }

  const handleClose = () => {
    if (isLoading) return;
    setStep(1);
    onClose();
  };

  if (!open) return null;

  const isFinalStep = step === 2;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-[scale-in_0.25s_ease-out] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            {isFinalStep ? (
              <AlertTriangle size={22} className="text-red-500" />
            ) : (
              icon ?? <AlertTriangle size={22} className="text-rose-deep" />
            )}
            <h2 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
              {isFinalStep ? (finalTitle ?? title) : title}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="close"
          >
            <X size={20} />
          </button>
        </div>

        {!isFinalStep ? (
          <div className="px-6 py-4">
            {message && <p className="text-sm text-gray-500 leading-relaxed">{message}</p>}

            {details.length > 0 && (
              <dl className="mt-4 rounded-xl bg-blush-50/70 border border-rose-soft divide-y divide-rose-soft/70">
                {details.map((d, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <dt className="text-xs text-gray-500 pt-0.5 shrink-0">{d.label}</dt>
                    <dd className="text-sm font-medium text-gray-800 text-right wrap-break-word">{d.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ) : (
          <div className="px-6 py-4">
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 leading-relaxed font-medium">{finalWarning}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 px-6 pb-6">
          {isFinalStep ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep(1)}
              disabled={isLoading}
            >
              <ArrowLeft size={16} className="inline mr-1" /> {cancelLabel}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          )}
          {isFinalStep ? (
            <Button
              type="button"
              variant={confirmVariant}
              className="flex-1"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? processingLabel : confirmLabel}
            </Button>
          ) : (
            <Button
              type="button"
              variant={confirmVariant}
              className="flex-1"
              onClick={() => setStep(2)}
              disabled={isLoading}
            >
              {continueLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
