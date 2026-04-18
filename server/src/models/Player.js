const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    auctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: '', trim: true },
    nationality: { type: String, enum: ['domestic', 'overseas'], default: 'domestic' },
    gender: { type: String, enum: ['male', 'female', ''], default: '' },
    country: { type: String, default: '', trim: true },
    basePrice: { type: Number, required: true, min: 0 }, // in auction's currency unit (e.g. lakhs)
    photoUrl: { type: String, default: '' },
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
    category: { type: String, default: null },  // auction-defined; e.g. 'A+', 'Gold', 'Open'
    status: { type: String, enum: ['pool', 'live', 'sold', 'unsold'], default: 'pool' },
    soldToTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    finalPrice: { type: Number, default: null },
    setNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

playerSchema.index({ auctionId: 1, status: 1 });

module.exports = mongoose.model('Player', playerSchema);
