import { formatShort } from '../../utils/formatCurrency';

const getBudgetChipStyle = (pct, colorHex, isMe) => {
  const bgTint = pct <= 25
    ? 'rgba(239,68,68,0.08)'
    : pct <= 60
      ? 'rgba(234,179,8,0.06)'
      : undefined;
  return {
    borderLeftColor: colorHex,
    borderLeftWidth: 3,
    backgroundColor: isMe ? undefined : bgTint, // don't override isMe indigo highlight
  };
};

const TeamBudgetRail = ({ teams = [], auction, myTeamId }) => {
  const symbol = auction?.currencySymbol || '₹';
  const unit = auction?.currencyUnit || 'lakh';

  if (teams.length === 0) return null;

  return (
    <div className='bg-gray-900 rounded-2xl border border-gray-700 p-3'>
      <h3 className='text-xs text-gray-500 uppercase tracking-wider mb-2 px-1'>Team Budgets</h3>
      <div className='flex flex-wrap gap-2'>
        {teams.map((team) => {
          const pct = Math.round((team.remainingPurse / team.initialPurse) * 100);
          const isMe = myTeamId && team._id === myTeamId;
          return (
            <div
              key={team._id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                isMe
                  ? 'border-indigo-500 bg-indigo-900/30'
                  : 'border-gray-700 bg-gray-800'
              }`}
              style={getBudgetChipStyle(pct, team.colorHex, isMe)}
            >
              {team.logoUrl && (
                <img src={team.logoUrl} alt='' className='h-5 w-5 rounded-full object-cover' />
              )}
              <div>
                <div className='text-xs font-medium text-white'>{team.shortName}</div>
                <div className='text-xs text-gray-400'>
                  {formatShort(team.remainingPurse, symbol, unit)}
                  <span className='text-gray-600 ml-1'>({pct}%)</span>
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
