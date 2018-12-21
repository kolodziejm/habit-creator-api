const express = require('express');
const passport = require('passport');
const { check, validationResult } = require('express-validator/check');

const Habit = require('../models/Habit');
const User = require('../models/User');

const differenceInCalendarDays = require('date-fns/difference_in_calendar_days');

const createErrorObj = require('../utils/createErrorObj');

const router = express.Router();

// GET /api/habits
// PRIVATE
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const now = new Date().toISOString();
    const userDaysDiff = differenceInCalendarDays(now, user.lastActiveDate)
    if (userDaysDiff >= 1) {
      await Habit.updateMany({ isFinished: false }, { streak: 0 });
      await Habit.updateMany({}, { isFinished: false });
      if (userDaysDiff >= 2) {
        await Habit.updateMany({}, { streak: 0 })
      }
      user.lastActiveDate = now;
      await user.save();
    }
    const habits = await Habit.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    res.status(404).json({
      msg: 'Couldn\'t fetch habits'
    });
  }
});

// POST /api/habits
// Private
router.post('/', passport.authenticate('jwt', { session: false }), [
  check('name').not().isEmpty().withMessage('Enter a habit name').isLength({ max: 100 }).withMessage('Habit name has to be below 100 characters'),
  check('color').not().isEmpty().withMessage('Choose a color').isLength({ min: 4, max: 7 }).withMessage('Incorrect color format'),
  check('difficulty').not().isEmpty().withMessage('Difficulty not selected').isIn(['easy', 'medium', 'hard']).withMessage('Wrong difficulty')
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errObj = createErrorObj(errors.array());
    return res.status(400).json(errObj);
  }

  try {
    const currentHabits = await Habit.find({ userId: req.user.id });
    if (currentHabits.length >= 10) {
      return res.status(400).json({ name: 'Maximum of 10 habits are allowed' });
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

// PATCH /api/habits/:habitId
// Private
router.patch('/:habitId', passport.authenticate('jwt', { session: false }), [
  check('editHabitName').not().isEmpty().withMessage('Enter a habit name').isLength({ max: 100 }).withMessage('Habit name has to be below 100 characters'),
  check('editHabitColor').not().isEmpty().withMessage('Choose a color').isLength({ min: 4, max: 7 }).withMessage('Incorrect color format'),
  check('editHabitDiff').not().isEmpty().withMessage('Difficulty not selected').isIn(['easy', 'medium', 'hard']).withMessage('Wrong difficulty')
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errObj = createErrorObj(errors.array());
    return res.status(400).json(errObj);
  }

  const { editHabitName, editHabitColor, editHabitDiff } = req.body;
  try {
    const habit = await Habit.findById(req.params.habitId);
    if (req.user.id !== habit.userId.toString()) {
      return res.status(422).json({ msg: 'Not authorized' });
    }
    habit.name = editHabitName;
    habit.color = editHabitColor;
    habit.difficulty = editHabitDiff;
    const updatedHabit = await habit.save();
    res.json(updatedHabit);
  } catch (err) {
    console.log(err);
    res.status(400).json({ msg: 'Couldn\'t update the habit' });
  }
});

// DELETE /api/habits/:habitId
// Private
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
    res.status(400).json({ msg: 'Couldn\'t delete the habit' });
  }
});

// PATCH /api/habits/finish/:habitId
// Private
router.patch('/finish/:habitId', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const habit = await Habit.findById(req.params.habitId);
    if (req.user.id !== habit.userId.toString()) {
      return res.status(422).json({ msg: 'Not authorized' });
    }
    if (habit.isFinished) {
      return res.status(422).json({ msg: 'Habit is already finished' });
    }
    habit.isFinished = true;
    habit.lastDateFinished = new Date().toISOString();
    habit.streak++;
    await habit.save();
    res.json({ msg: 'Habit saved as finished!' });
  } catch (err) {
    console.log(err);
    res.status(400).json({ msg: 'Couldn\'t finish the habit' });
  }
});

module.exports = router;