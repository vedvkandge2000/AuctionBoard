import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAuction } from '../services/auctionService';
import { listTeams } from '../services/teamService';
import { AuctionProvider, useAuction } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PlayerCard from '../components/auction/PlayerCard';
import BidPanel from '../components/auction/BidPanel';
import OfflineBidPanel from '../components/auction/OfflineBidPanel';
import BidHistory from '../components/auction/BidHistory';
import TeamBudgetRail from '../components/auction/TeamBudgetRail';
import AuctionStatusBanner from '../components/auction/AuctionStatusBanner';
import AuctionControls from '../components/auction/AuctionControls';
import RTMPrompt from '../components/auction/RTMPrompt';
import TeamSquadPanel from '../components/auction/TeamSquadPanel';
import MySquadPanel from '../components/auction/MySquadPanel';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';

const AuctionRoomInner = ({ initialAuction, teams = [], refetch }) => {
  const { auction, bidHistory, placeBid, lastBidError, dispatch, lastResult, teams: liveTeams } = useAuction();
  const { isAdmin, isTeamOwner, user } = useAuth();
  const { addToast } = useToast();
  const [bidPending, setBidPending] = useState(false);
  const [soldOverlay, setSoldOverlay] = useState(null); // 'sold' | 'unsold' | null

  useEffect(() => {
    if (lastBidError) {
      addToast(lastBidError, 'error');
      setBidPending(false);
      dispatch({ type: 'BID_ERROR_CLEAR' });
    }
  }, [lastBidError]);

  // Drive SOLD/UNSOLD overlay from AuctionContext lastResult
  useEffect(() => {
    if (!lastResult) return;
    setSoldOverlay(lastResult.type);
    const timer = setTimeout(() => setSoldOverlay(null), 2500);
    return () => clearTimeout(timer);
  }, [lastResult?.timestamp]);

  const liveAuction = auction || initialAuction;
  const myTeam = isTeamOwner
    ? liveTeams.find((t) => t.ownerId?._id === user?.id || t.ownerId === user?.id)
    : null;

  const handleBid = async (amount) => {
    setBidPending(true);
    try {
      placeBid(amount);
    } catch (e) {
      addToast('Failed to place bid', 'error');
    } finally {
      setTimeout(() => setBidPending(false), 1500);
    }
  };

  return (
    <div className='space-y-4 animate-fade-in'>
      {/* Stadium atmosphere header */}
      <div
        className='rounded-2xl px-5 py-3 flex items-center justify-between'
        style={{ background: 'var(--gradient-card-live)', border: '1px solid var(--color-border)' }}
      >
        <div className='flex items-center gap-3'>
          <span
            className='w-2.5 h-2.5 rounded-full flex-shrink-0'
            style={{
              backgroundColor: liveAuction.status === 'live' ? 'var(--color-success)' : 'var(--color-text-subtle)',
              animation: liveAuction.status === 'live' ? 'liveGlow 2s ease-out infinite' : 'none',
            }}
          />
          <span className='font-semibold text-sm' style={{ color: 'var(--color-text)' }}>
            {liveAuction.name}
          </span>
          {liveAuction.sport && (
            <span className='text-xs capitalize' style={{ color: 'var(--color-text-muted)' }}>
              · {liveAuction.sport}
            </span>
          )}
        </div>
        <Badge variant={liveAuction.status === 'live' ? 'green' : liveAuction.status === 'paused' ? 'yellow' : 'default'}>
          {liveAuction.status}
        </Badge>
      </div>

      <AuctionStatusBanner auction={liveAuction} />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        {/* Left: Player spotlight */}
        <div className='lg:col-span-1 space-y-4'>
          <PlayerCard
            player={liveAuction?.currentPlayerId}
            auction={liveAuction}
            soldOverlay={soldOverlay}
          />
        </div>

        {/* Center: Bid panel + history */}
        <div className='lg:col-span-1 space-y-4'>
          {isAdmin && liveAuction?.mode === 'offline' && (
            <OfflineBidPanel auction={liveAuction} teams={liveTeams} />
          )}
          {isTeamOwner && liveAuction?.mode !== 'offline' && (
            <BidPanel
              auction={liveAuction}
              myTeam={myTeam}
              onBid={handleBid}
              bidPending={bidPending}
            />
          )}
          <BidHistory history={bidHistory} auction={liveAuction} />
        </div>

        {/* Right: Admin controls + team budgets + squad panels */}
        <div className='lg:col-span-1 space-y-4'>
          {isAdmin && (
            <AuctionControls auction={liveAuction} onUpdate={refetch} />
          )}
          <TeamBudgetRail
            teams={liveTeams}
            auction={liveAuction}
            myTeamId={myTeam?._id}
          />
          {isAdmin && (
            <TeamSquadPanel auctionId={liveAuction._id} auction={liveAuction} />
          )}
          {isTeamOwner && myTeam && (
            <MySquadPanel auctionId={liveAuction._id} auction={liveAuction} myTeam={myTeam} />
          )}
        </div>
      </div>

      <RTMPrompt auction={liveAuction} />
    </div>
  );
};

const AuctionRoomPage = () => {
  const { id } = useParams();

  const { data: auction, isLoading: auctionLoading, refetch } = useQuery({
    queryKey: ['auction', id],
    queryFn: () => getAuction(id),
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', id],
    queryFn: () => listTeams(id),
  });

  if (auctionLoading || teamsLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Spinner size='lg' />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className='text-center py-16' style={{ color: 'var(--color-text-muted)' }}>
        Auction not found.
      </div>
    );
  }

  return (
    <AuctionProvider auctionId={id} initialTeams={teams}>
      <AuctionRoomInner initialAuction={auction} teams={teams} refetch={refetch} />
    </AuctionProvider>
  );
};

export default AuctionRoomPage;
