const Auction = require('../models/Auction');
const Player = require('../models/Player');
const Team = require('../models/Team');
const BidEvent = require('../models/BidEvent');
const ApiError = require('../utils/ApiError');
const { calcNextBid, calcIncrement } = require('../utils/bidIncrementCalc');
const { getIO } = require('../config/socket');
const { auctionRoom, teamRoom } = require('../socket/roomManager');
// rtmService required lazily below to avoid circular deps

/**
 * Start the auction (draft → live).
 */
const startAuction = async (auctionId, userId) => {
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new ApiError(404, 'Auction not found');
  if (auction.status !== 'draft') throw new ApiError(400, 'Auction is not in draft status');

  auction.status = 'live';
  await auction.save();
  await BidEvent.create({ auctionId, eventType: 'auction_started', triggeredBy: userId });

  getIO().to(auctionRoom(auctionId)).emit('auction:resumed');
  return auction;
};

/**
 * Pause the auction.
 */
const pauseAuction = async (auctionId, userId) => {
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new ApiError(404, 'Auction not found');
  if (auction.status !== 'live') throw new ApiError(400, 'Auction is not live');

  auction.status = 'paused';
  await auction.save();
  await BidEvent.create({ auctionId, eventType: 'auction_paused', triggeredBy: userId });

  getIO().to(auctionRoom(auctionId)).emit('auction:paused');
  return auction;
};

/**
 * Resume the auction (paused → live).
 */
const resumeAuction = async (auctionId, userId) => {
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new ApiError(404, 'Auction not found');
  if (auction.status !== 'paused') throw new ApiError(400, 'Auction is not paused');

  auction.status = 'live';
  await auction.save();
  await BidEvent.create({ auctionId, eventType: 'auction_resumed', triggeredBy: userId });

  getIO().to(auctionRoom(auctionId)).emit('auction:resumed');
  return auction;
};

/**
 * End the auction.
 */
const endAuction = async (auctionId, userId) => {
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new ApiError(404, 'Auction not found');
  if (!['live', 'paused'].includes(auction.status)) throw new ApiError(400, 'Auction is not live or paused');

  // If a player is on block, clear them
  if (auction.currentPlayerId) {
    await Player.findByIdAndUpdate(auction.currentPlayerId, { status: 'pool' });
    auction.currentPlayerId = null;
    auction.currentBid = 0;
    auction.currentBidTeamId = null;
    auction.bidStartedAt = null;
  }

  auction.status = 'completed';
  await auction.save();
  await BidEvent.create({ auctionId, eventType: 'auction_ended', triggeredBy: userId });

  getIO().to(auctionRoom(auctionId)).emit('auction:ended');
  return auction;
};

/**
 * Put the next player on the block.
 */
const putNextPlayer = async (auctionId, userId) => {
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new ApiError(404, 'Auction not found');
  if (auction.status !== 'live') throw new ApiError(400, 'Auction must be live to set next player');

  // Clear any existing player on block first
  if (auction.currentPlayerId) {
    await Player.findByIdAndUpdate(auction.currentPlayerId, { status: 'pool' });
  }

  // Find next unsold pool player in auction order
  const ordered = auction.auctionOrder.filter(
    (pid) =>
      !auction.soldPlayerIds.some((s) => s.equals(pid)) &&
      !auction.unsoldPlayerIds.some((u) => u.equals(pid))
  );

  if (ordered.length === 0) throw new ApiError(400, 'No more players in the auction pool');

  const nextPlayerId = ordered[0];
  const player = await Player.findByIdAndUpdate(
    nextPlayerId,
    { status: 'live' },
    { new: true }
  );

  auction.currentPlayerId = player._id;
  auction.currentBid = player.basePrice;
  auction.currentBidTeamId = null;
  auction.bidStartedAt = new Date();
  await auction.save();

  await BidEvent.create({ auctionId, playerId: player._id, eventType: 'player_set_live', triggeredBy: userId });

  getIO().to(auctionRoom(auctionId)).emit('auction:player_live', {
    player,
    basePrice: player.basePrice,
    bidStartedAt: auction.bidStartedAt,
  });

  return { auction, player };
};

/**
 * Mark current player as SOLD to the highest bidder.
 */
const markSold = async (auctionId, userId, overrideTeamId = null, overrideAmount = null) => {
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new ApiError(404, 'Auction not found');
  if (!auction.currentPlayerId) throw new ApiError(400, 'No player is currently on the block');

  const winningTeamId = overrideTeamId || auction.currentBidTeamId;
  if (!winningTeamId) throw new ApiError(400, 'No bid has been placed — use Unsold instead');

  const finalPrice = overrideAmount || auction.currentBid;
  const player = await Player.findById(auction.currentPlayerId);

  // Update player
  await Player.findByIdAndUpdate(player._id, {
    status: 'sold',
    soldToTeamId: winningTeamId,
    finalPrice,
  });

  // Update team: deduct purse + add to squad
  await Team.findByIdAndUpdate(winningTeamId, {
    $inc: { remainingPurse: -finalPrice },
    $push: { players: { playerId: player._id, pricePaid: finalPrice } },
  });

  // Update auction state
  auction.soldPlayerIds.push(player._id);
  auction.currentPlayerId = null;
  auction.currentBid = 0;
  auction.currentBidTeamId = null;
  auction.bidStartedAt = null;
  await auction.save();

  // Log
  await BidEvent.create({
    auctionId,
    playerId: player._id,
    teamId: winningTeamId,
    amount: finalPrice,
    eventType: 'sold',
    triggeredBy: userId,
  });

  const winningTeam = await Team.findById(winningTeamId).select('name shortName remainingPurse colorHex');

  const io = getIO();
  io.to(auctionRoom(auctionId)).emit('auction:sold', { player, team: winningTeam, finalPrice });
  io.to(auctionRoom(auctionId)).emit('team:purse_update', {
    teamId: winningTeamId,
    remainingPurse: winningTeam.remainingPurse,
  });

  // Open RTM window if enabled (lazily required to avoid circular deps)
  if (auction.rtmEnabled) {
    const { openRTMWindow } = require('./rtmService');
    await openRTMWindow(auction, player, winningTeamId, finalPrice);
  }

  return { player, team: winningTeam, finalPrice };
};

