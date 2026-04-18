import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listTeams, createTeam, updateTeam, deleteTeam, getSquad } from '../services/teamService';
import { getAuction } from '../services/auctionService';
import { getApprovedOwners } from '../services/registrationService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { formatCurrency, formatShort } from '../utils/formatCurrency';

const TeamForm = ({ auction, team, onSave, onClose, isAdmin }) => {
  const [form, setForm] = useState(
    team || { name: '', shortName: '', colorHex: '#6366f1', ownerId: '' }
  );
  const [loading, setLoading] = useState(false);
  const handle = (k, v) => setForm({ ...form, [k]: v });

  const { data: approvedOwners = [] } = useQuery({
    queryKey: ['approved-owners'],
    queryFn: getApprovedOwners,
    enabled: isAdmin,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]';

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm mb-1.5' style={{ color: 'var(--color-text-muted)' }}>Team Name *</label>
          <input required className={inputCls} value={form.name} onChange={(e) => handle('name', e.target.value)} placeholder='e.g. Mumbai Indians' />
        </div>
        <div>
          <label className='block text-sm mb-1.5' style={{ color: 'var(--color-text-muted)' }}>Short Name (max 5) *</label>
          <input required maxLength={5} className={inputCls} value={form.shortName} onChange={(e) => handle('shortName', e.target.value)} placeholder='e.g. MI' />
        </div>
        <div>
          <label className='block text-sm mb-1.5' style={{ color: 'var(--color-text-muted)' }}>Team Color</label>
          <input type='color' className='h-10 w-full rounded-lg cursor-pointer' style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }} value={form.colorHex} onChange={(e) => handle('colorHex', e.target.value)} />
        </div>
        {isAdmin && (
          <div>
            <label className='block text-sm mb-1.5' style={{ color: 'var(--color-text-muted)' }}>Assign Owner</label>
            <select
              className={inputCls}
              value={form.ownerId}
              onChange={(e) => handle('ownerId', e.target.value)}
            >
              <option value=''>No owner (unowned team)</option>
              {approvedOwners.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email}){u.teamId ? ' — already has a team' : ''}
                </option>
              ))}
            </select>
            {approvedOwners.length === 0 && (
              <p className='text-xs mt-1' style={{ color: 'var(--color-text-subtle)' }}>No approved team owners yet. Approve owners from the Approvals page.</p>
            )}
          </div>
        )}
      </div>
      <div className='flex gap-3 justify-end pt-2'>
        <Button variant='ghost' onClick={onClose} type='button'>Cancel</Button>
        <Button type='submit' loading={loading}>{team ? 'Update' : 'Create Team'}</Button>
      </div>
    </form>
  );
};

