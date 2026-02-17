import { createHandler } from '../../_lib/handler.js';
import Task from '../../_lib/models/Task.js';
import { getBucketQuery } from '../../_lib/utils/bucketUtils.js';

export default createHandler(async (req, res) => {
  const { id } = req.query;

  if (req.method === 'PUT') {
    const updates = req.body;
    const task = await Task.findOne({ _id: id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Optimistic concurrency
    if (updates.__v !== undefined && updates.__v !== task.__v) {
      return res.status(409).json({ message: 'Conflict: task was modified', current: task });
    }

    // If moving to topPriority, check capacity
    if (updates.section === 'topPriority' && task.section !== 'topPriority') {
      const existing = await Task.countDocuments({
        userId: req.user._id,
        _id: { $ne: id },
        section: 'topPriority',
        completed: false,
        ...getBucketQuery(task.scope, task.date, task.periodStart),
      });
      if (existing >= 1) {
        return res.status(400).json({ message: 'Only 1 Top Priority allowed' });
      }
    }

    // If moving to secondary, check capacity
    if (updates.section === 'secondary' && task.section !== 'secondary') {
      const existing = await Task.countDocuments({
        userId: req.user._id,
        _id: { $ne: id },
        section: 'secondary',
        completed: false,
        ...getBucketQuery(task.scope, task.date, task.periodStart),
      });
      if (existing >= 3) {
        return res.status(400).json({ message: 'Maximum 3 Secondary tasks allowed' });
      }
    }

    Object.assign(task, updates);
    delete task.__v;
    await task.save();

    return res.json(task);
  }

  if (req.method === 'DELETE') {
    const task = await Task.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.json({ message: 'Task deleted' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
});
