# Port Configuration & Conflict Management

## Current Port Assignments

| Service | Port | Status | Auto-Fallback |
|---------|------|--------|---------------|
| **Backend Server** | 5000 | ✅ Running | ❌ Manual change required |
| **Frontend (Vite)** | 5173 | ✅ Running | ✅ Auto-switches if occupied |

## Port Conflict Prevention

### ✅ Your app is currently running without conflicts!

- **Backend**: Port 5000 (Express/Node.js)
- **Frontend**: Port 5173 (Vite/React)
- **Other apps detected**: Port 3000 is in use by another application (no conflict)

## How to Change Ports

### Backend Port (Manual Configuration)

If port 5000 is occupied, edit `server/.env`:

```env
# Change PORT to any available port
PORT=5001  # or 8000, 8080, etc.
```

Then restart the backend server.

### Frontend Port (Automatic Fallback)

The frontend is configured to automatically use the next available port if 5173 is occupied.

To force a specific port, edit `client/vite.config.js`:

```javascript
server: {
  port: 5174,        // Your preferred port
  strictPort: true,  // Set to true to fail if port is occupied
}
```

## Checking Port Availability

### Quick Check
Run the port checker utility:
```bash
.\check-ports.bat
```

### Manual Check
Check specific port:
```bash
netstat -ano | findstr :5000
```

Find what process is using a port:
```bash
netstat -ano | findstr :5000
# Look at the last column (PID), then:
tasklist | findstr <PID>
```

## Common Port Conflicts

| Port | Typically Used By |
|------|-------------------|
| 3000 | Create React App, Next.js |
| 3001 | Alternative React dev server |
| 4000 | GraphQL servers |
| 5000 | Flask, Express, various backends |
| 5173 | Vite (default) |
| 8000 | Django, Python HTTP server |
| 8080 | Tomcat, alternative HTTP servers |

## Troubleshooting

### Backend won't start (Port 5000 occupied)
1. Run `.\check-ports.bat` to verify
2. Change `PORT` in `server/.env`
3. Restart the backend

### Frontend won't start (Port 5173 occupied)
- Vite will automatically try the next port (5174, 5175, etc.)
- Check the terminal output for the actual port being used

### Kill a process using a port
```bash
# Find the PID
netstat -ano | findstr :5000

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

## Best Practices

1. **Use the port checker** before starting the app
2. **Document custom ports** if you change them
3. **Keep ports consistent** across team members
4. **Use environment variables** for port configuration
5. **Enable auto-fallback** for development servers (already configured for Vite)

## Current Configuration

### Backend (`server/.env`)
- Configurable via `PORT` environment variable
- Default: 5000
- No auto-fallback (manual change required)

### Frontend (`client/vite.config.js`)
- Default port: 5173
- Auto-fallback enabled (`strictPort: false`)
- Will use next available port if 5173 is occupied

---

**Last Updated**: 2026-02-10
**Status**: ✅ No conflicts detected
