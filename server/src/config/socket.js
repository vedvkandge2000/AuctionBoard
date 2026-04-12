const { Server } = require('socket.io');
const { CLIENT_URL } = require('./env');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: CLIENT_URL, methods: ['GET', 'POST'], credentials: true },
  });

  // Auction socket handlers wired in Phase 2
  require('../socket/auctionHandlers')(io);

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = initSocket;
module.exports.getIO = getIO;
