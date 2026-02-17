import { createHandler } from '../../_lib/handler.js';
import Task from '../../_lib/models/Task.js';

export default createHandler(async (req, res) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  const { section, rank } = req.body;

  const task = await Task.findOne({ _id: id, userId: req.user._id });
  if (!task) return res.status(404).json({ message: 'Task not found' });

  if (section) task.section = section;
  if (rank !== undefined) task.rank = rank;
  await task.save();

  return res.json(task);
});
