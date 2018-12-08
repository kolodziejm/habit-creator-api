const express = require('express');
const passport = require('passport');
const { check, validationResult } = require('express-validator/check');

const Habit = require('../models/Habit');
const User = require('../models/User');

const router = express.Router();

// GET /api/habits/
// PRIVATE
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const habits = await Habit.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    res.status(404).json({
      msg: 'Couldn\'t fetch habits'
    })
  }
});

// POST /api/habits/
// Private
router.post('/', passport.authenticate('jwt', { session: false }), [
  check('name').not().isEmpty().withMessage('Enter a habit name').isLength({ max: 150 }).withMessage('Habit name has to be below 150 characters')
  // TODO: CHECK IF COLOR IS PRESENT
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // CHECK HOW MANY HABITS ARE PRESENT, IF 10 - RETURN AN ERROR, 15 IS A LIMIT
  try {
    const currentHabits = await Habit.find({ userId: req.user.id });
    console.log(currentHabits);
    if (currentHabits.length >= 10) {
      return res.status(400).json({ msg: 'Maximum of 10 habits are allowed' });
    }

    const { name } = req.body;
    const newHabit = new Habit({
      name,
      userId: req.user.id
    });

    const habit = await newHabit.save();
    res.json(habit);
  } catch (err) {
    console.log(err);
    res.status(400).json({ msg: 'Habit creation failed' })
  }
});

module.exports = router;