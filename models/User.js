const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  coins: {
    type: Number,
    default: 0,
    required: true
  },
  lastActiveDate: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('users', userSchema);