import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <motion.div
            className='absolute inset-0 backdrop-blur-sm'
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative w-full ${SIZES[size] || SIZES.md} flex flex-col max-h-[90vh]`}
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
            }}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            <div
              className='flex items-center justify-between p-5 flex-shrink-0'
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <h2 className='text-lg font-semibold' style={{ color: 'var(--color-text)' }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                className='text-2xl leading-none transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]'
                style={{ color: 'var(--color-text-muted)' }}
                aria-label='Close'
              >
                ×
              </button>
            </div>
            <div className='p-5 overflow-y-auto'>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
