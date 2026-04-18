import { motion } from 'framer-motion';

const VARIANT_STYLES = {
  primary: {
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-text-inverse)',
  },
  danger: {
    backgroundColor: 'var(--color-danger)',
    color: '#ffffff',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    border: '1px solid var(--color-border)',
  },
  success: {
    backgroundColor: 'var(--color-success)',
    color: 'var(--color-text-inverse)',
  },
  warning: {
    backgroundColor: 'var(--color-gold)',
    color: 'var(--color-gold-text)',
  },
  secondary: {
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
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
  style = {},
  ...props
}) => {
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  return (
    <motion.button
      {...props}
      disabled={loading || props.disabled}
      whileHover={!props.disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!props.disabled && !loading ? { scale: 0.97 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      style={{ ...variantStyle, ...style }}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-opacity duration-150 focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
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
    </motion.button>
  );
};

export default Button;
