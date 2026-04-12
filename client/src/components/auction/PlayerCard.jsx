import Badge from '../ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';

const ROLE_ICONS = {
  Batsman: '🏏',
  Bowler: '🎯',
  'All-Rounder': '⭐',
  'Wicket-Keeper': '🧤',
};

const StatPill = ({ label, value }) => (
  <div className='bg-gray-800 rounded-lg px-3 py-2 text-center'>
    <div className='text-gray-400 text-xs'>{label}</div>
    <div className='text-white font-semibold text-sm'>{value}</div>
  </div>
);

const PlayerCard = ({ player, auction }) => {
  if (!player) {
    return (
      <div className='flex flex-col items-center justify-center h-64 bg-gray-900 rounded-2xl border border-gray-800 text-gray-500'>
        <div className='text-4xl mb-3'>⏳</div>
        <p className='text-sm'>Waiting for next player...</p>
      </div>
    );
  }

  const { currency = {}, bidIncrementTiers = [] } = auction || {};
  const symbol = auction?.currencySymbol || '₹';
  const unit = auction?.currencyUnit || 'lakh';
  const statEntries = Object.entries(player.stats || {}).slice(0, 4);

  return (
    <div className='bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700 overflow-hidden animate-slide-up'>
      {/* Photo / Avatar */}
      <div className='relative h-48 bg-gradient-to-br from-indigo-900 to-gray-900 flex items-center justify-center'>
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.name}
            className='h-full w-full object-cover'
          />
        ) : (
          <span className='text-7xl'>{ROLE_ICONS[player.role] || (player.gender ? '🏸' : '👤')}</span>
        )}
        <div className='absolute top-3 right-3 flex flex-col gap-1 items-end'>
          {player.gender ? (
            <Badge variant={player.gender === 'female' ? 'pink' : 'blue'}>
              {player.gender === 'female' ? '♀ Female' : '♂ Male'}
            </Badge>
          ) : (
            <Badge variant={player.nationality === 'overseas' ? 'orange' : 'indigo'}>
              {player.nationality === 'overseas' ? '🌍 Overseas' : '🏠 Domestic'}
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className='p-5'>
        <div className='flex items-start justify-between mb-3'>
          <div>
            <h2 className='text-xl font-bold text-white'>{player.name}</h2>
            <p className='text-gray-400 text-sm'>
              {ROLE_ICONS[player.role] || '🏸'} {player.role}
              {player.country && ` · ${player.country}`}
            </p>
          </div>
          <div className='text-right'>
            <div className='text-xs text-gray-500'>Base Price</div>
            <div className='text-indigo-400 font-bold'>
              {formatCurrency(player.basePrice, symbol, unit)}
            </div>
          </div>
        </div>

        {/* Stats */}
        {statEntries.length > 0 && (
          <div className='grid grid-cols-2 gap-2 mt-3'>
            {statEntries.map(([key, val]) => (
              <StatPill key={key} label={key.replace(/_/g, ' ')} value={val} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
