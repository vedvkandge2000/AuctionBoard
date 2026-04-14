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
 * Players are sequenced by the auction's playerCategories order, then uncategorised last.
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

  // Shuffle within groups first (Fisher-Yates), then stable-sort by category order
  // This ensures players within the same category come up in random order each round
  for (let i = ordered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  }

  // Sort remaining players by the auction's playerCategories order; uncategorised players go last
  const categoryOrder = auction.playerCategories || [];
  const playerDocs = await Player.find({ _id: { $in: ordered } }).select('category').lean();
  const categoryMap = Object.fromEntries(playerDocs.map((p) => [p._id.toString(), p.category]));
  if (categoryOrder.length > 0) {
    ordered.sort((a, b) => {
      const ai = categoryOrder.indexOf(categoryMap[a.toString()]);
      const bi = categoryOrder.indexOf(categoryMap[b.toString()]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }

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

  // Calculate max bid each team can place (purse minus minimum squad reservation)
  const [teams, poolPlayers] = await Promise.all([
    Team.find({ auctionId }).select('_id remainingPurse players').lean(),
    Player.find({ auctionId, status: 'pool' }).select('basePrice').sort({ basePrice: 1 }).lean(),
  ]);
  const teamMaxBids = {};
  for (const team of teams) {
    const slotsNeeded = Math.max(0, auction.minSquadSize - team.players.length - 1);
    const reserved = poolPlayers.slice(0, slotsNeeded).reduce((s, p) => s + p.basePrice, 0);
    teamMaxBids[team._id.toString()] = Math.max(0, team.remainingPurse - reserved);
  }

  getIO().to(auctionRoom(auctionId)).emit('auction:player_live', {
    player,
    basePrice: player.basePrice,
    bidStartedAt: auction.bidStartedAt,
    teamMaxBids,
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

  // Cannot re-bid for a player your team released
  if (team.releasedPlayerIds?.some((id) => id.equals(auction.currentPlayerId))) {
    return { valid: false, error: 'Your team released this player — you cannot re-bid for them' };
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

/**
 * Release a sold player from their team back to the auction pool.
 * The team is refunded the price paid and cannot re-bid for this player.
 */
const releasePlayer = async (auctionId, playerId, userId) => {
  const [auction, player] = await Promise.all([
    Auction.findById(auctionId),
    Player.findById(playerId),
  ]);
  if (!auction) throw new ApiError(404, 'Auction not found');
  if (!player) throw new ApiError(404, 'Player not found');
  if (player.status !== 'sold') throw new ApiError(400, 'Only sold players can be released');

  // Find the team that owns this player
  const team = await Team.findOne({ auctionId, 'players.playerId': player._id });
  if (!team) throw new ApiError(404, 'No team owns this player');

  const squadEntry = team.players.find((p) => p.playerId.equals(player._id));
  const refundAmount = squadEntry?.pricePaid || player.finalPrice || 0;

  // Update team atomically: remove from squad, refund purse, record release
  await Team.findByIdAndUpdate(team._id, {
    $pull: { players: { playerId: player._id } },
    $inc: { remainingPurse: refundAmount },
    $addToSet: { releasedPlayerIds: player._id },
  });

  // Reset player to pool
  await Player.findByIdAndUpdate(player._id, {
    status: 'pool',
    soldToTeamId: null,
    finalPrice: 0,
  });

  // Remove from auction sold list
  await Auction.findByIdAndUpdate(auctionId, {
    $pull: { soldPlayerIds: player._id },
  });

  await BidEvent.create({
    auctionId,
    playerId: player._id,
    teamId: team._id,
    amount: refundAmount,
    eventType: 'player_released',
    triggeredBy: userId,
  });

  const updatedTeam = await Team.findById(team._id).select('name remainingPurse players').lean();

  getIO().to(auctionRoom(auctionId)).emit('auction:player_released', {
    playerId: player._id,
    playerName: player.name,
    teamId: team._id,
    teamName: team.name,
    refundAmount,
    remainingPurse: updatedTeam.remainingPurse,
  });

  return { player, team: updatedTeam, refundAmount };
};

/**
 * Advance to the next auction round.
 * All unsold players are moved back to the pool for re-bidding.
 */
const advanceRound = async (auctionId, userId) => {
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new ApiError(404, 'Auction not found');
  if (!['live', 'paused'].includes(auction.status)) throw new ApiError(400, 'Auction must be live or paused');
  if (auction.unsoldPlayerIds.length === 0) throw new ApiError(400, 'No unsold players to re-introduce');

  // Move all unsold players back to pool
  await Player.updateMany({ _id: { $in: auction.unsoldPlayerIds } }, { status: 'pool' });

  const newRound = (auction.currentRound || 1) + 1;
  auction.unsoldPlayerIds = [];
  auction.currentRound = newRound;
  await auction.save();

  await BidEvent.create({ auctionId, eventType: 'round_advanced', triggeredBy: userId });

  getIO().to(auctionRoom(auctionId)).emit('auction:round_advanced', { round: newRound });

  return { round: newRound };
};

/**
 * Set the current bid manually (offline mode only). Called via REST by admin.
 * Broadcasts the same auction:bid_placed event as a regular bid.
 */
const setOfflineBid = async (auctionId, { teamId, amount }, adminId) => {
  const [auction, team] = await Promise.all([
    Auction.findById(auctionId),
    Team.findById(teamId),
  ]);
  if (!auction) throw new ApiError(404, 'Auction not found');
  if (auction.status !== 'live') throw new ApiError(400, 'Auction is not live');
  if (auction.mode !== 'offline') throw new ApiError(400, 'This action is only available in offline mode');
  if (!auction.currentPlayerId) throw new ApiError(400, 'No player is currently on the block');
  if (!team) throw new ApiError(404, 'Team not found');
  if (typeof amount !== 'number' || amount <= 0) throw new ApiError(400, 'amount must be a positive number');

  auction.currentBid = amount;
  auction.currentBidTeamId = teamId;
  await auction.save();

  await BidEvent.create({
    auctionId,
    playerId: auction.currentPlayerId,
    teamId,
    amount,
    eventType: 'bid',
    triggeredBy: adminId,
  });

  getIO().to(auctionRoom(auctionId)).emit('auction:bid_placed', {
    teamId,
    teamName: team.name,
    teamShortName: team.shortName,
    amount,
    timestamp: new Date(),
  });

  return { currentBid: amount, currentBidTeamId: teamId };
};

module.exports = { startAuction, pauseAuction, resumeAuction, endAuction, putNextPlayer, markSold, markUnsold, placeBid, releasePlayer, advanceRound, setOfflineBid };
