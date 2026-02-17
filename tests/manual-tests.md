# Manual UI Test Procedures

Step-by-step tests for UI features requiring browser interaction.  
Server must be running at `http://localhost:5173`.

---

## 1. Navigation

| # | Step | Expected |
|---|------|----------|
| 1 | Click each sidebar link: Dashboard, Tasks, Habits, Goals, Settings | Each loads the correct page without errors |
| 2 | Check URL changes to `/`, `/tasks`, `/routine`, `/vision`, `/settings` | URLs match expected routes |
| 3 | Sidebar collapse/expand toggle works | Sidebar collapses and expands smoothly |

---

## 2. Dashboard

| # | Step | Expected |
|---|------|----------|
| 1 | Load Dashboard page | All widgets render: Year/Month/Week progress bars, Goal Progress, Weekly Chart, Category Focus, Activity Heatmap, Upcoming Tasks, Quote |
| 2 | Verify Year Progress Bar | Shows current year progress with correct percentage (~13% for mid-Feb) |
| 3 | Verify Month Progress Bar | Shows current month progress |
| 4 | Verify Week Progress Bar | Shows current week progress |
| 5 | Check Focus Score | Shows a number 0-100 with visual indicator |
| 6 | Verify Quote Widget | Shows a quote with author attribution |
| 7 | Wait 5+ seconds | Dashboard data auto-refreshes (check network tab for `/dashboard/summary` calls) |
| 8 | Create a task on Tasks page, return to Dashboard | Pending task count increases, Upcoming Tasks shows new task |

---

## 3. Daily Tasks

| # | Step | Expected |
|---|------|----------|
| 1 | Click "+" button on a section | New task input appears |
| 2 | Type task title and press Enter | Task is created and appears in the section |
| 3 | Check section limits | Top Priority: max 1, Secondary: max 3 — overflow shows error |
| 4 | Click checkbox on a task | Task marks as completed (strikethrough/visual) |
| 5 | Uncheck a completed task | Task returns to uncompleted state |
| 6 | Drag a task to reorder | Task reorders within section |
| 7 | Use "Move to" menu on a task | Task moves to weekly/monthly/quarterly/yearly scope |
| 8 | Delete a task | Task disappears from the list |
| 9 | Navigate to previous/next day | Tasks for that day load from database |
| 10 | Rollover overdue tasks | Button appears if overdue tasks exist; tasks move to today |

---

## 4. Vision (Goals)

| # | Step | Expected |
|---|------|----------|
| 1 | Switch between Weekly, Monthly, Quarterly, Yearly tabs | Each tab shows tasks for that scope and period |
| 2 | Create a goal in Weekly view | Goal appears in the Must/Should/Could sections |
| 3 | Check section limits (same as Tasks) | Top Priority: 1, Secondary: 3 per period |
| 4 | Navigate between periods (prev/next week/month/etc.) | Tasks load correctly for each period |
| 5 | Complete a goal | Visual completion indicator updates |
| 6 | Move a goal between scopes | Goal moves correctly with date adjustment |
| 7 | Delete a goal | Goal is removed |

---

## 5. Routine (Habits)

| # | Step | Expected |
|---|------|----------|
| 1 | Click "+" to add a new habit | Modal/form appears with title, frequency, icon, color fields |
| 2 | Create a daily habit | Habit appears in the list |
| 3 | Create a weekly habit | Habit appears with weekly frequency indicator |
| 4 | Create a custom frequency habit | Habit appears with "Every X days" indicator |
| 5 | Toggle a habit as complete for today | Visual indicator shows completion (checkmark, color change) |
| 6 | Toggle the same habit off | Completion is undone |
| 7 | Check streak counter | Streak updates correctly based on consecutive completions |
| 8 | Delete a habit | Habit and its occurrences are removed |
| 9 | Wait 5+ seconds | Habit data auto-refreshes |

---

## 6. Settings — Profile

| # | Step | Expected |
|---|------|----------|
| 1 | Change username to "TestUser123" | Input updates |
| 2 | Change title to "Super Productive" | Input updates |
| 3 | Click Save | Success toast appears |
| 4 | Check TopNavbar immediately | Username and title update in navbar without page reload |
| 5 | Refresh page | Profile changes persist from database |

---

## 7. Settings — Avatar

| # | Step | Expected |
|---|------|----------|
| 1 | Click avatar upload area | File picker opens |
| 2 | Select an image file | Cropping interface appears |
| 3 | Adjust crop and click Save | Cropped image shows as avatar preview |
| 4 | Save profile | Avatar persists; navbar avatar updates |
| 5 | Try uploading file > 5MB | Error message shown |
| 6 | Try uploading non-image file | Error message shown |

---

## 8. Settings — Data Management

| # | Step | Expected |
|---|------|----------|
| 1 | Click Export | JSON file downloads with tasks, habits, occurrences |
| 2 | Verify exported JSON structure | Contains arrays for tasks, habits, occurrences |
| 3 | Click Import and select the exported file | Import succeeds with confirmation message |
| 4 | Click Clear Completed Tasks | Completed tasks are removed; incomplete tasks remain |

---

## 9. Auto-Refresh / Live Sync

| # | Step | Expected |
|---|------|----------|
| 1 | Open Dashboard, open browser DevTools Network tab | Network requests visible |
| 2 | Wait 15 seconds | See 2-3 requests to `/dashboard/summary` (every 5s) |
| 3 | Open another browser tab, create a task via direct API call (or use the app) | — |
| 4 | Switch back to Dashboard tab | Within 5 seconds, dashboard reflects the new task |
| 5 | Open Tasks page, watch Network tab | See periodic GET `/tasks` requests |

---

## 10. Search (TopNavbar)

| # | Step | Expected |
|---|------|----------|
| 1 | Click search bar in top navbar | Search input activates |
| 2 | Type a task title | Autocomplete suggestions appear |
| 3 | Click a suggestion | Navigates to the relevant page/task |
| 4 | Search for non-existent item | "No results" indicator shown |

---

## 11. Theme / Dark Mode

| # | Step | Expected |
|---|------|----------|
| 1 | Open Settings | Theme options visible |
| 2 | Switch between available themes | UI updates colors immediately |
| 3 | Refresh page | Theme choice persists |
