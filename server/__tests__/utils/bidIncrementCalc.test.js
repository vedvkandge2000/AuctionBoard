const { calcNextBid, calcIncrement } = require('../../src/utils/bidIncrementCalc');

const cricketTiers = [
  { upToAmount: 100, increment: 5 },
  { upToAmount: 500, increment: 20 },
  { upToAmount: 1000, increment: 50 },
  { upToAmount: 999999999, increment: 100 },
];

const badmintonTiers = [
  { upToAmount: 10, increment: 0.5 },
  { upToAmount: 20, increment: 1 },
  { upToAmount: 999999999, increment: 2 },
];

describe('calcNextBid — cricket tiers', () => {
  test('bid at 0 → 5 (first tier)', () => expect(calcNextBid(0, cricketTiers)).toBe(5));
  test('bid at 95 → 100 (still first tier)', () => expect(calcNextBid(95, cricketTiers)).toBe(100));
  test('bid at 100 → 120 (crosses to second tier)', () => expect(calcNextBid(100, cricketTiers)).toBe(120));
  test('bid at 480 → 500 (second tier)', () => expect(calcNextBid(480, cricketTiers)).toBe(500));
  test('bid at 500 → 550 (third tier)', () => expect(calcNextBid(500, cricketTiers)).toBe(550));
  test('bid at 1000 → 1100 (last tier)', () => expect(calcNextBid(1000, cricketTiers)).toBe(1100));
  test('bid at 5000 → 5100 (last tier)', () => expect(calcNextBid(5000, cricketTiers)).toBe(5100));
});

describe('calcNextBid — badminton tiers', () => {
  test('bid at 5 → 5.5', () => expect(calcNextBid(5, badmintonTiers)).toBeCloseTo(5.5));
  test('bid at 9.5 → 10', () => expect(calcNextBid(9.5, badmintonTiers)).toBeCloseTo(10));
  test('bid at 10 → 11 (second tier)', () => expect(calcNextBid(10, badmintonTiers)).toBeCloseTo(11));
  test('bid at 19 → 20 (second tier)', () => expect(calcNextBid(19, badmintonTiers)).toBeCloseTo(20));
  test('bid at 20 → 22 (last tier)', () => expect(calcNextBid(20, badmintonTiers)).toBeCloseTo(22));
  test('bid at 100 → 102 (last tier)', () => expect(calcNextBid(100, badmintonTiers)).toBeCloseTo(102));
});

describe('calcIncrement', () => {
  test('cricket: bid 50 → increment 5', () => expect(calcIncrement(50, cricketTiers)).toBe(5));
  test('cricket: bid 200 → increment 20', () => expect(calcIncrement(200, cricketTiers)).toBe(20));
  test('cricket: bid 700 → increment 50', () => expect(calcIncrement(700, cricketTiers)).toBe(50));
  test('cricket: bid 2000 → increment 100', () => expect(calcIncrement(2000, cricketTiers)).toBe(100));
  test('badminton: bid 5 → increment 0.5', () => expect(calcIncrement(5, badmintonTiers)).toBeCloseTo(0.5));
  test('badminton: bid 15 → increment 1', () => expect(calcIncrement(15, badmintonTiers)).toBe(1));
  test('badminton: bid 25 → increment 2', () => expect(calcIncrement(25, badmintonTiers)).toBe(2));
});

describe('edge cases', () => {
  test('single tier: any bid uses that increment', () => {
    const singleTier = [{ upToAmount: 999999999, increment: 10 }];
    expect(calcNextBid(0, singleTier)).toBe(10);
    expect(calcNextBid(999, singleTier)).toBe(1009);
  });
  test('bid exactly at tier boundary uses next tier', () => {
    expect(calcNextBid(100, cricketTiers)).toBe(120); // 100 is NOT < 100, so moves to next tier
  });
});
