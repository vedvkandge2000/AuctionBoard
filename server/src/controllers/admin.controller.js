const User = require('../models/User');
const PlayerRegistration = require('../models/PlayerRegistration');
const Player = require('../models/Player');
const Auction = require('../models/Auction');
const AuctionMembership = require('../models/AuctionMembership');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const requireAuctionOwner = require('../utils/requireAuctionOwner');

// Helper: get IDs of all auctions owned by this admin
const getAdminAuctionIds = async (adminId) => {
  const auctions = await Auction.find({ createdBy: adminId }).select('_id').lean();
  return auctions.map((a) => a._id);
};

// GET /api/admin/memberships?status=pending — list auction membership applications scoped to this admin
const listPendingMemberships = asyncHandler(async (req, res) => {
  const { status = 'pending' } = req.query;
  const auctionIds = await getAdminAuctionIds(req.user.id);
  const memberships = await AuctionMembership.find({
    auctionId: { $in: auctionIds },
    status,
  })
    .populate('userId', 'name email')
    .populate('auctionId', 'name sport')
    .sort({ createdAt: -1 });
  res.json({ success: true, memberships });
});

// POST /api/admin/memberships/:membershipId/approve
const approveMembership = asyncHandler(async (req, res) => {
  const membership = await AuctionMembership.findById(req.params.membershipId);
  if (!membership) throw new ApiError(404, 'Membership application not found');
  await requireAuctionOwner(membership.auctionId, req.user.id);
  membership.status = 'approved';
  membership.rejectionReason = '';
  await membership.save();
  res.json({ success: true, membership });
});

// POST /api/admin/memberships/:membershipId/reject
const rejectMembership = asyncHandler(async (req, res) => {
  const membership = await AuctionMembership.findById(req.params.membershipId);
  if (!membership) throw new ApiError(404, 'Membership application not found');
  await requireAuctionOwner(membership.auctionId, req.user.id);
  membership.status = 'rejected';
  membership.rejectionReason = req.body.reason || '';
  await membership.save();
  res.json({ success: true, membership });
});

// GET /api/admin/pending-players
// Only returns registrations for auctions owned by this admin
const listPendingPlayers = asyncHandler(async (req, res) => {
  const { status = 'pending' } = req.query;

  // Scope to this admin's auctions only
  const adminAuctions = await Auction.find({ createdBy: req.user.id }).select('_id').lean();
  const adminAuctionIds = adminAuctions.map((a) => a._id);

  const registrations = await PlayerRegistration.find({
    status,
    auctionId: { $in: adminAuctionIds },
  })
    .populate('userId', 'name email')
    .populate('auctionId', 'name sport playerCategories categoryBasePrices')
    .sort({ createdAt: -1 });

  res.json({ success: true, registrations });
});


// POST /api/admin/players/:registrationId/approve
// Body: { setNumber?, category?, basePrice?, auctionId? (legacy only) }
// For account-linked registrations: auctionId comes from registration.auctionId (player already chose)
// For legacy anonymous registrations: auctionId must be provided in the body
const approvePlayer = asyncHandler(async (req, res) => {
  const registration = await PlayerRegistration.findById(req.params.registrationId);
  if (!registration) throw new ApiError(404, 'Registration not found');

  // Guard: only pending registrations can be approved
  if (registration.status === 'approved') {
    throw new ApiError(409, 'This registration has already been approved');
  }
  if (registration.status === 'rejected') {
    throw new ApiError(400, 'Cannot approve a rejected registration');
  }

  const { setNumber = 1, category: adminCategory, basePrice: adminBasePrice } = req.body;

  // Use the auction the player applied to; fall back to body-provided auctionId (legacy flow)
  const auctionId = registration.auctionId || req.body.auctionId;
  if (!auctionId) throw new ApiError(400, 'auctionId is required — player did not specify an auction');

  // Verify the target auction belongs to this admin
  const auction = await requireAuctionOwner(auctionId, req.user.id);

  // Prevent double-adding the same player to the same auction
  const alreadyExists = await Player.exists({ auctionId, name: registration.name });
  if (alreadyExists) throw new ApiError(409, 'A player with this name is already in the selected auction');

  // Category: admin provides it at approval time; fall back to registration's category if any
  const category = adminCategory || registration.category || null;

  // Auto-derive gender from category if applicable (F+/F → female, others → male)
  let gender = registration.gender || '';
  if (category) {
    if (['F+', 'F'].includes(category)) gender = 'female';
    else if (['A+', 'A', 'B'].includes(category)) gender = 'male';
  }

  // Base price: admin override → auction's categoryBasePrices → registration's basePrice
  let basePrice = 0;
  if (adminBasePrice !== undefined && Number(adminBasePrice) > 0) {
    basePrice = Number(adminBasePrice);
  } else if (category && auction.categoryBasePrices?.[category] != null) {
    basePrice = auction.categoryBasePrices[category];
  } else if (registration.basePrice > 0) {
    basePrice = registration.basePrice;
  }

  const player = await Player.create({
    auctionId,
    name: registration.name,
    role: registration.role,
    nationality: registration.nationality,
    country: registration.country,
    gender,
    category,
    basePrice,
    photoUrl: registration.photoUrl,
    stats: registration.stats,
    setNumber,
  });

  // Add to auction order (sorting by category happens in putNextPlayer at runtime)
  auction.auctionOrder.push(player._id);

  // Mark registration as approved so player can see their status
  registration.status = 'approved';
  registration.category = category || registration.category;

  await Promise.all([auction.save(), registration.save()]);

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

// GET /api/admin/approved-owners — approved membership owners scoped to this admin's auctions
const listApprovedOwners = asyncHandler(async (req, res) => {
  const auctionIds = await getAdminAuctionIds(req.user.id);
  const memberships = await AuctionMembership.find({
    auctionId: { $in: auctionIds },
    status: 'approved',
  })
    .populate('userId', '_id name email')
    .sort({ createdAt: -1 });
  const users = memberships.map((m) => m.userId).filter(Boolean);
  res.json({ success: true, users });
});

module.exports = {
  listPendingMemberships, approveMembership, rejectMembership,
  listPendingPlayers, approvePlayer, rejectPlayer,
  listApprovedOwners,
};
