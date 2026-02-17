import { createHandler } from '../_lib/handler.js';
import Habit from '../_lib/models/Habit.js';
import HabitOccurrence from '../_lib/models/HabitOccurrence.js';

function computeStreak(habit, occurrences) {
  const dateSet = new Set(
    occurrences
      .filter(o => o.habitId.toString() === habit._id.toString() && o.completed)
      .map(o => o.dateUTC)
  );

  let streak = 0;
  const today = new Date();
  const d = new Date(today);

  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (dateSet.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export default createHandler(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const habits = await Habit.find({ userId: req.user._id, active: true });
  const occurrences = await HabitOccurrence.find({ userId: req.user._id });

  const streaks = habits.map(h => ({
    habitId: h._id,
    title: h.title,
    streak: computeStreak(h, occurrences),
  }));

  return res.json(streaks);
});
