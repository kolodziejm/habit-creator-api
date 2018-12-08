const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');
const secret = require('./keys').secret;

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = secret;

module.exports = passport => {
  passport.use(new JwtStrategy(opts, async (jwtPayload, done) => {
    try {
      const user = await User.findById(jwtPayload.userId);
      if (user) {
        return done(null, user);
      }
      return done(null, false);

    } catch (err) {
      console.log(err);
    }
  }));
};