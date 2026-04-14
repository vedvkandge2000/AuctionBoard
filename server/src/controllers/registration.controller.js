const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Auction = require('../models/Auction');
const PlayerRegistration = require('../models/PlayerRegistration');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const NAME_REGEX = /^[a-zA-Z\s]{2,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Public: Team owner self-registration — logs in immediately, applies to auctions separately
const registerTeamOwner = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email and password are required');
  }
  if (!NAME_REGEX.test(name.trim())) {
    throw new ApiError(400, 'Name must be at least 2 characters and contain only letters and spaces');
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    throw new ApiError(400, 'Enter a valid email address');
  }
  if (!PASSWORD_REGEX.test(password)) {
    throw new ApiError(400, 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
  }

  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    role: 'team_owner',
  });

  const token = signToken(user);
  res.status(201).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// Public: Player self-registration — creates a User account with role 'player', logs in immediately
// Players then discover auctions from their dashboard and apply via POST /register/player/apply
const registerPlayer = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email and password are required');
  }
  if (!NAME_REGEX.test(name.trim())) {
    throw new ApiError(400, 'Name must be at least 2 characters and contain only letters and spaces');
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    throw new ApiError(400, 'Enter a valid email address');
  }
  if (!PASSWORD_REGEX.test(password)) {
    throw new ApiError(400, 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
  }

  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    role: 'player',
  });

  const token = signToken(user);
  res.status(201).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// Protected (player role): Apply to an auction as a player
// Creates a PlayerRegistration linked to the player's User account and the target auction
const applyToAuction = asyncHandler(async (req, res) => {
  const { auctionId, role, gender, nationality, country, contactEmail, stats } = req.body;
  if (!auctionId) throw new ApiError(400, 'auctionId is required');
  if (!role?.trim()) throw new ApiError(400, 'role is required');
  if (contactEmail && !EMAIL_REGEX.test(contactEmail.trim())) {
    throw new ApiError(400, 'Enter a valid contact email address');
  }

  const [auction, user] = await Promise.all([
    Auction.findById(auctionId),
    User.findById(req.user.id).select('name'),
  ]);
  if (!auction) throw new ApiError(404, 'Auction not found');
  if (auction.status === 'completed') throw new ApiError(400, 'Cannot register for a completed auction');
  if (!user) throw new ApiError(404, 'User not found');

  const sanitizedStats = stats && typeof stats === 'object' && !Array.isArray(stats) ? stats : {};

  try {
    const registration = await PlayerRegistration.create({
      userId: req.user.id,
      auctionId,
      name: user.name,
      role: role.trim(),
      gender: gender || '',
      nationality: nationality || 'domestic',
      country: country || '',
      contactEmail: contactEmail ? contactEmail.trim() : '',
      stats: sanitizedStats,
    });
    res.status(201).json({ success: true, registration });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'You have already applied to this auction');
    }
    throw err;
  }
});

// Protected (player role): Get all of the current player's registrations
const getMyRegistrations = asyncHandler(async (req, res) => {
  const registrations = await PlayerRegistration.find({ userId: req.user.id })
    .populate({ path: 'auctionId', select: 'name sport status createdBy', populate: { path: 'createdBy', select: 'name' } })
    .sort({ createdAt: -1 });
  res.json({ success: true, registrations });
});

// Public: list open auctions for discovery (landing page / player discover tab)
const listOpenAuctions = asyncHandler(async (req, res) => {
  const auctions = await Auction.find(
    { status: { $in: ['draft', 'live'] } },
    'name sport status playerCategories categoryBasePrices createdBy'
  )
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, auctions });
});

module.exports = { registerTeamOwner, registerPlayer, applyToAuction, getMyRegistrations, listOpenAuctions };
