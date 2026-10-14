import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  confirmText = 'Delete Permanently',
  cancelText = 'Cancel',
  isLoading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="py-2">
        <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 mb-4">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 text-rose-600" />
          <p className="text-sm font-medium">{message}</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end mt-5 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors text-sm flex items-center justify-center gap-2 shadow-sm shadow-rose-200 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
