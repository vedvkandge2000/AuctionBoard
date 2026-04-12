import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getPendingUsers, approveUser, rejectUser,
  getPendingPlayers, approvePlayer, rejectPlayer,
} from '../services/registrationService';
import { listAuctions } from '../services/auctionService';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

const STATUS_VARIANTS = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};

// --- User Approvals Tab ---
const UserApprovalsTab = () => {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['pending-users', filter],
    queryFn: () => getPendingUsers(filter),
  });

  const approveMut = useMutation({
    mutationFn: approveUser,
    onSuccess: () => { addToast('User approved', 'success'); qc.invalidateQueries({ queryKey: ['pending-users'] }); },
    onError: (err) => addToast(err.response?.data?.message || 'Failed', 'error'),
  });
  const rejectMut = useMutation({
    mutationFn: rejectUser,
    onSuccess: () => { addToast('User rejected', 'success'); qc.invalidateQueries({ queryKey: ['pending-users'] }); },
    onError: (err) => addToast(err.response?.data?.message || 'Failed', 'error'),
  });

  return (
    <div>
      <div className='flex gap-2 mb-4'>
        {['pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'><Spinner /></div>
      ) : users.length === 0 ? (
        <EmptyState icon='👤' title='No users' description={`No ${filter} team owner accounts`} />
      ) : (
        <div className='space-y-3'>
          {users.map((u) => (
            <div key={u._id} className='bg-gray-800 rounded-xl p-4 flex items-center justify-between gap-4'>
              <div className='min-w-0'>
                <p className='text-white font-medium truncate'>{u.name}</p>
                <p className='text-gray-400 text-sm truncate'>{u.email}</p>
                <p className='text-gray-600 text-xs mt-0.5'>
                  Registered {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className='flex items-center gap-2 flex-shrink-0'>
                <Badge variant={STATUS_VARIANTS[u.approvalStatus]}>{u.approvalStatus}</Badge>
                {u.approvalStatus === 'pending' && (
                  <>
                    <Button
                      size='sm'
                      variant='success'
                      loading={approveMut.isPending}
                      onClick={() => approveMut.mutate(u._id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size='sm'
                      variant='danger'
                      loading={rejectMut.isPending}
                      onClick={() => rejectMut.mutate(u._id)}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Player Approvals Tab ---
const PlayerApprovalsTab = () => {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [assigningId, setAssigningId] = useState(null);
  const [selectedAuction, setSelectedAuction] = useState('');
  const [setNum, setSetNum] = useState(1);

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['pending-players', filter],
    queryFn: () => getPendingPlayers(filter),
  });

  const { data: auctions = [] } = useQuery({
    queryKey: ['auctions'],
    queryFn: listAuctions,
  });

  const approveMut = useMutation({
    mutationFn: ({ id, auctionId, setNumber }) => approvePlayer(id, auctionId, setNumber),
    onSuccess: () => {
      addToast('Player approved and added to auction', 'success');
      qc.invalidateQueries({ queryKey: ['pending-players'] });
      setAssigningId(null);
      setSelectedAuction('');
    },
    onError: (err) => addToast(err.response?.data?.message || 'Failed', 'error'),
  });

  const rejectMut = useMutation({
    mutationFn: (id) => rejectPlayer(id),
    onSuccess: () => { addToast('Player rejected', 'success'); qc.invalidateQueries({ queryKey: ['pending-players'] }); },
    onError: (err) => addToast(err.response?.data?.message || 'Failed', 'error'),
  });

  return (
    <div>
      <div className='flex gap-2 mb-4'>
        {['pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'><Spinner /></div>
      ) : registrations.length === 0 ? (
        <EmptyState icon='🏏' title='No registrations' description={`No ${filter} player registrations`} />
      ) : (
        <div className='space-y-3'>
          {registrations.map((r) => (
            <div key={r._id} className='bg-gray-800 rounded-xl p-4'>
              <div className='flex items-start justify-between gap-4'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <p className='text-white font-medium'>{r.name}</p>
                    <Badge variant='blue'>{r.role}</Badge>
                    {r.nationality === 'overseas' && <Badge variant='indigo'>Overseas</Badge>}
                  </div>
                  <p className='text-gray-400 text-sm mt-0.5'>
                    Base price: ₹{r.basePrice}L
                    {r.country && ` · ${r.country}`}
                    {r.contactEmail && ` · ${r.contactEmail}`}
                  </p>
                  {r.stats && Object.keys(r.stats).length > 0 && (
                    <p className='text-gray-500 text-xs mt-0.5'>
                      {Object.entries(r.stats).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  )}
                  <p className='text-gray-600 text-xs mt-1'>
                    Submitted {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  {r.status === 'approved' && r.assignedAuctionId && (
                    <p className='text-green-500 text-xs mt-1'>Assigned to auction</p>
                  )}
                  {r.status === 'rejected' && r.rejectionReason && (
                    <p className='text-red-400 text-xs mt-1'>Reason: {r.rejectionReason}</p>
                  )}
                </div>
                <div className='flex-shrink-0'>
                  <Badge variant={STATUS_VARIANTS[r.status]}>{r.status}</Badge>
                </div>
              </div>

              {r.status === 'pending' && (
                <div className='mt-3 pt-3 border-t border-gray-700'>
                  {assigningId === r._id ? (
                    <div className='flex flex-wrap gap-2 items-end'>
                      <div>
                        <label className='block text-gray-400 text-xs mb-1'>Assign to Auction *</label>
                        <select
                          value={selectedAuction}
                          onChange={(e) => setSelectedAuction(e.target.value)}
                          className='bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                        >
                          <option value=''>Select auction</option>
                          {auctions.map((a) => (
                            <option key={a._id} value={a._id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className='block text-gray-400 text-xs mb-1'>Set #</label>
                        <input
                          type='number'
                          min={1}
                          value={setNum}
                          onChange={(e) => setSetNum(Number(e.target.value))}
                          className='w-20 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                        />
                      </div>
                      <Button
                        size='sm'
                        variant='success'
                        disabled={!selectedAuction}
                        loading={approveMut.isPending}
                        onClick={() => approveMut.mutate({ id: r._id, auctionId: selectedAuction, setNumber: setNum })}
                      >
                        Confirm Approve
                      </Button>
                      <Button size='sm' variant='ghost' onClick={() => setAssigningId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className='flex gap-2'>
                      <Button size='sm' variant='success' onClick={() => { setAssigningId(r._id); setSelectedAuction(''); }}>
                        Approve
                      </Button>
                      <Button
                        size='sm'
                        variant='danger'
                        loading={rejectMut.isPending}
                        onClick={() => rejectMut.mutate(r._id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Page ---
const AdminApprovalsPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');

  if (!isAdmin) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className='p-6 max-w-3xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-white text-2xl font-bold'>Approvals</h1>
        <p className='text-gray-400 text-sm mt-1'>Review and approve team owner registrations and player applications</p>
      </div>

      <div className='flex gap-1 bg-gray-800 rounded-xl p-1 mb-6 w-fit'>
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'users' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Team Owners
        </button>
        <button
          onClick={() => setTab('players')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'players' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Players
        </button>
      </div>

      {tab === 'users' ? <UserApprovalsTab /> : <PlayerApprovalsTab />}
    </div>
  );
};

export default AdminApprovalsPage;
