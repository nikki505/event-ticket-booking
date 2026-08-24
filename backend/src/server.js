const path = require('path');

// find .env from this file, not from wherever the process started. dotenv uses
// process.cwd() by default, which was fine on my laptop but on the server pm2 starts
// somewhere else and it never found the file. The app crashed on every boot saying
// JWT_SECRET was missing while the file was sitting right there.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = require('./app');
const { connectDb } = require('./config/db');

const PORT = process.env.PORT || 5000;

// database first. No point listening for requests if it is not reachable.
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
