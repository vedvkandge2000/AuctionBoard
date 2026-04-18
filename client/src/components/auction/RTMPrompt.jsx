import { RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuction } from '../../context/AuctionContext';
import useCountdown from '../../hooks/useCountdown';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';

const RTMPrompt = ({ auction }) => {
  const { rtmPrompt, respondRTM } = useAuction();
  const remaining = useCountdown(rtmPrompt?.expiresAt);
  const symbol = auction?.currencySymbol || '₹';
  const unit = auction?.currencyUnit || 'lakh';

  const isUrgent = remaining !== null && remaining <= 5;

  return (
    <AnimatePresence>
      {rtmPrompt && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <motion.div
            className='absolute inset-0'
            style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className='relative max-w-sm w-full p-6'
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              border: `2px solid var(--color-warning)`,
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 0 40px rgba(255,204,0,0.3), var(--shadow-xl)',
            }}
            initial={{ opacity: 0, scale: 0.7, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          >
            {/* Icon */}
            <div className='text-center mb-4'>
              <div
                className='inline-flex items-center justify-center w-14 h-14 rounded-full mb-3'
                style={{ backgroundColor: 'var(--color-warning-bg)' }}
              >
                <RotateCcw size={26} style={{ color: 'var(--color-warning-text)' }} />
              </div>
              <h2 className='font-bold text-lg' style={{ color: 'var(--color-text)' }}>
                Right to Match
              </h2>
              <p className='text-sm mt-1' style={{ color: 'var(--color-text-muted)' }}>
                {rtmPrompt.winningTeam?.name} bid{' '}
                <span className='font-semibold' style={{ color: 'var(--color-warning-text)' }}>
                  {formatCurrency(rtmPrompt.winningBid, symbol, unit)}
                </span>{' '}
                for{' '}
                <span className='font-medium' style={{ color: 'var(--color-text)' }}>
                  {rtmPrompt.player?.name}
                </span>
              </p>
            </div>

            {/* Countdown */}
            {remaining !== null && (
              <div
                className='text-center text-3xl font-bold mb-5 tabular-nums transition-colors'
                style={{ color: isUrgent ? 'var(--color-danger)' : 'var(--color-warning-text)' }}
              >
                {remaining}s
              </div>
            )}

            <div className='flex gap-3'>
              <Button variant='ghost' className='flex-1' onClick={() => respondRTM(false)}>
                Decline
              </Button>
              <Button variant='warning' className='flex-1' onClick={() => respondRTM(true)}>
                Exercise RTM
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RTMPrompt;
