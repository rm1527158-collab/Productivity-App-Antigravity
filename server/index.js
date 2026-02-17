require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, stopMemoryDB } = require('./config/db');
const getUser = require('./middleware/getUser');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
// Routes
app.use('/api/tasks', getUser, require('./routes/tasks'));
app.use('/api/habits', getUser, require('./routes/habits'));
app.use('/api/dashboard', getUser, require('./routes/dashboard'));
app.use('/api/settings', getUser, require('./routes/settings'));
app.use('/api/quotes', require('./routes/quotes'));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date() }));

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    server.close(async () => {
      await stopMemoryDB();
      process.exit(0);
    });
  });
}

module.exports = app;
