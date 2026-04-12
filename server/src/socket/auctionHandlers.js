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

        // Join private team room if authenticated team_owner
        if (socket.user?.role === 'team_owner' && socket.user?.teamId) {
          socket.join(teamRoom(socket.user.teamId.toString()));
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

      const teamId = socket.user.teamId?.toString();
      if (!teamId) return socket.emit('bid:error', { message: 'No team associated with your account' });

      const result = await placeBid(auctionId, teamId, socket.user.id, amount);
      if (!result.valid) {
        socket.emit('bid:error', { message: result.error });
      }
      // On success, bid is broadcast to all via auctionEngine.placeBid → socket emit
    });

    socket.on('auction:rtm_response', async ({ exercise }) => {
      if (!socket.user || socket.user.role !== 'team_owner' || !socket.user.teamId) {
        return socket.emit('error', { message: 'Not authorized' });
      }
      const rooms = [...socket.rooms].filter((r) => r.startsWith('auction:'));
      if (rooms.length === 0) return;
      const auctionId = rooms[0].replace('auction:', '');

      try {
        await handleRTMResponse(auctionId, socket.user.teamId.toString(), exercise);
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
