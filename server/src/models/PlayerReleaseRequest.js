const mongoose = require('mongoose');

const playerReleaseRequestSchema = new mongoose.Schema(
  {
    auctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
    teamId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Team',    required: true },
    playerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Player',  required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    reason:    { type: String, default: '' },
    status:    { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  default: null },
    reviewedAt:  { type: Date, default: null },
    rejectionNote: { type: String, default: '' },
  },
  { timestamps: true }
);

// One active request per player per team at a time
playerReleaseRequestSchema.index({ auctionId: 1, playerId: 1, teamId: 1, status: 1 });

module.exports = mongoose.model('PlayerReleaseRequest', playerReleaseRequestSchema);
