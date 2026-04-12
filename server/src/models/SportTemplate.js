const mongoose = require('mongoose');

const bidIncrementTierSchema = new mongoose.Schema(
  {
    upToAmount: { type: Number, required: true },
    increment: { type: Number, required: true },
  },
  { _id: false }
);

const sportTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Cricket"
    sport: { type: String, required: true, trim: true, lowercase: true }, // slug, e.g. "cricket"
    icon: { type: String, default: '🎮' },
    description: { type: String, default: '' },

    // Mirror of Auction config fields
    playerRoles: { type: [String], default: [] },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    currencyUnit: { type: String, default: 'lakh' },
    defaultPursePerTeam: { type: Number, default: 1000 },
    minSquadSize: { type: Number, default: 10 },
    maxSquadSize: { type: Number, default: 20 },
    maxOverseasPlayers: { type: Number, default: 0 },
    minMalePlayers: { type: Number, default: 0 },
    minFemalePlayers: { type: Number, default: 0 },
    bidIncrementTiers: {
      type: [bidIncrementTierSchema],
      default: [{ upToAmount: 999999999, increment: 10 }],
    },
    rtmEnabled: { type: Boolean, default: false },
    rtmCardsPerTeam: { type: Number, default: 1 },

    isSeeded: { type: Boolean, default: false }, // true for built-in templates; prevents accidental deletion
  },
  { timestamps: true }
);

sportTemplateSchema.index({ sport: 1 }, { unique: true });

module.exports = mongoose.model('SportTemplate', sportTemplateSchema);
