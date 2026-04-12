import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const TOAST_STYLES = {
  info: 'bg-indigo-600',
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-600',
};

const ToastContainer = ({ toasts, onRemove }) => (
  <div className='fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm'>
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`${TOAST_STYLES[t.type] || TOAST_STYLES.info} text-white px-4 py-3 rounded-lg shadow-lg animate-slide-up flex items-start gap-3`}
      >
        <span className='flex-1 text-sm'>{t.message}</span>
        <button onClick={() => onRemove(t.id)} className='text-white/70 hover:text-white text-lg leading-none mt-0.5'>×</button>
      </div>
    ))}
  </div>
);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
