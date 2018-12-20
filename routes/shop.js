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

module.exports = router;