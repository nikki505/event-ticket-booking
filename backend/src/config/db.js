const mongoose = require('mongoose');

// Connecting to MongoDB. The connection string is never written in the code, it comes
// from the environment (requirement N3). That way the same code runs on my laptop and
// on the EC2 box with different databases, and no secret ends up in the repository.

async function connectDb() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    // Failing loudly here is much better than starting up and then throwing a confusing
    // error on the first request that touches the database.
    throw new Error('MONGO_URI is not set. Copy .env.example to .env and fill it in.');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

module.exports = { connectDb };
