const { uploadImage } = require('../services/uploadService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const uploadPlayerPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Image file is required');
  if (!ALLOWED_MIME.includes(req.file.mimetype)) throw new ApiError(400, 'Only JPEG, PNG, WebP, or GIF images are allowed');

  const url = await uploadImage(req.file.buffer, 'auctionboard/players');
  res.json({ success: true, url });
});

const uploadTeamLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Image file is required');
  if (!ALLOWED_MIME.includes(req.file.mimetype)) throw new ApiError(400, 'Only JPEG, PNG, WebP, or GIF images are allowed');

  const url = await uploadImage(req.file.buffer, 'auctionboard/teams');
  res.json({ success: true, url });
});

module.exports = { uploadPlayerPhoto, uploadTeamLogo };
