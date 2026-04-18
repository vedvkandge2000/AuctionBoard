import { Inbox } from 'lucide-react';

const EmptyState = ({ icon, title, description, hint, action }) => {
  const renderIcon = () => {
    if (!icon) {
      return (
        <div
          className='flex items-center justify-center w-16 h-16 rounded-2xl mb-4'
          style={{ backgroundColor: 'var(--color-accent-muted)' }}
        >
          <Inbox size={28} style={{ color: 'var(--color-accent)' }} />
        </div>
      );
    }
    if (typeof icon === 'string') {
      return <div className='text-5xl mb-4'>{icon}</div>;
    }
    return (
      <div
        className='flex items-center justify-center w-16 h-16 rounded-2xl mb-4'
        style={{ backgroundColor: 'var(--color-accent-muted)' }}
      >
        <span style={{ color: 'var(--color-accent)' }}>{icon}</span>
      </div>
    );
  };

  return (
    <div className='flex flex-col items-center justify-center py-16 text-center'>
      {renderIcon()}
      <h3 className='text-lg font-semibold mb-1' style={{ color: 'var(--color-text)' }}>
        {title}
      </h3>
      {description && (
        <p className='text-sm mb-2 max-w-sm' style={{ color: 'var(--color-text-muted)' }}>
          {description}
        </p>
      )}
      {hint && (
        <p className='text-xs mb-3 max-w-xs' style={{ color: 'var(--color-text-subtle)' }}>
          {hint}
        </p>
      )}
      {action && <div className='mt-2'>{action}</div>}
    </div>
  );
};

export default EmptyState;
