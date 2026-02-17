import { createHandler } from '../_lib/handler.js';
import HabitOccurrence from '../_lib/models/HabitOccurrence.js';

export default createHandler(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { from, to } = req.query;
  const filter = { userId: req.user._id };
  if (from || to) {
    filter.dateUTC = {};
    if (from) filter.dateUTC.$gte = from;
    if (to) filter.dateUTC.$lte = to;
  }

  const occurrences = await HabitOccurrence.find(filter).sort({ dateUTC: -1 });
  return res.json(occurrences);
});
