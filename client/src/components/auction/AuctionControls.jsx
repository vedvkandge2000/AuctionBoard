import Button from '../ui/Button';
import * as auctionService from '../../services/auctionService';
import { useToast } from '../../context/ToastContext';

const AuctionControls = ({ auction, onUpdate }) => {
  const { addToast } = useToast();
  const { status, _id: id } = auction;

  const act = async (fn, label) => {
    try {
      await fn(id);
      onUpdate();
      addToast(`${label} — done`, 'success');
    } catch (e) {
      addToast(e.response?.data?.message || `Failed: ${label}`, 'error');
    }
  };

  return (
    <div className='bg-gray-900 rounded-2xl border border-gray-700 p-4'>
      <h3 className='text-sm font-medium text-gray-400 mb-3'>Admin Controls</h3>
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
