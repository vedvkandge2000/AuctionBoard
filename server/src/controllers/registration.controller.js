const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PlayerRegistration = require('../models/PlayerRegistration');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Public: Team owner self-registration (awaits admin approval)
const registerTeamOwner = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email and password are required');
  }
  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name, email, passwordHash, role: 'team_owner', approvalStatus: 'pending' });

  res.status(201).json({
    success: true,
    message: 'Registration submitted. An admin will review and approve your account.',
  });
});

// Public: Player self-registration (awaits admin approval)
const registerPlayer = asyncHandler(async (req, res) => {
  const { name, role, nationality, country, basePrice, contactEmail, stats } = req.body;
  if (!name || !role || basePrice === undefined) {
    throw new ApiError(400, 'name, role and basePrice are required');
  }

  const registration = await PlayerRegistration.create({
    name,
    role,
    nationality: nationality || 'domestic',
    country: country || '',
    basePrice: Number(basePrice),
    contactEmail: contactEmail || '',
    stats: stats || {},
  });

  res.status(201).json({
    success: true,
    message: 'Player registration submitted. Admin will review your application.',
    registrationId: registration._id,
  });
});

module.exports = { registerTeamOwner, registerPlayer };
