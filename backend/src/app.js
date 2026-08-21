const path = require('path');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

// I split app.js away from server.js so my tests can load the express app without it
// trying to open a port or connect to the real database.

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

// In production the React app is built into static files and served by this same
// server, so there is only one thing to run on the EC2 box.
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(clientBuild));

  // React Router handles the paths on the client, so anything that is not an /api call
  // has to fall through to index.html or refreshing a page would give a 404.
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ message: 'That endpoint does not exist' });
});

// Catch all error handler. Without this an unexpected throw would hang the request or
// leak a stack trace to the browser.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

module.exports = app;
