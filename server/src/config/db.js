const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const connectDB = async () => {
  const conn = await mongoose.connect(MONGO_URI);
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

module.exports = connectDB;
