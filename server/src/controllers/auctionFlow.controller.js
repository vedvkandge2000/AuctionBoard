const auctionEngine = require('../services/auctionEngine');
const asyncHandler = require('../utils/asyncHandler');

const start = asyncHandler(async (req, res) => {
  const auction = await auctionEngine.startAuction(req.params.id, req.user.id);
  res.json({ success: true, auction });
});

const pause = asyncHandler(async (req, res) => {
  const auction = await auctionEngine.pauseAuction(req.params.id, req.user.id);
  res.json({ success: true, auction });
});

const resume = asyncHandler(async (req, res) => {
  const auction = await auctionEngine.resumeAuction(req.params.id, req.user.id);
  res.json({ success: true, auction });
});

const end = asyncHandler(async (req, res) => {
  const auction = await auctionEngine.endAuction(req.params.id, req.user.id);
  res.json({ success: true, auction });
});

const nextPlayer = asyncHandler(async (req, res) => {
  const result = await auctionEngine.putNextPlayer(req.params.id, req.user.id);
  res.json({ success: true, ...result });
});

const sold = asyncHandler(async (req, res) => {
  const result = await auctionEngine.markSold(req.params.id, req.user.id);
  res.json({ success: true, ...result });
});

const unsold = asyncHandler(async (req, res) => {
  const player = await auctionEngine.markUnsold(req.params.id, req.user.id);
  res.json({ success: true, player });
});

const overrideBid = asyncHandler(async (req, res) => {
  const { teamId, amount } = req.body;
  if (!teamId) throw new ApiError(400, 'teamId is required');
  if (amount === undefined || amount === null) throw new ApiError(400, 'amount is required');
  if (typeof amount !== 'number' || amount <= 0) throw new ApiError(400, 'amount must be a positive number');
  const result = await auctionEngine.markSold(req.params.id, req.user.id, teamId, amount);
  res.json({ success: true, ...result });
});

module.exports = { start, pause, resume, end, nextPlayer, sold, unsold, overrideBid };
