module.exports = {
  apps: [
    {
      name: 'auctionboard-server',
      script: 'server/index.js',
      instances: 1, // Socket.io requires sticky sessions for multi-instance
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 8000,
      },
    },
  ],
};
