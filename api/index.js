const app = require('../server/index');
const { connectDB } = require('../server/config/db');

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
