import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getPendingMemberships, approveMembership, rejectMembership,
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

// --- Membership Approvals Tab ---
const MembershipApprovalsTab = () => {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['memberships', filter],
    queryFn: () => getPendingMemberships(filter),
  });

  const approveMut = useMutation({
    mutationFn: approveMembership,
    onSuccess: () => { addToast('Membership approved', 'success'); qc.invalidateQueries({ queryKey: ['memberships'] }); },
    onError: (err) => addToast(err.response?.data?.message || 'Failed', 'error'),
  });
  const rejectMut = useMutation({
    mutationFn: (id) => rejectMembership(id),
    onSuccess: () => { addToast('Membership rejected', 'success'); qc.invalidateQueries({ queryKey: ['memberships'] }); },
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
      ) : memberships.length === 0 ? (
        <EmptyState icon='👤' title='No applications' description={`No ${filter} auction membership applications`} />
      ) : (
        <div className='space-y-3'>
          {memberships.map((m) => (
            <div key={m._id} className='bg-gray-800 rounded-xl p-4 flex items-center justify-between gap-4'>
              <div className='min-w-0'>
                <p className='text-white font-medium truncate'>{m.userId?.name}</p>
                <p className='text-gray-400 text-sm truncate'>{m.userId?.email}</p>
                {m.auctionId && (
                  <p className='text-indigo-400 text-xs mt-0.5 truncate'>
                    Auction: {m.auctionId.name}
                    {m.auctionId.sport && ` · ${m.auctionId.sport}`}
                  </p>
                )}
                <p className='text-gray-600 text-xs mt-0.5'>
                  Applied {new Date(m.createdAt).toLocaleDateString()}
                </p>
                {m.status === 'rejected' && m.rejectionReason && (
                  <p className='text-red-400 text-xs mt-0.5'>Reason: {m.rejectionReason}</p>
                )}
              </div>
              <div className='flex items-center gap-2 flex-shrink-0'>
                <Badge variant={STATUS_VARIANTS[m.status]}>{m.status}</Badge>
                {m.status === 'pending' && (
                  <>
                    <Button
                      size='sm'
                      variant='success'
                      loading={approveMut.isPending}
                      onClick={() => approveMut.mutate(m._id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size='sm'
                      variant='danger'
                      loading={rejectMut.isPending}
                      onClick={() => rejectMut.mutate(m._id)}
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

// Inline approval form state for a single registration
// ApprovalForm — two modes:
// 1. Account-linked (r.auctionId set): auction is fixed, just assign category + base price
// 2. Legacy anonymous (no auctionId): admin must pick auction too
const ApprovalForm = ({ registration, auctions, onConfirm, onCancel, isPending }) => {
  // If the player chose an auction when applying, use it directly
  const linkedAuction = registration.auctionId; // populated object or null

  const [selectedAuction, setSelectedAuction] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [basePriceOverride, setBasePriceOverride] = useState('');
  const [setNum, setSetNum] = useState(1);

  // For account-linked registrations, use the player's chosen auction
  const activeAuction = linkedAuction
    ? linkedAuction
    : auctions.find((a) => a._id === selectedAuction);

  const availableCategories = activeAuction?.playerCategories || [];
  const autoPriceFromCategory =
    selectedCategory && activeAuction?.categoryBasePrices?.[selectedCategory] != null
      ? activeAuction.categoryBasePrices[selectedCategory]
      : null;

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setBasePriceOverride('');
  };

  const effectiveBasePrice =
    basePriceOverride !== '' ? Number(basePriceOverride) : autoPriceFromCategory;

  const canConfirm = linkedAuction ? true : !!selectedAuction;

  const handleConfirm = () => {
    onConfirm({
      id: registration._id,
      // For legacy flow, pass the picked auctionId; for account-linked, server uses registration.auctionId
      auctionId: linkedAuction ? undefined : selectedAuction,
      setNumber: setNum,
      category: selectedCategory || undefined,
      basePrice: basePriceOverride !== '' ? Number(basePriceOverride) : undefined,
    });
  };

  return (
    <div className='space-y-3'>
      <p className='text-gray-500 text-xs'>
        {linkedAuction
          ? 'Player applied for this auction. Assign a category to set their base price, then approve.'
          : 'Approving adds this player to the selected auction. Assign a category to set their base price.'}
      </p>

      <div className='grid grid-cols-2 gap-2'>
        {/* Auction — fixed for account-linked, dropdown for legacy */}
        <div className='col-span-2'>
          <label className='block text-gray-400 text-xs mb-1'>Auction</label>
          {linkedAuction ? (
            <div className='bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm'>
              {linkedAuction.name}
              {linkedAuction.sport && <span className='text-gray-400 ml-2 text-xs capitalize'>({linkedAuction.sport})</span>}
            </div>
          ) : (
            <select
              value={selectedAuction}
              onChange={(e) => { setSelectedAuction(e.target.value); setSelectedCategory(''); setBasePriceOverride(''); }}
              className='w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
            >
              <option value=''>Select auction *</option>
              {auctions.map((a) => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Category */}
        <div>
          <label className='block text-gray-400 text-xs mb-1'>
            Category {availableCategories.length === 0 ? '(none configured)' : ''}
          </label>
          {availableCategories.length > 0 ? (
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className='w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              disabled={!activeAuction}
            >
              <option value=''>Not assigned</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          ) : (
            <input
              type='text'
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              placeholder='e.g. A+'
              disabled={!activeAuction}
              className='w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40'
            />
          )}
        </div>

        {/* Base Price */}
        <div>
          <label className='block text-gray-400 text-xs mb-1'>
            Base Price
            {autoPriceFromCategory != null && basePriceOverride === '' && (
              <span className='text-indigo-400 ml-1'>(auto: {autoPriceFromCategory})</span>
            )}
          </label>
          <input
            type='number'
            min={0}
            value={basePriceOverride}
            onChange={(e) => setBasePriceOverride(e.target.value)}
            placeholder={autoPriceFromCategory != null ? String(autoPriceFromCategory) : 'e.g. 100'}
            className='w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
          />
          {autoPriceFromCategory != null && basePriceOverride === '' && (
            <p className='text-gray-600 text-xs mt-0.5'>Leave blank to use category price</p>
          )}
        </div>

        {/* Set # */}
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
      </div>

      {/* Summary */}
      {canConfirm && (
        <div className='bg-gray-900 rounded-lg px-3 py-2 text-xs text-gray-400'>
          <span className='text-white'>{registration.name}</span>
          {selectedCategory && <span className='text-indigo-300 ml-2'>[{selectedCategory}]</span>}
          {effectiveBasePrice != null && <span className='ml-2'>· Base: {effectiveBasePrice}</span>}
          {!selectedCategory && <span className='text-yellow-500 ml-2'>· No category — will need manual base price</span>}
        </div>
      )}

      <div className='flex gap-2'>
        <Button
          size='sm'
          variant='success'
          disabled={!canConfirm}
          loading={isPending}
          onClick={handleConfirm}
        >
          Confirm Approve
        </Button>
        <Button size='sm' variant='ghost' onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

// --- Player Approvals Tab ---
const PlayerApprovalsTab = () => {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [assigningId, setAssigningId] = useState(null);

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['pending-players', filter],
    queryFn: () => getPendingPlayers(filter),
  });

  const { data: auctions = [] } = useQuery({
    queryKey: ['auctions'],
    queryFn: listAuctions,
  });

  const approveMut = useMutation({
    mutationFn: ({ id, auctionId, setNumber, category, basePrice }) =>
      approvePlayer(id, { auctionId, setNumber, category, basePrice }),
    onSuccess: () => {
      addToast('Player approved and added to auction', 'success');
      qc.invalidateQueries({ queryKey: ['pending-players'] });
      setAssigningId(null);
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
        <EmptyState icon='🏆' title='No registrations' description={`No ${filter} player registrations for your auctions`} />
      ) : (
        <div className='space-y-3'>
          {registrations.map((r) => (
            <div key={r._id} className='bg-gray-800 rounded-xl p-4'>
              <div className='flex items-start justify-between gap-4'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <p className='text-white font-medium'>{r.name}</p>
                    <Badge variant='blue'>{r.role}</Badge>
                    {r.gender && (
                      <Badge variant={r.gender === 'female' ? 'pink' : 'blue'}>
                        {r.gender === 'female' ? '♀ F' : '♂ M'}
                      </Badge>
                    )}
                    {r.nationality === 'overseas' && <Badge variant='indigo'>Overseas</Badge>}
                  </div>
                  {r.userId ? (
                    <p className='text-indigo-400 text-xs mt-0.5'>
                      Account: {r.userId.name} · {r.userId.email}
                    </p>
                  ) : (
                    <p className='text-gray-600 text-xs mt-0.5'>Legacy registration (no account)</p>
                  )}
                  <p className='text-gray-400 text-sm mt-0.5'>
                    {r.country && `${r.country}`}
                    {r.contactEmail && ` · ${r.contactEmail}`}
                  </p>
                  {r.stats && Object.keys(r.stats).length > 0 && (
                    <div className='flex flex-wrap gap-2 mt-1.5'>
                      {Object.entries(r.stats).map(([k, v]) => (
                        <span key={k} className='bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded'>
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className='text-gray-600 text-xs mt-1.5'>
                    Submitted {new Date(r.createdAt).toLocaleDateString()}
                  </p>
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
                    <ApprovalForm
                      registration={r}
                      auctions={auctions}
                      onConfirm={(payload) => approveMut.mutate(payload)}
                      onCancel={() => setAssigningId(null)}
                      isPending={approveMut.isPending}
                    />
                  ) : (
                    <div className='flex gap-2'>
                      <Button size='sm' variant='success' onClick={() => setAssigningId(r._id)}>
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
  const [tab, setTab] = useState('memberships');

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
          onClick={() => setTab('memberships')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'memberships' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
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

      {tab === 'memberships' ? <MembershipApprovalsTab /> : <PlayerApprovalsTab />}
    </div>
  );
};

export default AdminApprovalsPage;
