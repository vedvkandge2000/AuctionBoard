import { createContext, useCallback, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

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

const TOAST_CONFIG = {
  info:    { bg: 'var(--color-accent)',   icon: Info },
  success: { bg: 'var(--color-success)',  icon: CheckCircle },
  error:   { bg: 'var(--color-danger)',   icon: XCircle },
  warning: { bg: 'var(--color-warning)',  icon: AlertTriangle },
};

const ToastContainer = ({ toasts, onRemove }) => (
  <div className='fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none'>
    <AnimatePresence mode='popLayout'>
      {toasts.map((t) => {
        const cfg = TOAST_CONFIG[t.type] || TOAST_CONFIG.info;
        const Icon = cfg.icon;
        const isWarning = t.type === 'warning';
        return (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className='pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl'
            style={{
              backgroundColor: cfg.bg,
              color: isWarning ? '#1a1a1a' : '#ffffff',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <Icon size={16} className='mt-0.5 flex-shrink-0' />
            <span className='flex-1 text-sm font-medium'>{t.message}</span>
            <button
              onClick={() => onRemove(t.id)}
              className='opacity-70 hover:opacity-100 transition-opacity flex-shrink-0'
              aria-label='Dismiss'
            >
              <X size={16} />
            </button>
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>
);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
