const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const Auction = require('../../src/models/Auction');
const Player = require('../../src/models/Player');
const Team = require('../../src/models/Team');

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

const createAdminUser = async (overrides = {}) => {
  const pw = await bcrypt.hash('Password1!', 10);
  return User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    passwordHash: pw,
    role: 'admin',
    ...overrides,
  });
};

const createTeamOwnerUser = async (overrides = {}) => {
  const pw = await bcrypt.hash('Password1!', 10);
  return User.create({
    name: 'Team Owner',
    email: 'owner@test.com',
    passwordHash: pw,
    role: 'team_owner',
    ...overrides,
  });
};

// Kept for backward compatibility — team owners no longer have a global pending state
// but tests that need a team_owner user can still use this
const createPendingOwner = async (overrides = {}) => {
  const pw = await bcrypt.hash('Password1!', 10);
  return User.create({
    name: 'Pending Owner',
    email: 'pending@test.com',
    passwordHash: pw,
    role: 'team_owner',
    ...overrides,
  });
};

const getAuthHeader = (user) => {
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
  return { Authorization: `Bearer ${token}` };
};

const createAuction = async (adminId, overrides = {}) => {
  return Auction.create({
    name: 'Test Auction',
    sport: 'cricket',
    createdBy: adminId,
    status: 'draft',
    defaultPursePerTeam: 1000,
    minSquadSize: 5,
    maxSquadSize: 10,
    bidIncrementTiers: [{ upToAmount: 999999999, increment: 10 }],
    ...overrides,
  });
};

const createPlayer = async (auctionId, overrides = {}) => {
  return Player.create({
    auctionId,
    name: 'Test Player',
    role: 'Batsman',
    nationality: 'domestic',
    basePrice: 100,
    status: 'pool',
    ...overrides,
  });
};

const createTeam = async (auctionId, ownerId = null, overrides = {}) => {
  return Team.create({
    auctionId,
    name: 'Test Team',
    shortName: 'TST',
    colorHex: '#6366f1',
    ownerId,
    initialPurse: 1000,
    remainingPurse: 1000,
    rtmCardsRemaining: 0,
    ...overrides,
  });
};

module.exports = { createAdminUser, createTeamOwnerUser, createPendingOwner, getAuthHeader, createAuction, createPlayer, createTeam };
