const express = require('express');
const passport = require('passport');
const { check, validationResult } = require('express-validator/check');

const User = require('../models/User');

const createErrorObj = require('../utils/createErrorObj');

const router = express.Router();

// GET /api/shop
// PRIVATE
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

  } catch (err) {
    res.status(404).json({ errObj: { msg: 'Failed to fetch' } });
  }
});

// POST /api/shop
// PRIVATE
router.post('/', passport.authenticate('jwt', { session: false }), [
  check('title').not().isEmpty().withMessage('Enter a reward title').isLength({ max: 100 }).withMessage('Reward name has to be below 100 characters'),
  check('description').optional().isLength({ min: 5, max: 150 }).withMessage('Description has to be between 5 and 150 characters'),
  check('price').isEmpty().withMessage('Set a price for the reward').isNumeric().withMessage('Price has to be a number'),
  check('imageUrl').optional().isURL().withMessage('Provided image URL is invalid')
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errObj = createErrorObj(errors.array());
    return res.status(400).json(errObj);
  }

  try {
    const currentHabits = await Habit.find({ userId: req.user.id });
    if (currentHabits.length >= 10) {
      return res.status(400).json({ errObj: { name: 'Maximum of 10 habits are allowed' } });
    }
    const { name, color, difficulty } = req.body;
    const newHabit = new Habit({
      name,
      userId: req.user.id,
      difficulty,
      color
    });
    const habit = await newHabit.save();
    res.status(201).json(habit);
  } catch (err) {
    console.log(err);
    res.status(400).json({ msg: 'Habit creation failed' });
  }
});

module.exports = router;