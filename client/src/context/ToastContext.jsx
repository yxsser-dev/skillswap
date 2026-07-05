import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span aria-hidden="true">{ICONS[t.type] || ICONS.info}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              className="modal-close"
              style={{ width: '1.5rem', height: '1.5rem', flexShrink: 0 }}
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
