const Player = require('../models/Player');
const Auction = require('../models/Auction');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const requireAuctionOwner = require('../utils/requireAuctionOwner');
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
  const auction = await requireAuctionOwner(req.params.id, req.user.id);

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
  await requireAuctionOwner(req.params.id, req.user.id);
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
  await requireAuctionOwner(req.params.id, req.user.id);
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

// Derive gender from category (mirrors approvePlayer logic in admin.controller.js)
const genderFromCategory = (category) => {
  if (!category) return '';
  if (['F+', 'F'].includes(category)) return 'female';
  if (['A+', 'A', 'B'].includes(category)) return 'male';
  return '';
};

// Bulk import via CSV
const bulkImport = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'CSV file is required');

  const auction = await requireAuctionOwner(req.params.id, req.user.id);

  let records;
  try {
    records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
  } catch (e) {
    throw new ApiError(400, `CSV parse error: ${e.message}`);
  }

  const validCategories = auction.playerCategories || [];
  const basePriceMap = auction.categoryBasePrices || {};
  const success = [];
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2; // 1-indexed + header row

    if (!row.name || !row.role) {
      errors.push({ row: rowNum, message: 'name and role are required' });
      continue;
    }

    // Category: validate against auction config if categories are defined
    const category = row.category || '';
    if (category && validCategories.length > 0 && !validCategories.includes(category)) {
      errors.push({ row: rowNum, message: `category "${category}" is not valid for this auction. Valid: ${validCategories.join(', ')}` });
      continue;
    }

    // Base price: use column value → category base price → error
    let basePrice = 0;
    if (row.basePrice && Number(row.basePrice) > 0) {
      basePrice = Number(row.basePrice);
    } else if (category && basePriceMap[category] != null) {
      basePrice = basePriceMap[category];
    }
    if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
      errors.push({ row: rowNum, message: 'basePrice is required (or set a category with a configured base price)' });
      continue;
    }

    // Gender: use column value → auto-derive from category
    let gender = ['male', 'female'].includes(row.gender) ? row.gender : '';
    if (!gender && category) gender = genderFromCategory(category);

    // Parse stats_* columns into stats object
    const stats = {};
    Object.keys(row).forEach((key) => {
      if (key.startsWith('stats_')) {
        const val = row[key];
        if (val !== '') stats[key.replace('stats_', '')] = val;
      }
    });

    try {
      const player = await Player.create({
        auctionId: req.params.id,
        name: row.name,
        role: row.role,
        nationality: row.nationality === 'overseas' ? 'overseas' : 'domestic',
        gender,
        country: row.country || '',
        category: category || null,
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

// Download CSV template — generated dynamically from the auction's config
const downloadTemplate = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id)
    .select('name sport playerRoles playerCategories categoryBasePrices currencyUnit minMalePlayers minFemalePlayers')
    .lean();
  if (!auction) throw new ApiError(404, 'Auction not found');

  const roles = auction.playerRoles?.length > 0 ? auction.playerRoles : ['Player'];
  const categories = auction.playerCategories || [];
  const basePriceMap = auction.categoryBasePrices || {};
  const unit = auction.currencyUnit || 'lakh';
  const hasCategories = categories.length > 0;
  const hasGenderRules = (auction.minMalePlayers > 0 || auction.minFemalePlayers > 0);

  // Minimal columns — only include what the admin actually needs to fill in:
  // - category-based auctions: basePrice and gender are both derived from category config, so omit them
  // - no-category auctions: basePrice is required; gender only if the auction enforces gender composition
  const headers = ['name', 'role', 'nationality', 'setNumber'];
  if (hasCategories) {
    headers.splice(headers.indexOf('nationality'), 0, 'category');
    // gender only needed when a category doesn't auto-map (custom category names)
    const allCategoriesMapped = categories.every((c) => genderFromCategory(c) !== '');
    if (hasGenderRules && !allCategoriesMapped) headers.push('gender');
  } else {
    headers.push('basePrice');
    if (hasGenderRules) headers.push('gender');
  }
  headers.push('stats_example');

  const escapeCell = (v) => {
    const s = String(v ?? '');
    return s.includes(',') ? `"${s}"` : s;
  };
  const toRow = (cells) => cells.map(escapeCell).join(',');

  const hints = [
    `# CSV template for: ${auction.name} (${auction.sport})`,
    `# Valid roles: ${roles.join(', ')}`,
  ];
  if (hasCategories) {
    hints.push(`# Valid categories: ${categories.join(', ')} — base price is taken from auction config`);
  } else {
    hints.push(`# basePrice unit: ${unit}`);
  }
  hints.push(`# nationality: domestic / overseas (default: domestic)`);
  hints.push(`# stats_* columns: rename stats_example → stats_yourStatName, add as many as needed`);

  const lines = [...hints, toRow(headers)];

  if (hasCategories) {
    categories.forEach((cat, i) => {
      const row = {
        name: `Example ${cat} Player`,
        role: roles[i % roles.length],
        nationality: 'domestic',
        category: cat,
        setNumber: 1,
        gender: genderFromCategory(cat),
        stats_example: '',
      };
      lines.push(toRow(headers.map((h) => row[h] ?? '')));
    });
  } else {
    roles.slice(0, 3).forEach((role, i) => {
      const row = {
        name: `Example ${role}`,
        role,
        nationality: i === 1 ? 'overseas' : 'domestic',
        basePrice: 100,
        setNumber: 1,
        gender: hasGenderRules ? (i % 2 === 0 ? 'male' : 'female') : '',
        stats_example: '',
      };
      lines.push(toRow(headers.map((h) => row[h] ?? '')));
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${auction.sport}_players_template.csv"`);
  res.send(lines.join('\n') + '\n');
});

module.exports = { listPlayers, addPlayer, updatePlayer, deletePlayer, bulkImport, downloadTemplate };
