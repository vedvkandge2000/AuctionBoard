const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Team = require('../models/Team');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL } = require('../config/env');
const { sendResetEmail } = require('../services/emailService');

const NAME_REGEX = /^[a-zA-Z\s]{2,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'viewer' } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'name, email and password are required');
  if (!NAME_REGEX.test(name.trim())) throw new ApiError(400, 'Name must be at least 2 characters and contain only letters and spaces');
  if (!EMAIL_REGEX.test(email.trim())) throw new ApiError(400, 'Enter a valid email address');
  if (!PASSWORD_REGEX.test(password)) throw new ApiError(400, 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash, role });
  const token = signToken(user);

  res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role } });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'email and password are required');
  if (!EMAIL_REGEX.test(email.trim())) throw new ApiError(400, 'Enter a valid email address');

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Invalid email or password');

  const token = signToken(user);
  res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

const getMyTeam = asyncHandler(async (req, res) => {
  const { auctionId } = req.query;
  if (auctionId) {
    const team = await Team.findOne({ auctionId, ownerId: req.user.id })
      .populate('players.playerId')
      .populate('auctionId', 'name currencySymbol currencyUnit');
    return res.json({ success: true, team: team || null });
  }
  // No auctionId — return all teams owned by this user across all auctions
  const teams = await Team.find({ ownerId: req.user.id })
    .populate('players.playerId')
    .populate('auctionId', 'name currencySymbol currencyUnit');
  res.json({ success: true, teams });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !NAME_REGEX.test(name.trim())) {
    throw new ApiError(400, 'Name must be at least 2 characters and contain only letters and spaces');
  }
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name: name.trim() },
    { new: true, runValidators: true }
  ).select('-passwordHash');
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, 'oldPassword, newPassword and confirmPassword are required');
  }
  if (!PASSWORD_REGEX.test(newPassword)) {
    throw new ApiError(400, 'New password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, 'Passwords do not match');
  }

  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');

  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Current password is incorrect');

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
});

const deleteMe = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) throw new ApiError(400, 'Password is required to delete your account');

  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Incorrect password');

  await User.findByIdAndDelete(req.user.id);
  // Note: associated Team is left intact (known v1 limitation — team ownership becomes orphaned)

  res.json({ success: true, message: 'Account deleted successfully' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');

  // Always return the same message to prevent user enumeration
  const GENERIC_MSG = "If that email is registered, you'll receive a reset link shortly. Check your inbox.";

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${CLIENT_URL}/reset-password/${token}`;
    await sendResetEmail(user.email, resetUrl);
  }

  res.json({ success: true, message: GENERIC_MSG });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;
  if (!password || !confirmPassword) throw new ApiError(400, 'password and confirmPassword are required');
  if (!PASSWORD_REGEX.test(password)) {
    throw new ApiError(400, 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
  }
  if (password !== confirmPassword) throw new ApiError(400, 'Passwords do not match');

  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) throw new ApiError(400, 'Reset link is invalid or has expired');

  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.json({ success: true, message: 'Password has been reset. You can now log in.' });
});

module.exports = { register, login, me, getMyTeam, updateMe, changePassword, deleteMe, forgotPassword, resetPassword };
