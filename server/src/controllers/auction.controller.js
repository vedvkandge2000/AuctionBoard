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

// Delete auction (draft only)
const deleteAuction = asyncHandler(async (req, res) => {
  const auction = await requireAuctionOwner(req.params.id, req.user.id);
  if (auction.status !== 'draft') throw new ApiError(400, 'Can only delete a draft auction');

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

module.exports = { createAuction, getAuction, listAuctions, browseAuctions, updateConfig, deleteAuction, getOrder, setOrder };
