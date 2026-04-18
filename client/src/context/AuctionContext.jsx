import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { connectSocket, disconnectSocket } from '../services/socketService';

const AuctionContext = createContext(null);

const initialState = {
  auction: null,
  teams: [],
  bidHistory: [],
  bidSeq: 0,             // monotonic counter for stable AnimatePresence keys
  teamMaxBids: {},       // { [teamId]: maxBid } — updated each time a new player goes live
  rtmPrompt: null,       // { player, winningBid, expiresAt } or null
  lastResult: null,      // { type: 'sold'|'unsold', player, timestamp } — drives SOLD/UNSOLD overlay
  squadRefreshAt: null,  // bumped when a player is released — triggers squad panel refetch
  releaseRequests: [],   // pending release requests (live, via socket)
  connected: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'STATE_UPDATE':
      return { ...state, auction: action.auction };
    case 'PLAYER_LIVE':
      return {
        ...state,
        auction: { ...state.auction, currentPlayerId: action.player, currentBid: action.basePrice, currentBidTeamId: null },
        bidHistory: [],
        bidSeq: 0,
        teamMaxBids: action.teamMaxBids || {},
      };
    case 'BID_PLACED': {
      const nextSeq = state.bidSeq + 1;
      return {
        ...state,
        bidSeq: nextSeq,
        auction: { ...state.auction, currentBid: action.amount, currentBidTeamId: { _id: action.teamId, name: action.teamName } },
        bidHistory: [{ ...action, seq: nextSeq }, ...state.bidHistory].slice(0, 50),
      };
    }
    case 'SOLD':
      return {
        ...state,
        lastResult: { type: 'sold', player: action.player, timestamp: Date.now() },
        auction: {
          ...state.auction,
          currentPlayerId: null,
          currentBid: 0,
          currentBidTeamId: null,
          soldPlayerIds: [...(state.auction?.soldPlayerIds || []), action.player?._id].filter(Boolean),
        },
      };
    case 'UNSOLD':
      return {
        ...state,
        lastResult: { type: 'unsold', player: action.player, timestamp: Date.now() },
        auction: {
          ...state.auction,
          currentPlayerId: null,
          currentBid: 0,
          currentBidTeamId: null,
          unsoldPlayerIds: [...(state.auction?.unsoldPlayerIds || []), action.player?._id].filter(Boolean),
        },
      };
    case 'AUCTION_STATUS':
      return { ...state, auction: { ...state.auction, status: action.status } };
    case 'PURSE_UPDATE': {
      const updatedTeams = state.teams.map((t) =>
        t._id === action.teamId ? { ...t, remainingPurse: action.remainingPurse } : t
      );
      return { ...state, teams: updatedTeams };
    }
    case 'PLAYER_RELEASED': {
      const updatedTeams = state.teams.map((t) =>
        t._id === action.teamId ? { ...t, remainingPurse: action.remainingPurse } : t
      );
      const remainingRequests = state.releaseRequests.filter(
        (r) => !(r.playerId?._id === action.playerId?.toString() || r.playerId === action.playerId)
      );
      return { ...state, teams: updatedTeams, squadRefreshAt: Date.now(), releaseRequests: remainingRequests };
    }
    case 'ROUND_ADVANCED':
      return { ...state, auction: { ...state.auction, currentRound: action.round, unsoldPlayerIds: [] } };
    case 'RELEASE_REQUESTED':
      return { ...state, releaseRequests: [action.request, ...state.releaseRequests] };
    case 'RELEASE_APPROVED': {
      const remaining = state.releaseRequests.filter((r) => r._id !== action.request._id);
      return { ...state, releaseRequests: remaining, squadRefreshAt: Date.now() };
    }
    case 'RELEASE_REJECTED': {
      const remaining = state.releaseRequests.filter((r) => r._id !== action.request._id);
      return { ...state, releaseRequests: remaining };
    }
    case 'SET_TEAMS':
      return { ...state, teams: action.teams };
    case 'RTM_PROMPT':
      return { ...state, rtmPrompt: action.prompt };
    case 'RTM_CLEAR':
      return { ...state, rtmPrompt: null };
    case 'BID_ERROR':
      return { ...state, lastBidError: action.message };
    case 'BID_ERROR_CLEAR':
      return { ...state, lastBidError: null };
    case 'CONNECTED':
      return { ...state, connected: true };
    case 'DISCONNECTED':
      return { ...state, connected: false };
    default:
      return state;
  }
};

