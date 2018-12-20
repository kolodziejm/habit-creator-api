const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rewardSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
}, { timestamps: true });

module.exports = mongoose.model('rewards', rewardSchema);