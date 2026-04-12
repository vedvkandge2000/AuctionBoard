/**
 * Format an auction currency amount for display.
 * e.g. formatCurrency(200, '₹', 'lakh') → '₹200 L'
 *      formatCurrency(1250, '₹', 'lakh') → '₹12.5 Cr'  (when crore conversion enabled)
 */
export const formatCurrency = (amount, symbol = '₹', unit = 'lakh') => {
  if (amount === null || amount === undefined) return '—';

  // If unit is 'lakh' and amount >= 100, show in crores for readability
  if (unit === 'lakh' && amount >= 100) {
    const crores = amount / 100;
    const formatted = crores % 1 === 0 ? crores.toString() : crores.toFixed(2).replace(/\.?0+$/, '');
    return `${symbol}${formatted} Cr`;
  }

  const formatted = amount % 1 === 0 ? amount.toString() : amount.toFixed(2).replace(/\.?0+$/, '');
  return `${symbol}${formatted} ${unit.charAt(0).toUpperCase() + unit.slice(1)}`;
};

export const formatShort = (amount, symbol = '₹', unit = 'lakh') => {
  if (amount === null || amount === undefined) return '—';
  if (unit === 'lakh' && amount >= 100) {
    return `${symbol}${(amount / 100).toFixed(1).replace(/\.0$/, '')}Cr`;
  }
  return `${symbol}${amount}L`;
};
