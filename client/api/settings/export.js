import { createHandler } from '../_lib/handler.js';
import Task from '../_lib/models/Task.js';
import Habit from '../_lib/models/Habit.js';
import HabitOccurrence from '../_lib/models/HabitOccurrence.js';
import UserPreferences from '../_lib/models/UserPreferences.js';

export default createHandler(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const userId = req.user._id;
  const [tasks, habits, occurrences, preferences] = await Promise.all([
    Task.find({ userId }).lean(),
    Habit.find({ userId }).lean(),
    HabitOccurrence.find({ userId }).lean(),
    UserPreferences.findOne({ userId }).lean(),
  ]);

  return res.json({
    tasks,
    habits,
    habitOccurrences: occurrences,
    preferences,
    exportedAt: new Date().toISOString(),
  });
});
