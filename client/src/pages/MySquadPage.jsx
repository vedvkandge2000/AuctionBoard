import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyTeams } from '../services/authService';
import api from '../services/api';
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

const SquadView = ({ team }) => {
  const symbol = team.auctionId?.currencySymbol || '₹';
  const unit = team.auctionId?.currencyUnit || 'lakh';
  const pct = team.initialPurse > 0 ? Math.round((team.remainingPurse / team.initialPurse) * 100) : 0;
  const spent = team.initialPurse - team.remainingPurse;

  const byRole = (team.players || []).reduce((acc, sp) => {
    const role = sp.playerId?.role || 'Other';
    if (!acc[role]) acc[role] = [];
    acc[role].push(sp);
    return acc;
  }, {});

  return (
    <>
      {/* Header */}
      <div className='flex items-center gap-4 mb-6'>
        {team.logoUrl && (
          <img src={team.logoUrl} alt='' className='h-14 w-14 rounded-full object-cover' style={{ border: '2px solid var(--color-border)' }} />
        )}
        <div>
          <div className='flex items-center gap-2'>
            <h2 className='text-2xl font-bold' style={{ color: 'var(--color-text)' }}>{team.name}</h2>
            <span className='text-xs px-2 py-0.5 rounded-full' style={{ backgroundColor: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>{team.shortName}</span>
          </div>
          <p className='text-sm mt-0.5' style={{ color: 'var(--color-text-muted)' }}>My Squad</p>
        </div>
      </div>

      {/* Stats row */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6'>
        <div className='rounded-xl p-4 text-center' style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className='text-xs mb-1' style={{ color: 'var(--color-text-muted)' }}>Remaining Purse</p>
          <p className='font-bold text-lg' style={{ color: 'var(--color-accent)' }}>{formatShort(team.remainingPurse, symbol, unit)}</p>
        </div>
        <div className='rounded-xl p-4 text-center' style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className='text-xs mb-1' style={{ color: 'var(--color-text-muted)' }}>Spent</p>
          <p className='font-bold text-lg' style={{ color: 'var(--color-text)' }}>{formatShort(spent, symbol, unit)}</p>
        </div>
        <div className='rounded-xl p-4 text-center' style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className='text-xs mb-1' style={{ color: 'var(--color-text-muted)' }}>Players</p>
          <p className='font-bold text-lg' style={{ color: 'var(--color-text)' }}>{team.players?.length || 0}</p>
        </div>
        <div className='rounded-xl p-4 text-center' style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className='text-xs mb-1' style={{ color: 'var(--color-text-muted)' }}>RTM Cards</p>
          <p className='font-bold text-lg' style={{ color: 'var(--color-text)' }}>{team.rtmCardsRemaining}</p>
        </div>
      </div>

      {/* Purse bar */}
      <div className='mb-6'>
        <div className='flex justify-between text-xs mb-1' style={{ color: 'var(--color-text-muted)' }}>
          <span>Purse used</span>
          <span>{pct}% remaining</span>
        </div>
        <div className='h-2 rounded-full overflow-hidden' style={{ backgroundColor: 'var(--color-surface)' }}>
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
              <h3 className='text-xs uppercase tracking-widest mb-2 px-1' style={{ color: 'var(--color-text-subtle)' }}>{role} ({players.length})</h3>
              <div className='space-y-2'>
                {players.map((sp) => (
                  <div key={sp.playerId?._id} className='rounded-xl px-4 py-3 flex items-center justify-between' style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className='flex items-center gap-3'>
                      {sp.playerId?.photoUrl ? (
                        <img src={sp.playerId.photoUrl} alt='' className='h-9 w-9 rounded-full object-cover' />
                      ) : (
                        <div className='h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm' style={{ backgroundColor: 'var(--color-surface-sunken)', color: 'var(--color-text)' }}>
                          {sp.playerId?.name?.[0] || '?'}
                        </div>
                      )}
                      <div>
                        <p className='font-medium text-sm' style={{ color: 'var(--color-text)' }}>{sp.playerId?.name}</p>
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
                      <p className='font-semibold' style={{ color: 'var(--color-accent)' }}>{formatCurrency(sp.pricePaid, symbol, unit)}</p>
                      {sp.playerId?.basePrice && sp.pricePaid > sp.playerId.basePrice && (
                        <p className='text-xs' style={{ color: 'var(--color-text-subtle)' }}>base {formatShort(sp.playerId.basePrice, symbol, unit)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const MySquadPage = () => {
  const { id: auctionId } = useParams();

  // If accessed from /auction/:id/my-squad — load just this auction's team
  // If accessed from /my-squad (legacy) — load all teams and let user pick
  const { data: team, isLoading, isError } = useQuery({
    queryKey: ['my-team', auctionId],
    queryFn: async () => {
      const { data } = await api.get('/auth/me/team', { params: { auctionId } });
      return data.team || null;
    },
    enabled: !!auctionId,
  });

  if (isLoading) {
    return <div className='flex justify-center items-center h-64'><Spinner size='lg' /></div>;
  }

  if (isError) {
    return (
      <div className='max-w-2xl mx-auto'>
        <EmptyState icon='⚠️' title='Could not load squad' description='Try refreshing the page.' />
      </div>
    );
  }

  if (!team) {
    return (
      <div className='max-w-2xl mx-auto'>
        <EmptyState
          icon='🛡️'
          title='No team yet'
          description="You don't have a team in this auction yet."
          action={
            <Link to={`/auction/${auctionId}/teams`} style={{ color: 'var(--color-accent)' }} className='hover:opacity-80 text-sm underline'>
              Go to Teams page
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className='max-w-3xl mx-auto animate-fade-in'>
      <SquadView team={team} />
    </div>
  );
};

export default MySquadPage;
