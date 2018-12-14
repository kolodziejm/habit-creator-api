const express = require('express');
const passport = require('passport');
const { check, validationResult } = require('express-validator/check');

const Habit = require('../models/Habit');
const User = require('../models/User');

const createErrorObj = require('../utils/createErrorObj');

const router = express.Router();

// GET /api/habits
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

// POST /api/habits
// Private
router.post('/', passport.authenticate('jwt', { session: false }), [
  check('name').not().isEmpty().withMessage('Enter a habit name').isLength({ max: 150 }).withMessage('Habit name has to be below 150 characters')
  // TODO: CHECK IF COLOR IS PRESENT
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errObj = createErrorObj(errors.array());
    return res.status(400).json({ errObj });
  }

  try {
    const currentHabits = await Habit.find({ userId: req.user.id });
    if (currentHabits.length >= 10) {
      return res.status(400).json({ errObj: { name: 'Maximum of 10 habits are allowed' } });
    }
    const { name } = req.body;
    const newHabit = new Habit({
      name,
      userId: req.user.id
    });
    const habit = await newHabit.save();
    res.status(201).json(habit);
  } catch (err) {
    console.log(err);
    res.status(400).json({ msg: 'Habit creation failed' })
  }
});

// PATCH /api/habits/:habitId
// Private
router.patch('/:habitId', passport.authenticate('jwt', { session: false }), [
  check('editHabitName').not().isEmpty().withMessage('Enter a habit name').isLength({ max: 150 }).withMessage('Habit name has to be below 150 characters')
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errObj = createErrorObj(errors.array());
    return res.status(400).json({ errObj });
  }

  const { editHabitName } = req.body;
  try {
    const habit = await Habit.findById(req.params.habitId);
    if (req.user.id !== habit.userId.toString()) {
      return res.status(422).json({ errObj: { msg: 'Not authorized' } });
    }
    habit.name = editHabitName;
    const updatedHabit = await habit.save();
    res.json(updatedHabit);
  } catch (err) {
    console.log(err);
    res.json({ errObj: { msg: 'Couldn\'t update the habit' } })
  }
});

// DELETE /api/habits/:habitId
router.delete('/:habitId', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const habit = await Habit.findById(req.params.habitId);
    if (req.user.id !== habit.userId.toString()) {
      return res.status(422).json({ msg: 'Not authorized' });
    }
    await habit.remove();
    res.json({ msg: 'Habit successfully deleted' });

  } catch (err) {
    console.log(err);
    res.json({ msg: 'Couldn\'t delete the habit' })
  }
});

// TODO: habit finish, unfinish, checkStreak routes!

module.exports = router;