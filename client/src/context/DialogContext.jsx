import { createContext, useContext, useState, useCallback, useRef } from 'react';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const closeDialog = (result) => {
    if (resolverRef.current) resolverRef.current(result);
    resolverRef.current = null;
    setDialog(null);
  };

  const confirm = useCallback(({ title = 'Are you sure?', message = '', danger = false, confirmLabel = 'Confirm' } = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({ mode: 'confirm', title, message, danger, confirmLabel });
    });
  }, []);

  const promptText = useCallback(({ title = 'Enter details', message = '', placeholder = '', minLength = 0, confirmLabel = 'Submit' } = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({ mode: 'prompt', title, message, placeholder, minLength, confirmLabel, inputValue: '' });
    });
  }, []);

  const handleConfirm = () => {
    if (dialog.mode === 'prompt') {
      const trimmed = dialog.inputValue.trim();
      if (trimmed.length < dialog.minLength) return;
      closeDialog(trimmed);
    } else {
      closeDialog(true);
    }
  };

  const handleCancel = () => closeDialog(dialog.mode === 'prompt' ? null : false);

  const promptTooShort =
    dialog?.mode === 'prompt' &&
    dialog.inputValue.trim().length > 0 &&
    dialog.inputValue.trim().length < dialog.minLength;

  return (
    <DialogContext.Provider value={{ confirm, promptText }}>
      {children}
      {dialog && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{dialog.title}</span>
              <button className="modal-close" onClick={handleCancel} aria-label="Close">×</button>
            </div>

            {dialog.message && (
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                {dialog.message}
              </p>
            )}

            {dialog.mode === 'prompt' && (
              <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                <textarea
                  className="textarea"
                  rows="3"
                  placeholder={dialog.placeholder}
                  value={dialog.inputValue}
                  autoFocus
                  onChange={(e) => setDialog({ ...dialog, inputValue: e.target.value })}
                />
                {promptTooShort && (
                  <span className="form-error">Please enter at least {dialog.minLength} characters.</span>
                )}
              </div>
            )}

            <div className="flex" style={{ gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: dialog.mode === 'confirm' ? 'var(--space-6)' : 0 }}>
              <button className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
              <button className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`} onClick={handleConfirm}>
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}
