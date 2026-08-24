const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { validateRegister, validateLogin, hasErrors } = require('../utils/validators');

// R1 register with a role
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
    // Two people registering the same email at once can both get past the check above.
    // The unique index still stops the second, code 11000, so I show the same message.
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

    // D006. Same message whether the email is unknown or the password is wrong,
    // otherwise anyone could type addresses in and find out who is registered.
    const failMessage = 'Email or password is incorrect';

    if (!user) return res.status(401).json({ message: failMessage });

    const passwordOk = await user.checkPassword(req.body.password);
    if (!passwordOk) return res.status(401).json({ message: failMessage });

    return res.json({ token: signToken(user), user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

// the React app calls this on load to check the saved token still works
async function me(req, res) {
  return res.json({ user: req.user.toSafeJSON() });
}

module.exports = { register, login, me };
