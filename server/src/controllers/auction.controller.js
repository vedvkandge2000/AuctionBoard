const Auction = require('../models/Auction');
const Player = require('../models/Player');
const Team = require('../models/Team');
const BidEvent = require('../models/BidEvent');
const AuctionMembership = require('../models/AuctionMembership');
const PlayerRegistration = require('../models/PlayerRegistration');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const requireAuctionOwner = require('../utils/requireAuctionOwner');

// Create a new auction
const createAuction = asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) throw new ApiError(400, 'Auction name is required');
  const auction = await Auction.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, auction });
});

// Get auction by ID (includes live state)
const getAuction = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id)
    .populate('currentPlayerId')
    .populate('currentBidTeamId', 'name shortName colorHex');
  if (!auction) throw new ApiError(404, 'Auction not found');
  res.json({ success: true, auction });
});

// List auctions — scoped by role
const listAuctions = asyncHandler(async (req, res) => {
  const { role, id: userId } = req.user;
  let filter = {};

  if (role === 'admin') {
    filter = { createdBy: userId };
  } else if (role === 'team_owner') {
    // Show only auctions where the user has an approved membership
    const memberships = await AuctionMembership.find({ userId, status: 'approved' }).select('auctionId').lean();
    filter = { _id: { $in: memberships.map((m) => m.auctionId) } };
  } else if (role === 'player') {
    // Show only auctions where the player has an approved registration
    const registrations = await PlayerRegistration.find({ userId, status: 'approved' }).select('auctionId').lean();
    filter = { _id: { $in: registrations.map((r) => r.auctionId) } };
  }
  // viewer: no filter — sees all

  const auctions = await Auction.find(filter)
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .select('-auctionOrder -soldPlayerIds -unsoldPlayerIds');
  res.json({ success: true, auctions });
});

// Update auction config (only in draft)
const updateConfig = asyncHandler(async (req, res) => {
  const auction = await requireAuctionOwner(req.params.id, req.user.id);
  if (auction.status !== 'draft') throw new ApiError(400, 'Can only edit config when auction is in draft status');

  const allowed = [
    'name', 'sport', 'currency', 'currencySymbol', 'currencyUnit',
    'defaultPursePerTeam', 'minSquadSize', 'maxSquadSize', 'maxOverseasPlayers',
    'minMalePlayers', 'minFemalePlayers',
    'bidIncrementTiers', 'rtmEnabled', 'rtmCardsPerTeam', 'playerRoles',
    'playerCategories', 'categoryBasePrices',
  ];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) auction[key] = req.body[key];
  });

  await auction.save();
  res.json({ success: true, auction });
});

// Delete auction (draft or completed)
const deleteAuction = asyncHandler(async (req, res) => {
  const auction = await requireAuctionOwner(req.params.id, req.user.id);
  if (!['draft', 'completed'].includes(auction.status)) throw new ApiError(400, 'Can only delete a draft or completed auction');

  await Promise.all([
    auction.deleteOne(),
    Player.deleteMany({ auctionId: auction._id }),
    Team.deleteMany({ auctionId: auction._id }),
    BidEvent.deleteMany({ auctionId: auction._id }),
  ]);

  res.json({ success: true, message: 'Auction deleted' });
});

// Get auction order
const getOrder = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id).populate('auctionOrder', 'name role nationality basePrice status photoUrl');
  if (!auction) throw new ApiError(404, 'Auction not found');
  res.json({ success: true, order: auction.auctionOrder });
});

// Set auction order
const setOrder = asyncHandler(async (req, res) => {
  const { playerIds } = req.body;
  if (!Array.isArray(playerIds)) throw new ApiError(400, 'playerIds must be an array');
  const auction = await requireAuctionOwner(req.params.id, req.user.id);
  auction.auctionOrder = playerIds;
  await auction.save();
  res.json({ success: true, order: auction.auctionOrder });
});

// GET /api/auctions/browse — all open/active auctions with role-specific status enrichment
const browseAuctions = asyncHandler(async (req, res) => {
  const auctions = await Auction.find(
    { status: { $in: ['draft', 'live', 'paused'] } }
  )
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .select('-auctionOrder -soldPlayerIds -unsoldPlayerIds')
    .lean();

  if (req.user.role === 'team_owner') {
    const memberships = await AuctionMembership.find({ userId: req.user.id })
      .select('auctionId status')
      .lean();
    const membershipMap = Object.fromEntries(
      memberships.map((m) => [m.auctionId.toString(), m])
    );
    const result = auctions.map((a) => {
      const mem = membershipMap[a._id.toString()];
      return { ...a, myMembershipStatus: mem ? mem.status : 'none', myMembershipId: mem ? mem._id : null };
    });
    return res.json({ success: true, auctions: result });
  }

  if (req.user.role === 'player') {
    const registrations = await PlayerRegistration.find({ userId: req.user.id })
      .select('auctionId status')
      .lean();
    const regMap = Object.fromEntries(
      registrations.map((r) => [r.auctionId.toString(), r])
    );
    const result = auctions.map((a) => {
      const reg = regMap[a._id.toString()];
      return { ...a, myRegistrationStatus: reg ? reg.status : 'none', myRegistrationId: reg ? reg._id : null };
    });
    return res.json({ success: true, auctions: result });
  }

  res.json({ success: true, auctions });
});

