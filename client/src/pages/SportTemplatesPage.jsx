import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSportTemplates, createSportTemplate, updateSportTemplate,
  deleteSportTemplate, cloneSportTemplate,
} from '../services/sportTemplateService';
import { useToast } from '../context/ToastContext';
import useRoleGuard from '../hooks/useRoleGuard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

const Field = ({ label, hint, children }) => (
  <div>
    <label className='block text-gray-400 text-sm mb-1.5'>{label}</label>
    {children}
    {hint && <p className='text-gray-600 text-xs mt-1'>{hint}</p>}
  </div>
);

const BidTierBuilder = ({ tiers, onChange }) => {
  const update = (i, key, val) => onChange(tiers.map((t, idx) => idx === i ? { ...t, [key]: Number(val) } : t));
  const add = () => onChange([...tiers, { upToAmount: 999999999, increment: 10 }]);
  const remove = (i) => onChange(tiers.filter((_, idx) => idx !== i));

  return (
    <div className='space-y-2'>
      {tiers.map((tier, i) => (
        <div key={i} className='flex gap-2 items-center'>
          <div className='flex-1'>
            <label className='text-gray-500 text-xs'>Up to amount</label>
            <input
              type='number'
              className={inputCls}
              value={tier.upToAmount === 999999999 ? '' : tier.upToAmount}
              placeholder='∞'
              onChange={(e) => update(i, 'upToAmount', e.target.value || 999999999)}
            />
          </div>
          <div className='flex-1'>
            <label className='text-gray-500 text-xs'>Increment</label>
            <input type='number' className={inputCls} value={tier.increment} onChange={(e) => update(i, 'increment', e.target.value)} />
          </div>
          {tiers.length > 1 && (
            <button onClick={() => remove(i)} className='text-red-400 hover:text-red-300 mt-4 px-2'>×</button>
          )}
        </div>
      ))}
      <Button size='sm' variant='ghost' type='button' onClick={add}>+ Add Tier</Button>
    </div>
  );
};

const BLANK_FORM = {
  name: '', sport: '', icon: '🎮', description: '',
  playerRoles: '',
  currency: 'INR', currencySymbol: '₹', currencyUnit: 'lakh',
  defaultPursePerTeam: 1000,
  minSquadSize: 10, maxSquadSize: 20,
  maxOverseasPlayers: 0, minMalePlayers: 0, minFemalePlayers: 0,
  bidIncrementTiers: [{ upToAmount: 999999999, increment: 10 }],
  rtmEnabled: false, rtmCardsPerTeam: 1,
};

const templateToForm = (t) => ({
  ...t,
  playerRoles: (t.playerRoles || []).join(', '),
});

const formToPayload = (f) => ({
  ...f,
  playerRoles: f.playerRoles.split(',').map((r) => r.trim()).filter(Boolean),
  defaultPursePerTeam: Number(f.defaultPursePerTeam),
  minSquadSize: Number(f.minSquadSize),
  maxSquadSize: Number(f.maxSquadSize),
  maxOverseasPlayers: Number(f.maxOverseasPlayers),
  minMalePlayers: Number(f.minMalePlayers),
  minFemalePlayers: Number(f.minFemalePlayers),
  rtmCardsPerTeam: Number(f.rtmCardsPerTeam),
});

