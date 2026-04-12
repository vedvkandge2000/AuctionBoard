import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuction, updateAuctionConfig } from '../services/auctionService';
import { useToast } from '../context/ToastContext';
import useRoleGuard from '../hooks/useRoleGuard';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { listSportTemplates } from '../services/sportTemplateService';

const Section = ({ title, children }) => (
  <div className='bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4'>
    <h2 className='text-white font-semibold border-b border-gray-800 pb-3'>{title}</h2>
    {children}
  </div>
);

const Field = ({ label, hint, children }) => (
  <div>
    <label className='block text-gray-400 text-sm mb-1.5'>{label}</label>
    {children}
    {hint && <p className='text-gray-600 text-xs mt-1'>{hint}</p>}
  </div>
);

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

const BidTierBuilder = ({ tiers, onChange }) => {
  const update = (i, key, val) => {
    const next = tiers.map((t, idx) => idx === i ? { ...t, [key]: Number(val) } : t);
    onChange(next);
  };
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

const AuctionConfigPage = () => {
  useRoleGuard('admin');
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const qc = useQueryClient();

  const { data: auction, isLoading } = useQuery({ queryKey: ['auction', id], queryFn: () => getAuction(id) });
  const { data: templates = [] } = useQuery({ queryKey: ['sport-templates'], queryFn: listSportTemplates });
  const templateMap = Object.fromEntries(templates.map((t) => [t.sport, t]));
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (auction && !form) {
      setForm({
        name: auction.name,
        sport: auction.sport,
        currency: auction.currency,
        currencySymbol: auction.currencySymbol,
        currencyUnit: auction.currencyUnit,
        defaultPursePerTeam: auction.defaultPursePerTeam,
        minSquadSize: auction.minSquadSize,
        maxSquadSize: auction.maxSquadSize,
        maxOverseasPlayers: auction.maxOverseasPlayers,
        minMalePlayers: auction.minMalePlayers ?? 0,
        minFemalePlayers: auction.minFemalePlayers ?? 0,
        rtmEnabled: auction.rtmEnabled,
        rtmCardsPerTeam: auction.rtmCardsPerTeam,
        playerRoles: (auction.playerRoles || []).join(', '),
        bidIncrementTiers: auction.bidIncrementTiers,
      });
    }
  }, [auction]);

  const mutation = useMutation({
    mutationFn: (payload) => updateAuctionConfig(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction', id] });
      addToast('Config saved!', 'success');
    },
    onError: (e) => addToast(e.response?.data?.message || 'Failed to save', 'error'),
  });

  const handle = (k, v) => setForm({ ...form, [k]: v });

  const applyPreset = () => {
    const template = templateMap[form.sport];
    if (!template) return;
    const { _id, isSeeded, createdAt, updatedAt, __v, name: tName, description, icon, sport, ...config } = template;
    setForm((f) => ({
      ...f,
      ...config,
      playerRoles: (config.playerRoles || []).join(', '),
    }));
    addToast(`Applied ${tName} template defaults`, 'success');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      playerRoles: form.playerRoles.split(',').map((r) => r.trim()).filter(Boolean),
      defaultPursePerTeam: Number(form.defaultPursePerTeam),
      minSquadSize: Number(form.minSquadSize),
      maxSquadSize: Number(form.maxSquadSize),
      maxOverseasPlayers: Number(form.maxOverseasPlayers),
      minMalePlayers: Number(form.minMalePlayers),
      minFemalePlayers: Number(form.minFemalePlayers),
      rtmCardsPerTeam: Number(form.rtmCardsPerTeam),
    });
  };

  if (isLoading || !form) return <div className='flex justify-center h-64 items-center'><Spinner size='lg' /></div>;

  if (auction?.status !== 'draft') {
    return (
      <div className='text-center py-16 text-gray-400'>
        <p className='text-4xl mb-4'>🔒</p>
        <p>Config can only be edited while auction is in <strong className='text-white'>draft</strong> status.</p>
        <Button className='mt-4' onClick={() => navigate(`/auction/${id}`)}>Back to Auction</Button>
      </div>
    );
  }

  return (
    <div className='animate-fade-in max-w-2xl'>
      <div className='mb-5'>
        <h1 className='text-2xl font-bold text-white'>Auction Config</h1>
        <p className='text-gray-400 text-sm mt-0.5'>{auction.name}</p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-5'>
        <Section title='Basic Info'>
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Auction Name'><input className={inputCls} value={form.name} onChange={(e) => handle('name', e.target.value)} /></Field>
            <Field label='Sport'>
              <div className='flex gap-2'>
                <select className={inputCls} value={form.sport} onChange={(e) => handle('sport', e.target.value)}>
                  {templates.map((t) => (
                    <option key={t.sport} value={t.sport}>{t.icon} {t.name}</option>
                  ))}
                  {!templateMap[form.sport] && <option value={form.sport}>{form.sport}</option>}
                </select>
                {templateMap[form.sport] && (
                  <Button type='button' variant='ghost' size='sm' onClick={applyPreset} title='Reset all fields to sport defaults'>
                    Reset
                  </Button>
                )}
              </div>
            </Field>
          </div>
          <Field label='Player Roles (comma-separated)' hint='e.g. Batsman, Bowler, All-Rounder, Wicket-Keeper'>
            <input className={inputCls} value={form.playerRoles} onChange={(e) => handle('playerRoles', e.target.value)} />
          </Field>
        </Section>

        <Section title='Currency'>
          <div className='grid grid-cols-3 gap-4'>
            <Field label='Code (e.g. INR)'><input className={inputCls} value={form.currency} onChange={(e) => handle('currency', e.target.value)} /></Field>
            <Field label='Symbol (e.g. ₹)'><input className={inputCls} value={form.currencySymbol} onChange={(e) => handle('currencySymbol', e.target.value)} /></Field>
            <Field label='Unit (e.g. lakh)'><input className={inputCls} value={form.currencyUnit} onChange={(e) => handle('currencyUnit', e.target.value)} /></Field>
          </div>
          <Field label={`Default Purse per Team (in ${form.currencyUnit})`}>
            <input type='number' min='1' className={inputCls} value={form.defaultPursePerTeam} onChange={(e) => handle('defaultPursePerTeam', e.target.value)} />
          </Field>
        </Section>

        <Section title='Squad Rules'>
          <div className='grid grid-cols-3 gap-4'>
            <Field label='Min Squad Size'><input type='number' min='1' className={inputCls} value={form.minSquadSize} onChange={(e) => handle('minSquadSize', e.target.value)} /></Field>
            <Field label='Max Squad Size'><input type='number' min='1' className={inputCls} value={form.maxSquadSize} onChange={(e) => handle('maxSquadSize', e.target.value)} /></Field>
            <Field label='Max Overseas Players' hint='0 = unlimited'><input type='number' min='0' className={inputCls} value={form.maxOverseasPlayers} onChange={(e) => handle('maxOverseasPlayers', e.target.value)} /></Field>
            <Field label='Min Male Players' hint='0 = not enforced'><input type='number' min='0' className={inputCls} value={form.minMalePlayers} onChange={(e) => handle('minMalePlayers', e.target.value)} /></Field>
            <Field label='Min Female Players' hint='0 = not enforced'><input type='number' min='0' className={inputCls} value={form.minFemalePlayers} onChange={(e) => handle('minFemalePlayers', e.target.value)} /></Field>
          </div>
        </Section>

        <Section title={`Bid Increment Tiers (${form.currencyUnit}s)`}>
          <p className='text-gray-500 text-xs'>Define increment rules by bid range. Last row's "up to" is treated as infinity.</p>
          <BidTierBuilder tiers={form.bidIncrementTiers} onChange={(tiers) => handle('bidIncrementTiers', tiers)} />
        </Section>

        <Section title='RTM Cards'>
          <div className='flex items-center gap-3'>
            <input type='checkbox' id='rtm' checked={form.rtmEnabled} onChange={(e) => handle('rtmEnabled', e.target.checked)} className='h-4 w-4 rounded text-indigo-600' />
            <label htmlFor='rtm' className='text-gray-300 text-sm'>Enable RTM (Right to Match) cards</label>
          </div>
          {form.rtmEnabled && (
            <Field label='RTM Cards per Team'>
              <input type='number' min='1' max='5' className={inputCls} value={form.rtmCardsPerTeam} onChange={(e) => handle('rtmCardsPerTeam', e.target.value)} />
            </Field>
          )}
        </Section>

        <div className='flex gap-3'>
          <Button type='submit' loading={mutation.isPending} size='lg'>Save Config</Button>
          <Button variant='ghost' type='button' onClick={() => navigate(`/auction/${id}`)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default AuctionConfigPage;
