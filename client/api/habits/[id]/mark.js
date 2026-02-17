import { createHandler } from '../../_lib/handler.js';
import Habit from '../../_lib/models/Habit.js';
import HabitOccurrence from '../../_lib/models/HabitOccurrence.js';

export default createHandler(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  const { dateUTC, completed = true } = req.body;

  const habit = await Habit.findOne({ _id: id, userId: req.user._id });
  if (!habit) return res.status(404).json({ message: 'Habit not found' });

  if (completed) {
    await HabitOccurrence.findOneAndUpdate(
      { habitId: id, dateUTC },
      { habitId: id, userId: req.user._id, dateUTC, completed: true },
      { upsert: true, new: true }
    );
  } else {
    await HabitOccurrence.findOneAndDelete({ habitId: id, dateUTC });
  }

  return res.json({ message: completed ? 'Marked' : 'Unmarked' });
});
