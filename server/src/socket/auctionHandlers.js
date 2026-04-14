const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { auctionRoom, teamRoom } = require('./roomManager');
const Auction = require('../models/Auction');
const Team = require('../models/Team');
const { placeBid } = require('../services/auctionEngine');
const { handleRTMResponse } = require('../services/rtmService');

// Rate limiter: max 1 bid per 1000ms per socket
const bidTimestamps = new Map();
const isRateLimited = (socketId) => {
  const last = bidTimestamps.get(socketId) || 0;
  const now = Date.now();
  if (now - last < 1000) return true;
  bidTimestamps.set(socketId, now);
  return false;
};

// TODO [v1.3 socket auth]: REST endpoints are ownership-protected via requireAuctionOwner.
// Socket operations (auction:join, auction:bid, auction:rtm_response) currently only check
// socket.user.role and do not verify auction ownership. This is acceptable for v1.2 because:
//   1. Admin flow control (start/pause/nextPlayer/sold) goes through REST, not sockets.
//   2. Socket reads (state_update events) are not security-sensitive.
//   3. An admin could join another admin's room via socket and receive live updates,
//      but cannot mutate state through this path.
// For v1.3: add an `auction:join` ownership check for admin sockets:
//   if (socket.user.role === 'admin') verify Auction.exists({ _id: auctionId, createdBy: socket.user.id })
const auctionHandlers = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.user = null;
      return next();
    }
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
    } catch {
      socket.user = null;
    }
    next();
  });

  io.on('connection', (socket) => {
    socket.on('auction:join', async ({ auctionId }) => {
      try {
        const auction = await Auction.findById(auctionId)
          .populate('currentPlayerId')
          .populate('currentBidTeamId', 'name shortName colorHex');
        if (!auction) return;

        socket.join(auctionRoom(auctionId));

        // Join private team room if authenticated team_owner — look up team from DB
        if (socket.user?.role === 'team_owner') {
          const team = await Team.findOne({ auctionId, ownerId: socket.user.id }).select('_id').lean();
          if (team) {
            socket.join(teamRoom(team._id.toString()));
            socket.teamId = team._id.toString(); // cache on socket for bid/rtm handlers
          } else {
            socket.teamId = null;
          }
        }

        socket.emit('auction:state_update', { auction });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('auction:bid', async ({ amount }) => {
      // Must be authenticated team_owner
      if (!socket.user || socket.user.role !== 'team_owner') {
        return socket.emit('bid:error', { message: 'Not authorized to bid' });
      }

      if (isRateLimited(socket.id)) {
        return socket.emit('bid:error', { message: 'Bidding too fast — slow down' });
      }

      // Find which auction this socket is in
      const rooms = [...socket.rooms].filter((r) => r.startsWith('auction:'));
      if (rooms.length === 0) return socket.emit('bid:error', { message: 'Not in an auction room' });
      const auctionId = rooms[0].replace('auction:', '');

      const teamId = socket.teamId;
      if (!teamId) return socket.emit('bid:error', { message: 'You do not have a team in this auction' });

      // Block bids in offline mode — admin controls bids manually
      const auctionCheck = await Auction.findById(auctionId).select('mode').lean();
      if (auctionCheck?.mode === 'offline') {
        return socket.emit('bid:error', { message: 'Bidding is disabled — this auction is in offline mode' });
      }

      const result = await placeBid(auctionId, teamId, socket.user.id, amount);
      if (!result.valid) {
        socket.emit('bid:error', { message: result.error });
      }
      // On success, bid is broadcast to all via auctionEngine.placeBid → socket emit
    });

    socket.on('auction:rtm_response', async ({ exercise }) => {
      if (!socket.user || socket.user.role !== 'team_owner' || !socket.teamId) {
        return socket.emit('error', { message: 'Not authorized' });
      }
      const rooms = [...socket.rooms].filter((r) => r.startsWith('auction:'));
      if (rooms.length === 0) return;
      const auctionId = rooms[0].replace('auction:', '');

      try {
        await handleRTMResponse(auctionId, socket.teamId, exercise);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      bidTimestamps.delete(socket.id);
    });
  });
};

module.exports = auctionHandlers;
