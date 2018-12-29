const express = require('express');
const passport = require('passport');
const { check, validationResult } = require('express-validator/check');

const Habit = require('../models/Habit');
const User = require('../models/User');
const Achievement = require('../models/Achievement');

const differenceInCalendarDays = require('date-fns/difference_in_calendar_days');

const createErrorObj = require('../utils/createErrorObj');
const handleAchievement = require('../utils/handleAchievement');

const router = express.Router();

// GET /api/habits
// PRIVATE
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const now = new Date().toISOString();
    const userDaysDiff = differenceInCalendarDays(now, user.lastActiveDate)
    let failAchievValue = 0;
    console.log({ now }, user.lastActiveDate)
    console.log({ userDaysDiff })
    if (userDaysDiff >= 1 && user.lastActiveDate !== null) {
      console.log('INSIDE >= 1 STATEMENT in GET', { user })
      const habitsArray = await Habit.find({ userId: req.user.id });
      if (habitsArray.some(habit => habit.streak >= 7 && !habit.isFinished)) {
        failAchievValue += await handleAchievement('I don\'t feel like doing it today', req.user.id);
      }
      await Habit.updateMany({ userId: req.user.id, isFinished: false }, { streak: 0 });
      await Habit.updateMany({ userId: req.user.id }, { isFinished: false });
      if (userDaysDiff >= 2) {
        console.log('INSIDE >= 2 STATEMENT in GET')
        await Habit.updateMany({ userId: req.user.id }, { streak: 0 })
      }
      user.lastActiveDate = now;
      user.coins += failAchievValue;
      await user.save();
    } else if (user.lastActiveDate === null) {
      user.lastActiveDate = now;
      await user.save();
    }
    const habits = await Habit.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ habits, failAchievValue, coins: user.coins });
  } catch (err) {
    console.log(err)
    res.status(404).json({
      msg: 'Couldn\'t fetch habits'
    });
  }
});

// POST /api/habits
// Private
router.post('/', passport.authenticate('jwt', { session: false }), [
  check('name').not().isEmpty().withMessage('Enter a habit name').trim().isLength({ max: 100 }).withMessage('Habit name has to be below 100 characters'),
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
  check('editHabitName').not().isEmpty().withMessage('Enter a habit name').trim().isLength({ max: 100 }).withMessage('Habit name has to be below 100 characters'),
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
    const user = await User.findById(req.user.id);
    let value, bonus;
    switch (habit.difficulty) {
      case 'easy':
        bonus = 2, value = 50;
        break;

      case 'medium':
        bonus = 5, value = 100;
        break;

      case 'hard':
        bonus = 10, value = 200;
        break;

      default: {
        bonus = 0, value = 0;
      }
    }
    user.coins += value + bonus * habit.streak;
    habit.streak++;
    let achievementCoins = 0;
    const journeyAchCoins = await handleAchievement('Journey has begun', req.user.id);
    achievementCoins += journeyAchCoins;
    switch (habit.streak) {
      case 3: {
        console.log('CASE 3 TRIGGERED')
        achievementCoins += await handleAchievement('Freshman', req.user.id);
      }
        break;
      case 7: {
        console.log('CASE 7 TRIGGERED')
        achievementCoins += await handleAchievement('On the right track', req.user.id);
      }
        break;
      case 14: {
        console.log('CASE 14 TRIGGERED')
        achievementCoins += await handleAchievement('Making progress', req.user.id);
      }
        break;
      case 30: {
        console.log('CASE 30 TRIGGERED')
        achievementCoins += await handleAchievement('Entire month', req.user.id);
      }
        break;
      case 90: {
        console.log('CASE 90 TRIGGERED')
        achievementCoins += await handleAchievement('A quarter', req.user.id);
      }
        break;
      case 180: {
        console.log('CASE 180 TRIGGERED')
        achievementCoins += await handleAchievement('Owning it', req.user.id);
      }
        break;
      case 365: {
        console.log('CASE 365 TRIGGERED')
        achievementCoins += await handleAchievement('Godlike', req.user.id);
      }
        break;
      default:
        achievementCoins;
    }
    user.coins += achievementCoins;
    await habit.save();
    await user.save();
    res.json({ msg: 'Habit saved as finished!', coins: user.coins, value, bonus: bonus * (habit.streak - 1) });
  } catch (err) {
    console.log(err);
    res.status(400).json({ msg: 'Couldn\'t finish the habit' });
  }
});

module.exports = router;