const SquadModal = ({ open, onClose, auctionId, team, auction }) => {
  const { data: squadTeam, isLoading } = useQuery({
    queryKey: ['squad', auctionId, team?._id],
    queryFn: () => getSquad(auctionId, team._id),
    enabled: open && !!team,
  });

  const symbol = auction?.currencySymbol || '₹';
  const unit = auction?.currencyUnit || 'lakh';

  return (
    <Modal open={open} onClose={onClose} title={`${team?.name || 'Squad'} — Squad`} size='lg'>
      {isLoading ? (
        <div className='flex justify-center py-8'><Spinner /></div>
      ) : (
        <div>
          <div className='grid grid-cols-3 gap-3 mb-4 text-center'>
            <div className='rounded-lg p-3' style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className='text-xs' style={{ color: 'var(--color-text-muted)' }}>Remaining Purse</div>
              <div className='font-bold' style={{ color: 'var(--color-accent)' }}>{formatCurrency(squadTeam?.remainingPurse, symbol, unit)}</div>
            </div>
            <div className='rounded-lg p-3' style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className='text-xs' style={{ color: 'var(--color-text-muted)' }}>Players</div>
              <div className='font-bold' style={{ color: 'var(--color-text)' }}>{squadTeam?.players?.length || 0}</div>
            </div>
            <div className='rounded-lg p-3' style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className='text-xs' style={{ color: 'var(--color-text-muted)' }}>RTM Cards</div>
              <div className='font-bold' style={{ color: 'var(--color-text)' }}>{squadTeam?.rtmCardsRemaining || 0}</div>
            </div>
          </div>
          <div className='space-y-2 max-h-80 overflow-y-auto'>
            {(squadTeam?.players || []).map((sp) => (
              <div key={sp.playerId?._id} className='flex items-center justify-between rounded-lg px-4 py-2.5' style={{ backgroundColor: 'var(--color-surface)' }}>
                <div>
                  <p className='text-sm font-medium' style={{ color: 'var(--color-text)' }}>{sp.playerId?.name}</p>
                  <p className='text-xs' style={{ color: 'var(--color-text-muted)' }}>{sp.playerId?.role} {sp.acquiredViaRtm ? '· RTM' : ''}</p>
                </div>
                <span className='font-semibold text-sm' style={{ color: 'var(--color-accent)' }}>{formatCurrency(sp.pricePaid, symbol, unit)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

const getBudgetBorderColor = (pct) => {
  if (pct > 60) return '#22c55e'; // green-500
  if (pct > 25) return '#eab308'; // yellow-500
  return '#ef4444'; // red-500
};

const TeamsPage = () => {
  const { id: auctionId } = useParams();
  const { isAdmin, isTeamOwner, user } = useAuth();
  const { addToast } = useToast();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [squadTeam, setSquadTeam] = useState(null);

  const { data: auction } = useQuery({ queryKey: ['auction', auctionId], queryFn: () => getAuction(auctionId) });
  const { data: teams = [], isLoading } = useQuery({ queryKey: ['teams', auctionId], queryFn: () => listTeams(auctionId) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['teams', auctionId] });

  const createMutation = useMutation({
    mutationFn: (t) => createTeam(auctionId, t),
    onSuccess: () => { invalidate(); addToast('Team created!', 'success'); setShowForm(false); },
    onError: (e) => addToast(e.response?.data?.message || 'Failed', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: (t) => updateTeam(auctionId, editing._id, t),
    onSuccess: () => { invalidate(); addToast('Team updated', 'success'); setEditing(null); },
    onError: (e) => addToast(e.response?.data?.message || 'Failed', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (tid) => deleteTeam(auctionId, tid),
    onSuccess: () => { invalidate(); addToast('Team deleted', 'info'); },
    onError: (e) => addToast(e.response?.data?.message || 'Failed', 'error'),
  });

  const symbol = auction?.currencySymbol || '₹';
  const unit = auction?.currencyUnit || 'lakh';

  if (isLoading) return <div className='flex justify-center h-64 items-center'><Spinner size='lg' /></div>;

  return (
    <div className='animate-fade-in'>
      <div className='flex items-center justify-between mb-5'>
        <div>
          <h1 className='text-2xl font-bold' style={{ color: 'var(--color-text)' }}>Teams</h1>
          <p className='text-sm' style={{ color: 'var(--color-text-muted)' }}>{teams.length} teams</p>
        </div>
        {isAdmin && <Button onClick={() => setShowForm(true)}>+ Add Team</Button>}
        {isTeamOwner && !teams.some((t) => t.ownerId?._id === user?.id || t.ownerId === user?.id) && (
          <Button onClick={() => setShowForm(true)}>+ Create My Team</Button>
        )}
      </div>

      {teams.length === 0 ? (
        <EmptyState
          icon='🛡️'
          title='No teams yet'
          description={isAdmin ? 'Add teams to the auction.' : isTeamOwner ? 'Create your team to join the auction.' : 'No teams have been added yet.'}
          hint={isAdmin ? 'Tip: assign team owners so they can access the auction room.' : undefined}
          action={(isAdmin || isTeamOwner) && <Button onClick={() => setShowForm(true)}>{isAdmin ? 'Add Team' : 'Create My Team'}</Button>}
        />
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {teams.map((team) => {
            const pct = Math.round((team.remainingPurse / team.initialPurse) * 100);
            return (
              <div key={team._id} className='rounded-2xl p-5 transition-colors' style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderTopColor: team.colorHex, borderTopWidth: 3, borderLeftColor: getBudgetBorderColor(pct), borderLeftWidth: 3 }}>
                <div className='flex items-center gap-3 mb-3'>
                  {team.logoUrl && <img src={team.logoUrl} alt='' className='h-8 w-8 rounded-full object-cover' />}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <h2 className='font-semibold truncate' style={{ color: 'var(--color-text)' }}>{team.name}</h2>
                      {isTeamOwner && (team.ownerId?._id === user?.id || team.ownerId === user?.id) && (
                        <span className='text-xs px-2 py-0.5 rounded-full flex-shrink-0' style={{ backgroundColor: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>My Team</span>
                      )}
                    </div>
                    <p className='text-xs' style={{ color: 'var(--color-text-subtle)' }}>{team.shortName}</p>
                  </div>
                </div>
                <div className='space-y-1 text-sm mb-4'>
                  <div className='flex justify-between'>
                    <span style={{ color: 'var(--color-text-muted)' }}>Purse</span>
                    <span className='font-medium' style={{ color: 'var(--color-accent)' }}>{formatShort(team.remainingPurse, symbol, unit)} <span style={{ color: 'var(--color-text-subtle)' }}>({pct}%)</span></span>
                  </div>
                  <div className='flex justify-between'>
                    <span style={{ color: 'var(--color-text-muted)' }}>Players</span>
                    <span style={{ color: 'var(--color-text)' }}>{team.players?.length || 0}</span>
                  </div>
                </div>
                {/* Purse bar */}
                <div className='h-1.5 rounded-full mb-4' style={{ backgroundColor: 'var(--color-border)' }}>
                  <div className='h-1.5 rounded-full transition-all' style={{ width: `${pct}%`, backgroundColor: team.colorHex }} />
                </div>
                <div className='flex gap-2 flex-wrap'>
                  <Button size='sm' variant='ghost' onClick={() => setSquadTeam(team)}>View Squad</Button>
                  {isAdmin && (
                    <>
                      <Button size='sm' variant='ghost' onClick={() => { setEditing(team); setShowForm(true); }}>Edit</Button>
                      <Button size='sm' variant='danger' onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(team._id); }}>Delete</Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Edit Team' : isTeamOwner ? 'Create My Team' : 'Add Team'}>
        <TeamForm
          auction={auction}
          team={editing}
          isAdmin={isAdmin}
          onSave={editing ? updateMutation.mutateAsync : createMutation.mutateAsync}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      </Modal>

      <SquadModal
        open={!!squadTeam}
        onClose={() => setSquadTeam(null)}
        auctionId={auctionId}
        team={squadTeam}
        auction={auction}
      />
    </div>
  );
};

export default TeamsPage;
