import { createHandler } from '../_lib/handler.js';
import quotes from '../_lib/data/quotes.js';

export default createHandler(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % quotes.length;

  return res.json(quotes[index]);
});
