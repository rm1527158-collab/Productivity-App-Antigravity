import { createHandler } from '../_lib/handler.js';
import Task from '../_lib/models/Task.js';
import Habit from '../_lib/models/Habit.js';
import HabitOccurrence from '../_lib/models/HabitOccurrence.js';

export default createHandler(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const userId = req.user._id;
  const [totalTasks, completedTasks, totalHabits, totalOccurrences] = await Promise.all([
    Task.countDocuments({ userId }),
    Task.countDocuments({ userId, completed: true }),
    Habit.countDocuments({ userId }),
    HabitOccurrence.countDocuments({ userId }),
  ]);

  return res.json({
    totalTasks,
    completedTasks,
    completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    totalHabits,
    totalOccurrences,
  });
});
