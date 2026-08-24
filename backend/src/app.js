const path = require('path');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

// split from server.js so the tests can load the app without opening a port or
// connecting to the real database

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

// in production the same server serves the built React files, so there is only one
// thing to run on the EC2 box
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(clientBuild));

  // React Router handles paths in the browser, so anything not /api falls through to
  // index.html. Without this, refreshing a page gives a 404.
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ message: 'That endpoint does not exist' });
});

// catch all, otherwise a throw hangs the request or leaks a stack trace
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

module.exports = app;
