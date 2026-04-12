const SportTemplate = require('../models/SportTemplate');

const SEEDS = [
  {
    name: 'Cricket',
    sport: 'cricket',
    icon: '🏏',
    description: 'IPL-style auction with overseas cap and tiered bid increments',
    playerRoles: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'],
    currency: 'INR',
    currencySymbol: '₹',
    currencyUnit: 'lakh',
    defaultPursePerTeam: 12500,
    minSquadSize: 18,
    maxSquadSize: 25,
    maxOverseasPlayers: 8,
    minMalePlayers: 0,
    minFemalePlayers: 0,
    bidIncrementTiers: [
      { upToAmount: 100, increment: 5 },
      { upToAmount: 500, increment: 20 },
      { upToAmount: 1000, increment: 50 },
      { upToAmount: 999999999, increment: 100 },
    ],
    rtmEnabled: false,
    rtmCardsPerTeam: 1,
    isSeeded: true,
  },
  {
    name: 'Badminton',
    sport: 'badminton',
    icon: '🏸',
    description: 'Gender-balanced squads with category-based player tiers (A+/A/B/F+/F)',
    playerRoles: ['A+', 'A', 'B', 'F+', 'F'],
    currency: 'CR',
    currencySymbol: '₹',
    currencyUnit: 'CR',
    defaultPursePerTeam: 100,
    minSquadSize: 8,
    maxSquadSize: 15,
    maxOverseasPlayers: 0,
    minMalePlayers: 6,
    minFemalePlayers: 2,
    bidIncrementTiers: [
      { upToAmount: 10, increment: 0.5 },
      { upToAmount: 20, increment: 1 },
      { upToAmount: 999999999, increment: 2 },
    ],
    rtmEnabled: false,
    rtmCardsPerTeam: 1,
    isSeeded: true,
  },
];

const seedSportTemplates = async () => {
  const count = await SportTemplate.countDocuments();
  if (count > 0) return; // already seeded

  await SportTemplate.insertMany(SEEDS);
  console.log('Sport templates seeded (Cricket, Badminton)');
};

module.exports = seedSportTemplates;
