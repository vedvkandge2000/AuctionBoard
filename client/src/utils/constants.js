export const ROLES = {
  ADMIN: 'admin',
  TEAM_OWNER: 'team_owner',
  VIEWER: 'viewer',
};

export const AUCTION_STATUS = {
  DRAFT: 'draft',
  LIVE: 'live',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

export const PLAYER_STATUS = {
  POOL: 'pool',
  LIVE: 'live',
  SOLD: 'sold',
  UNSOLD: 'unsold',
};

export const STATUS_COLORS = {
  draft: 'bg-gray-700 text-gray-200',
  live: 'bg-green-600 text-white',
  paused: 'bg-yellow-600 text-white',
  completed: 'bg-blue-600 text-white',
};

export const NATIONALITY_COLORS = {
  domestic: 'bg-indigo-900 text-indigo-200',
  overseas: 'bg-orange-900 text-orange-200',
};
