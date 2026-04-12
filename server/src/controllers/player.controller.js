const Player = require('../models/Player');
const Auction = require('../models/Auction');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { parse } = require('csv-parse/sync');

// List players for an auction
const listPlayers = asyncHandler(async (req, res) => {
  const { status, role, nationality, set } = req.query;
  const filter = { auctionId: req.params.id };
  if (status) filter.status = status;
  if (role) filter.role = role;
  if (nationality) filter.nationality = nationality;
  if (set) filter.setNumber = Number(set);

  const players = await Player.find(filter).sort({ setNumber: 1, name: 1 });
  res.json({ success: true, players });
});

// Add single player
const addPlayer = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) throw new ApiError(404, 'Auction not found');

  const player = await Player.create({ ...req.body, auctionId: req.params.id });

  // Add to auction order if not already there
  if (!auction.auctionOrder.includes(player._id)) {
    auction.auctionOrder.push(player._id);
    await auction.save();
  }

  res.status(201).json({ success: true, player });
});

// Update player
const updatePlayer = asyncHandler(async (req, res) => {
  const player = await Player.findOneAndUpdate(
    { _id: req.params.pid, auctionId: req.params.id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!player) throw new ApiError(404, 'Player not found');
  res.json({ success: true, player });
});

// Delete player
const deletePlayer = asyncHandler(async (req, res) => {
  const player = await Player.findOne({ _id: req.params.pid, auctionId: req.params.id });
  if (!player) throw new ApiError(404, 'Player not found');
  if (player.status === 'sold') throw new ApiError(400, 'Cannot delete a sold player');
  await player.deleteOne();

  // Remove from auction order
  await Auction.findByIdAndUpdate(req.params.id, {
    $pull: { auctionOrder: player._id },
  });

  res.json({ success: true, message: 'Player deleted' });
});

// Bulk import via CSV
const bulkImport = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'CSV file is required');

  const auction = await Auction.findById(req.params.id);
  if (!auction) throw new ApiError(404, 'Auction not found');

  let records;
  try {
    records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
  } catch (e) {
    throw new ApiError(400, `CSV parse error: ${e.message}`);
  }

  const success = [];
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2; // 1-indexed + header row

    if (!row.name || !row.role || !row.basePrice) {
      errors.push({ row: rowNum, message: 'name, role, and basePrice are required' });
      continue;
    }

    const basePrice = Number(row.basePrice);
    if (isNaN(basePrice) || basePrice <= 0) {
      errors.push({ row: rowNum, message: 'basePrice must be a positive number' });
      continue;
    }

    // Parse stats_* columns into stats object
    const stats = {};
    Object.keys(row).forEach((key) => {
      if (key.startsWith('stats_')) {
        stats[key.replace('stats_', '')] = row[key];
      }
    });

    try {
      const player = await Player.create({
        auctionId: req.params.id,
        name: row.name,
        role: row.role,
        nationality: row.nationality === 'overseas' ? 'overseas' : 'domestic',
        gender: ['male', 'female'].includes(row.gender) ? row.gender : '',
        country: row.country || '',
        basePrice,
        setNumber: Number(row.setNumber) || 1,
        stats,
      });
      success.push(player);
    } catch (e) {
      errors.push({ row: rowNum, message: e.message });
    }
  }

  // Add new players to auction order
  if (success.length > 0) {
    await Auction.findByIdAndUpdate(req.params.id, {
      $push: { auctionOrder: { $each: success.map((p) => p._id) } },
    });
  }

  res.status(201).json({ success: true, imported: success.length, errors });
});

// Download CSV template
const downloadTemplate = (req, res) => {
  const template = 'name,role,nationality,gender,country,basePrice,setNumber,stats_matches,stats_runs,stats_wickets\n' +
    'Virat Kohli,Batsman,domestic,,India,200,1,250,12000,\n' +
    'Jasprit Bumrah,Bowler,domestic,,India,200,1,120,,300\n' +
    'Sindhu PV,F+,,female,India,4,1,,,\n' +
    'Player A,A+,,male,India,5,1,,,\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="players_template.csv"');
  res.send(template);
};

module.exports = { listPlayers, addPlayer, updatePlayer, deletePlayer, bulkImport, downloadTemplate };
