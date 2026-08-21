const path = require('path');

// Work out where .env is from THIS file, not from wherever the process happened to be
// started. dotenv defaults to process.cwd(), which is fine when I run npm start inside
// backend/ on my laptop, but on the server pm2 starts the process from a different
// directory and the file was never found. The app then crashed on every boot saying
// JWT_SECRET was not set, even though the file was sitting right there.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

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
