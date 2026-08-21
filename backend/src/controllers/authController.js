const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { validateRegister, validateLogin, hasErrors } = require('../utils/validators');

// R1 register a new account with a role
async function register(req, res, next) {
  try {
    const errors = validateRegister(req.body);
    if (hasErrors(errors)) {
      return res.status(400).json({ message: 'Please correct the highlighted fields', errors });
    }

    const email = req.body.email.trim().toLowerCase();

    const alreadyThere = await User.findOne({ email });
    if (alreadyThere) {
      return res.status(409).json({
        message: 'Please correct the highlighted fields',
        errors: { email: 'That email is already registered' }
      });
    }

    const passwordHash = await User.hashPassword(req.body.password);
    const user = await User.create({ email, passwordHash, role: req.body.role });

    return res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
  } catch (err) {
    // If two people register the same email at the exact same moment they can both get
    // past the findOne check above. The unique index still stops the second one, and
    // Mongo throws error code 11000, so I turn that into the same message.
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'Please correct the highlighted fields',
        errors: { email: 'That email is already registered' }
      });
    }
    next(err);
  }
}

// R2 log in
async function login(req, res, next) {
  try {
    const errors = validateLogin(req.body);
    if (hasErrors(errors)) {
      return res.status(400).json({ message: 'Please correct the highlighted fields', errors });
    }

    const user = await User.findOne({ email: req.body.email.trim().toLowerCase() });

    // Decision D006. I give the SAME message whether the email does not exist or the
    // password is wrong. If I said "no account with that email" then anyone could type
    // in addresses and find out which ones are registered here.
    const failMessage = 'Email or password is incorrect';

    if (!user) return res.status(401).json({ message: failMessage });

    const passwordOk = await user.checkPassword(req.body.password);
    if (!passwordOk) return res.status(401).json({ message: failMessage });

    return res.json({ token: signToken(user), user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

// Used by the React app on page load to check the saved token is still good
async function me(req, res) {
  return res.json({ user: req.user.toSafeJSON() });
}

module.exports = { register, login, me };
