const VARIANT_STYLES = {
  default: {
    backgroundColor: 'var(--color-surface-sunken)',
    color: 'var(--color-text-muted)',
  },
  green: {
    backgroundColor: 'var(--color-success-bg)',
    color: 'var(--color-success-text)',
  },
  red: {
    backgroundColor: 'var(--color-danger-bg)',
    color: 'var(--color-danger-text)',
  },
  yellow: {
    backgroundColor: 'var(--color-warning-bg)',
    color: 'var(--color-warning-text)',
  },
  blue: {
    backgroundColor: 'rgba(0,116,255,0.1)',
    color: 'var(--color-accent)',
  },
  indigo: {
    backgroundColor: 'var(--color-accent-muted)',
    color: 'var(--color-accent)',
  },
  orange: {
    backgroundColor: 'rgba(249,115,22,0.12)',
    color: '#c2410c',
  },
  pink: {
    backgroundColor: 'rgba(236,72,153,0.12)',
    color: '#be185d',
  },
};

const Badge = ({ children, variant = 'default', className = '', style = {} }) => (
  <span
    style={{ ...(VARIANT_STYLES[variant] || VARIANT_STYLES.default), ...style }}
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
  >
    {children}
  </span>
);

export default Badge;
