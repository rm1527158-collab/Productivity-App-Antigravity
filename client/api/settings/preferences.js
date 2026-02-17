import { createHandler } from '../_lib/handler.js';
import UserPreferences from '../_lib/models/UserPreferences.js';

export default createHandler(async (req, res) => {
  if (req.method === 'GET') {
    let prefs = await UserPreferences.findOne({ userId: req.user._id });
    if (!prefs) {
      prefs = await UserPreferences.create({ userId: req.user._id });
    }
    return res.json(prefs);
  }

  if (req.method === 'PUT') {
    const prefs = await UserPreferences.findOneAndUpdate(
      { userId: req.user._id },
      { $set: flattenForUpdate(req.body) },
      { new: true, upsert: true, runValidators: true }
    );
    return res.json(prefs);
  }

  return res.status(405).json({ message: 'Method not allowed' });
});

function flattenForUpdate(obj, prefix = '', result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      flattenForUpdate(value, path, result);
    } else {
      result[path] = value;
    }
  }
  return result;
}
