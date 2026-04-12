/**
 * Socket.io room utilities.
 * Auction room: `auction:<auctionId>` — all participants
 * Team room:    `team:<teamId>`       — private, RTM prompts
 */

const auctionRoom = (auctionId) => `auction:${auctionId}`;
const teamRoom = (teamId) => `team:${teamId}`;

module.exports = { auctionRoom, teamRoom };
