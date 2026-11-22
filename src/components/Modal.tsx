// Modal y diálogo de confirmación reutilizables.
import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  widthClass?: string;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  children,
  onClose,
  footer,
  widthClass = 'max-w-lg',
}) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`w-full ${widthClass} bg-slate-900 border border-slate-800 rounded-xl shadow-2xl`}>
        <div className="flex items-center justify-between gap-4 p-4 border-b border-slate-800">
          <h2 className="titulo-seccion">{title}</h2>
          <button onClick={onClose} className="btn-secondary px-2 py-1" title="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">{children}</div>

        {footer ? <div className="p-4 border-t border-slate-800 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel = 'Eliminar',
  onConfirm,
  onCancel,
}) => (
  <Modal
    title={title}
    onClose={onCancel}
    footer={
      <>
        <button onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button onClick={onConfirm} className="btn-danger">
          {confirmLabel}
        </button>
      </>
    }
  >
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <p className="text-sm text-slate-300">{message}</p>
    </div>
  </Modal>
);
