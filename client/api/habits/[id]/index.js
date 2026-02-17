import { createHandler } from '../../_lib/handler.js';
import Habit from '../../_lib/models/Habit.js';
import HabitOccurrence from '../../_lib/models/HabitOccurrence.js';

export default createHandler(async (req, res) => {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    const habit = await Habit.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    // Cascade delete occurrences
    await HabitOccurrence.deleteMany({ habitId: id });
    return res.json({ message: 'Habit deleted' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
});
