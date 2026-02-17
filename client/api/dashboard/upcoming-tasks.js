import { createHandler } from '../_lib/handler.js';
import Task from '../_lib/models/Task.js';

export default createHandler(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Get overdue + today's incomplete tasks
  const tasks = await Task.find({
    userId: req.user._id,
    scope: 'daily',
    completed: false,
  }).sort({ date: 1, section: 1, rank: 1 });

  // Separate overdue vs upcoming
  const overdue = tasks.filter(t => t.date && t.date < today);
  const upcoming = tasks.filter(t => t.date && t.date >= today);

  return res.json([...overdue, ...upcoming].slice(0, 10));
});
