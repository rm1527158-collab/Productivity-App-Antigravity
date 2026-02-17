import { createHandler } from '../_lib/handler.js';

export default createHandler(async (req, res) => {
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
