import { createHandler } from '../_lib/handler.js';
import Habit from '../_lib/models/Habit.js';

export default createHandler(async (req, res) => {
  if (req.method === 'GET') {
    const habits = await Habit.find({ userId: req.user._id, active: true }).sort({ createdAt: -1 });
    return res.json(habits);
  }

  if (req.method === 'POST') {
    const { title, icon, frequency, customDays } = req.body;
    const habit = await Habit.create({
      userId: req.user._id,
      title,
      icon,
      frequency,
      customDays,
    });
    return res.status(201).json(habit);
  }

  return res.status(405).json({ message: 'Method not allowed' });
});
