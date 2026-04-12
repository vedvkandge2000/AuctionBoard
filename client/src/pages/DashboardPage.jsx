import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAuctions, createAuction, deleteAuction } from '../services/auctionService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { AUCTION_STATUS, STATUS_COLORS } from '../utils/constants';
import { listSportTemplates } from '../services/sportTemplateService';

const STATUS_BADGE = {
  draft: 'default',
  live: 'green',
  paused: 'yellow',
  completed: 'blue',
};

const NewAuctionModal = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState(null);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    try {
      const { _id, isSeeded, createdAt, updatedAt, __v, ...preset } = selected;
      await onCreate({ name, ...preset });
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title='New Auction' size='lg'>
      <form onSubmit={handleSubmit} className='space-y-5'>
        {/* Auction name */}
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

        {/* Sport selector — DB-driven */}
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

        {/* Config preview */}
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
              {selected.minMalePlayers > 0 && (
                <div className='flex justify-between'>
                  <span className='text-gray-500'>Min male</span>
                  <span className='text-white font-medium'>{selected.minMalePlayers}</span>
                </div>
              )}
              {selected.minFemalePlayers > 0 && (
                <div className='flex justify-between'>
                  <span className='text-gray-500'>Min female</span>
                  <span className='text-white font-medium'>{selected.minFemalePlayers}</span>
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

const DashboardPage = () => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: listAuctions,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['sport-templates'],
    queryFn: listSportTemplates,
  });
  const templateMap = Object.fromEntries(templates.map((t) => [t.sport, t]));

  const createMutation = useMutation({
    mutationFn: createAuction,
    onSuccess: (auction) => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      addToast('Auction created!', 'success');
      navigate(`/auction/${auction._id}/config`);
    },
    onError: (e) => addToast(e.response?.data?.message || 'Failed to create', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAuction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      addToast('Auction deleted', 'info');
    },
    onError: (e) => addToast(e.response?.data?.message || 'Failed to delete', 'error'),
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Spinner size='lg' />
      </div>
    );
  }

  return (
    <div className='animate-fade-in'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-white'>Auctions</h1>
          <p className='text-gray-400 text-sm mt-0.5'>Manage your player auctions</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowNew(true)}>+ New Auction</Button>
        )}
      </div>

      {auctions.length === 0 ? (
        <EmptyState
          icon='🏏'
          title='No auctions yet'
          description='Create your first player auction to get started.'
          action={isAdmin && <Button onClick={() => setShowNew(true)}>Create Auction</Button>}
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
                </div>
                <Badge variant={STATUS_BADGE[auction.status] || 'default'}>
                  {auction.status}
                </Badge>
              </div>

              <div className='flex gap-2 mt-4' onClick={(e) => e.stopPropagation()}>
                <Button size='sm' variant='ghost' onClick={() => navigate(`/auction/${auction._id}`)}>
                  Open
                </Button>
                {isAdmin && auction.status === 'draft' && (
                  <>
                    <Button size='sm' variant='ghost' onClick={() => navigate(`/auction/${auction._id}/config`)}>
                      Config
                    </Button>
                    <Button
                      size='sm'
                      variant='danger'
                      onClick={() => {
                        if (confirm('Delete this auction?')) deleteMutation.mutate(auction._id);
                      }}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <NewAuctionModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreate={createMutation.mutateAsync}
      />
    </div>
  );
};

export default DashboardPage;
