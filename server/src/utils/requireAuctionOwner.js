const Auction = require('../models/Auction');
const ApiError = require('./ApiError');

/**
 * Fetch an auction and assert the requesting user is its creator.
 * Returns the auction document so callers can reuse it (avoids a second DB fetch).
 * Throws ApiError(404) if the auction doesn't exist.
 * Throws ApiError(403) if the auction exists but belongs to a different admin.
 *
 * @param {string} auctionId
 * @param {string} userId  - req.user.id
 * @returns {Promise<Auction>}
 */
const requireAuctionOwner = async (auctionId, userId) => {
  const auction = await Auction.findOne({ _id: auctionId, createdBy: userId });
  if (!auction) {
    const exists = await Auction.exists({ _id: auctionId });
    throw new ApiError(exists ? 403 : 404, exists ? 'Forbidden' : 'Auction not found');
  }
  return auction;
};

module.exports = requireAuctionOwner;
