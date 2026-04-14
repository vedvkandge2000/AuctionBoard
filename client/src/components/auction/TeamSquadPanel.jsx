import { useState, useEffect } from 'react';
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

  // Initial load of pending requests (socket keeps it live after that)
  const { data: initialRequests = [] } = useQuery({
    queryKey: ['release-requests', auctionId],
    queryFn: () => listReleaseRequests(auctionId, 'pending'),
    enabled: open,
  });

  // Merge: prefer live socket state once loaded, fall back to initial fetch
  const pendingRequests = liveRequests.length > 0 ? liveRequests : initialRequests;

  // Refetch squads whenever a player gets released
  useEffect(() => {
    if (squadRefreshAt && open) refetchSquads();
  }, [squadRefreshAt]);

  const approveMut = useMutation({
    mutationFn: (reqId) => approveReleaseRequest(auctionId, reqId),
    onSuccess: (_, reqId) => {
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
    <div className='bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden'>
      <button
        className='w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-800 transition-colors'
        onClick={() => setOpen((v) => !v)}
      >
        <div className='flex items-center gap-2'>
          <span className='text-gray-300 font-medium'>Team Squads</span>
          {pendingRequests.length > 0 && (
            <span className='bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full'>
              {pendingRequests.length} release{pendingRequests.length > 1 ? 's' : ''} pending
            </span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-gray-500 text-xs'>{totalPlayers} signed</span>
          <span className='text-gray-500'>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className='border-t border-gray-800'>
          {/* Pending release requests */}
          {pendingRequests.length > 0 && (
            <div className='p-4 space-y-2 border-b border-gray-800'>
              <p className='text-xs text-yellow-400 font-medium uppercase tracking-wider mb-3'>
                Pending Release Requests
              </p>
              {pendingRequests.map((req) => (
                <div key={req._id} className='bg-yellow-900/20 border border-yellow-800/40 rounded-xl p-3'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='text-white text-sm font-medium'>
                          {req.playerId?.name || 'Player'}
                        </span>
                        {req.playerId?.category && (
                          <span className='text-xs bg-indigo-900/50 text-indigo-300 px-1.5 py-0.5 rounded'>
                            {req.playerId.category}
                          </span>
                        )}
                        <span className='text-gray-400 text-xs'>from {req.teamId?.name}</span>
                      </div>
                      {req.reason && (
                        <p className='text-gray-400 text-xs mt-1'>"{req.reason}"</p>
                      )}
                      <p className='text-gray-600 text-xs mt-0.5'>
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
                            className='bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs w-40 focus:outline-none focus:ring-1 focus:ring-red-500'
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
              <p className='text-gray-500 text-sm text-center py-4'>No teams yet</p>
            ) : (
              teams.map((team) => (
                <div key={team._id}>
                  <div className='flex items-center gap-2 mb-2'>
                    <div className='w-2 h-2 rounded-full flex-shrink-0' style={{ backgroundColor: team.colorHex || '#6366f1' }} />
                    <span className='text-white text-sm font-semibold'>{team.name}</span>
                    <span className='text-gray-500 text-xs'>({team.shortName})</span>
                    <span className='ml-auto text-indigo-400 text-xs font-medium'>
                      {formatCurrency(team.remainingPurse, symbol, unit)} left
                    </span>
                  </div>

                  {!team.players || team.players.length === 0 ? (
                    <p className='text-gray-600 text-xs pl-4'>No players yet</p>
                  ) : (
                    <div className='space-y-1 pl-4'>
                      {team.players.map((entry) => {
                        const p = entry.playerId;
                        if (!p) return null;
                        const hasPending = pendingRequests.some(
                          (r) => (r.playerId?._id || r.playerId) === p._id && (r.teamId?._id || r.teamId) === team._id
                        );
                        return (
                          <div key={p._id} className='flex items-center justify-between gap-2 bg-gray-800 rounded-lg px-3 py-1.5'>
                            <div className='flex items-center gap-2 min-w-0'>
                              <span className='text-white text-xs font-medium truncate'>{p.name}</span>
                              {p.category && (
                                <span className='text-xs bg-indigo-900/50 text-indigo-300 px-1.5 py-0.5 rounded flex-shrink-0'>
                                  {p.category}
                                </span>
                              )}
                              {p.role && <span className='text-gray-500 text-xs flex-shrink-0'>{p.role}</span>}
                            </div>
                            <div className='flex items-center gap-2 flex-shrink-0'>
                              <span className='text-green-400 text-xs font-medium'>
                                {formatCurrency(entry.pricePaid, symbol, unit)}
                              </span>
                              {hasPending ? (
                                <span className='text-yellow-400 text-xs'>Pending release</span>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (confirm(`Release ${p.name} back to auction pool? The team will be refunded ${formatCurrency(entry.pricePaid, symbol, unit)}.`)) {
                                      directReleaseMut.mutate(p._id);
                                    }
                                  }}
                                  disabled={directReleaseMut.isPending}
                                  className='text-gray-500 hover:text-red-400 text-xs px-1.5 py-0.5 rounded border border-transparent hover:border-red-800 transition-colors disabled:opacity-40'
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
