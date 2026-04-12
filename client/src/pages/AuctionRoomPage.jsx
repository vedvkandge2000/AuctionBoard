import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAuction } from '../services/auctionService';
import { listTeams } from '../services/teamService';
import { AuctionProvider, useAuction } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PlayerCard from '../components/auction/PlayerCard';
import BidPanel from '../components/auction/BidPanel';
import BidHistory from '../components/auction/BidHistory';
import TeamBudgetRail from '../components/auction/TeamBudgetRail';
import AuctionStatusBanner from '../components/auction/AuctionStatusBanner';
import AuctionControls from '../components/auction/AuctionControls';
import RTMPrompt from '../components/auction/RTMPrompt';
import Spinner from '../components/ui/Spinner';
import { useState, useEffect } from 'react';

const AuctionRoomInner = ({ initialAuction, teams, refetch }) => {
  const { auction, bidHistory, placeBid, lastBidError, dispatch } = useAuction();
  const { isAdmin, isTeamOwner, user } = useAuth();
  const { addToast } = useToast();
  const [bidPending, setBidPending] = useState(false);

  useEffect(() => {
    if (lastBidError) {
      addToast(lastBidError, 'error');
      setBidPending(false);
      dispatch({ type: 'BID_ERROR_CLEAR' });
    }
  }, [lastBidError]);

  const liveAuction = auction || initialAuction;
  const myTeam = isTeamOwner ? teams.find((t) => t._id === user?.teamId) : null;

  const handleBid = async (amount) => {
    setBidPending(true);
    try {
      placeBid(amount);
    } catch (e) {
      addToast('Failed to place bid', 'error');
    } finally {
      // Socket confirmation clears pending state
      setTimeout(() => setBidPending(false), 1500);
    }
  };

  return (
    <div className='space-y-4 animate-fade-in'>
      <AuctionStatusBanner auction={liveAuction} />

      {/* Desktop: 3-col layout */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        {/* Left/Center: Player spotlight */}
        <div className='lg:col-span-1 space-y-4'>
          <PlayerCard player={liveAuction?.currentPlayerId} auction={liveAuction} />
        </div>

        {/* Right: Bid panel + history */}
        <div className='lg:col-span-1 space-y-4'>
          <BidPanel
            auction={liveAuction}
            myTeam={myTeam}
            onBid={handleBid}
            bidPending={bidPending}
          />
          <BidHistory history={bidHistory} auction={liveAuction} />
        </div>

        {/* Right col: Admin controls + team budgets */}
        <div className='lg:col-span-1 space-y-4'>
          {isAdmin && (
            <AuctionControls auction={liveAuction} onUpdate={refetch} />
          )}
          <TeamBudgetRail
            teams={teams}
            auction={liveAuction}
            myTeamId={user?.teamId}
          />
        </div>
      </div>

      {/* RTM overlay */}
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
    return <div className='text-gray-400 text-center py-16'>Auction not found.</div>;
  }

  return (
    <AuctionProvider auctionId={id} initialTeams={teams}>
      <AuctionRoomInner initialAuction={auction} teams={teams} refetch={refetch} />
    </AuctionProvider>
  );
};

export default AuctionRoomPage;
