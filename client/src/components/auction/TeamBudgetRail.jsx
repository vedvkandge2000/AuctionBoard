import { formatShort } from '../../utils/formatCurrency';

const getBudgetStyle = (pct, isMe) => {
  if (isMe) return {};
  if (pct <= 25) return { backgroundColor: 'var(--color-danger-bg)' };
  if (pct <= 60) return { backgroundColor: 'var(--color-warning-bg)' };
  return {};
};

const TeamBudgetRail = ({ teams = [], auction, myTeamId }) => {
  const symbol = auction?.currencySymbol || '₹';
  const unit = auction?.currencyUnit || 'lakh';

  if (teams.length === 0) return null;

  return (
    <div
      className='rounded-2xl p-3'
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h3
        className='text-xs uppercase tracking-wider mb-2 px-1'
        style={{ color: 'var(--color-text-subtle)', fontWeight: 600 }}
      >
        Team Budgets
      </h3>
      <div className='flex flex-wrap gap-2'>
        {teams.map((team) => {
          const pct = Math.round((team.remainingPurse / team.initialPurse) * 100);
          const isMe = myTeamId && team._id === myTeamId;
          return (
            <div
              key={team._id}
              className='flex items-center gap-2 px-3 py-2 rounded-lg transition-all'
              style={{
                borderLeft: `3px solid ${team.colorHex || 'var(--color-accent)'}`,
                border: isMe
                  ? `1px solid var(--color-accent)`
                  : `1px solid var(--color-border)`,
                borderLeftWidth: 3,
                borderLeftColor: team.colorHex || 'var(--color-accent)',
                backgroundColor: isMe
                  ? 'var(--color-accent-muted)'
                  : getBudgetStyle(pct, isMe).backgroundColor || 'var(--color-surface-sunken)',
              }}
            >
              {team.logoUrl && (
                <img src={team.logoUrl} alt='' className='h-5 w-5 rounded-full object-cover' />
              )}
              <div>
                <div className='text-xs font-medium' style={{ color: 'var(--color-text)' }}>
                  {team.shortName}
                </div>
                <div className='text-xs' style={{ color: 'var(--color-text-muted)' }}>
                  {formatShort(team.remainingPurse, symbol, unit)}
                  <span className='ml-1' style={{ color: 'var(--color-text-subtle)' }}>
                    ({pct}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamBudgetRail;
