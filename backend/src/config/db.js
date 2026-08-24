const mongoose = require('mongoose');

// The connection string comes from the environment, never the code. N3. Same code
// runs on my laptop and on EC2 with different databases, and no secret is committed.

async function connectDb() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    // fail loudly here rather than on the first request that touches the database
    throw new Error('MONGO_URI is not set. Copy .env.example to .env and fill it in.');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

module.exports = { connectDb };
