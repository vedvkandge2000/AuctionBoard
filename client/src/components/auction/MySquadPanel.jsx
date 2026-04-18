import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { useAuction } from '../../context/AuctionContext';
import { getSquad } from '../../services/teamService';
import { requestRelease } from '../../services/auctionService';
import { formatCurrency } from '../../utils/formatCurrency';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';

const MySquadPanel = ({ auctionId, auction, myTeam }) => {
  const { addToast } = useToast();
  const { squadRefreshAt, releaseRequests } = useAuction();
  const [open, setOpen] = useState(false);
  const [requestingId, setRequestingId] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const symbol = auction?.currencySymbol || '₹';
  const unit = auction?.currencyUnit || 'lakh';

  const { data: squadData, isLoading, refetch } = useQuery({
    queryKey: ['squad', auctionId, myTeam?._id],
    queryFn: () => getSquad(auctionId, myTeam._id),
    enabled: open && !!myTeam,
  });

  useEffect(() => {
    if (squadRefreshAt && open) refetch();
  }, [squadRefreshAt]);

  const handleRequestRelease = async (playerId) => {
    setSubmitting(true);
    try {
      await requestRelease(auctionId, playerId, reason);
      addToast('Release request submitted — waiting for auctioneer approval', 'success');
      setRequestingId(null);
      setReason('');
    } catch (e) {
      addToast(e.response?.data?.message || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const players = squadData?.players || [];

  const pendingPlayerIds = new Set(
    releaseRequests
      .filter((r) => (r.teamId?._id || r.teamId) === myTeam?._id)
      .map((r) => r.playerId?._id || r.playerId)
  );

  return (
    <div
      className='rounded-2xl overflow-hidden'
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <button
        className='w-full flex items-center justify-between px-4 py-3 text-sm transition-colors'
        style={{ color: 'var(--color-text)' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-sunken)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        onClick={() => setOpen((v) => !v)}
      >
        <div className='flex items-center gap-2'>
          <span className='font-medium'>My Squad</span>
          <span className='text-xs' style={{ color: 'var(--color-text-subtle)' }}>
            ({players.length} players)
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-medium' style={{ color: 'var(--color-accent)' }}>
            {formatCurrency(myTeam?.remainingPurse || 0, symbol, unit)} left
          </span>
          {open
            ? <ChevronUp size={16} style={{ color: 'var(--color-text-muted)' }} />
            : <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />}
        </div>
      </button>

      {open && (
        <div
          className='p-4 max-h-80 overflow-y-auto'
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {isLoading ? (
            <div className='flex justify-center py-6'><Spinner /></div>
          ) : players.length === 0 ? (
            <p className='text-sm text-center py-4' style={{ color: 'var(--color-text-subtle)' }}>
              No players in your squad yet
            </p>
          ) : (
            <div className='space-y-2'>
              {players.map((entry) => {
                const p = entry.playerId;
                if (!p) return null;
                const isPending = pendingPlayerIds.has(p._id);

                return (
                  <div
                    key={p._id}
                    className='rounded-xl p-3'
                    style={{ backgroundColor: 'var(--color-surface-sunken)' }}
                  >
                    <div className='flex items-center justify-between gap-3'>
                      <div className='min-w-0'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <span className='text-sm font-medium' style={{ color: 'var(--color-text)' }}>
                            {p.name}
                          </span>
                          {p.category && (
                            <span
                              className='text-xs px-1.5 py-0.5 rounded'
                              style={{ backgroundColor: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                            >
                              {p.category}
                            </span>
                          )}
                          {p.role && (
                            <span className='text-xs' style={{ color: 'var(--color-text-muted)' }}>
                              {p.role}
                            </span>
                          )}
                        </div>
                        <p className='text-xs mt-0.5' style={{ color: 'var(--color-success-text)' }}>
                          Paid: {formatCurrency(entry.pricePaid, symbol, unit)}
                        </p>
                      </div>

                      <div className='flex-shrink-0'>
                        {isPending ? (
                          <span
                            className='text-xs px-2 py-1 rounded-lg'
                            style={{
                              backgroundColor: 'var(--color-warning-bg)',
                              color: 'var(--color-warning-text)',
                              border: '1px solid var(--color-warning)',
                            }}
                          >
                            Release pending
                          </span>
                        ) : requestingId === p._id ? (
                          <div className='flex flex-col gap-1.5'>
                            <input
                              type='text'
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder='Reason (optional)'
                              className='rounded px-2 py-1 text-xs w-40 focus:outline-none'
                              style={{
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                              }}
                            />
                            <div className='flex gap-1'>
                              <Button
                                size='sm'
                                variant='warning'
                                loading={submitting}
                                onClick={() => handleRequestRelease(p._id)}
                              >
                                Submit
                              </Button>
                              <Button size='sm' variant='ghost' onClick={() => { setRequestingId(null); setReason(''); }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRequestingId(p._id)}
                            className='text-xs px-2 py-1 rounded border transition-colors'
                            style={{
                              color: 'var(--color-text-muted)',
                              borderColor: 'var(--color-border)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--color-warning-text)';
                              e.currentTarget.style.borderColor = 'var(--color-warning)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--color-text-muted)';
                              e.currentTarget.style.borderColor = 'var(--color-border)';
                            }}
                          >
                            Request Release
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MySquadPanel;
