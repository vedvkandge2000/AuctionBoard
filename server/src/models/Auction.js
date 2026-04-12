const mongoose = require('mongoose');

const bidIncrementTierSchema = new mongoose.Schema(
  {
    upToAmount: { type: Number, required: true }, // use Infinity sentinel = 999999999
    increment: { type: Number, required: true },
  },
  { _id: false }
);

const auctionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sport: { type: String, default: 'cricket', trim: true },
    status: { type: String, enum: ['draft', 'live', 'paused', 'completed'], default: 'draft' },

    // Currency config
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    currencyUnit: { type: String, default: 'lakh' }, // display unit label

    // Purse
    defaultPursePerTeam: { type: Number, default: 12500 }, // stored in lakhs

    // Squad rules
    minSquadSize: { type: Number, default: 18, min: 0 },
    maxSquadSize: { type: Number, default: 25, min: 1 },
    maxOverseasPlayers: { type: Number, default: 8, min: 0 }, // 0 = unlimited
    minMalePlayers: { type: Number, default: 0, min: 0 }, // 0 = not enforced
    minFemalePlayers: { type: Number, default: 0, min: 0 }, // 0 = not enforced

    // Bid increments
    bidIncrementTiers: {
      type: [bidIncrementTierSchema],
      default: [
        { upToAmount: 100, increment: 5 },
        { upToAmount: 500, increment: 20 },
        { upToAmount: 1000, increment: 50 },
        { upToAmount: 999999999, increment: 100 },
      ],
    },

    // RTM
    rtmEnabled: { type: Boolean, default: false },
    rtmCardsPerTeam: { type: Number, default: 1 },

    // Player categories (sport-specific)
    playerRoles: {
      type: [String],
      default: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'],
    },

    // Live auction state (denormalized for fast reads)
    currentPlayerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
    currentBid: { type: Number, default: 0 },
    currentBidTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    bidStartedAt: { type: Date, default: null },

    // Player ordering & outcomes
    auctionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    soldPlayerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    unsoldPlayerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Auction', auctionSchema);
