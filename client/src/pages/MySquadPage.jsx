import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getMyTeam } from '../services/authService';
import { formatCurrency, formatShort } from '../utils/formatCurrency';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const ROLE_COLOR_MAP = {
  Batsman: 'blue',
  Bowler: 'red',
  'All-Rounder': 'green',
  'Wicket-Keeper': 'yellow',
};
const getRoleColor = (role) => ROLE_COLOR_MAP[role] || 'indigo';

const MySquadPage = () => {
  const { user } = useAuth();
  const { data: team, isLoading, isError } = useQuery({
    queryKey: ['my-team'],
    queryFn: getMyTeam,
    enabled: !!user?.teamId,
  });

  if (!user?.teamId) {
    return (
      <div className='p-6 max-w-2xl mx-auto'>
        <EmptyState
          icon='🛡️'
          title='No team yet'
          description="You haven't created or been assigned a team. Go to an auction's Teams page to create your team."
        />
      </div>
    );
  }

  if (isLoading) {
    return <div className='flex justify-center items-center h-64'><Spinner size='lg' /></div>;
  }

  if (isError || !team) {
    return (
      <div className='p-6 max-w-2xl mx-auto'>
        <EmptyState icon='⚠️' title='Could not load team' description='Try refreshing the page.' />
      </div>
    );
  }

  const symbol = '₹';
  const unit = 'lakh';
  const pct = team.initialPurse > 0 ? Math.round((team.remainingPurse / team.initialPurse) * 100) : 0;
  const spent = team.initialPurse - team.remainingPurse;

  const byRole = (team.players || []).reduce((acc, sp) => {
    const role = sp.playerId?.role || 'Other';
    if (!acc[role]) acc[role] = [];
    acc[role].push(sp);
    return acc;
  }, {});

  return (
    <div className='p-6 max-w-3xl mx-auto animate-fade-in'>
      {/* Header */}
      <div className='flex items-center gap-4 mb-6'>
        {team.logoUrl && (
          <img src={team.logoUrl} alt='' className='h-14 w-14 rounded-full object-cover border-2 border-gray-700' />
        )}
        <div>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold text-white'>{team.name}</h1>
            <span className='text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full'>{team.shortName}</span>
          </div>
          <p className='text-gray-400 text-sm mt-0.5'>My Squad</p>
        </div>
      </div>

      {/* Stats row */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6'>
        <div className='bg-gray-900 border border-gray-800 rounded-xl p-4 text-center'>
          <p className='text-gray-400 text-xs mb-1'>Remaining Purse</p>
          <p className='text-indigo-400 font-bold text-lg'>{formatShort(team.remainingPurse, symbol, unit)}</p>
        </div>
        <div className='bg-gray-900 border border-gray-800 rounded-xl p-4 text-center'>
          <p className='text-gray-400 text-xs mb-1'>Spent</p>
          <p className='text-white font-bold text-lg'>{formatShort(spent, symbol, unit)}</p>
        </div>
        <div className='bg-gray-900 border border-gray-800 rounded-xl p-4 text-center'>
          <p className='text-gray-400 text-xs mb-1'>Players</p>
          <p className='text-white font-bold text-lg'>{team.players?.length || 0}</p>
        </div>
        <div className='bg-gray-900 border border-gray-800 rounded-xl p-4 text-center'>
          <p className='text-gray-400 text-xs mb-1'>RTM Cards</p>
          <p className='text-white font-bold text-lg'>{team.rtmCardsRemaining}</p>
        </div>
      </div>

      {/* Purse bar */}
      <div className='mb-6'>
        <div className='flex justify-between text-xs text-gray-400 mb-1'>
          <span>Purse used</span>
          <span>{pct}% remaining</span>
        </div>
        <div className='h-2 bg-gray-800 rounded-full overflow-hidden'>
          <div
            className='h-2 rounded-full transition-all'
            style={{ width: `${pct}%`, backgroundColor: team.colorHex || '#6366f1' }}
          />
        </div>
      </div>

      {/* Squad list */}
      {team.players?.length === 0 ? (
        <EmptyState icon='🏏' title='No players yet' description='Players will appear here once the auction begins and your team wins bids.' />
      ) : (
        <div className='space-y-5'>
          {Object.entries(byRole).map(([role, players]) => (
            <div key={role}>
              <h3 className='text-gray-500 text-xs uppercase tracking-widest mb-2 px-1'>{role} ({players.length})</h3>
              <div className='space-y-2'>
                {players.map((sp) => (
                  <div key={sp.playerId?._id} className='bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      {sp.playerId?.photoUrl ? (
                        <img src={sp.playerId.photoUrl} alt='' className='h-9 w-9 rounded-full object-cover' />
                      ) : (
                        <div className='h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm'>
                          {sp.playerId?.name?.[0] || '?'}
                        </div>
                      )}
                      <div>
                        <p className='text-white font-medium text-sm'>{sp.playerId?.name}</p>
                        <div className='flex items-center gap-1.5 mt-0.5'>
                          <Badge variant={getRoleColor(sp.playerId?.role)} className='text-xs'>
                            {sp.playerId?.role}
                          </Badge>
                          {sp.playerId?.gender ? (
                            <Badge variant={sp.playerId.gender === 'female' ? 'pink' : 'blue'} className='text-xs'>
                              {sp.playerId.gender === 'female' ? '♀ F' : '♂ M'}
                            </Badge>
                          ) : sp.playerId?.nationality === 'overseas' ? (
                            <Badge variant='indigo' className='text-xs'>Overseas</Badge>
                          ) : null}
                          {sp.acquiredViaRtm && (
                            <Badge variant='orange' className='text-xs'>RTM</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-indigo-400 font-semibold'>{formatCurrency(sp.pricePaid, symbol, unit)}</p>
                      {sp.playerId?.basePrice && sp.pricePaid > sp.playerId.basePrice && (
                        <p className='text-gray-600 text-xs'>base {formatShort(sp.playerId.basePrice, symbol, unit)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySquadPage;
