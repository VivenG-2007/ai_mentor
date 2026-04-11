const User = require('../models/User');
const Session = require('../models/Session');

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

async function scheduleWeeklySessions() {
  try {
    const users = await User.find({ isActive: true, role: 'user' });
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();
    
    for (const user of users) {
      const existing = await Session.findOne({ user: user._id, weekNumber, year });
      if (!existing) {
        await Session.create({
          user: user._id,
          weekNumber,
          year,
          status: 'scheduled',
          isScheduled: true,
          scheduledFor: now,
        });
        console.log(`📅 Session scheduled for user: ${user.name} (Week ${weekNumber})`);
      }
    }
  } catch (error) {
    console.error('Scheduler error:', error);
  }
}

module.exports = { scheduleWeeklySessions, getWeekNumber };
