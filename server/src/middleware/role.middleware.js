const ApiError = require('../utils/ApiError');

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, 'Forbidden: insufficient permissions');
  }
  next();
};

module.exports = { requireRole };