const TemplateForm = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial || BLANK_FORM);
  const [loading, setLoading] = useState(false);
  const handle = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formToPayload(form));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-5'>
      {/* Identity */}
      <div className='grid grid-cols-3 gap-3'>
        <Field label='Icon (emoji)'>
          <input className={inputCls} value={form.icon} onChange={(e) => handle('icon', e.target.value)} maxLength={4} />
        </Field>
        <Field label='Sport Name *'>
          <input required className={inputCls} value={form.name} onChange={(e) => handle('name', e.target.value)} placeholder='e.g. Basketball' />
        </Field>
        <Field label='Sport Slug *' hint='Lowercase, no spaces'>
          <input
            required
            className={inputCls}
            value={form.sport}
            onChange={(e) => handle('sport', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            placeholder='e.g. basketball'
          />
        </Field>
      </div>
      <Field label='Description'>
        <input className={inputCls} value={form.description} onChange={(e) => handle('description', e.target.value)} placeholder='Short description shown in the auction creation dropdown' />
      </Field>

      {/* Players */}
      <div className='border-t border-gray-800 pt-4'>
        <p className='text-gray-500 text-xs uppercase tracking-widest mb-3'>Players &amp; Squad</p>
        <Field label='Player Roles (comma-separated)' hint='e.g. Batsman, Bowler, All-Rounder'>
          <input className={inputCls} value={form.playerRoles} onChange={(e) => handle('playerRoles', e.target.value)} />
        </Field>
        <div className='grid grid-cols-3 gap-3 mt-3'>
          <Field label='Min Squad'>
            <input type='number' min='1' className={inputCls} value={form.minSquadSize} onChange={(e) => handle('minSquadSize', e.target.value)} />
          </Field>
          <Field label='Max Squad'>
            <input type='number' min='1' className={inputCls} value={form.maxSquadSize} onChange={(e) => handle('maxSquadSize', e.target.value)} />
          </Field>
          <Field label='Max Overseas' hint='0 = off'>
            <input type='number' min='0' className={inputCls} value={form.maxOverseasPlayers} onChange={(e) => handle('maxOverseasPlayers', e.target.value)} />
          </Field>
          <Field label='Min Male' hint='0 = off'>
            <input type='number' min='0' className={inputCls} value={form.minMalePlayers} onChange={(e) => handle('minMalePlayers', e.target.value)} />
          </Field>
          <Field label='Min Female' hint='0 = off'>
            <input type='number' min='0' className={inputCls} value={form.minFemalePlayers} onChange={(e) => handle('minFemalePlayers', e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Currency */}
      <div className='border-t border-gray-800 pt-4'>
        <p className='text-gray-500 text-xs uppercase tracking-widest mb-3'>Currency &amp; Purse</p>
        <div className='grid grid-cols-3 gap-3'>
          <Field label='Code'><input className={inputCls} value={form.currency} onChange={(e) => handle('currency', e.target.value)} /></Field>
          <Field label='Symbol'><input className={inputCls} value={form.currencySymbol} onChange={(e) => handle('currencySymbol', e.target.value)} /></Field>
          <Field label='Unit'><input className={inputCls} value={form.currencyUnit} onChange={(e) => handle('currencyUnit', e.target.value)} /></Field>
        </div>
        <div className='mt-3'>
          <Field label={`Default Purse per Team (${form.currencyUnit})`}>
            <input type='number' min='1' className={inputCls} value={form.defaultPursePerTeam} onChange={(e) => handle('defaultPursePerTeam', e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Bid increments */}
      <div className='border-t border-gray-800 pt-4'>
        <p className='text-gray-500 text-xs uppercase tracking-widest mb-3'>Bid Increment Tiers</p>
        <BidTierBuilder tiers={form.bidIncrementTiers} onChange={(tiers) => handle('bidIncrementTiers', tiers)} />
      </div>

      {/* RTM */}
      <div className='border-t border-gray-800 pt-4'>
        <div className='flex items-center gap-3 mb-3'>
          <input type='checkbox' id='rtm' checked={form.rtmEnabled} onChange={(e) => handle('rtmEnabled', e.target.checked)} className='h-4 w-4 rounded' />
          <label htmlFor='rtm' className='text-gray-300 text-sm'>Enable RTM cards by default</label>
        </div>
        {form.rtmEnabled && (
          <Field label='RTM Cards per Team'>
            <input type='number' min='1' max='5' className={inputCls} value={form.rtmCardsPerTeam} onChange={(e) => handle('rtmCardsPerTeam', e.target.value)} />
          </Field>
        )}
      </div>

      <div className='flex gap-3 justify-end border-t border-gray-800 pt-4'>
        <Button variant='ghost' onClick={onClose} type='button'>Cancel</Button>
        <Button type='submit' loading={loading}>{initial ? 'Save Changes' : 'Create Template'}</Button>
      </div>
    </form>
  );
};

const SportTemplatesPage = () => {
  useRoleGuard('admin');
  const { addToast } = useToast();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['sport-templates'],
    queryFn: listSportTemplates,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['sport-templates'] });

  const createMutation = useMutation({
    mutationFn: createSportTemplate,
    onSuccess: () => { invalidate(); addToast('Template created', 'success'); },
    onError: (e) => addToast(e.response?.data?.message || 'Failed', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateSportTemplate(editing._id, data),
    onSuccess: () => { invalidate(); addToast('Template updated', 'success'); setEditing(null); },
    onError: (e) => addToast(e.response?.data?.message || 'Failed', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSportTemplate,
    onSuccess: () => { invalidate(); addToast('Template deleted', 'info'); },
    onError: (e) => addToast(e.response?.data?.message || 'Failed to delete — built-in templates are protected', 'error'),
  });

  const cloneMutation = useMutation({
    mutationFn: cloneSportTemplate,
    onSuccess: () => { invalidate(); addToast('Template cloned — edit it to customise', 'success'); },
    onError: (e) => addToast(e.response?.data?.message || 'Failed', 'error'),
  });

  if (isLoading) return <div className='flex justify-center h-64 items-center'><Spinner size='lg' /></div>;

  return (
    <div className='animate-fade-in max-w-3xl'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-white'>Sport Templates</h1>
          <p className='text-gray-400 text-sm mt-0.5'>Define default configs for each sport. Applied when a new auction is created.</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>+ New Template</Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState icon='🎮' title='No sport templates' description='Create a template to define default config for a sport.' action={<Button onClick={() => setShowForm(true)}>Create Template</Button>} />
      ) : (
        <div className='space-y-3'>
          {templates.map((t) => (
            <div key={t._id} className='bg-gray-900 border border-gray-800 rounded-2xl p-5'>
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center gap-3'>
                  <span className='text-3xl'>{t.icon}</span>
                  <div>
                    <div className='flex items-center gap-2'>
                      <h2 className='text-white font-semibold'>{t.name}</h2>
                      {t.isSeeded && <Badge variant='indigo'>Built-in</Badge>}
                    </div>
                    <p className='text-gray-500 text-xs mt-0.5'>{t.description}</p>
                  </div>
                </div>
                <div className='flex gap-2'>
                  <Button size='sm' variant='ghost' onClick={() => { setEditing(t); setShowForm(true); }}>Edit</Button>
                  <Button size='sm' variant='ghost' onClick={() => cloneMutation.mutate(t._id)}>Clone</Button>
                  {!t.isSeeded && (
                    <Button size='sm' variant='danger' onClick={() => { if (confirm(`Delete "${t.name}" template?`)) deleteMutation.mutate(t._id); }}>Delete</Button>
                  )}
                </div>
              </div>

              {/* Config summary */}
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
                <div className='bg-gray-800 rounded-lg px-3 py-2'>
                  <p className='text-gray-500 mb-0.5'>Purse</p>
                  <p className='text-white font-medium'>{t.currencySymbol}{t.defaultPursePerTeam} {t.currencyUnit}</p>
                </div>
                <div className='bg-gray-800 rounded-lg px-3 py-2'>
                  <p className='text-gray-500 mb-0.5'>Squad</p>
                  <p className='text-white font-medium'>{t.minSquadSize}–{t.maxSquadSize}</p>
                </div>
                <div className='bg-gray-800 rounded-lg px-3 py-2'>
                  <p className='text-gray-500 mb-0.5'>Roles</p>
                  <p className='text-white font-medium truncate'>{(t.playerRoles || []).join(', ') || '—'}</p>
                </div>
                <div className='bg-gray-800 rounded-lg px-3 py-2'>
                  <p className='text-gray-500 mb-0.5'>Bid tiers</p>
                  <p className='text-white font-medium'>{t.bidIncrementTiers?.length} tier{t.bidIncrementTiers?.length !== 1 ? 's' : ''}</p>
                </div>
                {t.maxOverseasPlayers > 0 && (
                  <div className='bg-gray-800 rounded-lg px-3 py-2'>
                    <p className='text-gray-500 mb-0.5'>Overseas cap</p>
                    <p className='text-white font-medium'>{t.maxOverseasPlayers}</p>
                  </div>
                )}
                {t.minMalePlayers > 0 && (
                  <div className='bg-gray-800 rounded-lg px-3 py-2'>
                    <p className='text-gray-500 mb-0.5'>Min male</p>
                    <p className='text-white font-medium'>{t.minMalePlayers}</p>
                  </div>
                )}
                {t.minFemalePlayers > 0 && (
                  <div className='bg-gray-800 rounded-lg px-3 py-2'>
                    <p className='text-gray-500 mb-0.5'>Min female</p>
                    <p className='text-white font-medium'>{t.minFemalePlayers}</p>
                  </div>
                )}
                {t.rtmEnabled && (
                  <div className='bg-gray-800 rounded-lg px-3 py-2'>
                    <p className='text-gray-500 mb-0.5'>RTM cards</p>
                    <p className='text-white font-medium'>{t.rtmCardsPerTeam}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? `Edit — ${editing.name}` : 'New Sport Template'}
        size='xl'
      >
        <TemplateForm
          initial={editing ? templateToForm(editing) : null}
          onSave={editing ? updateMutation.mutateAsync : createMutation.mutateAsync}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      </Modal>
    </div>
  );
};

export default SportTemplatesPage;
