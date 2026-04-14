const mongoose = require('mongoose');

const auctionMembershipSchema = new mongoose.Schema(
  {
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    auctionId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
    status:          { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

// One application per user per auction — enforced at DB level
auctionMembershipSchema.index({ userId: 1, auctionId: 1 }, { unique: true });
// Fast lookup: "all applications for this auction by status"
auctionMembershipSchema.index({ auctionId: 1, status: 1 });

module.exports = mongoose.model('AuctionMembership', auctionMembershipSchema);
