const mongoose = require('mongoose');

const bidEventSchema = new mongoose.Schema(
  {
    auctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    amount: { type: Number, default: 0 },
    eventType: {
      type: String,
      enum: [
        'bid',
        'bid_reversed',
        'sold',
        'unsold',
        'rtm_exercised',
        'rtm_declined',
        'auction_started',
        'auction_paused',
        'auction_resumed',
        'auction_ended',
        'player_set_live',
        'player_release_requested',
        'player_released',
        'player_release_rejected',
        'round_advanced',
      ],
      required: true,
    },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

bidEventSchema.index({ auctionId: 1, playerId: 1, createdAt: 1 });

module.exports = mongoose.model('BidEvent', bidEventSchema);
