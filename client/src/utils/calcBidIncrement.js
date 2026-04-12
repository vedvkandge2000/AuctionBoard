/**
 * Given current bid and tiers array, return the next valid bid amount.
 * Mirrors server-side bidIncrementCalc.js exactly.
 */
export const calcNextBid = (currentBid, tiers = []) => {
  for (const tier of tiers) {
    if (currentBid < tier.upToAmount) {
      return currentBid + tier.increment;
    }
  }
  return currentBid + (tiers[tiers.length - 1]?.increment ?? 5);
};

export const calcIncrement = (currentBid, tiers = []) => {
  for (const tier of tiers) {
    if (currentBid < tier.upToAmount) {
      return tier.increment;
    }
  }
  return tiers[tiers.length - 1]?.increment ?? 5;
};
