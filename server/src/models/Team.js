const mongoose = require('mongoose');

const squadPlayerSchema = new mongoose.Schema(
  {
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    pricePaid: { type: Number, required: true },
    acquiredViaRtm: { type: Boolean, default: false },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    auctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
    name: { type: String, required: true, trim: true },
    shortName: { type: String, required: true, trim: true, maxlength: 5 },
    logoUrl: { type: String, default: '' },
    colorHex: { type: String, default: '#6366f1' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    initialPurse: { type: Number, required: true },
    remainingPurse: { type: Number, required: true },
    rtmCardsRemaining: { type: Number, default: 0 },
    players: [squadPlayerSchema],
    releasedPlayerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  },
  { timestamps: true }
);

// unique: true prevents same owner owning 2 teams in the same auction
// sparse: true allows multiple teams with ownerId = null (unowned teams)
teamSchema.index({ auctionId: 1, ownerId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Team', teamSchema);