export const AuctionProvider = ({ auctionId, initialTeams = [], children }) => {
  const [state, dispatch] = useReducer(reducer, { ...initialState, teams: initialTeams });
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('connect', () => dispatch({ type: 'CONNECTED' }));
    socket.on('disconnect', () => dispatch({ type: 'DISCONNECTED' }));
    socket.on('auction:state_update', ({ auction }) => dispatch({ type: 'STATE_UPDATE', auction }));
    socket.on('auction:player_live', ({ player, basePrice, teamMaxBids }) => dispatch({ type: 'PLAYER_LIVE', player, basePrice, teamMaxBids }));
    socket.on('auction:bid_placed', (data) => dispatch({ type: 'BID_PLACED', ...data }));
    socket.on('auction:sold', (data) => dispatch({ type: 'SOLD', player: data?.player }));
    socket.on('auction:unsold', (data) => dispatch({ type: 'UNSOLD', player: data?.player }));
    socket.on('auction:paused', () => dispatch({ type: 'AUCTION_STATUS', status: 'paused' }));
    socket.on('auction:resumed', () => dispatch({ type: 'AUCTION_STATUS', status: 'live' }));
    socket.on('auction:ended', () => dispatch({ type: 'AUCTION_STATUS', status: 'completed' }));
    socket.on('team:purse_update', (data) => dispatch({ type: 'PURSE_UPDATE', ...data }));
    socket.on('team:rtm_prompt', (prompt) => dispatch({ type: 'RTM_PROMPT', prompt }));
    socket.on('team:rtm_expired', () => dispatch({ type: 'RTM_CLEAR' }));
    socket.on('bid:error', ({ message }) => dispatch({ type: 'BID_ERROR', message }));
    socket.on('auction:player_released', (data) => dispatch({ type: 'PLAYER_RELEASED', ...data }));
    socket.on('auction:round_advanced', ({ round }) => dispatch({ type: 'ROUND_ADVANCED', round }));
    socket.on('auction:release_requested', ({ request }) => dispatch({ type: 'RELEASE_REQUESTED', request }));
    socket.on('auction:release_approved', ({ request }) => dispatch({ type: 'RELEASE_APPROVED', request }));
    socket.on('auction:release_rejected', ({ request }) => dispatch({ type: 'RELEASE_REJECTED', request }));

    socket.emit('auction:join', { auctionId });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('auction:state_update');
      socket.off('auction:player_live');
      socket.off('auction:bid_placed');
      socket.off('auction:sold');
      socket.off('auction:unsold');
      socket.off('auction:paused');
      socket.off('auction:resumed');
      socket.off('auction:ended');
      socket.off('team:purse_update');
      socket.off('team:rtm_prompt');
      socket.off('team:rtm_expired');
      socket.off('bid:error');
      socket.off('auction:player_released');
      socket.off('auction:round_advanced');
      socket.off('auction:release_requested');
      socket.off('auction:release_approved');
      socket.off('auction:release_rejected');
    };
  }, [auctionId]);

  const placeBid = useCallback((amount) => {
    socketRef.current?.emit('auction:bid', { amount });
  }, []);

  const respondRTM = useCallback((exercise) => {
    socketRef.current?.emit('auction:rtm_response', { exercise });
    dispatch({ type: 'RTM_CLEAR' });
  }, []);

  return (
    <AuctionContext.Provider value={{ ...state, placeBid, respondRTM, dispatch }}>
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = () => {
  const ctx = useContext(AuctionContext);
  if (!ctx) throw new Error('useAuction must be used inside AuctionProvider');
  return ctx;
};
