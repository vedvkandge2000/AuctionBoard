const mongoose = require('mongoose');

const playerRegistrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    nationality: { type: String, enum: ['domestic', 'overseas'], default: 'domestic' },
    gender: { type: String, enum: ['male', 'female', ''], default: '' },
    country: { type: String, default: '', trim: true },
    basePrice: { type: Number, required: true },
    photoUrl: { type: String, default: '' },
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
    contactEmail: { type: String, default: '', trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, default: '' },
    // Set when admin approves and assigns to an auction
    assignedAuctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', default: null },
    approvedPlayerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlayerRegistration', playerRegistrationSchema);
