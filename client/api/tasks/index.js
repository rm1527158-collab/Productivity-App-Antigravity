import { createHandler } from '../_lib/handler.js';
import Task from '../_lib/models/Task.js';
import { getBucketQuery } from '../_lib/utils/bucketUtils.js';

export default createHandler(async (req, res) => {
  if (req.method === 'GET') {
    const { scope = 'daily', date, periodStart, section } = req.query;
    const filter = { userId: req.user._id, ...getBucketQuery(scope, date, periodStart) };
    if (section) filter.section = section;

    const tasks = await Task.find(filter).sort({ section: 1, rank: 1 });
    return res.json(tasks);
  }

  if (req.method === 'POST') {
    const { title, section = 'backlog', scope = 'daily', date, periodStart, notes } = req.body;

    // Capacity checks
    if (section === 'topPriority' && scope === 'daily') {
      const existing = await Task.countDocuments({
        userId: req.user._id,
        section: 'topPriority',
        completed: false,
        ...getBucketQuery(scope, date, periodStart),
      });
      if (existing >= 1) {
        return res.status(400).json({ message: 'Only 1 Top Priority task allowed per day' });
      }
    }
    if (section === 'secondary') {
      const existing = await Task.countDocuments({
        userId: req.user._id,
        section: 'secondary',
        completed: false,
        ...getBucketQuery(scope, date, periodStart),
      });
      if (existing >= 3) {
        return res.status(400).json({ message: 'Maximum 3 Secondary tasks allowed per period' });
      }
    }

    // Calculate rank
    const maxRankDoc = await Task.findOne({
      userId: req.user._id,
      section,
      ...getBucketQuery(scope, date, periodStart),
    }).sort({ rank: -1 });
    const rank = maxRankDoc ? maxRankDoc.rank + 1 : 0;

    const task = await Task.create({
      userId: req.user._id,
      title,
      section,
      scope,
      date,
      periodStart,
      rank,
      notes,
    });

    return res.status(201).json(task);
  }

  return res.status(405).json({ message: 'Method not allowed' });
});
