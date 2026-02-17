import { createHandler } from '../_lib/handler.js';
import Task from '../_lib/models/Task.js';
import Habit from '../_lib/models/Habit.js';
import HabitOccurrence from '../_lib/models/HabitOccurrence.js';

export default createHandler(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { tasks = [], habits = [], habitOccurrences = [], mode = 'merge' } = req.body;
  const userId = req.user._id;
  const results = { tasks: 0, habits: 0, occurrences: 0 };

  if (mode === 'overwrite') {
    await Promise.all([
      Task.deleteMany({ userId }),
      Habit.deleteMany({ userId }),
      HabitOccurrence.deleteMany({ userId }),
    ]);
  }

  // Import tasks
  for (const t of tasks) {
    const taskData = { ...t, userId, _id: undefined, __v: undefined };
    if (mode === 'merge') {
      await Task.findOneAndUpdate(
        { userId, title: t.title, scope: t.scope, date: t.date },
        taskData,
        { upsert: true }
      );
    } else {
      await Task.create(taskData);
    }
    results.tasks++;
  }

  // Import habits
  for (const h of habits) {
    const habitData = { ...h, userId, _id: undefined, __v: undefined };
    if (mode === 'merge') {
      await Habit.findOneAndUpdate(
        { userId, title: h.title },
        habitData,
        { upsert: true }
      );
    } else {
      await Habit.create(habitData);
    }
    results.habits++;
  }

  // Import occurrences
  for (const o of habitOccurrences) {
    const occData = { ...o, userId, _id: undefined, __v: undefined };
    try {
      if (mode === 'merge') {
        await HabitOccurrence.findOneAndUpdate(
          { habitId: o.habitId, dateUTC: o.dateUTC },
          occData,
          { upsert: true }
        );
      } else {
        await HabitOccurrence.create(occData);
      }
      results.occurrences++;
    } catch (e) {
      // skip duplicates
    }
  }

  return res.json({ message: 'Import complete', results });
});
