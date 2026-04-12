/**
 * Given the current bid and an array of increment tiers, return the next valid bid amount.
 * Tiers format: [{ upToAmount: Number, increment: Number }, ...]
 * The last tier should have upToAmount: Infinity.
 */
const calcNextBid = (currentBid, tiers) => {
  for (const tier of tiers) {
    if (currentBid < tier.upToAmount) {
      return currentBid + tier.increment;
    }
  }
  // fallback: use last tier's increment
  return currentBid + tiers[tiers.length - 1].increment;
};

const calcIncrement = (currentBid, tiers) => {
  for (const tier of tiers) {
    if (currentBid < tier.upToAmount) {
      return tier.increment;
    }
  }
  return tiers[tiers.length - 1].increment;
};

module.exports = { calcNextBid, calcIncrement };
