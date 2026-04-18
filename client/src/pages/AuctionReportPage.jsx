import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, CartesianGrid, Legend,
} from 'recharts';
import { getAuctionReport, getReportRecipients, shareReport } from '../services/auctionService';
import { formatCurrency } from '../utils/formatCurrency';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---- Share via Email Modal ----
const ShareReportModal = ({ open, onClose, auctionId, auctionName }) => {
  const { addToast } = useToast();
  const [recipients, setRecipients] = useState([]); // [{ teamId, teamName, email, selected }]
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getReportRecipients(auctionId)
      .then((list) => {
        setRecipients(list.map((r) => ({
          teamId: r.teamId,
          teamName: r.teamName,
          email: r.ownerEmail || '',
          selected: !!r.ownerEmail, // pre-check teams that already have owner email
        })));
      })
      .catch((err) => addToast(err.response?.data?.message || 'Failed to load teams', 'error'))
      .finally(() => setLoading(false));
  }, [open, auctionId, addToast]);

  const update = (teamId, patch) => {
    setRecipients((prev) => prev.map((r) => (r.teamId === teamId ? { ...r, ...patch } : r)));
  };

  const toggleAll = (selected) => {
    setRecipients((prev) => prev.map((r) => ({ ...r, selected: selected && !!r.email })));
  };

  const handleSend = async () => {
    const picks = recipients.filter((r) => r.selected);
    if (picks.length === 0) { addToast('Select at least one team', 'warning'); return; }
    const invalid = picks.find((r) => !EMAIL_REGEX.test(r.email.trim()));
    if (invalid) { addToast(`Invalid email for ${invalid.teamName}`, 'error'); return; }

    setSending(true);
    try {
      const result = await shareReport(auctionId, picks.map((r) => ({ teamId: r.teamId, email: r.email.trim() })));
      const sent = result.sent?.length || 0;
      const failed = result.failed?.length || 0;
      if (failed > 0) {
        const first = result.failed[0];
        addToast(
          `Sent ${sent} — ${failed} failed. ${first.teamName || ''}: ${first.reason}`,
          sent > 0 ? 'warning' : 'error'
        );
      } else {
        addToast(`Report sent to ${sent} team(s)`, 'success');
        onClose();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send', 'error');
    } finally {
      setSending(false);
    }
  };

  const allSelected = recipients.length > 0 && recipients.every((r) => r.selected);
  const someSelected = recipients.some((r) => r.selected);

  return (
    <Modal open={open} onClose={onClose} title={`Share "${auctionName}" Report`} size='lg'>
      {loading ? (
        <div className='flex justify-center py-8'><Spinner /></div>
      ) : (
        <>
          <p className='text-sm mb-4' style={{ color: 'var(--color-text-muted)' }}>
            An email with the full report and each team's squad will be sent. Missing emails can be entered below.
          </p>

          <div className='flex items-center justify-between mb-3 pb-2' style={{ borderBottom: '1px solid var(--color-border)' }}>
            <label className='inline-flex items-center gap-2 text-xs' style={{ color: 'var(--color-text-muted)' }}>
              <input
                type='checkbox'
                checked={allSelected}
                onChange={(e) => toggleAll(e.target.checked)}
              />
              Select all (with email)
            </label>
            <span className='text-xs' style={{ color: 'var(--color-text-subtle)' }}>
              {recipients.filter((r) => r.selected).length} selected
            </span>
          </div>

          <div className='space-y-2 max-h-[50vh] overflow-y-auto pr-1'>
            {recipients.map((r) => (
              <div
                key={r.teamId}
                className='flex items-center gap-3 p-2 rounded-lg'
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <input
                  type='checkbox'
                  checked={r.selected}
                  onChange={(e) => update(r.teamId, { selected: e.target.checked })}
                />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium truncate' style={{ color: 'var(--color-text)' }}>{r.teamName}</p>
                </div>
                <input
                  type='email'
                  placeholder='owner@example.com'
                  value={r.email}
                  onChange={(e) => update(r.teamId, { email: e.target.value })}
                  className='rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]'
                  style={{ backgroundColor: 'var(--color-surface-2, #0f172a)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            ))}
            {recipients.length === 0 && (
              <p className='text-sm text-center py-4' style={{ color: 'var(--color-text-subtle)' }}>No teams to share with.</p>
            )}
          </div>

          <div className='flex gap-3 justify-end pt-4 mt-4' style={{ borderTop: '1px solid var(--color-border)' }}>
            <Button variant='ghost' onClick={onClose} type='button'>Cancel</Button>
            <Button onClick={handleSend} loading={sending} disabled={!someSelected}>
              <Mail size={14} /> Send Report
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const COLORS = {
  indigo: '#6366f1',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
  gray: '#6b7280',
  blue: '#3b82f6',
  orange: '#f97316',
  pink: '#ec4899',
  teal: '#14b8a6',
  purple: '#a855f7',
};

const ROLE_COLORS = [
  '#6366f1', '#22c55e', '#ef4444', '#eab308',
  '#3b82f6', '#f97316', '#ec4899', '#14b8a6', '#a855f7',
];

const tooltipStyle = {
  contentStyle: { backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#d1d5db' },
  itemStyle: { color: '#e5e7eb' },
};

const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl p-5 ${className}`} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <h3 className='font-semibold text-sm mb-4 pb-3' style={{ color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}>{children}</h3>
);

const StatCard = ({ label, value, sub, color }) => (
  <div className='rounded-2xl p-4' style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
    <p className='text-xs mb-1' style={{ color: 'var(--color-text-subtle)' }}>{label}</p>
    <p className='text-2xl font-bold' style={{ color: color || 'var(--color-text)' }}>{value}</p>
    {sub && <p className='text-xs mt-1' style={{ color: 'var(--color-text-subtle)' }}>{sub}</p>}
  </div>
);

// ---- Overview Tab ----
const OverviewTab = ({ summary, categoryBreakdown, roleBreakdown, sym, unit }) => {
  const chartColors = {
    primary: getVar('--color-accent') || '#6366f1',
    success: getVar('--color-success') || '#22c55e',
    danger: getVar('--color-danger') || '#ef4444',
    warning: getVar('--color-warning') || '#eab308',
  };

  const soldPct = summary.totalPlayers > 0 ? Math.round((summary.soldCount / summary.totalPlayers) * 100) : 0;
  const pieData = [
    { name: 'Sold', value: summary.soldCount },
    { name: 'Unsold', value: summary.unsoldCount },
    { name: 'In Pool', value: summary.poolCount },
  ].filter((d) => d.value > 0);
  const pieColors = [chartColors.success, chartColors.danger, COLORS.gray];

  return (
    <div className='space-y-6'>
      {/* Stat cards */}
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
        <StatCard label='Total Players' value={summary.totalPlayers} />
        <StatCard label='Sold' value={summary.soldCount} color={chartColors.success}
          sub={`${soldPct}% of pool`} />
        <StatCard label='Unsold' value={summary.unsoldCount} color={chartColors.danger} />
        <StatCard label='Total Spent'
          value={formatCurrency(summary.totalSpent, sym, unit)}
          color={chartColors.primary} />
        <StatCard label='Avg Price'
          value={summary.avgPrice ? formatCurrency(summary.avgPrice, sym, unit) : '—'} />
        <StatCard label='Highest Bid'
          value={summary.maxPrice ? formatCurrency(summary.maxPrice, sym, unit) : '—'}
          color={chartColors.warning} />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Sold vs Unsold pie */}
        <Card>
          <CardTitle>Player Outcomes</CardTitle>
          <ResponsiveContainer width='100%' height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx='50%' cy='50%'
                innerRadius={55} outerRadius={85}
                paddingAngle={3}
                dataKey='value'
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <Card>
            <CardTitle>Players by Category</CardTitle>
            <ResponsiveContainer width='100%' height={220}>
              <BarChart data={categoryBreakdown} barCategoryGap='30%'>
                <CartesianGrid strokeDasharray='3 3' stroke='#1f2937' vertical={false} />
                <XAxis dataKey='category' tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <Bar dataKey='sold' name='Sold' fill={chartColors.success} radius={[4, 4, 0, 0]} />
                <Bar dataKey='unsold' name='Unsold' fill={chartColors.danger} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Role breakdown */}
      {roleBreakdown.length > 0 && (
        <Card>
          <CardTitle>Players by Role</CardTitle>
          <ResponsiveContainer width='100%' height={200}>
            <BarChart data={roleBreakdown} barCategoryGap='30%'>
              <CartesianGrid strokeDasharray='3 3' stroke='#1f2937' vertical={false} />
              <XAxis dataKey='role' tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Bar dataKey='sold' name='Sold' fill={chartColors.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey='unsold' name='Unsold' fill={COLORS.gray} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
};

// ---- Team PDF/Print report generator ----
const generateTeamReport = (team, auction, sym, unit) => {
  const fmt = (v) => formatCurrency(v, sym, unit);
  const pct = team.initialPurse > 0 ? Math.round((team.totalSpent / team.initialPurse) * 100) : 0;
  const sorted = team.players.slice().sort((a, b) => b.finalPrice - a.finalPrice);
  const hasBase = sorted.some((p) => p.basePrice > 0);
  const hasCategory = sorted.some((p) => p.category);
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const rows = sorted.map((p, i) => {
    const premium = hasBase && p.basePrice > 0
      ? Math.round(((p.finalPrice - p.basePrice) / p.basePrice) * 100)
      : null;
    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${p.name || '—'}</strong></td>
        <td>${p.role || '—'}</td>
        ${hasCategory ? `<td>${p.category || '—'}</td>` : ''}
        <td>${p.nationality === 'overseas' ? 'Overseas' : 'Domestic'}</td>
        ${hasBase ? `<td>${p.basePrice ? fmt(p.basePrice) : '—'}</td>` : ''}
        <td class="price">${fmt(p.finalPrice)}</td>
        ${hasBase ? `<td class="${premium > 0 ? 'premium-up' : premium < 0 ? 'premium-down' : ''}">${premium !== null ? (premium > 0 ? `+${premium}%` : `${premium}%`) : '—'}</td>` : ''}
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${team.name} — Squad Report · ${auction.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #fff; padding: 32px; font-size: 13px; }
  .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; border-bottom: 3px solid ${team.colorHex || '#6366f1'}; padding-bottom: 16px; }
  .team-name { font-size: 26px; font-weight: 800; color: ${team.colorHex || '#6366f1'}; }
  .auction-name { font-size: 13px; color: #555; margin-top: 3px; }
  .meta { text-align: right; font-size: 12px; color: #777; line-height: 1.6; }
  .summary { display: flex; gap: 12px; margin-bottom: 28px; }
  .stat { flex: 1; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; }
  .stat-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .stat-value { font-size: 18px; font-weight: 700; color: #111; }
  .stat-value.green { color: #16a34a; }
  .stat-value.indigo { color: #4f46e5; }
  .stat-bar { margin-top: 8px; height: 5px; background: #e5e7eb; border-radius: 99px; overflow: hidden; }
  .stat-bar-fill { height: 100%; background: ${team.colorHex || '#6366f1'}; border-radius: 99px; width: ${pct}%; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: ${team.colorHex || '#6366f1'}; color: #fff; }
  thead th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tbody tr:hover { background: #f0f4ff; }
  td { padding: 9px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
  .price { font-weight: 700; color: #16a34a; }
  .premium-up { color: #d97706; font-weight: 600; }
  .premium-down { color: #dc2626; font-weight: 600; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #444; margin-bottom: 12px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #aaa; display: flex; justify-content: space-between; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none !important; }
    a { color: inherit; text-decoration: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="team-name">${team.name} <span style="font-size:16px;font-weight:500;color:#888">(${team.shortName})</span></div>
      <div class="auction-name">${auction.name} &nbsp;·&nbsp; ${auction.sport}</div>
    </div>
    <div class="meta">
      <div>Squad Report</div>
      <div>${date}</div>
      <div style="margin-top:6px">
        <button class="no-print" onclick="window.print()"
          style="background:${team.colorHex || '#6366f1'};color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">
          Print / Save PDF
        </button>
      </div>
    </div>
  </div>

  <div class="summary">
    <div class="stat">
      <div class="stat-label">Total Budget</div>
      <div class="stat-value">${fmt(team.initialPurse)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Amount Spent</div>
      <div class="stat-value indigo">${fmt(team.totalSpent)}</div>
      <div class="stat-bar"><div class="stat-bar-fill"></div></div>
    </div>
    <div class="stat">
      <div class="stat-label">Remaining</div>
      <div class="stat-value green">${fmt(team.remainingPurse)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Players Signed</div>
      <div class="stat-value">${team.playerCount}</div>
    </div>
  </div>

  <div class="section-title">Squad (${sorted.length} players · ${pct}% budget used)</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Role</th>
        ${hasCategory ? '<th>Category</th>' : ''}
        <th>Nationality</th>
        ${hasBase ? '<th>Base Price</th>' : ''}
        <th>Price Paid</th>
        ${hasBase ? '<th>Premium</th>' : ''}
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="10" style="text-align:center;color:#aaa;padding:20px;">No players signed yet</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <span>${auction.name}</span>
    <span>Generated ${date}</span>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
};

// ---- Teams Tab ----
const TeamsTab = ({ teams, sym, unit, auction }) => {
  const chartColors = {
    primary: getVar('--color-accent') || '#6366f1',
    success: getVar('--color-success') || '#22c55e',
    danger: getVar('--color-danger') || '#ef4444',
    warning: getVar('--color-warning') || '#eab308',
  };

  const chartData = teams
    .map((t) => ({
      name: t.shortName,
      Spent: t.totalSpent,
      Remaining: t.remainingPurse,
    }))
    .sort((a, b) => b.Spent - a.Spent);

  return (
    <div className='space-y-6'>
      {/* Purse chart */}
      <Card>
        <CardTitle>Purse Utilisation per Team</CardTitle>
        <ResponsiveContainer width='100%' height={220}>
          <BarChart data={chartData} barCategoryGap='30%'>
            <CartesianGrid strokeDasharray='3 3' stroke='#1f2937' vertical={false} />
            <XAxis dataKey='name' tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} formatter={(v) => formatCurrency(v, sym, unit)} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
            <Bar dataKey='Spent' fill={chartColors.primary} radius={[4, 4, 0, 0]} stackId='a' />
            <Bar dataKey='Remaining' fill={COLORS.gray} radius={[4, 4, 0, 0]} stackId='a' />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Per-team squad cards */}
      <div className='grid gap-4 sm:grid-cols-2'>
        {teams.map((team) => (
          <Card key={team._id}>
            <div className='flex items-center gap-2 mb-3'>
              <div className='w-3 h-3 rounded-full flex-shrink-0' style={{ backgroundColor: team.colorHex || '#6366f1' }} />
              <span className='font-semibold text-sm' style={{ color: 'var(--color-text)' }}>{team.name}</span>
              <span className='text-xs' style={{ color: 'var(--color-text-subtle)' }}>({team.shortName})</span>
              <div className='ml-auto flex items-center gap-2'>
                <span className='text-xs font-medium' style={{ color: 'var(--color-accent)' }}>{team.playerCount} players</span>
                <button
                  onClick={() => generateTeamReport(team, auction, sym, unit)}
                  className='text-xs px-2 py-0.5 rounded transition-colors hover:text-white'
                  style={{ color: 'var(--color-text-subtle)', border: '1px solid var(--color-border)' }}
                  title='Open printable team report'
                >
                  Download
                </button>
              </div>
            </div>

            <div className='flex gap-4 text-xs mb-3'>
              <div>
                <p style={{ color: 'var(--color-text-subtle)' }}>Spent</p>
                <p className='font-medium' style={{ color: 'var(--color-text)' }}>{formatCurrency(team.totalSpent, sym, unit)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--color-text-subtle)' }}>Remaining</p>
                <p className='font-medium' style={{ color: 'var(--color-success-text)' }}>{formatCurrency(team.remainingPurse, sym, unit)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--color-text-subtle)' }}>Budget</p>
                <p className='font-medium' style={{ color: 'var(--color-text-muted)' }}>{formatCurrency(team.initialPurse, sym, unit)}</p>
              </div>
            </div>

            {team.players.length === 0 ? (
              <p className='text-xs' style={{ color: 'var(--color-text-subtle)' }}>No players signed</p>
            ) : (
              <div className='space-y-1'>
                {team.players
                  .slice()
                  .sort((a, b) => b.finalPrice - a.finalPrice)
                  .map((p, i) => (
                    <div key={i} className='flex items-center justify-between gap-2 rounded-lg px-3 py-1.5' style={{ backgroundColor: 'var(--color-surface-sunken)' }}>
                      <div className='flex items-center gap-2 min-w-0'>
                        <span className='text-xs font-medium truncate' style={{ color: 'var(--color-text)' }}>{p.name}</span>
                        {p.category && (
                          <span className='text-xs px-1.5 py-0.5 rounded flex-shrink-0' style={{ backgroundColor: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
                            {p.category}
                          </span>
                        )}
                        {p.role && <span className='text-xs flex-shrink-0' style={{ color: 'var(--color-text-subtle)' }}>{p.role}</span>}
                      </div>
                      <span className='text-xs font-medium flex-shrink-0' style={{ color: 'var(--color-success-text)' }}>
                        {formatCurrency(p.finalPrice, sym, unit)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

// ---- Players Tab ----
const PlayersTab = ({ soldPlayers, sym, unit }) => {
  const top10 = soldPlayers.slice(0, 10);
  const hasBase = soldPlayers.some((p) => p.basePrice > 0);

  const scatterData = soldPlayers
    .filter((p) => p.basePrice > 0 && p.finalPrice > 0)
    .map((p) => ({ x: p.basePrice, y: p.finalPrice, name: p.name, role: p.role }));

  const roles = [...new Set(soldPlayers.map((p) => p.role).filter(Boolean))];

  return (
    <div className='space-y-6'>
      {/* Top 10 table */}
      <Card>
        <CardTitle>Top Players by Final Price</CardTitle>
        {top10.length === 0 ? (
          <p className='text-sm' style={{ color: 'var(--color-text-subtle)' }}>No players sold yet.</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-xs'>
              <thead>
                <tr style={{ color: 'var(--color-text-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  <th className='text-left py-2 pr-3 font-medium w-6'>#</th>
                  <th className='text-left py-2 pr-3 font-medium'>Player</th>
                  <th className='text-left py-2 pr-3 font-medium'>Team</th>
                  <th className='text-left py-2 pr-3 font-medium'>Category</th>
                  <th className='text-left py-2 pr-3 font-medium'>Role</th>
                  {hasBase && <th className='text-right py-2 pr-3 font-medium'>Base</th>}
                  <th className='text-right py-2 pr-3 font-medium'>Final</th>
                  {hasBase && <th className='text-right py-2 font-medium'>Premium</th>}
                </tr>
              </thead>
              <tbody>
                {top10.map((p, i) => {
                  const premium = p.basePrice > 0 ? Math.round(((p.finalPrice - p.basePrice) / p.basePrice) * 100) : null;
                  return (
                    <tr key={p._id} className='transition-colors' style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
                      <td className='py-2 pr-3 font-mono' style={{ color: 'var(--color-text-subtle)' }}>{i + 1}</td>
                      <td className='py-2 pr-3 font-medium' style={{ color: 'var(--color-text)' }}>{p.name}</td>
                      <td className='py-2 pr-3'>
                        {p.team ? (
                          <span className='flex items-center gap-1.5'>
                            <span className='w-2 h-2 rounded-full inline-block flex-shrink-0'
                              style={{ backgroundColor: p.team.colorHex || '#6366f1' }} />
                            <span style={{ color: 'var(--color-text-muted)' }}>{p.team.shortName}</span>
                          </span>
                        ) : <span style={{ color: 'var(--color-text-subtle)' }}>—</span>}
                      </td>
                      <td className='py-2 pr-3' style={{ color: 'var(--color-text-muted)' }}>{p.category || '—'}</td>
                      <td className='py-2 pr-3' style={{ color: 'var(--color-text-muted)' }}>{p.role || '—'}</td>
                      {hasBase && (
                        <td className='py-2 pr-3 text-right' style={{ color: 'var(--color-text-muted)' }}>
                          {p.basePrice ? formatCurrency(p.basePrice, sym, unit) : '—'}
                        </td>
                      )}
                      <td className='py-2 pr-3 text-right font-medium' style={{ color: 'var(--color-success-text)' }}>
                        {formatCurrency(p.finalPrice, sym, unit)}
                      </td>
                      {hasBase && (
                        <td className='py-2 text-right'>
                          {premium !== null ? (
                            <span style={{ color: premium > 0 ? 'var(--color-warning-text)' : 'var(--color-text-subtle)' }}>
                              {premium > 0 ? `+${premium}%` : `${premium}%`}
                            </span>
                          ) : <span style={{ color: 'var(--color-text-subtle)' }}>—</span>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Base vs Final scatter */}
      {scatterData.length > 1 && (
        <Card>
          <CardTitle>Base Price vs Final Price (by Role)</CardTitle>
          <ResponsiveContainer width='100%' height={260}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#1f2937' />
              <XAxis dataKey='x' name='Base Price' tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false} tickLine={false} label={{ value: 'Base Price', fill: '#6b7280', fontSize: 11, dy: 16 }} />
              <YAxis dataKey='y' name='Final Price' tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                {...tooltipStyle}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={tooltipStyle.contentStyle} className='text-xs space-y-1'>
                      <p style={{ color: 'var(--color-text)' }} className='font-semibold'>{d.name}</p>
                      <p style={{ color: 'var(--color-text-muted)' }}>{d.role}</p>
                      <p>Base: {formatCurrency(d.x, sym, unit)}</p>
                      <p>Final: {formatCurrency(d.y, sym, unit)}</p>
                    </div>
                  );
                }}
              />
              {roles.map((role, i) => (
                <Scatter
                  key={role}
                  name={role}
                  data={scatterData.filter((d) => d.role === role)}
                  fill={ROLE_COLORS[i % ROLE_COLORS.length]}
                  opacity={0.85}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
};

// ---- Financial Tab ----
const FinancialTab = ({ teams, categoryBreakdown, soldPlayers, sym, unit }) => {
  const chartColors = {
    primary: getVar('--color-accent') || '#6366f1',
    success: getVar('--color-success') || '#22c55e',
    danger: getVar('--color-danger') || '#ef4444',
    warning: getVar('--color-warning') || '#eab308',
  };

  const utilisationData = teams
    .map((t) => ({
      name: t.shortName,
      utilisation: t.initialPurse > 0 ? Math.round((t.totalSpent / t.initialPurse) * 100) : 0,
      colorHex: t.colorHex,
    }))
    .sort((a, b) => b.utilisation - a.utilisation);

  // Category price inflation (avg final / avg base)
  const catInflation = categoryBreakdown
    .map((c) => {
      const catPlayers = soldPlayers.filter((p) => (p.category || 'Uncategorised') === c.category && p.basePrice > 0);
      const avgBase = catPlayers.length > 0
        ? Math.round(catPlayers.reduce((s, p) => s + p.basePrice, 0) / catPlayers.length)
        : 0;
      const inflation = avgBase > 0 && c.avgPrice > 0
        ? Math.round(((c.avgPrice - avgBase) / avgBase) * 100)
        : null;
      return { ...c, avgBase, inflation };
    })
    .filter((c) => c.sold > 0);

  return (
    <div className='space-y-6'>
      {/* Budget utilisation chart */}
      <Card>
        <CardTitle>Budget Utilisation per Team (%)</CardTitle>
        <ResponsiveContainer width='100%' height={220}>
          <BarChart data={utilisationData} barCategoryGap='30%'>
            <CartesianGrid strokeDasharray='3 3' stroke='#1f2937' vertical={false} />
            <XAxis dataKey='name' tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
              domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip {...tooltipStyle} formatter={(v) => `${v}%`} />
            <Bar dataKey='utilisation' name='Budget Used' radius={[4, 4, 0, 0]}>
              {utilisationData.map((entry, i) => (
                <Cell key={i} fill={entry.colorHex || chartColors.primary} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Per-team financial summary table */}
      <Card>
        <CardTitle>Team Financial Summary</CardTitle>
        <div className='overflow-x-auto'>
          <table className='w-full text-xs'>
            <thead>
              <tr style={{ color: 'var(--color-text-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                <th className='text-left py-2 pr-3 font-medium'>Team</th>
                <th className='text-right py-2 pr-3 font-medium'>Budget</th>
                <th className='text-right py-2 pr-3 font-medium'>Spent</th>
                <th className='text-right py-2 pr-3 font-medium'>Remaining</th>
                <th className='text-right py-2 pr-3 font-medium'>Used %</th>
                <th className='text-right py-2 font-medium'>Players</th>
              </tr>
            </thead>
            <tbody>
              {teams
                .slice()
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .map((t) => {
                  const pct = t.initialPurse > 0 ? Math.round((t.totalSpent / t.initialPurse) * 100) : 0;
                  return (
                    <tr key={t._id} className='transition-colors' style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
                      <td className='py-2 pr-3'>
                        <div className='flex items-center gap-2'>
                          <div className='w-2.5 h-2.5 rounded-full flex-shrink-0' style={{ backgroundColor: t.colorHex || '#6366f1' }} />
                          <span className='font-medium' style={{ color: 'var(--color-text)' }}>{t.name}</span>
                        </div>
                      </td>
                      <td className='py-2 pr-3 text-right' style={{ color: 'var(--color-text-muted)' }}>{formatCurrency(t.initialPurse, sym, unit)}</td>
                      <td className='py-2 pr-3 text-right font-medium' style={{ color: 'var(--color-accent)' }}>{formatCurrency(t.totalSpent, sym, unit)}</td>
                      <td className='py-2 pr-3 text-right' style={{ color: 'var(--color-success-text)' }}>{formatCurrency(t.remainingPurse, sym, unit)}</td>
                      <td className='py-2 pr-3 text-right'>
                        <span style={{ color: pct >= 80 ? 'var(--color-warning-text)' : pct >= 50 ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                          {pct}%
                        </span>
                      </td>
                      <td className='py-2 text-right' style={{ color: 'var(--color-text-muted)' }}>{t.playerCount}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Category price inflation */}
      {catInflation.length > 0 && catInflation.some((c) => c.avgBase > 0) && (
        <Card>
          <CardTitle>Category Price Inflation</CardTitle>
          <div className='overflow-x-auto'>
            <table className='w-full text-xs'>
              <thead>
                <tr style={{ color: 'var(--color-text-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  <th className='text-left py-2 pr-3 font-medium'>Category</th>
                  <th className='text-right py-2 pr-3 font-medium'>Players Sold</th>
                  <th className='text-right py-2 pr-3 font-medium'>Avg Base</th>
                  <th className='text-right py-2 pr-3 font-medium'>Avg Final</th>
                  <th className='text-right py-2 font-medium'>Inflation</th>
                </tr>
              </thead>
              <tbody>
                {catInflation.map((c) => (
                  <tr key={c.category} className='transition-colors' style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
                    <td className='py-2 pr-3 font-medium' style={{ color: 'var(--color-text)' }}>{c.category}</td>
                    <td className='py-2 pr-3 text-right' style={{ color: 'var(--color-text-muted)' }}>{c.sold}</td>
                    <td className='py-2 pr-3 text-right' style={{ color: 'var(--color-text-muted)' }}>
                      {c.avgBase ? formatCurrency(c.avgBase, sym, unit) : '—'}
                    </td>
                    <td className='py-2 pr-3 text-right font-medium' style={{ color: 'var(--color-accent)' }}>
                      {formatCurrency(c.avgPrice, sym, unit)}
                    </td>
                    <td className='py-2 text-right'>
                      {c.inflation !== null ? (
                        <span style={{ color: c.inflation > 0 ? 'var(--color-warning-text)' : 'var(--color-text-subtle)' }} className={c.inflation > 0 ? 'font-medium' : ''}>
                          {c.inflation > 0 ? `+${c.inflation}%` : `${c.inflation}%`}
                        </span>
                      ) : <span style={{ color: 'var(--color-text-subtle)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ---- Main Page ----
const TABS = ['Overview', 'Teams', 'Players', 'Financial'];

const AuctionReportPage = () => {
  const { id: auctionId } = useParams();
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('Overview');
  const [showShare, setShowShare] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['auction-report', auctionId],
    queryFn: () => getAuctionReport(auctionId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className='flex justify-center items-center py-20'>
        <Spinner size='lg' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded-2xl p-6 text-sm' style={{ backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger-text)' }}>
        {error.response?.data?.message || 'Failed to load report.'}
      </div>
    );
  }

  const { auction, summary, teams, soldPlayers, categoryBreakdown, roleBreakdown } = data;
  const sym = auction.currencySymbol || '₹';
  const unit = auction.currencyUnit || 'lakh';

  return (
    <div className='animate-fade-in space-y-6'>
      {/* Header */}
      <div className='flex flex-wrap items-start gap-3'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-3 mb-1'>
            <h1 className='text-2xl font-bold' style={{ color: 'var(--color-text)' }}>{auction.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border`} style={
              auction.status === 'completed'
                ? { backgroundColor: 'var(--color-accent-muted)', color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }
                : { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)', borderColor: 'var(--color-success-border)' }
            }>
              {auction.status}
            </span>
          </div>
          <p className='text-sm capitalize' style={{ color: 'var(--color-text-muted)' }}>
            {auction.sport} · Round {auction.currentRound} · {summary.soldCount} players sold
          </p>
        </div>
        {isAdmin && (
          <Button size='sm' variant='ghost' onClick={() => setShowShare(true)}>
            <Mail size={14} /> Share via Email
          </Button>
        )}
      </div>

      {isAdmin && (
        <ShareReportModal
          open={showShare}
          onClose={() => setShowShare(false)}
          auctionId={auctionId}
          auctionName={auction.name}
        />
      )}

      {/* Tabs */}
      <div className='flex gap-1 rounded-xl p-1 w-fit' style={{ backgroundColor: 'var(--color-surface)' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'text-white' : 'hover:text-white'
            }`}
            style={tab === t
              ? { backgroundColor: 'var(--color-accent)' }
              : { color: 'var(--color-text-muted)' }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <OverviewTab
          summary={summary}
          categoryBreakdown={categoryBreakdown}
          roleBreakdown={roleBreakdown}
          sym={sym}
          unit={unit}
        />
      )}
      {tab === 'Teams' && (
        <TeamsTab teams={teams} sym={sym} unit={unit} auction={auction} />
      )}
      {tab === 'Players' && (
        <PlayersTab soldPlayers={soldPlayers} sym={sym} unit={unit} />
      )}
      {tab === 'Financial' && (
        <FinancialTab
          teams={teams}
          categoryBreakdown={categoryBreakdown}
          soldPlayers={soldPlayers}
          sym={sym}
          unit={unit}
        />
      )}
    </div>
  );
};

export default AuctionReportPage;
