const Auction = require('../models/Auction');
const AuctionMembership = require('../models/AuctionMembership');
const Team = require('../models/Team');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/memberships — team owner applies to join an auction
const applyToAuction = asyncHandler(async (req, res) => {
  const { auctionId } = req.body;
  if (!auctionId) throw new ApiError(400, 'auctionId is required');

  const auction = await Auction.findById(auctionId);
  if (!auction) throw new ApiError(404, 'Auction not found');
  if (auction.status === 'completed') throw new ApiError(400, 'Cannot apply to a completed auction');

  try {
    const membership = await AuctionMembership.create({
      userId: req.user.id,
      auctionId,
    });
    res.status(201).json({ success: true, membership });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'You have already applied to this auction');
    }
    throw err;
  }
});

// GET /api/memberships/mine — get all of the current user's memberships
const getMyMemberships = asyncHandler(async (req, res) => {
  const memberships = await AuctionMembership.find({ userId: req.user.id })
    .populate('auctionId', 'name sport status createdAt')
    .sort({ createdAt: -1 })
    .lean();

  // For approved memberships, look up whether a team exists
  const approvedAuctionIds = memberships
    .filter((m) => m.status === 'approved')
    .map((m) => m.auctionId?._id);

  const teams = approvedAuctionIds.length
    ? await Team.find({ auctionId: { $in: approvedAuctionIds }, ownerId: req.user.id })
        .select('_id name auctionId')
        .lean()
    : [];

  const teamByAuction = Object.fromEntries(teams.map((t) => [t.auctionId.toString(), t]));

  const result = memberships.map((m) => ({
    ...m,
    team: m.status === 'approved' ? (teamByAuction[m.auctionId?._id?.toString()] || null) : null,
  }));

  res.json({ success: true, memberships: result });
});

// DELETE /api/memberships/:id — withdraw a pending application
const withdrawApplication = asyncHandler(async (req, res) => {
  const membership = await AuctionMembership.findOne({ _id: req.params.id, userId: req.user.id });
  if (!membership) throw new ApiError(404, 'Application not found');
  if (membership.status !== 'pending') {
    throw new ApiError(400, 'Only pending applications can be withdrawn');
  }
  await membership.deleteOne();
  res.json({ success: true, message: 'Application withdrawn' });
});

module.exports = { applyToAuction, getMyMemberships, withdrawApplication };
