# Local Database Setup Guide

## Overview

Your productivity app now uses **MongoDB Memory Server** for local development. This is an in-memory MongoDB instance that requires no installation - perfect for temporary usage and development.

## Architecture

```
Frontend (React + Vite)  →  Backend (Express)  →  MongoDB Memory Server
Port 3000                   Port 5000             Port 27017 (in-memory)
```

## ✅ What's Already Set Up

1. **MongoDB Memory Server** - Installed as a dev dependency
2. **Backend Configuration** - Auto-starts in-memory database
3. **Sample Data** - Seed script with tasks, habits, and occurrences
4. **User Authentication** - Test user ID: `507f1f77bcf86cd799439011`
5. **Frontend Integration** - Axios configured for `localhost:5000`

## 🚀 Quick Start

### Start the Full Stack

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Seed Sample Data

While the backend server is running, in a new terminal:
```bash
cd server
npm run seed
```

This creates:
- 5 sample tasks (daily, weekly, monthly, quarterly)
- 4 sample habits
- 28 habit occurrences across the past week

## 📝 Important Notes

### Data Persistence

> [!WARNING]
> **Data is NOT persisted between restarts**
> 
> MongoDB Memory Server runs entirely in RAM. When you stop the backend server, all data is lost. This is intentional for temporary/development usage.
> 
> **To persist data between sessions**, you'll need to either:
> - Run `npm run seed` after each server restart
> - Switch to a real MongoDB installation

### Test User ID

All operations use a single test user ID: `507f1f77bcf86cd799439011`

This is configured in:
- `.env` → `TEST_USER_ID`
- Frontend → `client/src/lib/axios.js`
- Backend → `server/middleware/getUser.js`

## 📚 NPM Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start backend in production mode |
| `npm run dev` | Start backend with nodemon (auto-restart) |
| `npm run seed` | Seed database with sample data |
| `npm run setup` | Alias for `npm run seed` |

## 🔧 Configuration

### Environment Variables (`.env`)

```env
MONGO_URI=                    # Leave empty for in-memory DB
USE_MEMORY_DB=true           # Force in-memory DB
PORT=5000                    # Backend server port
NODE_ENV=development         # Environment
TEST_USER_ID=507f1f77...     # Test user for development
```

### Switching to Real MongoDB

To use an external MongoDB instance:

1. Install MongoDB Community Server
2. Update `.env`:
   ```env
   MONGO_URI=mongodb://localhost:27017/operability
   USE_MEMORY_DB=false
   ```
3. Restart the backend server

## 🎯 Verification Checklist

- [x] Backend starts without errors
- [x] MongoDB Memory Server connects successfully
- [x] Seed script runs without errors
- [ ] Frontend can fetch data from backend
- [ ] CRUD operations work end-to-end

## 🐛 Troubleshooting

### Port 5000 Already in Use

```bash
# Windows - Find and kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Connection Refused

- Ensure backend is running (`npm run dev` in server directory)
- Check `.env` file exists in server directory
- Verify frontend axios baseURL is `http://localhost:5000`

### No Data Showing

- Run `npm run seed` to populate the database
- Check browser console for API errors
- Verify backend logs show successful database connection

## 📂 File Structure

```
server/
├── config/
│   └── db.js                 # Database connection with Memory Server
├── models/                   # Mongoose schemas
├── middleware/
│   └── getUser.js           # User authentication middleware
├── routes/                  # API endpoints
├── seed-data.js             # Sample data script
├── .env                     # Environment configuration
└── index.js                 # Main server file
```

## 🔗 Related Files

- [db.js](file:///c:/CODING/PRODUCTIVITY%20APP/server/config/db.js) - Database configuration
- [seed-data.js](file:///c:/CODING/PRODUCTIVITY%20APP/server/seed-data.js) - Sample data script
- [axios.js](file:///c:/CODING/PRODUCTIVITY%20APP/client/src/lib/axios.js) - Frontend API client
- [.env](file:///c:/CODING/PRODUCTIVITY%20APP/server/.env) - Environment variables
