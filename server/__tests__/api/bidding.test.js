const testDb = require('../../src/config/testDb');
const { placeBid } = require('../../src/services/auctionEngine');
const { createAdminUser, createTeamOwnerUser, createAuction, createPlayer, createTeam } = require('../helpers/fixtures');
const Auction = require('../../src/models/Auction');

// Mock Socket.io — placeBid emits events; tests don't need real sockets
jest.mock('../../src/config/socket', () => ({
  getIO: () => ({ to: () => ({ emit: () => {} }) }),
}));

let admin, auction, player, team1, team2;

beforeAll(async () => { await testDb.connect(); });
beforeEach(async () => {
  await testDb.clear();
  admin = await createAdminUser();
  const owner1 = await createTeamOwnerUser({ email: 'owner1@test.com' });
  const owner2 = await createTeamOwnerUser({ email: 'owner2@test.com' });

  auction = await createAuction(admin._id, {
    status: 'live',
    defaultPursePerTeam: 1000,
    minSquadSize: 2,
    maxSquadSize: 5,
    maxOverseasPlayers: 1,
    minMalePlayers: 0,
    minFemalePlayers: 0,
    bidIncrementTiers: [{ upToAmount: 999999999, increment: 10 }],
  });

  player = await createPlayer(auction._id, { basePrice: 100, status: 'live', nationality: 'domestic', gender: '' });
  await Auction.findByIdAndUpdate(auction._id, { currentPlayerId: player._id, currentBid: player.basePrice });

  team1 = await createTeam(auction._id, owner1._id, { remainingPurse: 1000 });
  team2 = await createTeam(auction._id, owner2._id, { remainingPurse: 1000 });
});
afterAll(async () => { await testDb.disconnect(); });

describe('placeBid — valid bids', () => {
  test('first bid at base price is accepted', async () => {
    const result = await placeBid(auction._id, team1._id, admin._id, 110); // 100 + 10
    expect(result.valid).toBe(true);
    expect(result.nextBid).toBe(120);
  });

  test('second team outbids successfully', async () => {
    await placeBid(auction._id, team1._id, admin._id, 110);
    const result = await placeBid(auction._id, team2._id, admin._id, 120);
    expect(result.valid).toBe(true);
  });
});

describe('placeBid — invalid scenarios', () => {
  test('wrong bid amount is rejected', async () => {
    const result = await placeBid(auction._id, team1._id, admin._id, 150); // should be 110
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/110/);
  });

  test('bidding on non-live auction is rejected', async () => {
    await Auction.findByIdAndUpdate(auction._id, { status: 'paused' });
    const result = await placeBid(auction._id, team1._id, admin._id, 110);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/not live/i);
  });

  test('self-outbid is rejected', async () => {
    await placeBid(auction._id, team1._id, admin._id, 110);
    const result = await placeBid(auction._id, team1._id, admin._id, 120);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/already the highest bidder/i);
  });

  test('insufficient purse is rejected', async () => {
    await team1.updateOne({ remainingPurse: 5 });
    const result = await placeBid(auction._id, team1._id, admin._id, 110);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/purse/i);
  });

  test('full squad is rejected', async () => {
    await team1.updateOne({
      players: Array(5).fill(null).map(() => ({ playerId: player._id, pricePaid: 10 })),
    });
    const result = await placeBid(auction._id, team1._id, admin._id, 110);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/squad is full/i);
  });

  test('overseas cap is enforced', async () => {
    await player.updateOne({ nationality: 'overseas' });
    // Fill overseas slot
    const overseasPlayer = await createPlayer(auction._id, { nationality: 'overseas', status: 'sold' });
    await team1.updateOne({ players: [{ playerId: overseasPlayer._id, pricePaid: 50 }] });
    // maxOverseasPlayers = 1, team already has 1
    const result = await placeBid(auction._id, team1._id, admin._id, 110);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/overseas/i);
  });
});

describe('placeBid — gender composition', () => {
  test('rejects bid when winning would make gender quota impossible to meet', async () => {
    // Auction: maxSquad=3, need 2 male + 1 female
    await Auction.findByIdAndUpdate(auction._id, {
      minMalePlayers: 2,
      minFemalePlayers: 1,
      maxSquadSize: 3,
      minSquadSize: 3,
    });

    // team2 already has 2 female players (2/3 slots used), needs 2 males still
    const f1 = await createPlayer(auction._id, { nationality: 'domestic', gender: 'female', status: 'sold' });
    const f2 = await createPlayer(auction._id, { nationality: 'domestic', gender: 'female', status: 'sold' });
    await team2.updateOne({
      players: [
        { playerId: f1._id, pricePaid: 50 },
        { playerId: f2._id, pricePaid: 50 },
      ],
    });

    // Current player on block is FEMALE — if team2 wins, they'd have 3 females,
    // 0 males, 0 slots left → impossible to reach minMalePlayers=2
    await player.updateOne({ gender: 'female' });
    await Auction.findByIdAndUpdate(auction._id, {
      currentPlayerId: player._id,
      currentBid: 100,
      currentBidTeamId: null,
    });

    const result = await placeBid(auction._id, team2._id, admin._id, 110);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/gender/i);
  });

  test('allows bid when gender quota can still be met', async () => {
    // Auction: maxSquad=4, need 2 male + 1 female
    await Auction.findByIdAndUpdate(auction._id, {
      minMalePlayers: 2,
      minFemalePlayers: 1,
      maxSquadSize: 4,
      minSquadSize: 3,
    });

    // team1 is empty — current player is male. After bidding: 1 male, 3 slots remain — can still get 1 more male + 1 female
    await player.updateOne({ gender: 'male' });
    await Auction.findByIdAndUpdate(auction._id, {
      currentPlayerId: player._id,
      currentBid: 100,
      currentBidTeamId: null,
    });

    const result = await placeBid(auction._id, team1._id, admin._id, 110);
    expect(result.valid).toBe(true);
  });
});
