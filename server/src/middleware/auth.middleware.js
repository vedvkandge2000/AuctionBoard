const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authenticated');
  }
  const token = auth.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = decoded; // { id, role, teamId }
  next();
});

module.exports = { protect };