// GET /api/auctions/:id/report — post-auction analytics
const getReport = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id).lean();
  if (!auction) throw new ApiError(404, 'Auction not found');

  // Auth: admin who owns it, OR approved team-owner member
  if (req.user.role === 'admin') {
    if (auction.createdBy.toString() !== req.user.id) throw new ApiError(403, 'Not your auction');
  } else if (req.user.role === 'team_owner') {
    const membership = await AuctionMembership.findOne({
      auctionId: auction._id, userId: req.user.id, status: 'approved',
    });
    if (!membership) throw new ApiError(403, 'Not a member of this auction');
  } else {
    throw new ApiError(403, 'Not authorised to view this report');
  }

  const [teams, players] = await Promise.all([
    Team.find({ auctionId: auction._id })
      .populate({ path: 'players.playerId', select: 'name role category nationality basePrice' })
      .lean(),
    Player.find({ auctionId: auction._id }).lean(),
  ]);

  const soldPlayers = players.filter((p) => p.status === 'sold');
  const unsoldPlayers = players.filter((p) => p.status === 'unsold');

  const teamById = {};
  const teamRows = teams.map((t) => {
    const totalSpent = t.initialPurse - t.remainingPurse;
    const row = {
      _id: t._id,
      name: t.name,
      shortName: t.shortName,
      colorHex: t.colorHex,
      initialPurse: t.initialPurse,
      remainingPurse: t.remainingPurse,
      totalSpent,
      playerCount: t.players.length,
      players: t.players.map((e) => ({
        name: e.playerId?.name,
        role: e.playerId?.role,
        category: e.playerId?.category,
        nationality: e.playerId?.nationality,
        basePrice: e.playerId?.basePrice,
        finalPrice: e.pricePaid,
      })),
    };
    teamById[t._id.toString()] = { name: t.name, shortName: t.shortName, colorHex: t.colorHex };
    return row;
  });

  const soldRows = soldPlayers
    .map((p) => ({
      _id: p._id,
      name: p.name,
      role: p.role,
      category: p.category,
      nationality: p.nationality,
      basePrice: p.basePrice,
      finalPrice: p.finalPrice,
      team: teamById[p.soldToTeamId?.toString()] || null,
    }))
    .sort((a, b) => b.finalPrice - a.finalPrice);

  const prices = soldPlayers.map((p) => p.finalPrice);
  const totalSpent = prices.reduce((s, v) => s + v, 0);

  const catMap = {};
  players.forEach((p) => {
    const key = p.category || 'Uncategorised';
    if (!catMap[key]) catMap[key] = { category: key, total: 0, sold: 0, unsold: 0, totalSpent: 0 };
    catMap[key].total++;
    if (p.status === 'sold') { catMap[key].sold++; catMap[key].totalSpent += p.finalPrice; }
    if (p.status === 'unsold') catMap[key].unsold++;
  });
  const categoryBreakdown = Object.values(catMap).map((c) => ({
    ...c, avgPrice: c.sold > 0 ? Math.round(c.totalSpent / c.sold) : 0,
  }));

  const roleMap = {};
  players.forEach((p) => {
    const key = p.role || 'Unknown';
    if (!roleMap[key]) roleMap[key] = { role: key, total: 0, sold: 0, unsold: 0, totalSpent: 0 };
    roleMap[key].total++;
    if (p.status === 'sold') { roleMap[key].sold++; roleMap[key].totalSpent += p.finalPrice; }
    if (p.status === 'unsold') roleMap[key].unsold++;
  });
  const roleBreakdown = Object.values(roleMap).map((r) => ({
    ...r, avgPrice: r.sold > 0 ? Math.round(r.totalSpent / r.sold) : 0,
  }));

  res.json({
    success: true,
    auction: {
      name: auction.name,
      sport: auction.sport,
      status: auction.status,
      currentRound: auction.currentRound,
      currencySymbol: auction.currencySymbol,
      currencyUnit: auction.currencyUnit,
    },
    summary: {
      totalPlayers: players.length,
      soldCount: soldPlayers.length,
      unsoldCount: unsoldPlayers.length,
      poolCount: players.length - soldPlayers.length - unsoldPlayers.length,
      totalSpent,
      avgPrice: prices.length ? Math.round(totalSpent / prices.length) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      minPrice: prices.length ? Math.min(...prices) : 0,
    },
    teams: teamRows,
    soldPlayers: soldRows,
    categoryBreakdown,
    roleBreakdown,
  });
});

module.exports = { createAuction, getAuction, listAuctions, browseAuctions, updateConfig, deleteAuction, getOrder, setOrder, getReport };
