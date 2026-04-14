const PlayerReleaseRequest = require('../models/PlayerReleaseRequest');
const Player = require('../models/Player');
const Team = require('../models/Team');
const BidEvent = require('../models/BidEvent');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const auctionEngine = require('../services/auctionEngine');
const { getIO } = require('../config/socket');
const { auctionRoom } = require('../socket/roomManager');

// Team owner: request release of one of their players
const createRequest = asyncHandler(async (req, res) => {
  const { playerId, reason = '' } = req.body;
  if (!playerId) throw new ApiError(400, 'playerId is required');

  // Find the team owned by this user in this auction
  const team = await Team.findOne({ auctionId: req.params.id, ownerId: req.user.id });
  if (!team) throw new ApiError(403, 'You do not own a team in this auction');

  // Verify the player is in this team's squad
  const inSquad = team.players.some((p) => p.playerId.equals(playerId));
  if (!inSquad) throw new ApiError(400, 'This player is not in your squad');

  // No duplicate pending request
  const existing = await PlayerReleaseRequest.findOne({
    auctionId: req.params.id,
    playerId,
    teamId: team._id,
    status: 'pending',
  });
  if (existing) throw new ApiError(409, 'A release request for this player is already pending');

  const player = await Player.findById(playerId).select('name');
  if (!player) throw new ApiError(404, 'Player not found');

  const request = await PlayerReleaseRequest.create({
    auctionId: req.params.id,
    teamId: team._id,
    playerId,
    requestedBy: req.user.id,
    reason,
  });

  await BidEvent.create({
    auctionId: req.params.id,
    playerId,
    teamId: team._id,
    eventType: 'player_release_requested',
    triggeredBy: req.user.id,
  });

  // Populate for socket emit
  const populated = await PlayerReleaseRequest.findById(request._id)
    .populate('playerId', 'name role category')
    .populate('teamId', 'name shortName colorHex')
    .populate('requestedBy', 'name');

  getIO().to(auctionRoom(req.params.id)).emit('auction:release_requested', { request: populated });

  res.status(201).json({ success: true, request: populated });
});

// Admin: list all pending release requests for an auction
const listRequests = asyncHandler(async (req, res) => {
  const { status = 'pending' } = req.query;
  const requests = await PlayerReleaseRequest.find({ auctionId: req.params.id, status })
    .populate('playerId', 'name role category')
    .populate('teamId', 'name shortName colorHex')
    .populate('requestedBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, requests });
});

// Admin: approve a release request
const approveRequest = asyncHandler(async (req, res) => {
  const request = await PlayerReleaseRequest.findOne({
    _id: req.params.reqId,
    auctionId: req.params.id,
    status: 'pending',
  });
  if (!request) throw new ApiError(404, 'Pending release request not found');

  // Execute the actual release via engine
  const result = await auctionEngine.releasePlayer(req.params.id, request.playerId.toString(), req.user.id);

  // Mark request approved
  request.status = 'approved';
  request.reviewedBy = req.user.id;
  request.reviewedAt = new Date();
  await request.save();

  const populated = await PlayerReleaseRequest.findById(request._id)
    .populate('playerId', 'name role category')
    .populate('teamId', 'name shortName colorHex');

  getIO().to(auctionRoom(req.params.id)).emit('auction:release_approved', {
    request: populated,
    refundAmount: result.refundAmount,
  });

  res.json({ success: true, request: populated, ...result });
});

// Admin: reject a release request
const rejectRequest = asyncHandler(async (req, res) => {
  const { rejectionNote = '' } = req.body;
  const request = await PlayerReleaseRequest.findOne({
    _id: req.params.reqId,
    auctionId: req.params.id,
    status: 'pending',
  });
  if (!request) throw new ApiError(404, 'Pending release request not found');

  request.status = 'rejected';
  request.reviewedBy = req.user.id;
  request.reviewedAt = new Date();
  request.rejectionNote = rejectionNote;
  await request.save();

  await BidEvent.create({
    auctionId: req.params.id,
    playerId: request.playerId,
    teamId: request.teamId,
    eventType: 'player_release_rejected',
    triggeredBy: req.user.id,
  });

  const populated = await PlayerReleaseRequest.findById(request._id)
    .populate('playerId', 'name role category')
    .populate('teamId', 'name shortName colorHex');

  getIO().to(auctionRoom(req.params.id)).emit('auction:release_rejected', { request: populated, rejectionNote });

  res.json({ success: true, request: populated });
});

module.exports = { createRequest, listRequests, approveRequest, rejectRequest };
