const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Team = require('../models/Team');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, teamId: user.teamId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'viewer', teamId } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'name, email and password are required');

  const passwordHash = await bcrypt.hash(password, 10);
  const approvalStatus = role === 'team_owner' ? 'pending' : 'na';
  const user = await User.create({ name, email, passwordHash, role, teamId: teamId || null, approvalStatus });
  const token = signToken(user);

  res.status(201).json({ success: true, token, user: { id: user._id, name, email, role, teamId: user.teamId, approvalStatus: user.approvalStatus } });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'email and password are required');

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Invalid email or password');

  if (user.approvalStatus === 'pending') {
    throw new ApiError(403, 'Your account is pending admin approval. Please wait for confirmation.');
  }
  if (user.approvalStatus === 'rejected') {
    throw new ApiError(403, 'Your account registration was rejected. Contact the admin for more details.');
  }

  const token = signToken(user);
  res.json({ success: true, token, user: { id: user._id, name: user.name, email, role: user.role, teamId: user.teamId, approvalStatus: user.approvalStatus } });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

const getMyTeam = asyncHandler(async (req, res) => {
  if (!req.user.teamId) {
    return res.json({ success: true, team: null });
  }
  const team = await Team.findById(req.user.teamId).populate('players.playerId');
  res.json({ success: true, team: team || null });
});

module.exports = { register, login, me, getMyTeam };
