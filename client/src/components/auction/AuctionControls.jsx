import Button from '../ui/Button';
import * as auctionService from '../../services/auctionService';
import { useToast } from '../../context/ToastContext';

const AuctionControls = ({ auction, onUpdate }) => {
  const { addToast } = useToast();
  const { status, _id: id, currentRound = 1, unsoldPlayerIds = [] } = auction;

  const act = async (fn, label) => {
    try {
      await fn(id);
      onUpdate();
      addToast(`${label} — done`, 'success');
    } catch (e) {
      addToast(e.response?.data?.message || `Failed: ${label}`, 'error');
    }
  };

  const hasUnsold = unsoldPlayerIds.length > 0;

  return (
    <div className='bg-gray-900 rounded-2xl border border-gray-700 p-4'>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-sm font-medium text-gray-400'>Admin Controls</h3>
        <span className='text-xs font-medium text-indigo-400 bg-indigo-900/30 border border-indigo-800 px-2 py-0.5 rounded-full'>
          Round {currentRound}
        </span>
      </div>
      <div className='flex flex-wrap gap-2'>
        {status === 'draft' && (
          <Button size='sm' variant='success' onClick={() => act(auctionService.startAuction, 'Started')}>
            ▶️ Start Auction
          </Button>
        )}
        {status === 'live' && (
          <>
            <Button size='sm' onClick={() => act(auctionService.nextPlayer, 'Next player')}>
              ⏭️ Next Player
            </Button>
            <Button size='sm' variant='success' onClick={() => act(auctionService.markSold, 'Sold!')}>
              🔨 Sold
            </Button>
            <Button size='sm' variant='ghost' onClick={() => act(auctionService.markUnsold, 'Unsold')}>
              ❌ Unsold
            </Button>
            <Button size='sm' variant='warning' onClick={() => act(auctionService.pauseAuction, 'Paused')}>
              ⏸️ Pause
            </Button>
          </>
        )}
        {status === 'paused' && (
          <Button size='sm' variant='success' onClick={() => act(auctionService.resumeAuction, 'Resumed')}>
            ▶️ Resume
          </Button>
        )}
        {(status === 'live' || status === 'paused') && hasUnsold && (
          <Button
            size='sm'
            variant='ghost'
            onClick={() => {
              if (confirm(`Re-introduce ${unsoldPlayerIds.length} unsold player(s) as Round ${currentRound + 1}?`)) {
                act(auctionService.advanceRound, `Round ${currentRound + 1} started`);
              }
            }}
          >
            🔄 Next Round ({unsoldPlayerIds.length} unsold)
          </Button>
        )}
        {(status === 'live' || status === 'paused') && (
          <Button size='sm' variant='danger' onClick={() => act(auctionService.endAuction, 'Ended')}>
            🏁 End Auction
          </Button>
        )}
      </div>
    </div>
  );
};

export default AuctionControls;
