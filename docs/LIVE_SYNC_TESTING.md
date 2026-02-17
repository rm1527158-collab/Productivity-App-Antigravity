# Live Sync Testing Guide

## Quick Test Procedure

### Test 1: Single Device Test
1. Open the app at `http://localhost:5173/`
2. Navigate to the Daily Tasks page
3. Open browser DevTools (F12) → Console tab
4. Watch for console logs showing data fetches every 5 seconds
5. Open a second tab with the same page
6. Add a task in one tab
7. Within 5 seconds, the task should appear in the other tab automatically

### Test 2: Multi-Device Test (Recommended)
1. **Device 1:** Open `http://localhost:5173/daily`
2. **Device 2:** Open the same URL on another device/browser
3. On Device 1: Add a new task
4. On Device 2: Watch the task list - new task appears within 5 seconds
5. On Device 2: Mark a task as complete
6. On Device 1: Task completion updates within 5 seconds

### Test 3: Database Sync Test
1. Open MongoDB Compass or Studio 3T
2. Connect to: `mongodb+srv://rm1527158_db_user:jsT1kszANUfzGaHl@cluster0.p9exhxe.mongodb.net/operability`
3. Navigate to the `tasks` collection
4. Manually add a task document:
```json
{
  "title": "Test Task from Database",
  "completed": false,
  "scope": "daily",
  "date": "2026-02-09",
  "section": "work",
  "priority": "high",
  "userId": "507f1f77bcf86cd799439011",
  "priorityRank": 0,
  "version": 0,
  "createdAt": "2026-02-09T17:30:00.000Z",
  "updatedAt": "2026-02-09T17:30:00.000Z"
}
```
5. Within 5 seconds, the task appears in the app without refresh!

### Test 4: Network Interruption Test
1. Open the app on Daily Tasks page
2. Add a few tasks
3. Disconnect network (or pause in DevTools → Network tab)
4. Wait 10-15 seconds
5. Reconnect network
6. Polling should resume automatically
7. Check console for any errors

### Expected Behaviors

✅ **Data refreshes every 5 seconds** - Check Network tab for `/tasks` requests
✅ **Green "Live" indicator visible** - Pulsing dot on Daily/Vision/Routine pages
✅ **No page flicker** - UI stays smooth during updates
✅ **Changes sync across devices** - Multi-tab/device updates work
✅ **Cleanup on unmount** - No memory leaks when navigating away

### Console Monitoring

Watch for these patterns in DevTools Console:
```
# Successful fetch pattern
GET /tasks?scope=daily&date=2026-02-09 200 OK

# Every 5 seconds you should see new requests
# Even if data hasn't changed, requests continue
```

### Performance Check

Monitor in DevTools → Performance tab:
- CPU usage should remain low (~1-2%)
- No memory leaks (heap size stable)
- Polling intervals consistent at ~5s

## Common Issues

### Polling Not Working
- Check console for JavaScript errors
- Verify `useAutoRefresh` hook is imported
- Ensure `fetchData` function is properly defined

### Data Not Updating
- Check Network tab for 200 OK responses
- Verify backend is running on port 5000
- Check MongoDB connection in server logs

### Performance Issues
- Reduce polling interval if needed
- Check for unnecessary re-renders
- Monitor network request size

## Success Criteria

☑️ Data updates automatically without user action
☑️ Multiple tabs/devices stay synced
☑️ No console errors during polling
☑️ Live indicator shows on relevant pages
☑️ App remains responsive during sync
☑️ No memory leaks over time

---

**Ready to test!** Open the app and watch the magic happen! 🎉
