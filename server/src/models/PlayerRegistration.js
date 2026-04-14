const mongoose = require('mongoose');

const playerRegistrationSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },  // set when registered via account
    auctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', default: null }, // required for account-linked registrations
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    nationality: { type: String, enum: ['domestic', 'overseas'], default: 'domestic' },
    gender: { type: String, enum: ['male', 'female', ''], default: '' },
    country: { type: String, default: '', trim: true },
    basePrice: { type: Number, default: 0 },
    photoUrl: { type: String, default: '' },
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
    category: { type: String, default: null },  // assigned by admin during approval, not set by player
    contactEmail: { type: String, default: '', trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, default: '' },
    // Legacy: player's preferred auction hint from old anonymous registration flow
    preferredAuctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', default: null },
  },
  { timestamps: true }
);

// One registration per player account per auction
playerRegistrationSchema.index({ userId: 1, auctionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('PlayerRegistration', playerRegistrationSchema);
