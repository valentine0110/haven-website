import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastCtx = createContext(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback((message, variant = "success", duration = 4000) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, variant, leaving: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 320);
    }, duration);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 320);
  }, []);

  // Expose a stable object with named methods so consumers can safely
  // destructure or call toast.success() / toast.error() without worrying
  // about stale references from property-mutation on a memoized function.
  const toast = useMemo(() => ({
    show: (msg, variant, duration) => addToast(msg, variant, duration),
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  }), [addToast]);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.variant} ${t.leaving ? "toast-leave" : ""}`} role="status">
            <span>{t.message}</span>
            <button type="button" className="toast-dismiss" onClick={() => dismiss(t.id)} aria-label="Dismiss">×</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
