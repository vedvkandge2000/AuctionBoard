/**
 * uploadService.js
 *
 * Storage backends (selected by STORAGE_BACKEND env var):
 *   local      — saves to /uploads/ on disk, served as static (default for local dev, no keys needed)
 *   cloudinary — Cloudinary CDN (default for production)
 *
 * To swap backends: change STORAGE_BACKEND in .env. No other code changes needed.
 */

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const BACKEND = process.env.STORAGE_BACKEND || 'local';

// ── Local disk (dev only) ─────────────────────────────────────────────────────

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const uploadLocal = async (buffer, folder) => {
  const subDir = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  fs.writeFileSync(path.join(subDir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
};

// ── Cloudinary (production) ───────────────────────────────────────────────────

const uploadCloudinary = async (buffer, folder) => {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `auctionboard/${folder}`, resource_type: 'image', format: 'webp' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Resize image to 400×400 WebP then upload via the configured backend.
 * Returns the public URL string.
 */
const uploadImage = async (buffer, folder = 'general') => {
  const processed = await sharp(buffer)
    .resize(400, 400, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer();

  if (BACKEND === 'cloudinary') return uploadCloudinary(processed, folder);
  return uploadLocal(processed, folder);
};

module.exports = { uploadImage };
