const express = require('express');
const passport = require('passport');

const User = require('../models/User');
const Achievement = require('../models/Achievement');

const router = express.Router();

// GET /api/achievements
// Private
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const achievements = await Achievement.find();
    res.json(achievements);
  } catch (err) {
    res.status(404).json({
      msg: 'Couldn\'t fetch habits'
    });
  }
});

module.exports = router;