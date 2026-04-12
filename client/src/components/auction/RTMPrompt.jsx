import { useAuction } from '../../context/AuctionContext';
import useCountdown from '../../hooks/useCountdown';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';

const RTMPrompt = ({ auction }) => {
  const { rtmPrompt, respondRTM } = useAuction();
  const remaining = useCountdown(rtmPrompt?.expiresAt);
  const symbol = auction?.currencySymbol || '₹';
  const unit = auction?.currencyUnit || 'lakh';

  if (!rtmPrompt) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' />
      <div className='relative max-w-sm w-full bg-gray-900 border border-orange-500 rounded-2xl shadow-2xl p-6 animate-slide-up'>
        <div className='text-center mb-4'>
          <div className='text-3xl mb-2'>🔄</div>
          <h2 className='text-white font-bold text-lg'>Right to Match</h2>
          <p className='text-gray-400 text-sm mt-1'>
            {rtmPrompt.winningTeam?.name} bid{' '}
            <span className='text-orange-400 font-semibold'>
              {formatCurrency(rtmPrompt.winningBid, symbol, unit)}
            </span>{' '}
            for <span className='text-white font-medium'>{rtmPrompt.player?.name}</span>
          </p>
        </div>

        {remaining !== null && (
          <div className='text-center text-2xl font-bold text-orange-400 mb-4'>{remaining}s</div>
        )}

        <div className='flex gap-3'>
          <Button variant='ghost' className='flex-1' onClick={() => respondRTM(false)}>
            Decline
          </Button>
          <Button variant='warning' className='flex-1' onClick={() => respondRTM(true)}>
            Exercise RTM
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RTMPrompt;
