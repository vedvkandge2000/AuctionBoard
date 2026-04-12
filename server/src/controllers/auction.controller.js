const Auction = require('../models/Auction');
const Player = require('../models/Player');
const Team = require('../models/Team');
const BidEvent = require('../models/BidEvent');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

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

// List all auctions
const listAuctions = asyncHandler(async (req, res) => {
  const auctions = await Auction.find().sort({ createdAt: -1 }).select('-auctionOrder -soldPlayerIds -unsoldPlayerIds');
  res.json({ success: true, auctions });
});

// Update auction config (only in draft)
const updateConfig = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) throw new ApiError(404, 'Auction not found');
  if (auction.status !== 'draft') throw new ApiError(400, 'Can only edit config when auction is in draft status');

  const allowed = [
    'name', 'sport', 'currency', 'currencySymbol', 'currencyUnit',
    'defaultPursePerTeam', 'minSquadSize', 'maxSquadSize', 'maxOverseasPlayers',
    'minMalePlayers', 'minFemalePlayers',
    'bidIncrementTiers', 'rtmEnabled', 'rtmCardsPerTeam', 'playerRoles',
  ];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) auction[key] = req.body[key];
  });

  await auction.save();
  res.json({ success: true, auction });
});

// Delete auction (draft only)
const deleteAuction = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) throw new ApiError(404, 'Auction not found');
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
  const auction = await Auction.findById(req.params.id);
  if (!auction) throw new ApiError(404, 'Auction not found');
  auction.auctionOrder = playerIds;
  await auction.save();
  res.json({ success: true, order: auction.auctionOrder });
});

module.exports = { createAuction, getAuction, listAuctions, updateConfig, deleteAuction, getOrder, setOrder };
