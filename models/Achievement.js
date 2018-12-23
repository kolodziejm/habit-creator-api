const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const achievementSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  usersWhoFinished: {
    type: Array,
    default: []
  },
  value: {
    type: Number,
    required: true
  },
  imageName: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('achievements', achievementSchema);