import { useState } from 'react';
import { setOfflineBid, overrideBid } from '../../services/auctionService';
import { useToast } from '../../context/ToastContext';
import { calcNextBid } from '../../utils/calcBidIncrement';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../ui/Button';

const OfflineBidPanel = ({ auction, teams }) => {
  const { addToast } = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loading, setLoading] = useState(false);

  const isLive = auction?.status === 'live';
  const hasPlayer = !!auction?.currentPlayerId;
  const sym = auction?.currencySymbol || '';
  const unit = auction?.currencyUnit || '';

  const basePrice = auction?.currentPlayerId?.basePrice ?? 0;
  const noBidYet = !auction?.currentBidTeamId;
  const nextBid = noBidYet
    ? (basePrice || calcNextBid(auction?.currentBid ?? 0, auction?.bidIncrementTiers ?? []))
    : calcNextBid(auction.currentBid, auction?.bidIncrementTiers ?? []);
  const canBid = isLive && hasPlayer && selectedTeamId && !loading;

  const handleSellAtBase = async () => {
    if (!canBid || !basePrice) return;
    setLoading(true);
    try {
      await overrideBid(auction._id, selectedTeamId, basePrice);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to sell at base price', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentBidTeam = teams.find(
    (t) => t._id === (auction?.currentBidTeamId?._id || auction?.currentBidTeamId)
  );

  const handleBid = async () => {
    if (!canBid) return;
    setLoading(true);
    try {
      await setOfflineBid(auction._id, selectedTeamId, nextBid);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to record bid', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-white font-semibold text-sm'>Offline Bid Control</h3>
        <span className='text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium'>
          Offline Mode
        </span>
      </div>

      {!hasPlayer ? (
        <p className='text-gray-500 text-sm text-center py-2'>No player on the block</p>
      ) : (
        <>
          {/* Current bid */}
          <div className='bg-gray-800/60 rounded-xl px-4 py-3'>
            <p className='text-gray-500 text-xs mb-0.5'>Current bid</p>
            {auction.currentBid > 0 ? (
              <>
                <p className='text-white font-bold text-xl'>
                  {formatCurrency(auction.currentBid, sym, unit)}
                </p>
                {currentBidTeam && (
                  <p className='text-gray-400 text-xs mt-0.5'>by {currentBidTeam.name}</p>
                )}
              </>
            ) : (
              <p className='text-gray-400 text-sm'>
                Base price — {basePrice > 0 ? formatCurrency(basePrice, sym, unit) : '—'}
              </p>
            )}
          </div>

          {/* Team selector + increment button */}
          <div>
            <label className='block text-gray-400 text-xs mb-1.5'>Bidding Team</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mb-3'
            >
              <option value=''>Select team...</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name} ({team.shortName})
                </option>
              ))}
            </select>

            <Button
              disabled={!canBid}
              loading={loading}
              onClick={handleBid}
              className='w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-semibold'
            >
              Bid {formatCurrency(nextBid, sym, unit)}
            </Button>

            {noBidYet && basePrice > 0 && (
              <button
                disabled={!canBid}
                onClick={handleSellAtBase}
                className='w-full mt-2 text-xs text-green-400 hover:text-green-300 border border-green-800 hover:border-green-600 rounded-lg py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
              >
                Sell at base price — {formatCurrency(basePrice, sym, unit)}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OfflineBidPanel;
