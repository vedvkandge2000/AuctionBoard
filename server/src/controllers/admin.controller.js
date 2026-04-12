const User = require('../models/User');
const PlayerRegistration = require('../models/PlayerRegistration');
const Player = require('../models/Player');
const Auction = require('../models/Auction');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/pending-users
const listPendingUsers = asyncHandler(async (req, res) => {
  const { status = 'pending' } = req.query;
  const users = await User.find({ role: 'team_owner', approvalStatus: status })
    .select('-passwordHash')
    .sort({ createdAt: -1 });
  res.json({ success: true, users });
});

// POST /api/admin/users/:userId/approve
const approveUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { approvalStatus: 'approved' },
    { new: true }
  ).select('-passwordHash');
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

// POST /api/admin/users/:userId/reject
const rejectUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { approvalStatus: 'rejected' },
    { new: true }
  ).select('-passwordHash');
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

// GET /api/admin/pending-players
const listPendingPlayers = asyncHandler(async (req, res) => {
  const { status = 'pending' } = req.query;
  const registrations = await PlayerRegistration.find({ status }).sort({ createdAt: -1 });
  res.json({ success: true, registrations });
});

// POST /api/admin/players/:registrationId/approve
// Body: { auctionId, setNumber? }
const approvePlayer = asyncHandler(async (req, res) => {
  const registration = await PlayerRegistration.findById(req.params.registrationId);
  if (!registration) throw new ApiError(404, 'Registration not found');
  if (registration.status !== 'pending') throw new ApiError(400, 'Registration is no longer pending');

  const { auctionId, setNumber = 1 } = req.body;
  if (!auctionId) throw new ApiError(400, 'auctionId is required to assign the player');

  const auction = await Auction.findById(auctionId);
  if (!auction) throw new ApiError(404, 'Auction not found');

  const player = await Player.create({
    auctionId,
    name: registration.name,
    role: registration.role,
    nationality: registration.nationality,
    country: registration.country,
    basePrice: registration.basePrice,
    photoUrl: registration.photoUrl,
    stats: registration.stats,
    setNumber,
  });

  registration.status = 'approved';
  registration.assignedAuctionId = auctionId;
  registration.approvedPlayerId = player._id;
  await registration.save();

  res.json({ success: true, player, registration });
});

// POST /api/admin/players/:registrationId/reject
const rejectPlayer = asyncHandler(async (req, res) => {
  const registration = await PlayerRegistration.findByIdAndUpdate(
    req.params.registrationId,
    { status: 'rejected', rejectionReason: req.body.reason || '' },
    { new: true }
  );
  if (!registration) throw new ApiError(404, 'Registration not found');
  res.json({ success: true, registration });
});

// GET /api/admin/approved-owners — list of approved team owners for the team creation dropdown
const listApprovedOwners = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'team_owner', approvalStatus: 'approved' })
    .select('_id name email teamId')
    .sort({ name: 1 });
  res.json({ success: true, users });
});

module.exports = { listPendingUsers, approveUser, rejectUser, listPendingPlayers, approvePlayer, rejectPlayer, listApprovedOwners };
