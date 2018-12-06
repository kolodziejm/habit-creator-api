const express = require('express');
const { check, validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');

const User = require('../models/User');

const router = express.Router();

// GET /api/auth/register
// PUBLIC
router.post('/register', [
  check('username').trim().isAlphanumeric().withMessage('Characters and numbers only').isLength({ min: 5, max: 30 }).withMessage('Username has to be between 5 and 30 characters'),
  check('password').isLength({ min: 5 }).withMessage('Password has to be at least 5 characters long'),
  check('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords have to match')
], async (req, res, next) => {
  const { username, password } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'User with that name already exists' })
    }
    const hashedPw = await bcrypt.hash(password, 12);
    const newUser = new User({
      username,
      password: hashedPw
    });
    await newUser.save();
    res.json({ success: true });

  } catch (err) {
    console.log(err);
    throw err;
  }
})


module.exports = router;