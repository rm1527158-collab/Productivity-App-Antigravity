import { createHandler } from '../_lib/handler.js';
import Task from '../_lib/models/Task.js';
import Habit from '../_lib/models/Habit.js';
import HabitOccurrence from '../_lib/models/HabitOccurrence.js';
import UserPreferences from '../_lib/models/UserPreferences.js';

export default createHandler(async (req, res) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const userId = req.user._id;
  await Promise.all([
    Task.deleteMany({ userId }),
    Habit.deleteMany({ userId }),
    HabitOccurrence.deleteMany({ userId }),
    UserPreferences.deleteMany({ userId }),
  ]);

  return res.json({ message: 'All data cleared' });
});
