const Player = require('../models/Player');
const Team = require('../models/Team');
const BidEvent = require('../models/BidEvent');
const ApiError = require('../utils/ApiError');
const { getIO } = require('../config/socket');
const { auctionRoom, teamRoom } = require('../socket/roomManager');

// In-memory store of pending RTM windows: { auctionId: { playerId, winningTeamId, finalPrice, eligibleTeams, responses, timer } }
const pendingRTM = new Map();

/**
 * Open RTM window after a player is sold.
 * Called from auctionEngine.markSold when rtmEnabled.
 */
const openRTMWindow = async (auction, player, winningTeamId, finalPrice) => {
  const auctionId = auction._id.toString();

  // Find eligible teams: have RTM cards, not the winning team
  const teams = await Team.find({ auctionId, rtmCardsRemaining: { $gt: 0 } });
  const eligible = teams.filter((t) => !t._id.equals(winningTeamId));

  if (eligible.length === 0) return; // No RTM candidates

  const winningTeam = await Team.findById(winningTeamId).select('name shortName');
  const expiresAt = new Date(Date.now() + 30_000); // 30s window

  const state = {
    playerId: player._id.toString(),
    winningTeamId: winningTeamId.toString(),
    finalPrice,
    eligible: eligible.map((t) => t._id.toString()),
    responses: {}, // teamId → 'exercised' | 'declined'
  };

  pendingRTM.set(auctionId, state);

  const io = getIO();
  // Prompt each eligible team in their private room
  for (const team of eligible) {
    io.to(teamRoom(team._id.toString())).emit('team:rtm_prompt', {
      player,
      winningBid: finalPrice,
      winningTeam,
      expiresAt: expiresAt.toISOString(),
    });
  }

  // Auto-expire after 30s
  state.timer = setTimeout(() => {
    closeRTMWindow(auctionId);
    io.to(auctionRoom(auctionId)).emit('auction:rtm_window_closed', { exercised: false });
    for (const team of eligible) {
      io.to(teamRoom(team._id.toString())).emit('team:rtm_expired');
    }
    pendingRTM.delete(auctionId);
  }, 30_000);
};

/**
 * Handle a team's RTM response.
 */
const handleRTMResponse = async (auctionId, teamId, exercise) => {
  const state = pendingRTM.get(auctionId);
  if (!state) throw new ApiError(400, 'No active RTM window');
  if (!state.eligible.includes(teamId)) throw new ApiError(403, 'Your team is not eligible for RTM');
  if (state.responses[teamId]) throw new ApiError(400, 'Already responded to RTM');

  state.responses[teamId] = exercise ? 'exercised' : 'declined';

  if (exercise) {
    // RTM exercised — transfer player, deduct card and purse
    const [player, rtmTeam] = await Promise.all([
      Player.findByIdAndUpdate(state.playerId, { soldToTeamId: teamId }, { new: true }),
      Team.findByIdAndUpdate(
        teamId,
        {
          $inc: { remainingPurse: -state.finalPrice, rtmCardsRemaining: -1 },
          $push: { players: { playerId: state.playerId, pricePaid: state.finalPrice, acquiredViaRtm: true } },
        },
        { new: true }
      ),
    ]);

    // Remove player from old winning team
    await Team.findByIdAndUpdate(state.winningTeamId, {
      $inc: { remainingPurse: state.finalPrice }, // refund
      $pull: { players: { playerId: state.playerId } },
    });

    await BidEvent.create({
      auctionId,
      playerId: state.playerId,
      teamId,
      amount: state.finalPrice,
      eventType: 'rtm_exercised',
    });

    clearTimeout(state.timer);
    pendingRTM.delete(auctionId);

    const io = getIO();
    io.to(auctionRoom(auctionId)).emit('auction:sold', {
      player,
      team: rtmTeam,
      finalPrice: state.finalPrice,
      viaRtm: true,
    });
    io.to(auctionRoom(auctionId)).emit('team:purse_update', {
      teamId,
      remainingPurse: rtmTeam.remainingPurse,
    });
    // Refund purse update for original team
    const originalTeam = await Team.findById(state.winningTeamId).select('remainingPurse');
    io.to(auctionRoom(auctionId)).emit('team:purse_update', {
      teamId: state.winningTeamId,
      remainingPurse: originalTeam.remainingPurse,
    });
  } else {
    await BidEvent.create({ auctionId, playerId: state.playerId, teamId, eventType: 'rtm_declined' });

    // If all eligible teams have declined, close window
    const allDeclined = state.eligible.every((t) => state.responses[t] === 'declined');
    if (allDeclined) {
      clearTimeout(state.timer);
      pendingRTM.delete(auctionId);
    }
  }
};

const closeRTMWindow = (auctionId) => {
  const state = pendingRTM.get(auctionId);
  if (state?.timer) clearTimeout(state.timer);
  pendingRTM.delete(auctionId);
};

module.exports = { openRTMWindow, handleRTMResponse, closeRTMWindow };
