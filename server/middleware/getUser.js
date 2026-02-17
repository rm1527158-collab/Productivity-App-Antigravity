const mongoose = require('mongoose');
require('dotenv').config();

// Middleware to simulate authentication or strict user context
// For a desktop-first personal app, we might just define a static user or allow passing ID
const getUser = (req, res, next) => {
  // Check header or query or default to test user ID from environment
  const userId = req.headers['x-user-id'] || process.env.TEST_USER_ID || '507f1f77bcf86cd799439011';
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid User ID' });
  }

  req.user = { _id: userId };
  next();
};

module.exports = getUser;
