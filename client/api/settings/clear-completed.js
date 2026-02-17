import { createHandler } from '../_lib/handler.js';
import Task from '../_lib/models/Task.js';

export default createHandler(async (req, res) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const result = await Task.deleteMany({ userId: req.user._id, completed: true });
  return res.json({ message: 'Completed tasks cleared', count: result.deletedCount });
});
