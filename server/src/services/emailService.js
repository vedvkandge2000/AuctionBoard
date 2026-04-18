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

const formatAmount = (amount, symbol = '₹', unit = 'lakh') => {
  if (amount === null || amount === undefined) return '—';
  if (unit === 'lakh' && amount >= 100) {
    const crores = amount / 100;
    const formatted = crores % 1 === 0 ? crores.toString() : crores.toFixed(2).replace(/\.?0+$/, '');
    return `${symbol}${formatted} Cr`;
  }
  const formatted = amount % 1 === 0 ? amount.toString() : amount.toFixed(2).replace(/\.?0+$/, '');
  return `${symbol}${formatted} ${unit.charAt(0).toUpperCase() + unit.slice(1)}`;
};

const sendAuctionReportEmail = async (toEmail, payload) => {
  const { auctionName, sport, team, summary, reportUrl, currencySymbol = '₹', currencyUnit = 'lakh' } = payload;

  const squadRows = (team.players || [])
    .map((p) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #1e293b;color:#e2e8f0">${p.name || '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #1e293b;color:#94a3b8">${p.role || p.category || '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #1e293b;color:#e2e8f0;text-align:right">${formatAmount(p.finalPrice, currencySymbol, currencyUnit)}</td>
      </tr>
    `)
    .join('');

  const squadTable = team.players?.length > 0
    ? `
      <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px">
        <thead>
          <tr>
            <th style="padding:8px 10px;text-align:left;color:#64748b;border-bottom:1px solid #334155;font-weight:500">Player</th>
            <th style="padding:8px 10px;text-align:left;color:#64748b;border-bottom:1px solid #334155;font-weight:500">Role</th>
            <th style="padding:8px 10px;text-align:right;color:#64748b;border-bottom:1px solid #334155;font-weight:500">Price</th>
          </tr>
        </thead>
        <tbody>${squadRows}</tbody>
      </table>
    `
    : '<p style="color:#64748b;font-size:13px;margin-top:12px">No players acquired.</p>';

  const reportButton = reportUrl
    ? `
      <div style="text-align:center;margin:28px 0">
        <a href="${reportUrl}" style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
          View Full Report
        </a>
      </div>
    `
    : '';

  const transporter = createTransporter();
  await transporter.sendMail({
    from: resolveFrom(),
    to: toEmail,
    subject: `AuctionBoard — Report for ${auctionName}`,
    html: `
      <div style="font-family:sans-serif;max-width:640px;margin:auto;background:#0f172a;padding:32px;border-radius:12px;color:#e2e8f0">
        <h2 style="color:#ffffff;margin-top:0">${auctionName}</h2>
        <p style="color:#94a3b8;margin:4px 0 20px 0;text-transform:capitalize">${sport || ''}</p>

        <div style="background:#1e293b;border-radius:8px;padding:16px;margin-bottom:20px">
          <p style="color:#cbd5e1;margin:0 0 4px 0;font-size:13px">Your team</p>
          <p style="color:#ffffff;margin:0;font-size:18px;font-weight:600">${team.name}</p>
          <div style="display:flex;gap:24px;margin-top:12px;flex-wrap:wrap">
            <div>
              <p style="color:#64748b;margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">Spent</p>
              <p style="color:#e2e8f0;margin:2px 0 0 0;font-size:15px;font-weight:600">${formatAmount(team.totalSpent, currencySymbol, currencyUnit)}</p>
            </div>
            <div>
              <p style="color:#64748b;margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">Remaining</p>
              <p style="color:#e2e8f0;margin:2px 0 0 0;font-size:15px;font-weight:600">${formatAmount(team.remainingPurse, currencySymbol, currencyUnit)}</p>
            </div>
            <div>
              <p style="color:#64748b;margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">Players</p>
              <p style="color:#e2e8f0;margin:2px 0 0 0;font-size:15px;font-weight:600">${team.playerCount ?? team.players?.length ?? 0}</p>
            </div>
          </div>
        </div>

        <h3 style="color:#ffffff;font-size:15px;margin:24px 0 4px 0">Squad</h3>
        ${squadTable}

        <div style="background:#1e293b;border-radius:8px;padding:16px;margin-top:24px">
          <p style="color:#cbd5e1;margin:0 0 10px 0;font-size:13px;font-weight:600">Auction Summary</p>
          <div style="display:flex;gap:24px;flex-wrap:wrap;font-size:13px">
            <div><span style="color:#64748b">Total players:</span> <span style="color:#e2e8f0">${summary.totalPlayers}</span></div>
            <div><span style="color:#64748b">Sold:</span> <span style="color:#e2e8f0">${summary.soldCount}</span></div>
            <div><span style="color:#64748b">Unsold:</span> <span style="color:#e2e8f0">${summary.unsoldCount}</span></div>
            <div><span style="color:#64748b">Total spent:</span> <span style="color:#e2e8f0">${formatAmount(summary.totalSpent, currencySymbol, currencyUnit)}</span></div>
          </div>
        </div>

        ${reportButton}

        <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0">
        <p style="color:#475569;font-size:11px;text-align:center">AuctionBoard &mdash; Real-time auction platform</p>
      </div>
    `,
  });
};

module.exports = { sendResetEmail, sendAuctionReportEmail };
