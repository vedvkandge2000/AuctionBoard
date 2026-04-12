const VARIANTS = {
  default: 'bg-gray-700 text-gray-200',
  green: 'bg-green-900 text-green-300',
  red: 'bg-red-900 text-red-300',
  yellow: 'bg-yellow-900 text-yellow-300',
  blue: 'bg-blue-900 text-blue-300',
  indigo: 'bg-indigo-900 text-indigo-300',
  orange: 'bg-orange-900 text-orange-300',
  pink: 'bg-pink-900 text-pink-300',
};

const Badge = ({ children, variant = 'default', className = '' }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant] || VARIANTS.default} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
