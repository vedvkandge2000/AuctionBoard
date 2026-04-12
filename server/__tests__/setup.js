// Set required env vars before any module is loaded
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_jest';
process.env.MONGO_URI = 'mongodb://test_placeholder'; // overridden by mongodb-memory-server in each suite
process.env.STORAGE_BACKEND = 'local';
