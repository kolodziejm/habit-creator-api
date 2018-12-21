const express = require('express');
const passport = require('passport');
const { check, validationResult } = require('express-validator/check');

const User = require('../models/User');
const Reward = require('../models/Reward');

const createErrorObj = require('../utils/createErrorObj');

const router = express.Router();

// GET /api/shop
// PRIVATE
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const rewards = await Reward.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ rewards, coins: user.coins });
  } catch (err) {
    res.status(404).json({ msg: 'Failed to fetch' });
  }
});

// POST /api/shop/add-reward
// PRIVATE
router.post('/add-reward', passport.authenticate('jwt', { session: false }), [
  check('title').not().isEmpty().withMessage('Enter a reward title').isLength({ max: 100 }).withMessage('Reward name has to be below 100 characters'),
  check('description').optional().isLength({ min: 5, max: 100 }).withMessage('Description has to be between 5 and 100 characters'),
  check('price')
    .isInt({ gt: 0, lt: 1000001 }).withMessage('Price has to be an integer and be between 1 and a million')
    .not().isEmpty().withMessage('Set a price for the reward'),
  check('imageUrl').optional().isURL().withMessage('Provided image URL is invalid')
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errObj = createErrorObj(errors.array());
    return res.status(400).json(errObj);
  }

  try {
    const currentRewards = await Reward.find({ userId: req.user.id });
    if (currentRewards.length >= 20) {
      return res.status(400).json({ title: 'Maximum of 20 rewards are allowed' });
    }
    const { title, description, price, imageUrl } = req.body;
    const newReward = new Reward({
      title,
      userId: req.user.id,
      description,
      price,
      imageUrl
    });
    const reward = await newReward.save();
    res.status(201).json(reward);
  } catch (err) {
    console.log(err);
    res.status(400).json({ msg: 'Reward creation failed' });
  }
});

module.exports = router;