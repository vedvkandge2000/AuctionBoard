const Team = require('../models/Team');
const Auction = require('../models/Auction');
const Player = require('../models/Player');
const AuctionMembership = require('../models/AuctionMembership');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const requireAuctionOwner = require('../utils/requireAuctionOwner');

// List teams for an auction
// ?squads=1 (admin only) — include squad with populated player docs
const listTeams = asyncHandler(async (req, res) => {
  let query = Team.find({ auctionId: req.params.id }).populate('ownerId', 'name email');
  if (req.query.squads === '1' && req.user.role === 'admin') {
    query = query.populate('players.playerId', 'name role category gender');
  } else {
    query = query.select('-players -releasedPlayerIds');
  }
  const teams = await query;
  res.json({ success: true, teams });
});

// Create team
const createTeam = asyncHandler(async (req, res) => {
  let auction;
  if (req.user.role === 'admin') {
    auction = await requireAuctionOwner(req.params.id, req.user.id);
  } else {
    auction = await Auction.findById(req.params.id);
    if (!auction) throw new ApiError(404, 'Auction not found');
    // Team owners must have an approved membership for this auction
    const membership = await AuctionMembership.findOne({
      userId: req.user.id,
      auctionId: req.params.id,
      status: 'approved',
    });
    if (!membership) throw new ApiError(403, 'You must be an approved member of this auction to create a team');
  }

  // Team owners automatically become the owner; admins can specify an ownerId
  const ownerId = req.user.role === 'team_owner' ? req.user.id : (req.body.ownerId || null);

  // Enforce: one team per owner per auction (regardless of who is creating)
  if (ownerId) {
    const existing = await Team.findOne({ auctionId: req.params.id, ownerId });
    if (existing) {
      throw new ApiError(409, req.user.role === 'team_owner'
        ? 'You already have a team in this auction'
        : 'This owner already has a team in this auction');
    }
  }

  const purse = req.body.initialPurse !== undefined ? Number(req.body.initialPurse) : auction.defaultPursePerTeam;
  const rtmCards = auction.rtmEnabled ? auction.rtmCardsPerTeam : 0;

  const { ownerId: _ignored, ...bodyWithoutOwnerId } = req.body;
  const team = await Team.create({
    ...bodyWithoutOwnerId,
    auctionId: req.params.id,
    ownerId,
    initialPurse: purse,
    remainingPurse: purse,
    rtmCardsRemaining: rtmCards,
  });

  res.status(201).json({ success: true, team });
});

// Update team
const TEAM_UPDATE_ALLOWED = ['name', 'shortName', 'logoUrl', 'colorHex', 'ownerId', 'initialPurse', 'remainingPurse', 'rtmCardsRemaining'];
const updateTeam = asyncHandler(async (req, res) => {
  await requireAuctionOwner(req.params.id, req.user.id);
  const updates = {};
  TEAM_UPDATE_ALLOWED.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

  const team = await Team.findOneAndUpdate(
    { _id: req.params.tid, auctionId: req.params.id },
    updates,
    { new: true, runValidators: true }
  );
  if (!team) throw new ApiError(404, 'Team not found');

  res.json({ success: true, team });
});

// Delete team
const deleteTeam = asyncHandler(async (req, res) => {
  await requireAuctionOwner(req.params.id, req.user.id);
  const team = await Team.findOneAndDelete({ _id: req.params.tid, auctionId: req.params.id });
  if (!team) throw new ApiError(404, 'Team not found');
  res.json({ success: true, message: 'Team deleted' });
});

// Get team squad — any authenticated user can view any squad (read-only)
const getSquad = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ _id: req.params.tid, auctionId: req.params.id })
    .populate('players.playerId');
  if (!team) throw new ApiError(404, 'Team not found');
  res.json({ success: true, team });
});

module.exports = { listTeams, createTeam, updateTeam, deleteTeam, getSquad };
