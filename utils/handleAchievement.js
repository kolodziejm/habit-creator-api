const Achievement = require('../models/Achievement');

module.exports = async (title, userId) => {
  const achievement = await Achievement.findOne({ title });
  if (!achievement.usersWhoFinished.includes(userId)) {
    achievement.usersWhoFinished.push(userId);
    await achievement.save();
    return achievement.value;
  } else {
    return 0;
  }
}