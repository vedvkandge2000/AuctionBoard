import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listPlayers, addPlayer, updatePlayer, deletePlayer, bulkImportPlayers, downloadTemplate } from '../services/playerService';
import { getAuction } from '../services/auctionService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { formatCurrency } from '../utils/formatCurrency';

const STATUS_BADGE = { pool: 'default', live: 'green', sold: 'blue', unsold: 'red' };

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

const Field = ({ label, children }) => (
  <div>
    <label className='block text-gray-400 text-sm mb-1.5'>{label}</label>
    {children}
  </div>
);

const PlayerForm = ({ auction, player, onSave, onClose }) => {
  const [form, setForm] = useState(
    player || { name: '', role: auction?.playerRoles?.[0] || '', nationality: 'domestic', gender: '', country: '', basePrice: '', setNumber: 1 }
  );
  const [loading, setLoading] = useState(false);

  const handle = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ ...form, basePrice: Number(form.basePrice) });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-2 gap-4'>
        <Field label='Name'>
          <input required className={inputCls} value={form.name} onChange={(e) => handle('name', e.target.value)} />
        </Field>
        <Field label='Role'>
          <select className={inputCls} value={form.role} onChange={(e) => handle('role', e.target.value)}>
            {(auction?.playerRoles || []).map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label='Nationality'>
          <select className={inputCls} value={form.nationality} onChange={(e) => handle('nationality', e.target.value)}>
            <option value='domestic'>Domestic</option>
            <option value='overseas'>Overseas</option>
          </select>
        </Field>
        <Field label='Gender (optional)'>
          <select className={inputCls} value={form.gender} onChange={(e) => handle('gender', e.target.value)}>
            <option value=''>Not specified</option>
            <option value='male'>Male</option>
            <option value='female'>Female</option>
          </select>
        </Field>
        <Field label='Country'>
          <input className={inputCls} value={form.country} onChange={(e) => handle('country', e.target.value)} />
        </Field>
        <Field label={`Base Price (${auction?.currencyUnit || 'lakh'})`}>
          <input required type='number' min='1' className={inputCls} value={form.basePrice} onChange={(e) => handle('basePrice', e.target.value)} />
        </Field>
        <Field label='Set Number'>
          <input type='number' min='1' className={inputCls} value={form.setNumber} onChange={(e) => handle('setNumber', e.target.value)} />
        </Field>
      </div>
      <div className='flex gap-3 justify-end pt-2'>
        <Button variant='ghost' onClick={onClose} type='button'>Cancel</Button>
        <Button type='submit' loading={loading}>{player ? 'Update' : 'Add Player'}</Button>
      </div>
    </form>
  );
};

const PlayersPage = () => {
  const { id: auctionId } = useParams();
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const qc = useQueryClient();

  const [filter, setFilter] = useState({ status: '', role: '' });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const { data: auction } = useQuery({ queryKey: ['auction', auctionId], queryFn: () => getAuction(auctionId) });
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players', auctionId, filter],
    queryFn: () => listPlayers(auctionId, filter),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['players', auctionId] });

  const addMutation = useMutation({
    mutationFn: (p) => addPlayer(auctionId, p),
    onSuccess: () => { invalidate(); addToast('Player added', 'success'); },
    onError: (e) => addToast(e.response?.data?.message || 'Failed', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: (p) => updatePlayer(auctionId, editing._id, p),
    onSuccess: () => { invalidate(); addToast('Player updated', 'success'); setEditing(null); },
    onError: (e) => addToast(e.response?.data?.message || 'Failed', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (pid) => deletePlayer(auctionId, pid),
    onSuccess: () => { invalidate(); addToast('Player deleted', 'info'); },
    onError: (e) => addToast(e.response?.data?.message || 'Failed', 'error'),
  });

  const handleCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvLoading(true);
    try {
      const result = await bulkImportPlayers(auctionId, file);
      invalidate();
      addToast(`Imported ${result.imported} players${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''}`, result.errors.length ? 'warning' : 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Import failed', 'error');
    } finally {
      setCsvLoading(false);
      e.target.value = '';
    }
  };

  const symbol = auction?.currencySymbol || '₹';
  const unit = auction?.currencyUnit || 'lakh';

  if (isLoading) return <div className='flex justify-center h-64 items-center'><Spinner size='lg' /></div>;

  return (
    <div className='animate-fade-in'>
      <div className='flex flex-wrap items-center gap-3 mb-5'>
        <div className='flex-1'>
          <h1 className='text-2xl font-bold text-white'>Players</h1>
          <p className='text-gray-400 text-sm'>{players.length} players</p>
        </div>
        {isAdmin && (
          <div className='flex gap-2 flex-wrap'>
            <Button size='sm' variant='ghost' onClick={() => downloadTemplate(auctionId)}>⬇️ CSV Template</Button>
            <label className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-white/20 text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer ${csvLoading ? 'opacity-50 cursor-wait' : ''}`}>
              {csvLoading ? '⏳' : '📤'} Import CSV
              <input type='file' accept='.csv' className='hidden' onChange={handleCSV} />
            </label>
            <Button size='sm' onClick={() => setShowForm(true)}>+ Add Player</Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className='flex gap-3 mb-4 flex-wrap'>
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className='bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
        >
          <option value=''>All Status</option>
          <option value='pool'>Pool</option>
          <option value='live'>Live</option>
          <option value='sold'>Sold</option>
          <option value='unsold'>Unsold</option>
        </select>
        <select
          value={filter.role}
          onChange={(e) => setFilter({ ...filter, role: e.target.value })}
          className='bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
        >
          <option value=''>All Roles</option>
          {(auction?.playerRoles || []).map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      {players.length === 0 ? (
        <EmptyState icon='👤' title='No players found' description='Add players manually or import a CSV.' action={isAdmin && <Button onClick={() => setShowForm(true)}>Add Player</Button>} />
      ) : (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {players.map((player) => (
            <div key={player._id} className='bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors'>
              <div className='flex items-start justify-between mb-2'>
                <div>
                  <p className='text-white font-semibold text-sm'>{player.name}</p>
                  <p className='text-gray-400 text-xs'>
                    {player.role}
                    {player.gender ? ` · ${player.gender}` : ` · ${player.nationality}`}
                  </p>
                </div>
                <div className='flex flex-col items-end gap-1'>
                  <Badge variant={STATUS_BADGE[player.status] || 'default'}>{player.status}</Badge>
                  {player.gender && (
                    <Badge variant={player.gender === 'female' ? 'pink' : 'blue'}>
                      {player.gender === 'female' ? '♀ Female' : '♂ Male'}
                    </Badge>
                  )}
                </div>
              </div>
              <p className='text-indigo-400 text-sm font-medium mb-3'>
                {player.status === 'sold' ? `Sold: ${formatCurrency(player.finalPrice, symbol, unit)}` : `Base: ${formatCurrency(player.basePrice, symbol, unit)}`}
              </p>
              {isAdmin && player.status === 'pool' && (
                <div className='flex gap-2'>
                  <Button size='sm' variant='ghost' onClick={() => { setEditing(player); setShowForm(true); }}>Edit</Button>
                  <Button size='sm' variant='danger' onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(player._id); }}>Delete</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Edit Player' : 'Add Player'} size='lg'>
        <PlayerForm
          auction={auction}
          player={editing}
          onSave={editing ? updateMutation.mutateAsync : addMutation.mutateAsync}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      </Modal>
    </div>
  );
};

export default PlayersPage;
