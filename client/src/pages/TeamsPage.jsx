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

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-gray-400 text-sm mb-1.5'>Team Name *</label>
          <input required className={inputCls} value={form.name} onChange={(e) => handle('name', e.target.value)} placeholder='e.g. Mumbai Indians' />
        </div>
        <div>
          <label className='block text-gray-400 text-sm mb-1.5'>Short Name (max 5) *</label>
          <input required maxLength={5} className={inputCls} value={form.shortName} onChange={(e) => handle('shortName', e.target.value)} placeholder='e.g. MI' />
        </div>
        <div>
          <label className='block text-gray-400 text-sm mb-1.5'>Team Color</label>
          <input type='color' className='h-10 w-full rounded-lg border border-gray-700 bg-gray-800 cursor-pointer' value={form.colorHex} onChange={(e) => handle('colorHex', e.target.value)} />
        </div>
        {isAdmin && (
          <div>
            <label className='block text-gray-400 text-sm mb-1.5'>Assign Owner</label>
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
              <p className='text-gray-500 text-xs mt-1'>No approved team owners yet. Approve owners from the Approvals page.</p>
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
            <div className='bg-gray-800 rounded-lg p-3'>
              <div className='text-gray-400 text-xs'>Remaining Purse</div>
              <div className='text-indigo-400 font-bold'>{formatCurrency(squadTeam?.remainingPurse, symbol, unit)}</div>
            </div>
            <div className='bg-gray-800 rounded-lg p-3'>
              <div className='text-gray-400 text-xs'>Players</div>
              <div className='text-white font-bold'>{squadTeam?.players?.length || 0}</div>
            </div>
            <div className='bg-gray-800 rounded-lg p-3'>
              <div className='text-gray-400 text-xs'>RTM Cards</div>
              <div className='text-white font-bold'>{squadTeam?.rtmCardsRemaining || 0}</div>
            </div>
          </div>
          <div className='space-y-2 max-h-80 overflow-y-auto'>
            {(squadTeam?.players || []).map((sp) => (
              <div key={sp.playerId?._id} className='flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5'>
                <div>
                  <p className='text-white text-sm font-medium'>{sp.playerId?.name}</p>
                  <p className='text-gray-400 text-xs'>{sp.playerId?.role} {sp.acquiredViaRtm ? '· RTM' : ''}</p>
                </div>
                <span className='text-indigo-400 font-semibold text-sm'>{formatCurrency(sp.pricePaid, symbol, unit)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
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
          <h1 className='text-2xl font-bold text-white'>Teams</h1>
          <p className='text-gray-400 text-sm'>{teams.length} teams</p>
        </div>
        {isAdmin && <Button onClick={() => setShowForm(true)}>+ Add Team</Button>}
        {isTeamOwner && !user?.teamId && (
          <Button onClick={() => setShowForm(true)}>+ Create My Team</Button>
        )}
      </div>

      {teams.length === 0 ? (
        <EmptyState
          icon='🛡️'
          title='No teams yet'
          description={isAdmin ? 'Add teams to the auction.' : isTeamOwner && !user?.teamId ? 'Create your team to join the auction.' : 'No teams have been added yet.'}
          action={(isAdmin || (isTeamOwner && !user?.teamId)) && <Button onClick={() => setShowForm(true)}>{isAdmin ? 'Add Team' : 'Create My Team'}</Button>}
        />
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {teams.map((team) => {
            const pct = Math.round((team.remainingPurse / team.initialPurse) * 100);
            return (
              <div key={team._id} className='bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors' style={{ borderTopColor: team.colorHex, borderTopWidth: 3 }}>
                <div className='flex items-center gap-3 mb-3'>
                  {team.logoUrl && <img src={team.logoUrl} alt='' className='h-8 w-8 rounded-full object-cover' />}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <h2 className='text-white font-semibold truncate'>{team.name}</h2>
                      {isTeamOwner && user?.teamId?.toString() === team._id && (
                        <span className='text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full flex-shrink-0'>My Team</span>
                      )}
                    </div>
                    <p className='text-gray-500 text-xs'>{team.shortName}</p>
                  </div>
                </div>
                <div className='space-y-1 text-sm mb-4'>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Purse</span>
                    <span className='text-indigo-400 font-medium'>{formatShort(team.remainingPurse, symbol, unit)} <span className='text-gray-600'>({pct}%)</span></span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Players</span>
                    <span className='text-white'>{team.players?.length || 0}</span>
                  </div>
                </div>
                {/* Purse bar */}
                <div className='h-1.5 bg-gray-700 rounded-full mb-4'>
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
