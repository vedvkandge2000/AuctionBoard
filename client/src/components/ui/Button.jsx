const VARIANTS = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-indigo-800 disabled:text-indigo-400',
  danger: 'bg-red-700 hover:bg-red-600 text-white disabled:bg-red-900 disabled:text-red-500',
  ghost: 'bg-transparent hover:bg-white/10 text-gray-300 hover:text-white border border-white/20',
  success: 'bg-green-700 hover:bg-green-600 text-white',
  warning: 'bg-yellow-600 hover:bg-yellow-500 text-white',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) => (
  <button
    {...props}
    disabled={loading || props.disabled}
    className={`
      inline-flex items-center justify-center gap-2 rounded-lg font-medium
      transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950
      disabled:cursor-not-allowed
      ${VARIANTS[variant] || VARIANTS.primary}
      ${SIZES[size] || SIZES.md}
      ${className}
    `}
  >
    {loading && (
      <svg className='animate-spin h-4 w-4' fill='none' viewBox='0 0 24 24'>
        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z' />
      </svg>
    )}
    {children}
  </button>
);

export default Button;
