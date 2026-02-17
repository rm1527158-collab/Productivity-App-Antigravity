import { createHandler } from '../_lib/handler.js';
import quotes from '../_lib/data/quotes.js';

export default createHandler(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const index = Math.floor(Math.random() * quotes.length);
  return res.json(quotes[index]);
});
