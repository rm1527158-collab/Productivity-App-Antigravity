import { createHandler } from '../_lib/handler.js';
import Task from '../_lib/models/Task.js';

export default createHandler(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const today = new Date().toISOString().slice(0, 10);

  const result = await Task.updateMany(
    {
      userId: req.user._id,
      scope: 'daily',
      completed: false,
      date: { $lt: today },
    },
    { $set: { date: today } }
  );

  return res.json({ rolledOver: result.modifiedCount });
});
