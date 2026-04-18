import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { useAuction } from '../../context/AuctionContext';
import { listTeamsWithSquads } from '../../services/teamService';
import { listReleaseRequests, approveReleaseRequest, rejectReleaseRequest, releasePlayerDirect } from '../../services/auctionService';
import { formatCurrency } from '../../utils/formatCurrency';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';

const TeamSquadPanel = ({ auctionId, auction }) => {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const { squadRefreshAt, releaseRequests: liveRequests } = useAuction();
  const [open, setOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const symbol = auction?.currencySymbol || '₹';
  const unit = auction?.currencyUnit || 'lakh';

  const { data: teams = [], isLoading: teamsLoading, refetch: refetchSquads } = useQuery({
    queryKey: ['teams-squads', auctionId],
    queryFn: () => listTeamsWithSquads(auctionId),
    enabled: open,
  });

  const { data: initialRequests = [] } = useQuery({
    queryKey: ['release-requests', auctionId],
    queryFn: () => listReleaseRequests(auctionId, 'pending'),
    enabled: open,
  });

  const pendingRequests = liveRequests.length > 0 ? liveRequests : initialRequests;

  useEffect(() => {
    if (squadRefreshAt && open) refetchSquads();
  }, [squadRefreshAt]);

  const approveMut = useMutation({
    mutationFn: (reqId) => approveReleaseRequest(auctionId, reqId),
    onSuccess: () => {
      addToast('Player released — back in pool', 'success');
      qc.invalidateQueries({ queryKey: ['release-requests', auctionId] });
      refetchSquads();
    },
    onError: (e) => addToast(e.response?.data?.message || 'Failed to approve', 'error'),
  });

  const rejectMut = useMutation({
    mutationFn: ({ reqId, note }) => rejectReleaseRequest(auctionId, reqId, note),
    onSuccess: () => {
      addToast('Release request rejected', 'info');
      qc.invalidateQueries({ queryKey: ['release-requests', auctionId] });
      setRejectingId(null);
      setRejectNote('');
    },
    onError: (e) => addToast(e.response?.data?.message || 'Failed to reject', 'error'),
  });

  const directReleaseMut = useMutation({
    mutationFn: (playerId) => releasePlayerDirect(auctionId, playerId),
    onSuccess: () => {
      addToast('Player released — back in pool', 'success');
      refetchSquads();
    },
    onError: (e) => addToast(e.response?.data?.message || 'Failed to release', 'error'),
  });

  const totalPlayers = teams.reduce((s, t) => s + (t.players?.length || 0), 0);

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
          <span className='font-medium'>Team Squads</span>
          {pendingRequests.length > 0 && (
            <span
              className='text-xs font-bold px-2 py-0.5 rounded-full'
              style={{ backgroundColor: 'var(--color-warning)', color: '#1a1a1a' }}
            >
              {pendingRequests.length} release{pendingRequests.length > 1 ? 's' : ''} pending
            </span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-xs' style={{ color: 'var(--color-text-subtle)' }}>
            {totalPlayers} signed
          </span>
          {open ? <ChevronUp size={16} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />}
        </div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          {/* Pending release requests */}
          {pendingRequests.length > 0 && (
            <div className='p-4 space-y-2' style={{ borderBottom: '1px solid var(--color-border)' }}>
              <p className='text-xs uppercase tracking-wider mb-3' style={{ color: 'var(--color-warning-text)', fontWeight: 600 }}>
                Pending Release Requests
              </p>
              {pendingRequests.map((req) => (
                <div
                  key={req._id}
                  className='rounded-xl p-3'
                  style={{
                    backgroundColor: 'var(--color-warning-bg)',
                    border: '1px solid var(--color-warning)',
                  }}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='text-sm font-medium' style={{ color: 'var(--color-text)' }}>
                          {req.playerId?.name || 'Player'}
                        </span>
                        {req.playerId?.category && (
                          <span
                            className='text-xs px-1.5 py-0.5 rounded'
                            style={{ backgroundColor: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                          >
                            {req.playerId.category}
                          </span>
                        )}
                        <span className='text-xs' style={{ color: 'var(--color-text-muted)' }}>
                          from {req.teamId?.name}
                        </span>
                      </div>
                      {req.reason && (
                        <p className='text-xs mt-1' style={{ color: 'var(--color-text-muted)' }}>
                          "{req.reason}"
                        </p>
                      )}
                      <p className='text-xs mt-0.5' style={{ color: 'var(--color-text-subtle)' }}>
                        Requested by {req.requestedBy?.name}
                      </p>
                    </div>
                    <div className='flex gap-2 flex-shrink-0'>
                      {rejectingId === req._id ? (
                        <div className='flex flex-col gap-1.5'>
                          <input
                            type='text'
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
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
                              variant='danger'
                              loading={rejectMut.isPending}
                              onClick={() => rejectMut.mutate({ reqId: req._id, note: rejectNote })}
                            >
                              Confirm
                            </Button>
                            <Button size='sm' variant='ghost' onClick={() => { setRejectingId(null); setRejectNote(''); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button
                            size='sm'
                            variant='success'
                            loading={approveMut.isPending && approveMut.variables === req._id}
                            onClick={() => approveMut.mutate(req._id)}
                          >
                            Approve
                          </Button>
                          <Button size='sm' variant='danger' onClick={() => setRejectingId(req._id)}>
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Team squads */}
          <div className='p-4 space-y-4 max-h-80 overflow-y-auto'>
            {teamsLoading ? (
              <div className='flex justify-center py-6'><Spinner /></div>
            ) : teams.length === 0 ? (
              <p className='text-sm text-center py-4' style={{ color: 'var(--color-text-subtle)' }}>
                No teams yet
              </p>
            ) : (
              teams.map((team) => (
                <div key={team._id}>
                  <div className='flex items-center gap-2 mb-2'>
                    <div className='w-2 h-2 rounded-full flex-shrink-0' style={{ backgroundColor: team.colorHex || 'var(--color-accent)' }} />
                    <span className='text-sm font-semibold' style={{ color: 'var(--color-text)' }}>
                      {team.name}
                    </span>
                    <span className='text-xs' style={{ color: 'var(--color-text-subtle)' }}>
                      ({team.shortName})
                    </span>
                    <span className='ml-auto text-xs font-medium' style={{ color: 'var(--color-accent)' }}>
                      {formatCurrency(team.remainingPurse, symbol, unit)} left
                    </span>
                  </div>

                  {!team.players || team.players.length === 0 ? (
                    <p className='text-xs pl-4' style={{ color: 'var(--color-text-subtle)' }}>
                      No players yet
                    </p>
                  ) : (
                    <div className='space-y-1 pl-4'>
                      {team.players.map((entry) => {
                        const p = entry.playerId;
                        if (!p) return null;
                        const hasPending = pendingRequests.some(
                          (r) => (r.playerId?._id || r.playerId) === p._id && (r.teamId?._id || r.teamId) === team._id
                        );
                        return (
                          <div
                            key={p._id}
                            className='flex items-center justify-between gap-2 rounded-lg px-3 py-1.5'
                            style={{ backgroundColor: 'var(--color-surface-sunken)' }}
                          >
                            <div className='flex items-center gap-2 min-w-0'>
                              <span className='text-xs font-medium truncate' style={{ color: 'var(--color-text)' }}>
                                {p.name}
                              </span>
                              {p.category && (
                                <span
                                  className='text-xs px-1.5 py-0.5 rounded flex-shrink-0'
                                  style={{ backgroundColor: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                                >
                                  {p.category}
                                </span>
                              )}
                              {p.role && (
                                <span className='text-xs flex-shrink-0' style={{ color: 'var(--color-text-subtle)' }}>
                                  {p.role}
                                </span>
                              )}
                            </div>
                            <div className='flex items-center gap-2 flex-shrink-0'>
                              <span className='text-xs font-medium' style={{ color: 'var(--color-success-text)' }}>
                                {formatCurrency(entry.pricePaid, symbol, unit)}
                              </span>
                              {hasPending ? (
                                <span className='text-xs' style={{ color: 'var(--color-warning-text)' }}>
                                  Pending release
                                </span>
                              ) : (
                                <button
                                  onClick={() => directReleaseMut.mutate(p._id)}
                                  disabled={directReleaseMut.isPending}
                                  className='text-xs px-1.5 py-0.5 rounded border transition-colors disabled:opacity-40'
                                  style={{
                                    color: 'var(--color-text-subtle)',
                                    borderColor: 'var(--color-border)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--color-danger-text)';
                                    e.currentTarget.style.borderColor = 'var(--color-danger)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--color-text-subtle)';
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                  }}
                                >
                                  Release
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSquadPanel;
