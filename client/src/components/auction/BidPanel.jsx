import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { calcNextBid } from '../../utils/calcBidIncrement';
import Button from '../ui/Button';

const BidPanel = ({ auction, myTeam, onBid, bidPending }) => {
  const { isAdmin, isTeamOwner } = useAuth();
  const { currentBid, currentBidTeamId } = useAuction();

  if (!auction?.currentPlayerId) return null;

  const symbol = auction.currencySymbol || '₹';
  const unit = auction.currencyUnit || 'lakh';
  const tiers = auction.bidIncrementTiers || [];
  const nextBid = calcNextBid(currentBid || auction.currentPlayerId?.basePrice || 0, tiers);
  const isMyTeamLeading = currentBidTeamId && myTeam && currentBidTeamId._id === myTeam._id;
  const canBid = isTeamOwner && myTeam && auction.status === 'live' && !isMyTeamLeading;

  return (
    <div className='bg-gray-900 rounded-2xl border border-gray-700 p-5 space-y-4'>
      {/* Current bid */}
      <div className='text-center'>
        <p className='text-gray-400 text-sm mb-1'>Current Bid</p>
        <div className='text-4xl font-bold text-white'>
          {currentBid > 0 ? formatCurrency(currentBid, symbol, unit) : formatCurrency(auction.currentPlayerId?.basePrice, symbol, unit)}
        </div>
        {currentBidTeamId && (
          <p className='text-indigo-400 text-sm mt-1 font-medium'>
            🏷️ {currentBidTeamId.name || currentBidTeamId.shortName}
          </p>
        )}
      </div>

      {/* Bid button for team owners */}
      {canBid && (
        <Button
          size='lg'
          className='w-full text-lg'
          loading={bidPending}
          onClick={() => onBid(nextBid)}
        >
          Bid {formatCurrency(nextBid, symbol, unit)}
        </Button>
      )}

      {isMyTeamLeading && (
        <div className='text-center text-green-400 font-semibold text-sm py-2 bg-green-900/30 rounded-lg'>
          ✅ You are the highest bidder
        </div>
      )}

      {!isTeamOwner && !isAdmin && (
        <p className='text-center text-gray-500 text-sm'>Viewing only</p>
      )}
    </div>
  );
};

export default BidPanel;
