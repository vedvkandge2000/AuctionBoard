const EmptyState = ({ icon = '📭', title, description, hint, action }) => (
  <div className='flex flex-col items-center justify-center py-16 text-center'>
    <div className='text-5xl mb-4'>{icon}</div>
    <h3 className='text-lg font-semibold text-gray-200 mb-1'>{title}</h3>
    {description && <p className='text-gray-400 text-sm mb-2 max-w-sm'>{description}</p>}
    {hint && <p className='text-gray-600 text-xs mb-3 max-w-xs'>{hint}</p>}
    {action && <div className='mt-2'>{action}</div>}
  </div>
);

export default EmptyState;
