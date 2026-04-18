import { useRef, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { calcNextBid } from '../../utils/calcBidIncrement';
import Button from '../ui/Button';

const BidPanel = ({ auction, myTeam, onBid, bidPending }) => {
  const { isAdmin, isTeamOwner } = useAuth();
  const { currentBid, currentBidTeamId, teamMaxBids } = useAuction();
  const bidAmountRef = useRef(null);

  // Pulse animation on bid change
  useEffect(() => {
    if (!currentBid || !bidAmountRef.current) return;
    const el = bidAmountRef.current;
    el.classList.remove('animate-bid-pulse');
    void el.offsetWidth; // reflow to restart animation
    el.classList.add('animate-bid-pulse');
  }, [currentBid]);

  if (!auction?.currentPlayerId) return null;

  const symbol = auction.currencySymbol || '₹';
  const unit = auction.currencyUnit || 'lakh';
  const tiers = auction.bidIncrementTiers || [];
  const nextBid = calcNextBid(currentBid || auction.currentPlayerId?.basePrice || 0, tiers);
  const isMyTeamLeading = currentBidTeamId && myTeam && currentBidTeamId._id === myTeam._id;
  const myMaxBid = myTeam ? (teamMaxBids[myTeam._id] ?? Infinity) : Infinity;
  const bidExceedsMax = nextBid > myMaxBid;
  const canBid = isTeamOwner && myTeam && auction.status === 'live' && !isMyTeamLeading && !bidExceedsMax;

  return (
    <div
      className='rounded-2xl p-5 space-y-4'
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Current bid */}
      <div className='text-center'>
        <p className='text-sm mb-1' style={{ color: 'var(--color-text-muted)' }}>
          Current Bid
        </p>
        <div
          ref={bidAmountRef}
          className='text-4xl font-bold font-mono-nums'
          style={{ color: 'var(--color-text)' }}
        >
          {currentBid > 0
            ? formatCurrency(currentBid, symbol, unit)
            : formatCurrency(auction.currentPlayerId?.basePrice, symbol, unit)}
        </div>
        {currentBidTeamId && (
          <p className='text-sm mt-1 font-medium' style={{ color: 'var(--color-accent)' }}>
            🏷️ {currentBidTeamId.name || currentBidTeamId.shortName}
          </p>
        )}
      </div>

      {/* Max bid indicator */}
      {isTeamOwner && myTeam && myMaxBid !== Infinity && (
        <div
          className='text-center text-xs px-3 py-1.5 rounded-lg'
          style={{
            backgroundColor: bidExceedsMax ? 'var(--color-danger-bg)' : 'var(--color-surface-sunken)',
            color: bidExceedsMax ? 'var(--color-danger-text)' : 'var(--color-text-muted)',
          }}
        >
          Max bid: {formatCurrency(myMaxBid, symbol, unit)}
          {bidExceedsMax && ' — budget limit reached'}
        </div>
      )}

      {/* Bid button */}
      {isTeamOwner && myTeam && auction.status === 'live' && !isMyTeamLeading && (
        <Button
          size='lg'
          className='w-full text-lg'
          loading={bidPending}
          disabled={bidExceedsMax}
          onClick={() => onBid(nextBid)}
        >
          Bid {formatCurrency(nextBid, symbol, unit)}
        </Button>
      )}

      {isMyTeamLeading && (
        <div
          className='flex items-center justify-center gap-2 font-semibold text-sm py-2.5 rounded-lg'
          style={{
            backgroundColor: 'var(--color-success-bg)',
            color: 'var(--color-success-text)',
          }}
        >
          <CheckCircle2 size={16} />
          You are the highest bidder
        </div>
      )}

      {!isTeamOwner && !isAdmin && (
        <p className='text-center text-sm' style={{ color: 'var(--color-text-subtle)' }}>
          Viewing only
        </p>
      )}
    </div>
  );
};

export default BidPanel;
