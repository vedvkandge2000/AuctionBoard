import { useEffect } from 'react';

const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />
      <div
        className={`relative w-full ${sizes[size] || sizes.md} bg-gray-900 border border-gray-700 rounded-xl shadow-2xl animate-slide-up flex flex-col max-h-[90vh]`}
      >
        <div className='flex items-center justify-between p-5 border-b border-gray-700 flex-shrink-0'>
          <h2 className='text-lg font-semibold text-white'>{title}</h2>
          <button onClick={onClose} className='text-gray-400 hover:text-white text-2xl leading-none'>×</button>
        </div>
        <div className='p-5 overflow-y-auto'>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
