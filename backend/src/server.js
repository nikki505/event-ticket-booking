require('dotenv').config();

const app = require('./app');
const { connectDb } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start the database first. If the database is not reachable there is no point listening
// for requests, they would all fail anyway.
async function start() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
    }

    await connectDb();

    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (err) {
    console.error('Could not start the server:', err.message);
    process.exit(1);
  }
}

start();
