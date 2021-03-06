const express = require('express');
const passport = require('passport');
const { check, validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secret = require('../config/keys').secret;
const differenceInCalendarDays = require('date-fns/difference_in_calendar_days');

const createErrorObj = require('../utils/createErrorObj');

const User = require('../models/User');
const Habit = require('../models/Habit');

const router = express.Router();

// POST /api/auth/register
// PUBLIC
router.post('/register', [
  check('username').trim().isAlphanumeric().withMessage('Characters and numbers only').isLength({ min: 3, max: 30 }).withMessage('Username has to be between 3 and 30 characters'),
  check('password').isLength({ min: 5 }).withMessage('Password has to be at least 5 characters long'),
  check('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords have to match')
], async (req, res, next) => {
  const { username, password } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errArr = errors.array();
    const errObj = createErrorObj(errArr);
    console.log(errObj);
    return res.status(400).json(errObj);
  }

  try {
    const user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ username: 'User with that name already exists' });
    }
    const hashedPw = await bcrypt.hash(password, 12);
    const newUser = new User({
      username,
      password: hashedPw,
    });
    await newUser.save();
    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(404).json({ username: 'Register error' });
  }
})

// POST /api/auth/login
// PUBLIC
router.post('/login', [
  check('username').trim().isAlphanumeric().isLength({ min: 3, max: 30 }).withMessage('Provided username is incorrect'),
  check('password').isLength({ min: 5 }).withMessage('Provided password is incorrect')
], async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errArr = errors.array();
    const errObj = createErrorObj(errArr);
    console.log(errObj);
    return res.status(400).json(errObj);
  }

  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ username: 'User doesn\'t exist' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ password: 'Wrong password' });

    const now = new Date().toISOString();
    const userDaysDiff = differenceInCalendarDays(now, user.lastActiveDate)
    if (userDaysDiff >= 1 && user.lastActiveDate !== null) {
      await Habit.updateMany({ userId: user._id, isFinished: false }, { streak: 0 });
      await Habit.updateMany({ userId: user._id }, { isFinished: false });
      if (userDaysDiff >= 2) {
        await Habit.updateMany({ userId: user._id }, { streak: 0 })
      }
      user.lastActiveDate = now;
      await user.save();
    } else if (user.lastActiveDate === null) {
      user.lastActiveDate = now;
      await user.save();
    }
    const payload = {
      userId: user._id,
      username: user.username
    };

    jwt.sign(payload, secret, { expiresIn: "3d" }, (err, token) => {
      return res.status(200).json({ token: `Bearer ${token}` });
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({ username: 'Login error' });
  }
});

module.exports = router;