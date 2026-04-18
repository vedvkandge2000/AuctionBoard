import { useState } from 'react';
import { Play, SkipForward, Hammer, X, Pause, RefreshCw, Flag } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import * as auctionService from '../../services/auctionService';
import { useToast } from '../../context/ToastContext';

const AuctionControls = ({ auction, onUpdate }) => {
  const { addToast } = useToast();
  const { status, _id: id, currentRound = 1, unsoldPlayerIds = [] } = auction;
  const [confirmNextRound, setConfirmNextRound] = useState(false);

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
    <div
      className='rounded-2xl p-4'
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-sm font-medium' style={{ color: 'var(--color-text-muted)' }}>
          Admin Controls
        </h3>
        <span
          className='text-xs font-medium px-2 py-0.5 rounded-full'
          style={{
            backgroundColor: 'var(--color-accent-muted)',
            color: 'var(--color-accent)',
            border: '1px solid var(--color-accent)',
          }}
        >
          Round {currentRound}
        </span>
      </div>

      <div className='flex flex-wrap gap-2'>
        {status === 'draft' && (
          <Button size='sm' variant='success' onClick={() => act(auctionService.startAuction, 'Started')}>
            <Play size={14} /> Start Auction
          </Button>
        )}
        {status === 'live' && (
          <>
            <Button size='sm' onClick={() => act(auctionService.nextPlayer, 'Next player')}>
              <SkipForward size={14} /> Next Player
            </Button>
            <Button size='sm' variant='success' onClick={() => act(auctionService.markSold, 'Sold!')}>
              <Hammer size={14} /> Sold
            </Button>
            <Button size='sm' variant='ghost' onClick={() => act(auctionService.markUnsold, 'Unsold')}>
              <X size={14} /> Unsold
            </Button>
            <Button size='sm' variant='warning' onClick={() => act(auctionService.pauseAuction, 'Paused')}>
              <Pause size={14} /> Pause
            </Button>
          </>
        )}
        {status === 'paused' && (
          <Button size='sm' variant='success' onClick={() => act(auctionService.resumeAuction, 'Resumed')}>
            <Play size={14} /> Resume
          </Button>
        )}
        {(status === 'live' || status === 'paused') && hasUnsold && (
          <Button size='sm' variant='ghost' onClick={() => setConfirmNextRound(true)}>
            <RefreshCw size={14} /> Next Round ({unsoldPlayerIds.length} unsold)
          </Button>
        )}
        {(status === 'live' || status === 'paused') && (
          <Button size='sm' variant='danger' onClick={() => act(auctionService.endAuction, 'Ended')}>
            <Flag size={14} /> End Auction
          </Button>
        )}
      </div>

      {/* Next Round confirmation modal */}
      <Modal
        open={confirmNextRound}
        onClose={() => setConfirmNextRound(false)}
        title='Start Next Round?'
        size='sm'
      >
        <p className='text-sm mb-5' style={{ color: 'var(--color-text-muted)' }}>
          Re-introduce {unsoldPlayerIds.length} unsold player(s) as Round {currentRound + 1}?
        </p>
        <div className='flex gap-3 justify-end'>
          <Button size='sm' variant='ghost' onClick={() => setConfirmNextRound(false)}>
            Cancel
          </Button>
          <Button
            size='sm'
            variant='primary'
            onClick={() => {
              setConfirmNextRound(false);
              act(auctionService.advanceRound, `Round ${currentRound + 1} started`);
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AuctionControls;
