const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = require('../config/env');
const ApiError = require('../utils/ApiError');

const createTransporter = () => {
  if (!SMTP_HOST) {
    throw new ApiError(503, 'Email service is not configured on this server. Contact the administrator.');
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
};

const sendResetEmail = async (toEmail, resetUrl) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: SMTP_FROM,
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
