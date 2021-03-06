const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const habitSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  streak: {
    type: Number,
    default: 0
  },
  isFinished: {
    type: Boolean,
    default: false
  },
  lastDateFinished: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('habits', habitSchema);