import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
import { Gavel, Radio, Gamepad2, Clock } from 'lucide-react';

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

/* Framer Motion stagger variants for card grids */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* Reusable auction card accent strip + live glow */
const AuctionCard = ({ auction, onClick, children }) => {
  const isLive = auction.status === 'live';
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className='rounded-2xl overflow-hidden cursor-pointer'
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${isLive ? 'var(--color-success)' : 'var(--color-border)'}`,
        boxShadow: isLive ? '0 0 0 0 var(--glow-sold)' : 'var(--shadow-sm)',
        animation: isLive ? 'liveGlow 2.5s ease-out infinite' : 'none',
      }}
      onClick={onClick}
    >
      {/* Accent strip */}
      <div
        className='h-1'
        style={{
          backgroundColor: isLive
            ? 'var(--color-success)'
            : auction.status === 'completed'
              ? 'var(--color-text-subtle)'
              : 'var(--color-accent)',
          opacity: isLive ? 1 : auction.status === 'draft' ? 0.4 : 0.7,
        }}
      />
      <div className='p-5'>
        {children}
      </div>
    </motion.div>
  );
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
          <label className='block text-sm mb-1.5' style={{ color: 'var(--color-text-muted)' }}>Auction Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]'
            placeholder='e.g. IPL 2026 Auction'
          />
        </div>

        <div>
          <label className='block text-sm mb-2' style={{ color: 'var(--color-text-muted)' }}>Sport</label>
          {templatesLoading ? (
            <div className='flex justify-center py-4'><Spinner /></div>
          ) : templates.length === 0 ? (
            <p className='text-sm' style={{ color: 'var(--color-text-subtle)' }}>No sport templates found. Ask an admin to create one.</p>
          ) : (
            <div className='grid grid-cols-2 gap-3'>
              {templates.map((t) => {
                const isSelected = selected?._id === t._id;
                return (
                  <button
                    key={t._id}
                    type='button'
                    onClick={() => setSelectedId(t._id)}
                    className='flex items-center gap-3 p-3 rounded-xl border text-left transition-all'
                    style={isSelected
                      ? { borderColor: 'var(--color-accent)', backgroundColor: 'var(--color-accent-muted)', boxShadow: '0 0 0 1px var(--color-accent)' }
                      : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }
                    }
                  >
                    <span className='text-2xl'>{t.icon}</span>
                    <div className='min-w-0'>
                      <p className='font-semibold text-sm' style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text)' }}>{t.name}</p>
                      <p className='text-xs mt-0.5 leading-tight truncate' style={{ color: 'var(--color-text-subtle)' }}>{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className='block text-sm mb-2' style={{ color: 'var(--color-text-muted)' }}>Auction Mode</label>
          <div className='grid grid-cols-2 gap-3'>
            {[
              { value: 'online', label: 'Online', desc: 'Team owners bid in real-time', icon: '🌐' },
              { value: 'offline', label: 'Offline', desc: 'Admin scribes bids from physical room', icon: '🏟️' },
            ].map((opt) => (
              <button
                key={opt.value}
                type='button'
                onClick={() => setMode(opt.value)}
                className='flex items-center gap-3 p-3 rounded-xl border text-left transition-all'
                style={mode === opt.value
                  ? { borderColor: 'var(--color-gold)', backgroundColor: 'var(--color-gold-bg)', boxShadow: '0 0 0 1px var(--color-gold)' }
                  : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }
                }
              >
                <span className='text-2xl'>{opt.icon}</span>
                <div className='min-w-0'>
                  <p className='font-semibold text-sm' style={{ color: mode === opt.value ? 'var(--color-gold)' : 'var(--color-text)' }}>{opt.label}</p>
                  <p className='text-xs mt-0.5 leading-tight' style={{ color: 'var(--color-text-subtle)' }}>{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className='rounded-xl p-4' style={{ backgroundColor: 'var(--color-surface-sunken)', border: '1px solid var(--color-border)' }}>
            <p className='text-xs uppercase tracking-widest mb-3' style={{ color: 'var(--color-text-muted)' }}>Template Config</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2 text-xs'>
              <div className='flex justify-between'>
                <span style={{ color: 'var(--color-text-subtle)' }}>Purse</span>
                <span className='font-medium' style={{ color: 'var(--color-text)' }}>{selected.currencySymbol}{selected.defaultPursePerTeam} {selected.currencyUnit}</span>
              </div>
              <div className='flex justify-between'>
                <span style={{ color: 'var(--color-text-subtle)' }}>Squad size</span>
                <span className='font-medium' style={{ color: 'var(--color-text)' }}>{selected.minSquadSize}–{selected.maxSquadSize}</span>
              </div>
              {selected.maxOverseasPlayers > 0 && (
                <div className='flex justify-between'>
                  <span style={{ color: 'var(--color-text-subtle)' }}>Overseas cap</span>
                  <span className='font-medium' style={{ color: 'var(--color-text)' }}>{selected.maxOverseasPlayers}</span>
                </div>
              )}
              <div className='col-span-2 flex justify-between'>
                <span style={{ color: 'var(--color-text-subtle)' }}>Roles</span>
                <span className='font-medium' style={{ color: 'var(--color-text)' }}>{(selected.playerRoles || []).join(', ') || '—'}</span>
              </div>
            </div>
            <p className='text-xs mt-3' style={{ color: 'var(--color-text-subtle)' }}>All values can be customised in the config page after creation.</p>
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
    <motion.div
      className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {auctions.map((auction) => (
        <AuctionCard key={auction._id} auction={auction} onClick={() => navigate(`/auction/${auction._id}`)}>
          <div className='flex items-start justify-between mb-3'>
            <div>
              <h2 className='font-semibold' style={{ color: 'var(--color-text)' }}>{auction.name}</h2>
              <p className='text-xs mt-0.5 capitalize' style={{ color: 'var(--color-text-subtle)' }}>
                {templateMap[auction.sport]?.icon || '🎮'} {auction.sport}
              </p>
            </div>
            <div className='flex items-center gap-1.5'>
              {auction.status === 'live' && (
                <span className='inline-block w-2 h-2 rounded-full animate-pulse-dot flex-shrink-0' style={{ backgroundColor: 'var(--color-success)' }} />
              )}
              <Badge variant={STATUS_BADGE[auction.status] || 'default'}>{auction.status}</Badge>
            </div>
          </div>
          <div className='flex gap-2 mt-4' onClick={(e) => e.stopPropagation()}>
            <Button size='sm' variant='ghost' onClick={() => navigate(`/auction/${auction._id}`)}>Open</Button>
            {(auction.status === 'completed' || auction.status === 'live') && (
              <Button size='sm' variant='ghost' onClick={() => navigate(`/auction/${auction._id}/report`)}>Report</Button>
            )}
          </div>
        </AuctionCard>
      ))}
    </motion.div>
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
    <motion.div
      className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {auctions.map((auction) => {
        const status = auction.myMembershipStatus || 'none';
        const membershipId = auction.myMembershipId;
        return (
          <AuctionCard key={auction._id} auction={auction} onClick={() => {}}>
            <div className='flex items-start justify-between mb-3'>
              <div className='min-w-0 flex-1'>
                <h2 className='font-semibold truncate' style={{ color: 'var(--color-text)' }}>{auction.name}</h2>
                <p className='text-xs mt-0.5 capitalize' style={{ color: 'var(--color-text-subtle)' }}>
                  {templateMap[auction.sport]?.icon || '🎮'} {auction.sport}
                </p>
                {auction.createdBy?.name && (
                  <p className='text-xs mt-0.5' style={{ color: 'var(--color-text-subtle)' }}>by {auction.createdBy.name}</p>
                )}
              </div>
              <div className='flex items-center gap-1.5 flex-shrink-0 ml-2'>
                {auction.status === 'live' && (
                  <span className='inline-block w-2 h-2 rounded-full animate-pulse-dot flex-shrink-0' style={{ backgroundColor: 'var(--color-success)' }} />
                )}
                <Badge variant={STATUS_BADGE[auction.status] || 'default'}>{auction.status}</Badge>
              </div>
            </div>

            <div className='flex items-center gap-2 mt-4'>
              {status === 'none' && (
                <Button size='sm' loading={applyMut.isPending} onClick={() => applyMut.mutate(auction._id)}>
                  Apply to Join
                </Button>
              )}
              {status === 'pending' && (
                <>
                  <Badge variant={MEMBERSHIP_BADGE.pending}>Pending Approval</Badge>
                  <Button size='sm' variant='ghost' loading={withdrawMut.isPending} onClick={() => withdrawMut.mutate(membershipId)}>
                    Withdraw
                  </Button>
                </>
              )}
              {status === 'approved' && (
                <>
                  <Badge variant={MEMBERSHIP_BADGE.approved}>Joined</Badge>
                  <Button size='sm' variant='ghost' onClick={() => navigate(`/auction/${auction._id}`)}>Open</Button>
                </>
              )}
              {status === 'rejected' && <Badge variant={MEMBERSHIP_BADGE.rejected}>Rejected</Badge>}
            </div>
          </AuctionCard>
        );
      })}
    </motion.div>
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

  const inputCls = 'w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]';

  return (
    <Modal open={open} onClose={onClose} title={`Register for ${auction.name}`} size='md'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <p className='text-xs' style={{ color: 'var(--color-text-subtle)' }}>
          Your name from your account will be used. Fill in your playing details for this auction.
        </p>

        <div className='grid grid-cols-2 gap-3'>
          <div className='col-span-2'>
            <label className='block text-xs mb-1' style={{ color: 'var(--color-text-muted)' }}>Role *</label>
            {availableRoles.length > 0 ? (
              <select value={form.role} onChange={set('role')} className={inputCls}>
                <option value=''>Select role</option>
                {availableRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : (
              <input type='text' value={form.role} onChange={set('role')} placeholder='e.g. Batsman, Bowler' className={inputCls} />
            )}
          </div>

          <div>
            <label className='block text-xs mb-1' style={{ color: 'var(--color-text-muted)' }}>Gender</label>
            <select value={form.gender} onChange={set('gender')} className={inputCls}>
              <option value=''>Not specified</option>
              <option value='male'>Male</option>
              <option value='female'>Female</option>
            </select>
          </div>

          <div>
            <label className='block text-xs mb-1' style={{ color: 'var(--color-text-muted)' }}>Nationality</label>
            <select value={form.nationality} onChange={set('nationality')} className={inputCls}>
              <option value='domestic'>Domestic</option>
              <option value='overseas'>Overseas</option>
            </select>
          </div>

          <div>
            <label className='block text-xs mb-1' style={{ color: 'var(--color-text-muted)' }}>Country</label>
            <input type='text' value={form.country} onChange={set('country')} placeholder='e.g. India' className={inputCls} />
          </div>

          <div>
            <label className='block text-xs mb-1' style={{ color: 'var(--color-text-muted)' }}>Contact Email (optional)</label>
            <input type='text' value={form.contactEmail} onChange={set('contactEmail')} placeholder='Notifications' className={inputCls} />
          </div>
        </div>

        <div>
          <label className='block text-xs mb-2' style={{ color: 'var(--color-text-muted)' }}>Playing Stats (optional)</label>
          <div className='space-y-2'>
            {stats.map((s, i) => (
              <div key={i} className='flex gap-2 items-center'>
                <input type='text' value={s.key} onChange={(e) => updateStat(i, 'key', e.target.value)} placeholder='Stat name' className={`flex-1 ${inputCls}`} />
                <input type='text' value={s.value} onChange={(e) => updateStat(i, 'value', e.target.value)} placeholder='Value' className={`flex-1 ${inputCls}`} />
                <button type='button' onClick={() => setStats((prev) => prev.filter((_, idx) => idx !== i))}
                  className='text-lg leading-none px-1 hover:opacity-80' style={{ color: 'var(--color-text-subtle)' }}>×</button>
              </div>
            ))}
            <button type='button' onClick={() => setStats((prev) => [...prev, { key: '', value: '' }])}
              className='text-sm hover:opacity-80' style={{ color: 'var(--color-accent)' }}>+ Add stat</button>
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
      <motion.div
        className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {auctions.map((auction) => {
          const status = auction.myRegistrationStatus || 'none';
          return (
            <AuctionCard key={auction._id} auction={auction} onClick={() => {}}>
              <div className='flex items-start justify-between mb-3'>
                <div className='min-w-0 flex-1'>
                  <h2 className='font-semibold truncate' style={{ color: 'var(--color-text)' }}>{auction.name}</h2>
                  <p className='text-xs mt-0.5 capitalize' style={{ color: 'var(--color-text-subtle)' }}>
                    {templateMap[auction.sport]?.icon || '🎮'} {auction.sport}
                  </p>
                  {auction.createdBy?.name && (
                    <p className='text-xs mt-0.5' style={{ color: 'var(--color-text-subtle)' }}>by {auction.createdBy.name}</p>
                  )}
                </div>
                <div className='flex items-center gap-1.5 flex-shrink-0 ml-2'>
                  {auction.status === 'live' && (
                    <span className='inline-block w-2 h-2 rounded-full animate-pulse-dot flex-shrink-0' style={{ backgroundColor: 'var(--color-success)' }} />
                  )}
                  <Badge variant={STATUS_BADGE[auction.status] || 'default'}>{auction.status}</Badge>
                </div>
              </div>

              <div className='flex items-center gap-2 mt-4'>
                {status === 'none' && (
                  <Button size='sm' onClick={() => setApplyTarget(auction)}>Register as Player</Button>
                )}
                {status === 'pending' && <Badge variant={REGISTRATION_BADGE.pending}>Pending Approval</Badge>}
                {status === 'approved' && <Badge variant={REGISTRATION_BADGE.approved}>Approved</Badge>}
                {status === 'rejected' && <Badge variant={REGISTRATION_BADGE.rejected}>Rejected</Badge>}
              </div>
            </AuctionCard>
          );
        })}
      </motion.div>

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
    <motion.div
      className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {registrations.map((r) => {
        const auction = r.auctionId;
        return (
          <motion.div
            key={r._id}
            variants={cardVariants}
            className='rounded-2xl p-5'
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className='flex items-start justify-between mb-2'>
              <div>
                <h2 className='font-semibold' style={{ color: 'var(--color-text)' }}>{auction?.name || 'Unknown Auction'}</h2>
                <p className='text-xs mt-0.5 capitalize' style={{ color: 'var(--color-text-subtle)' }}>
                  {templateMap[auction?.sport]?.icon || '🎮'} {auction?.sport}
                </p>
              </div>
              <Badge variant={REGISTRATION_BADGE[r.status] || 'default'}>{r.status}</Badge>
            </div>
            <div className='text-xs mt-2 space-y-0.5' style={{ color: 'var(--color-text-subtle)' }}>
              <p>Role: <span style={{ color: 'var(--color-text-muted)' }}>{r.role}</span></p>
              {r.gender && <p>Gender: <span style={{ color: 'var(--color-text-muted)' }}>{r.gender}</span></p>}
              {r.country && <p>Country: <span style={{ color: 'var(--color-text-muted)' }}>{r.country}</span></p>}
              {r.category && <p>Category: <span className='font-medium' style={{ color: 'var(--color-accent)' }}>{r.category}</span></p>}
            </div>
            {r.stats && Object.keys(r.stats).length > 0 && (
              <div className='flex flex-wrap gap-1.5 mt-2'>
                {Object.entries(r.stats).map(([k, v]) => (
                  <span key={k} className='text-xs px-2 py-0.5 rounded' style={{ backgroundColor: 'var(--color-surface-sunken)', color: 'var(--color-text-muted)' }}>{k}: {v}</span>
                ))}
              </div>
            )}
            {r.status === 'rejected' && r.rejectionReason && (
              <p className='text-xs mt-2' style={{ color: 'var(--color-danger-text)' }}>Reason: {r.rejectionReason}</p>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// --- Player Dashboard ---
const PlayerDashboard = ({ templateMap }) => {
  const [tab, setTab] = useState('discover');

  return (
    <div className='animate-fade-in'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold' style={{ color: 'var(--color-text)' }}>Auctions</h1>
        <p className='text-sm mt-0.5' style={{ color: 'var(--color-text-muted)' }}>Discover auctions and manage your player registrations</p>
      </div>

      <div className='flex gap-1 rounded-xl p-1 mb-6 w-fit' style={{ backgroundColor: 'var(--color-surface)' }}>
        {[
          { value: 'discover', label: 'Discover' },
          { value: 'my', label: 'My Registrations' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className='px-4 py-1.5 rounded-lg text-sm font-medium transition-colors'
            style={tab === value
              ? { backgroundColor: 'var(--color-accent)', color: '#ffffff' }
              : { color: 'var(--color-text-muted)' }
            }
          >
            {label}
          </button>
        ))}
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

  const liveCount = auctions.filter((a) => a.status === 'live').length;
  const draftCount = auctions.filter((a) => a.status === 'draft').length;
  const sportTypes = [...new Set(auctions.map((a) => a.sport))].length;

  return (
    <>
      <div className='flex items-center justify-between mb-5'>
        <div>
          <h1 className='text-2xl font-bold' style={{ color: 'var(--color-text)' }}>Auctions</h1>
          <p className='text-sm mt-0.5' style={{ color: 'var(--color-text-muted)' }}>Manage your player auctions</p>
        </div>
        <Button onClick={() => setShowNew(true)}>+ New Auction</Button>
      </div>

      {/* Stats row */}
      {auctions.length > 0 && (
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6'>
          {[
            { label: 'Total', value: auctions.length, Icon: Gavel, highlight: false },
            { label: 'Live Now', value: liveCount, Icon: Radio, highlight: liveCount > 0 },
            { label: 'Sports', value: sportTypes, Icon: Gamepad2, highlight: false },
            { label: 'Draft', value: draftCount, Icon: Clock, highlight: false },
          ].map(({ label, value, Icon, highlight }) => (
            <div
              key={label}
              className='rounded-xl p-4'
              style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${highlight ? 'var(--color-success)' : 'var(--color-border)'}` }}
            >
              <div className='flex items-center justify-between mb-1.5'>
                <span className='text-xs font-medium' style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                <Icon size={13} style={{ color: highlight ? 'var(--color-success)' : 'var(--color-text-subtle)' }} />
              </div>
              <div className='flex items-baseline gap-1.5'>
                <span className='text-2xl font-bold font-mono-nums' style={{ color: highlight ? 'var(--color-success)' : 'var(--color-text)' }}>
                  {value}
                </span>
                {highlight && (
                  <span className='text-xs font-semibold animate-pulse-dot' style={{ color: 'var(--color-success)' }}>● LIVE</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {auctions.length === 0 ? (
        <div className='flex flex-col items-center py-16 gap-4'>
          <div
            className='w-16 h-16 rounded-2xl flex items-center justify-center'
            style={{ backgroundColor: 'var(--color-accent-muted)' }}
          >
            <Gavel size={32} style={{ color: 'var(--color-accent)' }} />
          </div>
          <p className='font-semibold text-lg' style={{ color: 'var(--color-text)' }}>No auctions yet</p>
          <p className='text-sm' style={{ color: 'var(--color-text-muted)' }}>Create your first player auction to get started</p>
          <Button onClick={() => setShowNew(true)}>+ New Auction</Button>
        </div>
      ) : (
        <motion.div
          className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {auctions.map((auction) => (
            <AuctionCard key={auction._id} auction={auction} onClick={() => navigate(`/auction/${auction._id}`)}>
              <div className='flex items-start justify-between mb-3'>
                <div>
                  <h2 className='font-semibold' style={{ color: 'var(--color-text)' }}>{auction.name}</h2>
                  <p className='text-xs mt-0.5 capitalize' style={{ color: 'var(--color-text-subtle)' }}>
                    {templateMap[auction.sport]?.icon || '🎮'} {auction.sport}
                  </p>
                  {auction.createdBy?.name && (
                    <p className='text-xs mt-0.5' style={{ color: 'var(--color-text-subtle)' }}>by {auction.createdBy.name}</p>
                  )}
                </div>
                <div className='flex items-center gap-1.5'>
                  {auction.status === 'live' && (
                    <span className='inline-block w-2 h-2 rounded-full animate-pulse-dot flex-shrink-0' style={{ backgroundColor: 'var(--color-success)' }} />
                  )}
                  <Badge variant={STATUS_BADGE[auction.status] || 'default'}>{auction.status}</Badge>
                </div>
              </div>
              <div className='flex gap-2 mt-4' onClick={(e) => e.stopPropagation()}>
                <Button size='sm' variant='ghost' onClick={() => navigate(`/auction/${auction._id}`)}>Open</Button>
                {auction.status === 'draft' && (
                  <Button size='sm' variant='ghost' onClick={() => navigate(`/auction/${auction._id}/config`)}>Config</Button>
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
                  <Button size='sm' variant='ghost' onClick={() => navigate(`/auction/${auction._id}/report`)}>Report</Button>
                )}
              </div>
            </AuctionCard>
          ))}
        </motion.div>
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
          <h1 className='text-2xl font-bold' style={{ color: 'var(--color-text)' }}>Auctions</h1>
          <p className='text-sm mt-0.5' style={{ color: 'var(--color-text-muted)' }}>Browse and manage your auction memberships</p>
        </div>

        <div className='flex gap-1 rounded-xl p-1 mb-6 w-fit' style={{ backgroundColor: 'var(--color-surface)' }}>
          {[
            { value: 'my', label: 'My Auctions' },
            { value: 'discover', label: 'Discover' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setOwnerTab(value)}
              className='px-4 py-1.5 rounded-lg text-sm font-medium transition-colors'
              style={ownerTab === value
                ? { backgroundColor: 'var(--color-accent)', color: '#ffffff' }
                : { color: 'var(--color-text-muted)' }
              }
            >
              {label}
            </button>
          ))}
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
        <h1 className='text-2xl font-bold' style={{ color: 'var(--color-text)' }}>Auctions</h1>
        <p className='text-sm mt-0.5' style={{ color: 'var(--color-text-muted)' }}>Browse live auctions</p>
      </div>
      <MyAuctionsTab templateMap={templateMap} navigate={navigate} />
    </div>
  );
};

export default DashboardPage;
