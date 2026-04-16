import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, CartesianGrid, Legend,
} from 'recharts';
import { getAuctionReport } from '../services/auctionService';
import { formatCurrency } from '../utils/formatCurrency';
import Spinner from '../components/ui/Spinner';

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
  <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <h3 className='text-white font-semibold text-sm mb-4 border-b border-gray-800 pb-3'>{children}</h3>
);

const StatCard = ({ label, value, sub, color = 'text-white' }) => (
  <div className='bg-gray-900 border border-gray-800 rounded-2xl p-4'>
    <p className='text-gray-500 text-xs mb-1'>{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {sub && <p className='text-gray-500 text-xs mt-1'>{sub}</p>}
  </div>
);

// ---- Overview Tab ----
const OverviewTab = ({ summary, categoryBreakdown, roleBreakdown, sym, unit }) => {
  const soldPct = summary.totalPlayers > 0 ? Math.round((summary.soldCount / summary.totalPlayers) * 100) : 0;
  const pieData = [
    { name: 'Sold', value: summary.soldCount },
    { name: 'Unsold', value: summary.unsoldCount },
    { name: 'In Pool', value: summary.poolCount },
  ].filter((d) => d.value > 0);
  const pieColors = [COLORS.green, COLORS.red, COLORS.gray];

  return (
    <div className='space-y-6'>
      {/* Stat cards */}
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
        <StatCard label='Total Players' value={summary.totalPlayers} />
        <StatCard label='Sold' value={summary.soldCount} color='text-green-400'
          sub={`${soldPct}% of pool`} />
        <StatCard label='Unsold' value={summary.unsoldCount} color='text-red-400' />
        <StatCard label='Total Spent'
          value={formatCurrency(summary.totalSpent, sym, unit)}
          color='text-indigo-400' />
        <StatCard label='Avg Price'
          value={summary.avgPrice ? formatCurrency(summary.avgPrice, sym, unit) : '—'} />
        <StatCard label='Highest Bid'
          value={summary.maxPrice ? formatCurrency(summary.maxPrice, sym, unit) : '—'}
          color='text-yellow-400' />
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
                <Bar dataKey='sold' name='Sold' fill={COLORS.green} radius={[4, 4, 0, 0]} />
                <Bar dataKey='unsold' name='Unsold' fill={COLORS.red} radius={[4, 4, 0, 0]} />
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
              <Bar dataKey='sold' name='Sold' fill={COLORS.indigo} radius={[4, 4, 0, 0]} />
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
            <Bar dataKey='Spent' fill={COLORS.indigo} radius={[4, 4, 0, 0]} stackId='a' />
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
              <span className='text-white font-semibold text-sm'>{team.name}</span>
              <span className='text-gray-500 text-xs'>({team.shortName})</span>
              <div className='ml-auto flex items-center gap-2'>
                <span className='text-xs text-indigo-400 font-medium'>{team.playerCount} players</span>
                <button
                  onClick={() => generateTeamReport(team, auction, sym, unit)}
                  className='text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 px-2 py-0.5 rounded transition-colors'
                  title='Open printable team report'
                >
                  Download
                </button>
              </div>
            </div>

            <div className='flex gap-4 text-xs mb-3'>
              <div>
                <p className='text-gray-500'>Spent</p>
                <p className='text-white font-medium'>{formatCurrency(team.totalSpent, sym, unit)}</p>
              </div>
              <div>
                <p className='text-gray-500'>Remaining</p>
                <p className='text-green-400 font-medium'>{formatCurrency(team.remainingPurse, sym, unit)}</p>
              </div>
              <div>
                <p className='text-gray-500'>Budget</p>
                <p className='text-gray-300 font-medium'>{formatCurrency(team.initialPurse, sym, unit)}</p>
              </div>
            </div>

            {team.players.length === 0 ? (
              <p className='text-gray-600 text-xs'>No players signed</p>
            ) : (
              <div className='space-y-1'>
                {team.players
                  .slice()
                  .sort((a, b) => b.finalPrice - a.finalPrice)
                  .map((p, i) => (
                    <div key={i} className='flex items-center justify-between gap-2 bg-gray-800 rounded-lg px-3 py-1.5'>
                      <div className='flex items-center gap-2 min-w-0'>
                        <span className='text-white text-xs font-medium truncate'>{p.name}</span>
                        {p.category && (
                          <span className='text-xs bg-indigo-900/50 text-indigo-300 px-1.5 py-0.5 rounded flex-shrink-0'>
                            {p.category}
                          </span>
                        )}
                        {p.role && <span className='text-gray-500 text-xs flex-shrink-0'>{p.role}</span>}
                      </div>
                      <span className='text-green-400 text-xs font-medium flex-shrink-0'>
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
          <p className='text-gray-500 text-sm'>No players sold yet.</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-xs'>
              <thead>
                <tr className='text-gray-500 border-b border-gray-800'>
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
                    <tr key={p._id} className='border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors'>
                      <td className='py-2 pr-3 text-gray-500 font-mono'>{i + 1}</td>
                      <td className='py-2 pr-3 text-white font-medium'>{p.name}</td>
                      <td className='py-2 pr-3'>
                        {p.team ? (
                          <span className='flex items-center gap-1.5'>
                            <span className='w-2 h-2 rounded-full inline-block flex-shrink-0'
                              style={{ backgroundColor: p.team.colorHex || '#6366f1' }} />
                            <span className='text-gray-300'>{p.team.shortName}</span>
                          </span>
                        ) : <span className='text-gray-600'>—</span>}
                      </td>
                      <td className='py-2 pr-3 text-gray-400'>{p.category || '—'}</td>
                      <td className='py-2 pr-3 text-gray-400'>{p.role || '—'}</td>
                      {hasBase && (
                        <td className='py-2 pr-3 text-right text-gray-400'>
                          {p.basePrice ? formatCurrency(p.basePrice, sym, unit) : '—'}
                        </td>
                      )}
                      <td className='py-2 pr-3 text-right text-green-400 font-medium'>
                        {formatCurrency(p.finalPrice, sym, unit)}
                      </td>
                      {hasBase && (
                        <td className='py-2 text-right'>
                          {premium !== null ? (
                            <span className={premium > 0 ? 'text-yellow-400' : 'text-gray-500'}>
                              {premium > 0 ? `+${premium}%` : `${premium}%`}
                            </span>
                          ) : <span className='text-gray-600'>—</span>}
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
                      <p className='text-white font-semibold'>{d.name}</p>
                      <p className='text-gray-400'>{d.role}</p>
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
                <Cell key={i} fill={entry.colorHex || COLORS.indigo} />
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
              <tr className='text-gray-500 border-b border-gray-800'>
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
                    <tr key={t._id} className='border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors'>
                      <td className='py-2 pr-3'>
                        <div className='flex items-center gap-2'>
                          <div className='w-2.5 h-2.5 rounded-full flex-shrink-0' style={{ backgroundColor: t.colorHex || '#6366f1' }} />
                          <span className='text-white font-medium'>{t.name}</span>
                        </div>
                      </td>
                      <td className='py-2 pr-3 text-right text-gray-400'>{formatCurrency(t.initialPurse, sym, unit)}</td>
                      <td className='py-2 pr-3 text-right text-indigo-400 font-medium'>{formatCurrency(t.totalSpent, sym, unit)}</td>
                      <td className='py-2 pr-3 text-right text-green-400'>{formatCurrency(t.remainingPurse, sym, unit)}</td>
                      <td className='py-2 pr-3 text-right'>
                        <span className={pct >= 80 ? 'text-yellow-400' : pct >= 50 ? 'text-indigo-400' : 'text-gray-400'}>
                          {pct}%
                        </span>
                      </td>
                      <td className='py-2 text-right text-gray-300'>{t.playerCount}</td>
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
                <tr className='text-gray-500 border-b border-gray-800'>
                  <th className='text-left py-2 pr-3 font-medium'>Category</th>
                  <th className='text-right py-2 pr-3 font-medium'>Players Sold</th>
                  <th className='text-right py-2 pr-3 font-medium'>Avg Base</th>
                  <th className='text-right py-2 pr-3 font-medium'>Avg Final</th>
                  <th className='text-right py-2 font-medium'>Inflation</th>
                </tr>
              </thead>
              <tbody>
                {catInflation.map((c) => (
                  <tr key={c.category} className='border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors'>
                    <td className='py-2 pr-3 text-white font-medium'>{c.category}</td>
                    <td className='py-2 pr-3 text-right text-gray-400'>{c.sold}</td>
                    <td className='py-2 pr-3 text-right text-gray-400'>
                      {c.avgBase ? formatCurrency(c.avgBase, sym, unit) : '—'}
                    </td>
                    <td className='py-2 pr-3 text-right text-indigo-400 font-medium'>
                      {formatCurrency(c.avgPrice, sym, unit)}
                    </td>
                    <td className='py-2 text-right'>
                      {c.inflation !== null ? (
                        <span className={c.inflation > 0 ? 'text-yellow-400 font-medium' : 'text-gray-500'}>
                          {c.inflation > 0 ? `+${c.inflation}%` : `${c.inflation}%`}
                        </span>
                      ) : <span className='text-gray-600'>—</span>}
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
  const [tab, setTab] = useState('Overview');

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
      <div className='bg-red-900/20 border border-red-800 rounded-2xl p-6 text-red-400 text-sm'>
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
      <div>
        <div className='flex items-center gap-3 mb-1'>
          <h1 className='text-2xl font-bold text-white'>{auction.name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
            auction.status === 'completed'
              ? 'bg-blue-900/30 text-blue-300 border-blue-800'
              : 'bg-green-900/30 text-green-300 border-green-800'
          }`}>
            {auction.status}
          </span>
        </div>
        <p className='text-gray-400 text-sm capitalize'>
          {auction.sport} · Round {auction.currentRound} · {summary.soldCount} players sold
        </p>
      </div>

      {/* Tabs */}
      <div className='flex gap-1 bg-gray-800 rounded-xl p-1 w-fit'>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
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
