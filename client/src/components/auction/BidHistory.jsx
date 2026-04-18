import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/formatCurrency';

const BidHistory = ({ history = [], auction }) => {
  const symbol = auction?.currencySymbol || '₹';
  const unit = auction?.currencyUnit || 'lakh';

  return (
    <div
      className='rounded-2xl p-4'
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h3 className='text-sm font-medium mb-3' style={{ color: 'var(--color-text-muted)' }}>
        Bid History
      </h3>

      {history.length === 0 ? (
        <p className='text-sm text-center py-4' style={{ color: 'var(--color-text-subtle)' }}>
          No bids yet
        </p>
      ) : (
        <ul className='space-y-2 max-h-48 overflow-y-auto'>
          <AnimatePresence initial={false}>
            {history.map((bid, i) => (
              <motion.li
                key={bid.seq ?? `${bid.teamName}-${bid.amount}-${i}`}
                layout
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className='flex items-center justify-between text-sm px-3 py-2 rounded-lg'
                style={
                  i === 0
                    ? {
                        backgroundColor: 'var(--color-accent-muted)',
                        border: '1px solid var(--color-accent)',
                        borderOpacity: 0.4,
                      }
                    : { backgroundColor: 'var(--color-surface-sunken)' }
                }
              >
                <span style={{ color: 'var(--color-text-muted)' }}>{bid.teamName}</span>
                <span className='font-semibold' style={{ color: 'var(--color-text)' }}>
                  {formatCurrency(bid.amount, symbol, unit)}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
};

export default BidHistory;
