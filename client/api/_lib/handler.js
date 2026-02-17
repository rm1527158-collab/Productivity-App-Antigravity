import mongoose from 'mongoose';
import { connectDB } from './db.js';

export function createHandler(fn) {
  return async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    try {
      await connectDB();

      // User middleware
      const userId = req.headers['x-user-id'] || process.env.TEST_USER_ID || '507f1f77bcf86cd799439011';
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid User ID' });
      }
      req.user = { _id: userId };

      return await fn(req, res);
    } catch (error) {
      console.error('Handler error:', error);
      return res.status(500).json({ message: error.message });
    }
  };
}
