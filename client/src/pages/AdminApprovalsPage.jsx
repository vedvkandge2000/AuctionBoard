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
              filter === s ? 'text-white' : 'hover:text-white'
            }`}
            style={filter === s
              ? { backgroundColor: 'var(--color-accent)' }
              : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }
            }
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
            <div key={m._id} className='rounded-xl p-4 flex items-center justify-between gap-4' style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className='min-w-0'>
                <p className='font-medium truncate' style={{ color: 'var(--color-text)' }}>{m.userId?.name}</p>
                <p className='text-sm truncate' style={{ color: 'var(--color-text-muted)' }}>{m.userId?.email}</p>
                {m.auctionId && (
                  <p className='text-xs mt-0.5 truncate' style={{ color: 'var(--color-accent)' }}>
                    Auction: {m.auctionId.name}
                    {m.auctionId.sport && ` · ${m.auctionId.sport}`}
                  </p>
                )}
                <p className='text-xs mt-0.5' style={{ color: 'var(--color-text-subtle)' }}>
                  Applied {new Date(m.createdAt).toLocaleDateString()}
                </p>
                {m.status === 'rejected' && m.rejectionReason && (
                  <p className='text-xs mt-0.5' style={{ color: 'var(--color-danger-text)' }}>Reason: {m.rejectionReason}</p>
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

  const inputCls = 'w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]';

  return (
    <div className='space-y-3'>
      <p className='text-xs' style={{ color: 'var(--color-text-subtle)' }}>
        {linkedAuction
          ? 'Player applied for this auction. Assign a category to set their base price, then approve.'
          : 'Approving adds this player to the selected auction. Assign a category to set their base price.'}
      </p>

      <div className='grid grid-cols-2 gap-2'>
        {/* Auction — fixed for account-linked, dropdown for legacy */}
        <div className='col-span-2'>
          <label className='block text-xs mb-1' style={{ color: 'var(--color-text-muted)' }}>Auction</label>
          {linkedAuction ? (
            <div className='rounded-lg px-3 py-1.5 text-sm' style={{ backgroundColor: 'var(--color-surface-sunken)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
              {linkedAuction.name}
              {linkedAuction.sport && <span className='ml-2 text-xs capitalize' style={{ color: 'var(--color-text-muted)' }}>({linkedAuction.sport})</span>}
            </div>
          ) : (
            <select
              value={selectedAuction}
              onChange={(e) => { setSelectedAuction(e.target.value); setSelectedCategory(''); setBasePriceOverride(''); }}
              className={inputCls}
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
          <label className='block text-xs mb-1' style={{ color: 'var(--color-text-muted)' }}>
            Category {availableCategories.length === 0 ? '(none configured)' : ''}
          </label>
          {availableCategories.length > 0 ? (
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className={inputCls}
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
              className={`${inputCls} placeholder-gray-500 disabled:opacity-40`}
            />
          )}
        </div>

        {/* Base Price */}
        <div>
          <label className='block text-xs mb-1' style={{ color: 'var(--color-text-muted)' }}>
            Base Price
            {autoPriceFromCategory != null && basePriceOverride === '' && (
              <span className='ml-1' style={{ color: 'var(--color-accent)' }}>(auto: {autoPriceFromCategory})</span>
            )}
          </label>
          <input
            type='number'
            min={0}
            value={basePriceOverride}
            onChange={(e) => setBasePriceOverride(e.target.value)}
            placeholder={autoPriceFromCategory != null ? String(autoPriceFromCategory) : 'e.g. 100'}
            className={`${inputCls} placeholder-gray-500`}
          />
          {autoPriceFromCategory != null && basePriceOverride === '' && (
            <p className='text-xs mt-0.5' style={{ color: 'var(--color-text-subtle)' }}>Leave blank to use category price</p>
          )}
        </div>

        {/* Set # */}
        <div>
          <label className='block text-xs mb-1' style={{ color: 'var(--color-text-muted)' }}>Set #</label>
          <input
            type='number'
            min={1}
            value={setNum}
            onChange={(e) => setSetNum(Number(e.target.value))}
            className='w-20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]'
          />
        </div>
      </div>

      {/* Summary */}
      {canConfirm && (
        <div className='rounded-lg px-3 py-2 text-xs' style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
          <span style={{ color: 'var(--color-text)' }}>{registration.name}</span>
          {selectedCategory && <span className='ml-2' style={{ color: 'var(--color-accent)' }}>[{selectedCategory}]</span>}
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
              filter === s ? 'text-white' : 'hover:text-white'
            }`}
            style={filter === s
              ? { backgroundColor: 'var(--color-accent)' }
              : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }
            }
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'><Spinner /></div>
      ) : registrations.length === 0 ? (
        <EmptyState icon='🎮' title='No registrations' description={`No ${filter} player registrations for your auctions`} />
      ) : (
        <div className='space-y-3'>
          {registrations.map((r) => (
            <div key={r._id} className='rounded-xl p-4' style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className='flex items-start justify-between gap-4'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <p className='font-medium' style={{ color: 'var(--color-text)' }}>{r.name}</p>
                    <Badge variant='blue'>{r.role}</Badge>
                    {r.gender && (
                      <Badge variant={r.gender === 'female' ? 'pink' : 'blue'}>
                        {r.gender === 'female' ? '♀ F' : '♂ M'}
                      </Badge>
                    )}
                    {r.nationality === 'overseas' && <Badge variant='indigo'>Overseas</Badge>}
                  </div>
                  {r.userId ? (
                    <p className='text-xs mt-0.5' style={{ color: 'var(--color-accent)' }}>
                      Account: {r.userId.name} · {r.userId.email}
                    </p>
                  ) : (
                    <p className='text-xs mt-0.5' style={{ color: 'var(--color-text-subtle)' }}>Legacy registration (no account)</p>
                  )}
                  <p className='text-sm mt-0.5' style={{ color: 'var(--color-text-muted)' }}>
                    {r.country && `${r.country}`}
                    {r.contactEmail && ` · ${r.contactEmail}`}
                  </p>
                  {r.stats && Object.keys(r.stats).length > 0 && (
                    <div className='flex flex-wrap gap-2 mt-1.5'>
                      {Object.entries(r.stats).map(([k, v]) => (
                        <span key={k} className='text-xs px-2 py-0.5 rounded' style={{ backgroundColor: 'var(--color-surface-sunken)', color: 'var(--color-text-muted)' }}>
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className='text-xs mt-1.5' style={{ color: 'var(--color-text-subtle)' }}>
                    Submitted {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  {r.status === 'rejected' && r.rejectionReason && (
                    <p className='text-xs mt-1' style={{ color: 'var(--color-danger-text)' }}>Reason: {r.rejectionReason}</p>
                  )}
                </div>
                <div className='flex-shrink-0'>
                  <Badge variant={STATUS_VARIANTS[r.status]}>{r.status}</Badge>
                </div>
              </div>

              {r.status === 'pending' && (
                <div className='mt-3 pt-3' style={{ borderTop: '1px solid var(--color-border)' }}>
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
        <h1 className='text-2xl font-bold' style={{ color: 'var(--color-text)' }}>Approvals</h1>
        <p className='text-sm mt-1' style={{ color: 'var(--color-text-muted)' }}>Review and approve team owner registrations and player applications</p>
      </div>

      <div className='flex gap-1 rounded-xl p-1 mb-6 w-fit' style={{ backgroundColor: 'var(--color-surface)' }}>
        <button
          onClick={() => setTab('memberships')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'memberships' ? 'text-white' : 'hover:text-white'
          }`}
          style={tab === 'memberships'
            ? { backgroundColor: 'var(--color-accent)' }
            : { color: 'var(--color-text-muted)' }
          }
        >
          Team Owners
        </button>
        <button
          onClick={() => setTab('players')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'players' ? 'text-white' : 'hover:text-white'
          }`}
          style={tab === 'players'
            ? { backgroundColor: 'var(--color-accent)' }
            : { color: 'var(--color-text-muted)' }
          }
        >
          Players
        </button>
      </div>

      {tab === 'memberships' ? <MembershipApprovalsTab /> : <PlayerApprovalsTab />}
    </div>
  );
};

export default AdminApprovalsPage;
