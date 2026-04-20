import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { formatShort } from '../../utils/formatCurrency';
import { calcNextBid } from '../../utils/calcBidIncrement';
import { listTeamsWithSquads } from '../../services/teamService';

const getMaxBidVariant = (maxBid, nextBid) => {
  if (maxBid === 0 || (nextBid > 0 && maxBid < nextBid)) return 'danger';
  if (nextBid > 0 && maxBid < nextBid * 3) return 'warning';
  return 'success';
};

const variantStyles = {
  danger: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger-text)' },
  warning: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' },
  success: { bg: 'var(--color-success-bg)', color: 'var(--color-success-text)' },
};

const SkeletonRow = () => (
  <div className='flex items-center gap-2 py-1.5 animate-pulse'>
    <div className='h-3 rounded flex-1' style={{ backgroundColor: 'var(--color-surface-sunken)' }} />
    <div className='h-3 w-16 rounded' style={{ backgroundColor: 'var(--color-surface-sunken)' }} />
  </div>
);

const TeamBudgetPanel = ({ teams = [], auction, myTeamId }) => {
  const { teamMaxBids, squadRefreshAt } = useAuction();
  const [expanded, setExpanded] = useState({});
  const [squadsData, setSquadsData] = useState(null);
  const [squadsLoading, setSquadsLoading] = useState(false);
  const [squadsLoadedAt, setSquadsLoadedAt] = useState(undefined);

  const symbol = auction?.currencySymbol || '₹';
  const unit = auction?.currencyUnit || 'lakh';
  const tiers = auction?.bidIncrementTiers || [];
  const currentBid = auction?.currentBid || 0;
  const nextBid = calcNextBid(currentBid, tiers);
  const hasCurrentPlayer = !!auction?.currentPlayerId;

  const fetchSquads = useCallback(async () => {
    if (!auction?._id) return;
    setSquadsLoading(true);
    try {
      const all = await listTeamsWithSquads(auction._id);
      const map = {};
      for (const t of all) map[t._id] = t.players || [];
      setSquadsData(map);
      setSquadsLoadedAt(squadRefreshAt);
    } catch {
      // keep stale data on error — non-critical
    } finally {
      setSquadsLoading(false);
    }
  }, [auction?._id, squadRefreshAt]);

  // Fetch eagerly on mount and whenever squadRefreshAt changes (player released)
  useEffect(() => {
    fetchSquads();
  }, [fetchSquads]);

  const toggleTeam = (teamId) => {
    setExpanded((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  if (teams.length === 0) return null;

  return (
    <div
      className='rounded-2xl overflow-hidden'
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className='px-4 pt-3 pb-2'>
        <h3
          className='text-xs uppercase tracking-wider'
          style={{ color: 'var(--color-text-subtle)', fontWeight: 600 }}
        >
          Teams
        </h3>
      </div>

      <div>
        {teams.map((team, idx) => {
          const isMe = myTeamId && team._id === myTeamId;
          const pct = Math.round((team.remainingPurse / team.initialPurse) * 100);
          const maxBid = hasCurrentPlayer ? (teamMaxBids?.[team._id] ?? null) : null;
          const variant = maxBid !== null ? getMaxBidVariant(maxBid, nextBid) : null;
          const isExpanded = !!expanded[team._id];
          const squadEntries = squadsData?.[team._id] || [];
          const playerCount = squadsData ? squadEntries.length : (team.players?.length ?? 0);

          return (
            <div
              key={team._id}
              style={{
                borderTop: idx > 0 ? '1px solid var(--color-border)' : 'none',
                backgroundColor: isMe ? 'var(--color-accent-muted)' : undefined,
              }}
            >
              {/* Team header row */}
              <button
                onClick={() => toggleTeam(team._id)}
                className='w-full text-left px-4 py-3 flex items-center gap-3 transition-colors'
                style={{ cursor: 'pointer' }}
              >
                {/* Color bar */}
                <div
                  className='w-1 h-8 rounded-full flex-shrink-0'
                  style={{ backgroundColor: team.colorHex || 'var(--color-accent)' }}
                />

                {/* Logo or initial */}
                {team.logoUrl ? (
                  <img
                    src={team.logoUrl}
                    alt=''
                    className='h-7 w-7 rounded-full object-cover flex-shrink-0'
                  />
                ) : (
                  <div
                    className='h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold'
                    style={{
                      backgroundColor: team.colorHex ? `${team.colorHex}33` : 'var(--color-surface-sunken)',
                      color: team.colorHex || 'var(--color-text-muted)',
                    }}
                  >
                    {team.shortName?.[0] || '?'}
                  </div>
                )}

                {/* Name + stats */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-1.5 flex-wrap'>
                    <span className='text-sm font-semibold truncate' style={{ color: 'var(--color-text)' }}>
                      {team.name}
                    </span>
                    {isMe && (
                      <span
                        className='text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0'
                        style={{ backgroundColor: 'var(--color-accent)', color: '#fff', fontSize: 10 }}
                      >
                        You
                      </span>
                    )}
                  </div>
                  <div className='text-xs mt-0.5 flex items-center gap-1.5' style={{ color: 'var(--color-text-muted)' }}>
                    <span>{formatShort(team.remainingPurse, symbol, unit)}</span>
                    <span style={{ color: 'var(--color-text-subtle)' }}>·</span>
                    <span style={{ color: pct <= 25 ? 'var(--color-danger-text)' : pct <= 60 ? 'var(--color-warning-text)' : 'var(--color-text-muted)' }}>
                      {pct}%
                    </span>
                    <span style={{ color: 'var(--color-text-subtle)' }}>·</span>
                    <span>{playerCount} player{playerCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Max bid chip */}
                {maxBid !== null && variant && (
                  <div
                    className='text-xs px-2 py-1 rounded-lg font-semibold flex-shrink-0 whitespace-nowrap'
                    style={variantStyles[variant]}
                  >
                    {maxBid === 0 ? 'Blocked' : `Max ${formatShort(maxBid, symbol, unit)}`}
                  </div>
                )}

                {/* Chevron */}
                <div className='flex-shrink-0' style={{ color: 'var(--color-text-subtle)' }}>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {/* Squad list */}
              {isExpanded && (
                <div
                  className='px-4 pb-3'
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  {squadsLoading && !squadsData ? (
                    <div className='pt-2 space-y-1.5'>
                      {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
                    </div>
                  ) : squadEntries.length === 0 ? (
                    <p className='text-xs pt-2' style={{ color: 'var(--color-text-subtle)' }}>
                      No players yet
                    </p>
                  ) : (
                    <div className='pt-2 space-y-1.5'>
                      {squadEntries.map((entry, i) => {
                        const p = entry.playerId || {};
                        return (
                          <div key={p._id || i} className='flex items-center justify-between gap-2'>
                            <div className='flex-1 min-w-0'>
                              <span
                                className='text-xs font-medium block truncate'
                                style={{ color: 'var(--color-text)' }}
                              >
                                {p.name || '—'}
                              </span>
                              {(p.role || p.category) && (
                                <span className='text-xs' style={{ color: 'var(--color-text-subtle)' }}>
                                  {p.role || p.category}
                                </span>
                              )}
                            </div>
                            <span
                              className='text-xs flex-shrink-0 font-mono-nums'
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {formatShort(entry.pricePaid, symbol, unit)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamBudgetPanel;
