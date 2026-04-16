import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAuctions, createAuction, deleteAuction, browseAuctions, applyToAuction, withdrawMembership,
} from '../services/auctionService';
import { applyAsPlayer, getMyPlayerRegistrations } from '../services/registrationService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { listSportTemplates } from '../services/sportTemplateService';

const STATUS_BADGE = {
  draft: 'default',
  live: 'green',
  paused: 'yellow',
  completed: 'blue',
};

const MEMBERSHIP_BADGE = {
  none: 'default',
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};

const REGISTRATION_BADGE = {
  none: 'default',
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};

const NewAuctionModal = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('online');
  const [loading, setLoading] = useState(false);

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['sport-templates'],
    queryFn: listSportTemplates,
    enabled: open,
    onSuccess: (data) => { if (data.length > 0 && !selectedId) setSelectedId(data[0]._id); },
  });

  const selected = templates.find((t) => t._id === selectedId) || templates[0] || null;

  const handleClose = () => {
    onClose();
    setName('');
    setSelectedId(null);
    setMode('online');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    try {
      const { _id, isSeeded, createdAt, updatedAt, __v, ...preset } = selected;
      await onCreate({ ...preset, name, mode });
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title='New Auction' size='lg'>
      <form onSubmit={handleSubmit} className='space-y-5'>
        <div>
          <label className='block text-gray-400 text-sm mb-1.5'>Auction Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
            placeholder='e.g. IPL 2026 Auction'
          />
        </div>

        <div>
          <label className='block text-gray-400 text-sm mb-2'>Sport</label>
          {templatesLoading ? (
            <div className='flex justify-center py-4'><Spinner /></div>
          ) : templates.length === 0 ? (
            <p className='text-gray-500 text-sm'>No sport templates found. Ask an admin to create one.</p>
          ) : (
            <div className='grid grid-cols-2 gap-3'>
              {templates.map((t) => {
                const isSelected = selected?._id === t._id;
                return (
                  <button
                    key={t._id}
                    type='button'
                    onClick={() => setSelectedId(t._id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950 ring-1 ring-indigo-500'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <span className='text-2xl'>{t.icon}</span>
                    <div className='min-w-0'>
                      <p className={`font-semibold text-sm ${isSelected ? 'text-indigo-300' : 'text-white'}`}>{t.name}</p>
                      <p className='text-gray-500 text-xs mt-0.5 leading-tight truncate'>{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className='block text-gray-400 text-sm mb-2'>Auction Mode</label>
          <div className='grid grid-cols-2 gap-3'>
            {[
              { value: 'online', label: 'Online', desc: 'Team owners bid in real-time', icon: '🌐' },
              { value: 'offline', label: 'Offline', desc: 'Admin scribes bids from physical room', icon: '🏟️' },
            ].map((opt) => (
              <button
                key={opt.value}
                type='button'
                onClick={() => setMode(opt.value)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  mode === opt.value
                    ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <span className='text-2xl'>{opt.icon}</span>
                <div className='min-w-0'>
                  <p className={`font-semibold text-sm ${mode === opt.value ? 'text-amber-300' : 'text-white'}`}>{opt.label}</p>
                  <p className='text-gray-500 text-xs mt-0.5 leading-tight'>{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className='bg-gray-800/50 border border-gray-700 rounded-xl p-4'>
            <p className='text-gray-400 text-xs uppercase tracking-widest mb-3'>Template Config</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2 text-xs'>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Purse</span>
                <span className='text-white font-medium'>{selected.currencySymbol}{selected.defaultPursePerTeam} {selected.currencyUnit}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Squad size</span>
                <span className='text-white font-medium'>{selected.minSquadSize}–{selected.maxSquadSize}</span>
              </div>
              {selected.maxOverseasPlayers > 0 && (
                <div className='flex justify-between'>
                  <span className='text-gray-500'>Overseas cap</span>
                  <span className='text-white font-medium'>{selected.maxOverseasPlayers}</span>
                </div>
              )}
              <div className='col-span-2 flex justify-between'>
                <span className='text-gray-500'>Roles</span>
                <span className='text-white font-medium'>{(selected.playerRoles || []).join(', ') || '—'}</span>
              </div>
            </div>
            <p className='text-gray-600 text-xs mt-3'>All values can be customised in the config page after creation.</p>
          </div>
        )}

        <div className='flex gap-3 justify-end pt-1'>
          <Button variant='ghost' onClick={handleClose} type='button'>Cancel</Button>
          <Button type='submit' loading={loading} disabled={!selected}>
            Create {selected?.icon} {selected?.name} Auction
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// --- Team Owner: "My Auctions" tab ---
const MyAuctionsTab = ({ templateMap, navigate }) => {
  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: listAuctions,
  });

  if (isLoading) return <div className='flex justify-center py-12'><Spinner size='lg' /></div>;

  if (auctions.length === 0) {
    return (
      <EmptyState
        icon='🏏'
        title='No auctions yet'
        description="You haven't been approved for any auctions."
        hint='Switch to the "Discover" tab to find and apply to open auctions.'
      />
    );
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {auctions.map((auction) => (
        <div
          key={auction._id}
          className='bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-indigo-700 transition-colors cursor-pointer'
          onClick={() => navigate(`/auction/${auction._id}`)}
        >
          <div className='flex items-start justify-between mb-3'>
            <div>
              <h2 className='text-white font-semibold'>{auction.name}</h2>
              <p className='text-gray-500 text-xs mt-0.5 capitalize'>
                {templateMap[auction.sport]?.icon || '🎮'} {auction.sport}
              </p>
              {auction.createdBy?.name && (
                <p className='text-gray-600 text-xs mt-0.5'>by {auction.createdBy.name}</p>
              )}
            </div>
            <div className='flex items-center gap-1.5'>
              {auction.status === 'live' && (
                <span className='inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse-dot flex-shrink-0' />
              )}
              <Badge variant={STATUS_BADGE[auction.status] || 'default'}>{auction.status}</Badge>
            </div>
          </div>
          <div className='flex gap-2 mt-4' onClick={(e) => e.stopPropagation()}>
            <Button size='sm' variant='ghost' onClick={() => navigate(`/auction/${auction._id}`)}>
              Open
            </Button>
            {(auction.status === 'completed' || auction.status === 'live') && (
              <Button size='sm' variant='ghost' onClick={() => navigate(`/auction/${auction._id}/report`)}>
                Report
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Team Owner: "Discover" tab ---
const DiscoverTab = ({ templateMap }) => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['auctions-browse'],
    queryFn: browseAuctions,
  });

  const applyMut = useMutation({
    mutationFn: (auctionId) => applyToAuction(auctionId),
    onSuccess: () => {
      addToast('Application submitted!', 'success');
      qc.invalidateQueries({ queryKey: ['auctions-browse'] });
      qc.invalidateQueries({ queryKey: ['auctions'] });
    },
    onError: (e) => addToast(e.response?.data?.message || 'Failed to apply', 'error'),
  });

  const withdrawMut = useMutation({
    mutationFn: (membershipId) => withdrawMembership(membershipId),
    onSuccess: () => {
      addToast('Application withdrawn', 'info');
      qc.invalidateQueries({ queryKey: ['auctions-browse'] });
      qc.invalidateQueries({ queryKey: ['auctions'] });
    },
    onError: (e) => addToast(e.response?.data?.message || 'Failed to withdraw', 'error'),
  });

  if (isLoading) return <div className='flex justify-center py-12'><Spinner size='lg' /></div>;

  if (auctions.length === 0) {
    return (
      <EmptyState
        icon='🔍'
        title='No open auctions'
        description='There are no auctions open for applications right now. Check back later.'
      />
    );
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {auctions.map((auction) => {
        const status = auction.myMembershipStatus || 'none';
        const membershipId = auction.myMembershipId;
        return (
          <div key={auction._id} className='bg-gray-900 border border-gray-800 rounded-2xl p-5 transition-colors'>
            <div className='flex items-start justify-between mb-3'>
              <div className='min-w-0 flex-1'>
                <h2 className='text-white font-semibold truncate'>{auction.name}</h2>
                <p className='text-gray-500 text-xs mt-0.5 capitalize'>
                  {templateMap[auction.sport]?.icon || '🎮'} {auction.sport}
                </p>
                {auction.createdBy?.name && (
                  <p className='text-gray-600 text-xs mt-0.5'>by {auction.createdBy.name}</p>
                )}
              </div>
              <div className='flex items-center gap-1.5 flex-shrink-0 ml-2'>
                {auction.status === 'live' && (
                  <span className='inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse-dot flex-shrink-0' />
                )}
                <Badge variant={STATUS_BADGE[auction.status] || 'default'}>{auction.status}</Badge>
              </div>
            </div>

            <div className='flex items-center gap-2 mt-4'>
              {status === 'none' && (
                <Button
                  size='sm'
                  loading={applyMut.isPending}
                  onClick={() => applyMut.mutate(auction._id)}
                >
                  Apply to Join
                </Button>
              )}
              {status === 'pending' && (
                <>
                  <Badge variant={MEMBERSHIP_BADGE.pending}>Pending Approval</Badge>
                  <Button
                    size='sm'
                    variant='ghost'
                    loading={withdrawMut.isPending}
                    onClick={() => withdrawMut.mutate(membershipId)}
                  >
                    Withdraw
                  </Button>
                </>
              )}
              {status === 'approved' && (
                <>
                  <Badge variant={MEMBERSHIP_BADGE.approved}>Joined</Badge>
                  <Button size='sm' variant='ghost' onClick={() => navigate(`/auction/${auction._id}`)}>
                    Open
                  </Button>
                </>
              )}
              {status === 'rejected' && (
                <Badge variant={MEMBERSHIP_BADGE.rejected}>Rejected</Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Player: "Apply to Auction" modal ---
const ApplyModal = ({ auction, templates, open, onClose, onSuccess }) => {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    role: '', gender: '', nationality: 'domestic', country: '', contactEmail: '',
  });
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const availableRoles = templates.find((t) => t.sport === auction?.sport)?.playerRoles || [];

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const updateStat = (i, field, val) =>
    setStats((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role.trim()) { addToast('Role is required', 'error'); return; }

    const statsObj = {};
    for (const { key, value } of stats) {
      const k = key.trim();
      if (k) statsObj[k] = value.trim();
    }

    setLoading(true);
    try {
      await applyAsPlayer(auction._id, { ...form, stats: statsObj });
      addToast('Registration submitted!', 'success');
      qc.invalidateQueries({ queryKey: ['auctions-browse-player'] });
      qc.invalidateQueries({ queryKey: ['my-player-registrations'] });
      onSuccess();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!auction) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Register for ${auction.name}`} size='md'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <p className='text-gray-500 text-xs'>
          Your name from your account will be used. Fill in your playing details for this auction. The auctioneer will assign your category and base price.
        </p>

        <div className='grid grid-cols-2 gap-3'>
          {/* Role */}
          <div className='col-span-2'>
            <label className='block text-gray-400 text-xs mb-1'>Role *</label>
            {availableRoles.length > 0 ? (
              <select
                value={form.role}
                onChange={set('role')}
                className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value=''>Select role</option>
                {availableRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : (
              <input
                type='text'
                value={form.role}
                onChange={set('role')}
                placeholder='e.g. Batsman, Bowler'
                className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            )}
          </div>

          {/* Gender */}
          <div>
            <label className='block text-gray-400 text-xs mb-1'>Gender</label>
            <select value={form.gender} onChange={set('gender')} className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'>
              <option value=''>Not specified</option>
              <option value='male'>Male</option>
              <option value='female'>Female</option>
            </select>
          </div>

          {/* Nationality */}
          <div>
            <label className='block text-gray-400 text-xs mb-1'>Nationality</label>
            <select value={form.nationality} onChange={set('nationality')} className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'>
              <option value='domestic'>Domestic</option>
              <option value='overseas'>Overseas</option>
            </select>
          </div>

          {/* Country */}
          <div>
            <label className='block text-gray-400 text-xs mb-1'>Country</label>
            <input type='text' value={form.country} onChange={set('country')} placeholder='e.g. India'
              className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500' />
          </div>

          {/* Contact Email */}
          <div>
            <label className='block text-gray-400 text-xs mb-1'>Contact Email (optional)</label>
            <input type='text' value={form.contactEmail} onChange={set('contactEmail')} placeholder='Notifications'
              className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500' />
          </div>
        </div>

        {/* Stats */}
        <div>
          <label className='block text-gray-400 text-xs mb-2'>Playing Stats (optional)</label>
          <div className='space-y-2'>
            {stats.map((s, i) => (
              <div key={i} className='flex gap-2 items-center'>
                <input type='text' value={s.key} onChange={(e) => updateStat(i, 'key', e.target.value)}
                  placeholder='Stat name' className='flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500' />
                <input type='text' value={s.value} onChange={(e) => updateStat(i, 'value', e.target.value)}
                  placeholder='Value' className='flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500' />
                <button type='button' onClick={() => setStats((prev) => prev.filter((_, idx) => idx !== i))}
                  className='text-gray-500 hover:text-red-400 text-lg leading-none px-1'>×</button>
              </div>
            ))}
            <button type='button' onClick={() => setStats((prev) => [...prev, { key: '', value: '' }])}
              className='text-indigo-400 hover:text-indigo-300 text-sm'>+ Add stat</button>
          </div>
        </div>

        <div className='flex gap-3 justify-end pt-1'>
          <Button variant='ghost' type='button' onClick={onClose}>Cancel</Button>
          <Button type='submit' loading={loading}>Submit Registration</Button>
        </div>
      </form>
    </Modal>
  );
};

// --- Player: "Discover" tab ---
const PlayerDiscoverTab = ({ templateMap }) => {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [applyTarget, setApplyTarget] = useState(null);

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['auctions-browse-player'],
    queryFn: browseAuctions,
  });

  const templates = Object.values(templateMap);

  if (isLoading) return <div className='flex justify-center py-12'><Spinner size='lg' /></div>;

  if (auctions.length === 0) {
    return (
      <EmptyState
        icon='🔍'
        title='No open auctions'
        description='There are no auctions open for player registrations right now.'
      />
    );
  }

  return (
    <>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {auctions.map((auction) => {
          const status = auction.myRegistrationStatus || 'none';
          return (
            <div key={auction._id} className='bg-gray-900 border border-gray-800 rounded-2xl p-5 transition-colors'>
              <div className='flex items-start justify-between mb-3'>
                <div className='min-w-0 flex-1'>
                  <h2 className='text-white font-semibold truncate'>{auction.name}</h2>
                  <p className='text-gray-500 text-xs mt-0.5 capitalize'>
                    {templateMap[auction.sport]?.icon || '🎮'} {auction.sport}
                  </p>
                  {auction.createdBy?.name && (
                    <p className='text-gray-600 text-xs mt-0.5'>by {auction.createdBy.name}</p>
                  )}
                </div>
                <div className='flex items-center gap-1.5 flex-shrink-0 ml-2'>
                  {auction.status === 'live' && (
                    <span className='inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse-dot flex-shrink-0' />
                  )}
                  <Badge variant={STATUS_BADGE[auction.status] || 'default'}>{auction.status}</Badge>
                </div>
              </div>

              <div className='flex items-center gap-2 mt-4'>
                {status === 'none' && (
                  <Button size='sm' onClick={() => setApplyTarget(auction)}>
                    Register as Player
                  </Button>
                )}
                {status === 'pending' && <Badge variant={REGISTRATION_BADGE.pending}>Pending Approval</Badge>}
                {status === 'approved' && <Badge variant={REGISTRATION_BADGE.approved}>Approved</Badge>}
                {status === 'rejected' && <Badge variant={REGISTRATION_BADGE.rejected}>Rejected</Badge>}
              </div>
            </div>
          );
        })}
      </div>

      <ApplyModal
        auction={applyTarget}
        templates={templates}
        open={!!applyTarget}
        onClose={() => setApplyTarget(null)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['auctions-browse-player'] });
          qc.invalidateQueries({ queryKey: ['my-player-registrations'] });
        }}
      />
    </>
  );
};

// --- Player: "My Registrations" tab ---
const MyRegistrationsTab = ({ templateMap }) => {
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['my-player-registrations'],
    queryFn: getMyPlayerRegistrations,
  });

  if (isLoading) return <div className='flex justify-center py-12'><Spinner size='lg' /></div>;

  if (registrations.length === 0) {
    return (
      <EmptyState
        icon='📋'
        title='No registrations yet'
        description='Go to the Discover tab to find open auctions and register as a player.'
      />
    );
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {registrations.map((r) => {
        const auction = r.auctionId;
        return (
          <div key={r._id} className='bg-gray-900 border border-gray-800 rounded-2xl p-5'>
            <div className='flex items-start justify-between mb-2'>
              <div>
                <h2 className='text-white font-semibold'>{auction?.name || 'Unknown Auction'}</h2>
                <p className='text-gray-500 text-xs mt-0.5 capitalize'>
                  {templateMap[auction?.sport]?.icon || '🎮'} {auction?.sport}
                </p>
                {auction?.createdBy?.name && (
                  <p className='text-gray-600 text-xs mt-0.5'>by {auction.createdBy.name}</p>
                )}
              </div>
              <Badge variant={REGISTRATION_BADGE[r.status] || 'default'}>{r.status}</Badge>
            </div>
            <div className='text-xs text-gray-500 mt-2 space-y-0.5'>
              <p>Role: <span className='text-gray-300'>{r.role}</span></p>
              {r.gender && <p>Gender: <span className='text-gray-300'>{r.gender}</span></p>}
              {r.country && <p>Country: <span className='text-gray-300'>{r.country}</span></p>}
              {r.category && <p>Category: <span className='text-indigo-300 font-medium'>{r.category}</span></p>}
            </div>
            {r.stats && Object.keys(r.stats).length > 0 && (
              <div className='flex flex-wrap gap-1.5 mt-2'>
                {Object.entries(r.stats).map(([k, v]) => (
                  <span key={k} className='bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded'>{k}: {v}</span>
                ))}
              </div>
            )}
            {r.status === 'rejected' && r.rejectionReason && (
              <p className='text-red-400 text-xs mt-2'>Reason: {r.rejectionReason}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

// --- Player Dashboard ---
const PlayerDashboard = ({ templateMap }) => {
  const [tab, setTab] = useState('discover');

  return (
    <div className='animate-fade-in'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white'>Auctions</h1>
        <p className='text-gray-400 text-sm mt-0.5'>Discover auctions and manage your player registrations</p>
      </div>

      <div className='flex gap-1 bg-gray-800 rounded-xl p-1 mb-6 w-fit'>
        <button
          onClick={() => setTab('discover')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'discover' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Discover
        </button>
        <button
          onClick={() => setTab('my')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'my' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          My Registrations
        </button>
      </div>

      {tab === 'discover'
        ? <PlayerDiscoverTab templateMap={templateMap} />
        : <MyRegistrationsTab templateMap={templateMap} />
      }
    </div>
  );
};

// --- Admin dashboard ---
const AdminDashboard = ({ templateMap, navigate }) => {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: listAuctions,
  });

  const createMut = useMutation({
    mutationFn: createAuction,
    onSuccess: (auction) => {
      qc.invalidateQueries({ queryKey: ['auctions'] });
      addToast('Auction created!', 'success');
      navigate(`/auction/${auction._id}/config`);
    },
    onError: (e) => addToast(e.response?.data?.message || 'Failed to create', 'error'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteAuction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auctions'] });
      addToast('Auction deleted', 'info');
    },
    onError: (e) => addToast(e.response?.data?.message || 'Failed to delete', 'error'),
  });

  if (isLoading) return <div className='flex justify-center py-12'><Spinner size='lg' /></div>;

  return (
    <>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-white'>Auctions</h1>
          <p className='text-gray-400 text-sm mt-0.5'>Manage your player auctions</p>
        </div>
        <Button onClick={() => setShowNew(true)}>+ New Auction</Button>
      </div>

      {auctions.length === 0 ? (
        <EmptyState
          icon='🏏'
          title='No auctions yet'
          description='Create your first player auction to get started.'
          hint='Auctions you create are private to your account.'
          action={<Button onClick={() => setShowNew(true)}>Create Auction</Button>}
        />
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {auctions.map((auction) => (
            <div
              key={auction._id}
              className='bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-indigo-700 transition-colors cursor-pointer'
              onClick={() => navigate(`/auction/${auction._id}`)}
            >
              <div className='flex items-start justify-between mb-3'>
                <div>
                  <h2 className='text-white font-semibold'>{auction.name}</h2>
                  <p className='text-gray-500 text-xs mt-0.5 capitalize'>
                    {templateMap[auction.sport]?.icon || '🎮'} {auction.sport}
                  </p>
                  {auction.createdBy?.name && (
                    <p className='text-gray-600 text-xs mt-0.5'>by {auction.createdBy.name}</p>
                  )}
                </div>
                <div className='flex items-center gap-1.5'>
                  {auction.status === 'live' && (
                    <span className='inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse-dot flex-shrink-0' />
                  )}
                  <Badge variant={STATUS_BADGE[auction.status] || 'default'}>{auction.status}</Badge>
                </div>
              </div>
              <div className='flex gap-2 mt-4' onClick={(e) => e.stopPropagation()}>
                <Button size='sm' variant='ghost' onClick={() => navigate(`/auction/${auction._id}`)}>
                  Open
                </Button>
                {auction.status === 'draft' && (
                  <Button size='sm' variant='ghost' onClick={() => navigate(`/auction/${auction._id}/config`)}>
                    Config
                  </Button>
                )}
                {(auction.status === 'draft' || auction.status === 'completed') && (
                  <Button
                    size='sm'
                    variant='danger'
                    onClick={() => { if (confirm('Delete this auction? This cannot be undone.')) deleteMut.mutate(auction._id); }}
                  >
                    Delete
                  </Button>
                )}
                {(auction.status === 'completed' || auction.status === 'live') && (
                  <Button size='sm' variant='ghost' onClick={() => navigate(`/auction/${auction._id}/report`)}>
                    Report
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <NewAuctionModal open={showNew} onClose={() => setShowNew(false)} onCreate={createMut.mutateAsync} />
    </>
  );
};

// --- Main Page ---
const DashboardPage = () => {
  const { isAdmin, isTeamOwner, isPlayer } = useAuth();
  const navigate = useNavigate();
  const [ownerTab, setOwnerTab] = useState('my');

  const { data: templates = [] } = useQuery({
    queryKey: ['sport-templates'],
    queryFn: listSportTemplates,
  });
  const templateMap = Object.fromEntries(templates.map((t) => [t.sport, t]));

  if (isAdmin) {
    return <div className='animate-fade-in'><AdminDashboard templateMap={templateMap} navigate={navigate} /></div>;
  }

  if (isPlayer) {
    return <PlayerDashboard templateMap={templateMap} />;
  }

  if (isTeamOwner) {
    return (
      <div className='animate-fade-in'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-white'>Auctions</h1>
          <p className='text-gray-400 text-sm mt-0.5'>Browse and manage your auction memberships</p>
        </div>

        <div className='flex gap-1 bg-gray-800 rounded-xl p-1 mb-6 w-fit'>
          <button
            onClick={() => setOwnerTab('my')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              ownerTab === 'my' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            My Auctions
          </button>
          <button
            onClick={() => setOwnerTab('discover')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              ownerTab === 'discover' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Discover
          </button>
        </div>

        {ownerTab === 'my'
          ? <MyAuctionsTab templateMap={templateMap} navigate={navigate} />
          : <DiscoverTab templateMap={templateMap} />
        }
      </div>
    );
  }

  // Viewer: flat auction list (read-only)
  return (
    <div className='animate-fade-in'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white'>Auctions</h1>
        <p className='text-gray-400 text-sm mt-0.5'>Browse live auctions</p>
      </div>
      <MyAuctionsTab templateMap={templateMap} navigate={navigate} />
    </div>
  );
};

export default DashboardPage;
