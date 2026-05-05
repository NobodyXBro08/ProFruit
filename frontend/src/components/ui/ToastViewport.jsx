import React from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import './ToastViewport.css';

export default function ToastViewport() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`toast-item toast-item--${t.variant}`}
        >
          <span className="toast-item-msg">{t.message}</span>
          <button type="button" className="toast-item-close" onClick={() => dismiss(t.id)} aria-label="Cerrar">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