/**
 * Mark current player as UNSOLD.
 */
const markUnsold = async (auctionId, userId) => {
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new ApiError(404, 'Auction not found');
  if (!auction.currentPlayerId) throw new ApiError(400, 'No player is currently on the block');

  const player = await Player.findByIdAndUpdate(
    auction.currentPlayerId,
    { status: 'unsold' },
    { new: true }
  );

  auction.unsoldPlayerIds.push(player._id);
  auction.currentPlayerId = null;
  auction.currentBid = 0;
  auction.currentBidTeamId = null;
  auction.bidStartedAt = null;
  await auction.save();

  await BidEvent.create({ auctionId, playerId: player._id, eventType: 'unsold', triggeredBy: userId });

  getIO().to(auctionRoom(auctionId)).emit('auction:unsold', { player });
  return player;
};

/**
 * Place a bid. Called from socket handler.
 * Returns { valid: bool, error?: string, nextBid? }
 */
const placeBid = async (auctionId, teamId, userId, amount) => {
  const [auction, team] = await Promise.all([
    Auction.findById(auctionId),
    Team.findById(teamId),
  ]);

  // Validations
  if (!auction || auction.status !== 'live') return { valid: false, error: 'Auction is not live' };
  if (!auction.currentPlayerId) return { valid: false, error: 'No player on the block' };
  if (!team) return { valid: false, error: 'Team not found' };

  // Cannot outbid yourself
  if (auction.currentBidTeamId && auction.currentBidTeamId.equals(teamId)) {
    return { valid: false, error: 'You are already the highest bidder' };
  }

  // Bid must equal exactly the next increment
  const expectedBid = calcNextBid(auction.currentBid, auction.bidIncrementTiers);
  if (amount !== expectedBid) {
    return { valid: false, error: `Bid must be ${expectedBid}` };
  }

  // Check squad capacity
  if (team.players.length >= auction.maxSquadSize) {
    return { valid: false, error: 'Team squad is full' };
  }

  // Check overseas cap
  const player = await Player.findById(auction.currentPlayerId);
  if (player.nationality === 'overseas' && auction.maxOverseasPlayers > 0) {
    const overseasCount = await Player.countDocuments({
      _id: { $in: team.players.map((p) => p.playerId) },
      nationality: 'overseas',
    });
    if (overseasCount >= auction.maxOverseasPlayers) {
      return { valid: false, error: 'Overseas player limit reached for this team' };
    }
  }

  // Gender composition check (for sports with gender-based squad requirements, e.g. badminton)
  if (auction.minMalePlayers > 0 || auction.minFemalePlayers > 0) {
    const squadIds = team.players.map((p) => p.playerId);
    const [maleCount, femaleCount] = await Promise.all([
      Player.countDocuments({ _id: { $in: squadIds }, gender: 'male' }),
      Player.countDocuments({ _id: { $in: squadIds }, gender: 'female' }),
    ]);
    const newMale = maleCount + (player.gender === 'male' ? 1 : 0);
    const newFemale = femaleCount + (player.gender === 'female' ? 1 : 0);
    const remainingSlots = auction.maxSquadSize - (team.players.length + 1);
    const maleDeficit = Math.max(0, auction.minMalePlayers - newMale);
    const femaleDeficit = Math.max(0, auction.minFemalePlayers - newFemale);
    if (maleDeficit + femaleDeficit > remainingSlots) {
      return { valid: false, error: 'Bidding on this player would make it impossible to meet gender composition requirements' };
    }
  }

  // Purse reservation check: ensure team can still fill minimum squad
  const slotsNeeded = Math.max(0, auction.minSquadSize - team.players.length - 1);
  const poolPlayers = await Player.find({ auctionId, status: 'pool' }).sort({ basePrice: 1 }).limit(slotsNeeded);
  const reservedAmount = poolPlayers.reduce((sum, p) => sum + p.basePrice, 0);
  const effectivePurse = team.remainingPurse - reservedAmount;
  if (amount > effectivePurse) {
    return { valid: false, error: 'Insufficient effective purse (minimum squad reservation applied)' };
  }

  // Accept bid
  auction.currentBid = amount;
  auction.currentBidTeamId = teamId;
  await auction.save();

  await BidEvent.create({
    auctionId,
    playerId: auction.currentPlayerId,
    teamId,
    amount,
    eventType: 'bid',
    triggeredBy: userId,
  });

  getIO().to(auctionRoom(auctionId)).emit('auction:bid_placed', {
    teamId,
    teamName: team.name,
    teamShortName: team.shortName,
    amount,
    timestamp: new Date(),
  });

  return { valid: true, nextBid: calcNextBid(amount, auction.bidIncrementTiers) };
};

module.exports = { startAuction, pauseAuction, resumeAuction, endAuction, putNextPlayer, markSold, markUnsold, placeBid };
