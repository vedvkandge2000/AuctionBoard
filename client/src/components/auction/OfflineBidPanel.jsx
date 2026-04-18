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
    <div
      className='rounded-2xl p-5 space-y-4'
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className='flex items-center justify-between'>
        <h3 className='font-semibold text-sm' style={{ color: 'var(--color-text)' }}>
          Offline Bid Control
        </h3>
        <span
          className='text-xs px-2 py-0.5 rounded-full font-medium'
          style={{
            backgroundColor: 'var(--color-warning-bg)',
            color: 'var(--color-warning-text)',
          }}
        >
          Offline Mode
        </span>
      </div>

      {!hasPlayer ? (
        <p className='text-sm text-center py-2' style={{ color: 'var(--color-text-subtle)' }}>
          No player on the block
        </p>
      ) : (
        <>
          {/* Current bid */}
          <div
            className='rounded-xl px-4 py-3'
            style={{ backgroundColor: 'var(--color-surface-sunken)' }}
          >
            <p className='text-xs mb-0.5' style={{ color: 'var(--color-text-subtle)' }}>
              Current bid
            </p>
            {auction.currentBid > 0 ? (
              <>
                <p className='font-bold text-xl' style={{ color: 'var(--color-text)' }}>
                  {formatCurrency(auction.currentBid, sym, unit)}
                </p>
                {currentBidTeam && (
                  <p className='text-xs mt-0.5' style={{ color: 'var(--color-text-muted)' }}>
                    by {currentBidTeam.name}
                  </p>
                )}
              </>
            ) : (
              <p className='text-sm' style={{ color: 'var(--color-text-muted)' }}>
                Base price — {basePrice > 0 ? formatCurrency(basePrice, sym, unit) : '—'}
              </p>
            )}
          </div>

          {/* Team selector + bid button */}
          <div>
            <label className='block text-xs mb-1.5' style={{ color: 'var(--color-text-muted)' }}>
              Bidding Team
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className='w-full rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none'
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
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
              className='w-full font-semibold'
              style={{
                backgroundColor: 'var(--color-warning)',
                color: '#1a1a1a',
              }}
            >
              Bid {formatCurrency(nextBid, sym, unit)}
            </Button>

            {noBidYet && basePrice > 0 && (
              <button
                disabled={!canBid}
                onClick={handleSellAtBase}
                className='w-full mt-2 text-xs px-3 py-2 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
                style={{
                  color: 'var(--color-success-text)',
                  borderColor: 'var(--color-success)',
                }}
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
