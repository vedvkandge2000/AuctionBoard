const nodemailer = require('nodemailer');
const { EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = require('../config/env');
const ApiError = require('../utils/ApiError');

const createTransporter = () => {
  // Simple mode: EMAIL_SERVICE=gmail (or outlook, yahoo, hotmail, …)
  if (EMAIL_SERVICE) {
    const missing = [];
    if (!EMAIL_USER) missing.push('EMAIL_USER');
    if (!EMAIL_PASS) missing.push('EMAIL_PASS');
    if (missing.length) {
      throw new ApiError(503, `Email not configured — set ${missing.join(' and ')} in your .env file. For Gmail, EMAIL_PASS must be an App Password (not your login password).`);
    }
    return nodemailer.createTransport({
      service: EMAIL_SERVICE,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });
  }

  // Custom SMTP mode: explicit host/port/credentials
  if (SMTP_HOST) {
    const missing = [];
    if (!SMTP_USER) missing.push('SMTP_USER');
    if (!SMTP_PASS) missing.push('SMTP_PASS');
    if (missing.length) {
      throw new ApiError(503, `Email not configured — set ${missing.join(' and ')} in your .env file.`);
    }
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  throw new ApiError(503, 'Email not configured — set EMAIL_SERVICE + EMAIL_USER + EMAIL_PASS in your .env file.');
};

// Resolve the "from" address for outgoing mail
const resolveFrom = () => {
  if (SMTP_FROM) return SMTP_FROM;
  if (EMAIL_USER) return `AuctionBoard <${EMAIL_USER}>`;
  if (SMTP_USER) return `AuctionBoard <${SMTP_USER}>`;
  return 'no-reply@auctionboard.io';
};

const sendResetEmail = async (toEmail, resetUrl) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: resolveFrom(),
    to: toEmail,
    subject: 'AuctionBoard — Reset your password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f172a;padding:32px;border-radius:12px;color:#e2e8f0">
        <h2 style="color:#ffffff;margin-top:0">Password Reset</h2>
        <p style="color:#94a3b8">You requested a password reset for your AuctionBoard account.</p>
        <p style="color:#94a3b8">Click the button below to set a new password. This link expires in <strong style="color:#e2e8f0">1 hour</strong>.</p>
        <div style="text-align:center;margin:32px 0">
          <a href="${resetUrl}"
            style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
            Reset Password
          </a>
        </div>
        <p style="color:#64748b;font-size:12px;margin-top:24px">
          If you did not request this, you can safely ignore this email. Your password will not change.
        </p>
        <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0">
        <p style="color:#475569;font-size:11px;text-align:center">AuctionBoard &mdash; Real-time auction platform</p>
      </div>
    `,
  });
};

module.exports = { sendResetEmail };
