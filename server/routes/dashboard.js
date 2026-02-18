const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const HabitOccurrence = require('../models/HabitOccurrence');
const { format, differenceInCalendarDays } = require('date-fns');

// Helper to determine if a habit is due on a specific date
const isHabitDue = (habit, date) => {
  const start = new Date(habit.startDate);
  const current = new Date(date);
  
  const diff = differenceInCalendarDays(current, start);
  if (diff < 0) return false;

  switch (habit.frequency) {
    case 'daily': return true;
    case 'every_other_day': return diff % 2 === 0;
    case 'weekly': return diff % 7 === 0;
    case 'monthly': return current.getDate() === start.getDate();
    case 'yearly': return current.getDate() === start.getDate() && current.getMonth() === start.getMonth();
    case 'custom': return diff % (habit.intervalDays || 1) === 0;
    default: return false;
  }
};


// GET /dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    // 0. Determine "Today" based on client's local time (passed as query param)
    // If client sends "2026-02-18", we treat that as the start of the day.
    let today;
    if (req.query.date) {
        today = new Date(req.query.date);
    } else {
        today = new Date();
    }
    // Ensure we are comparing dates correctly - treating 'today' as the start of the day (00:00:00)
    // The client sends 'YYYY-MM-DD', which new Date() parses as UTC 00:00:00.
    // We just need to make sure we don't shift it.
    if (isNaN(today.getTime())) {
        today = new Date(); // Fallback if invalid
    }
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);


    // ... (Previous setup code: userId, today, etc.)

    // EXECUTE QUERIES IN PARALLEL
    const [
      dailyStats,
      sectionStats,
      completionTrend,
      habitsToday,
      taskActivity,
      habitActivity,
      weeklyProgress,
      categoryStats,
      highPriorityCount,
      pendingTasksRaw,
      allActiveHabits,
      completedHabitIds,
      allOccurrences
    ] = await Promise.all([
        // 1. Daily Stats
        Task.aggregate([
            { 
              $match: { 
                userId, 
                scope: 'daily', 
                $or: [
                  { date: today },
                  { date: { $lt: today }, completed: false }
                ]
              } 
            },
            { $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: ["$completed", 1, 0] } }
            }}
        ]),

        // 2. Section Stats
        Task.aggregate([
            { $match: { userId, scope: 'daily', date: today } },
            { $group: { _id: "$section", count: { $sum: 1 } } }
        ]),

        // 3. Completion Trend (30 days)
        Task.aggregate([
            { $match: { userId, scope: 'daily', date: { $gte: (() => { const d = new Date(today); d.setDate(d.getDate() - 30); return d; })(), $lte: today } } },
            { $group: {
                _id: "$date",
                completedCount: { $sum: { $cond: ["$completed", 1, 0] } },
                totalCount: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]),

        // 4. Habits Today Count
        HabitOccurrence.countDocuments({
            userId,
            dateUTC: today,
            completed: true
        }),

        // 5a. Task Activity (365 days)
        Task.aggregate([
            { 
              $match: { 
                userId, 
                completed: true, 
                date: { $gte: (() => { const d = new Date(today); d.setDate(d.getDate() - 365); return d; })(), $lte: today },
                scope: 'daily' 
              } 
            },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                count: { $sum: 1 }
              }
            }
        ]),

        // 5b. Habit Activity (365 days)
        HabitOccurrence.aggregate([
            {
              $match: {
                userId,
                completed: true,
                dateUTC: { $gte: (() => { const d = new Date(today); d.setDate(d.getDate() - 365); return d; })(), $lte: today }
              }
            },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$dateUTC" } },
                count: { $sum: 1 }
              }
            }
        ]),

        // 6. Weekly Progress
        Task.aggregate([
            {
              $match: {
                userId,
                completed: true,
                date: { $gte: (() => { const d = new Date(today); d.setDate(d.getDate() - 6); return d; })(), $lte: today },
                scope: 'daily'
              }
            },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                value: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
        ]),

        // 7. Category Focus
        Task.aggregate([
            {
              $match: {
                userId,
                date: { $gte: (() => { const d = new Date(today); d.setDate(d.getDate() - 6); return d; })(), $lte: today },
                scope: 'daily'
              }
            },
            {
              $group: {
                _id: "$section",
                count: { $sum: 1 }
              }
            }
        ]),

        // 8. High Priority Count
        Task.countDocuments({
            userId,
            scope: 'daily',
            completed: false,
            $or: [
              { date: today },
              { date: { $lt: today } }
            ],
            priority: { $in: ['critical', 'high'] }
        }),

        // 9. Pending Tasks (Limit 2)
        Task.find({
            userId,
            scope: 'daily',
            completed: false,
            $or: [
              { date: today },
              { date: { $lt: today } }
            ]
        })
        .sort({ date: 1, priorityRank: 1 })
        .limit(2)
        .select('title priority section date')
        .lean(),

        // 10a. Active Habits
        require('../models/Habit').find({ userId, active: true }).lean(),

        // 10b. Completed Habit IDs for Today
        HabitOccurrence.find({
            userId,
            dateUTC: today,
            completed: true
        }).distinct('habitId'),

        // 10c. All Occurrences (for streaks) - Optimized
        HabitOccurrence.find({ userId }).select('habitId dateUTC').lean()
    ]);

    // ... (Processing logic remains similar but uses the results above)

    // Activity Map Processing
    const activityMap = new Map();
    taskActivity.forEach(item => {
        const existing = activityMap.get(item._id) || { date: item._id, taskCount: 0, habitCount: 0 };
        existing.taskCount = item.count;
        activityMap.set(item._id, existing);
    });
    habitActivity.forEach(item => {
        const existing = activityMap.get(item._id) || { date: item._id, taskCount: 0, habitCount: 0 };
        existing.habitCount = item.count;
        activityMap.set(item._id, existing);
    });
    const activityHeatmap = Array.from(activityMap.values());

    // Weekly Progress Processing
    const weeklyProgressData = weeklyProgress.map(item => ({ date: item._id, value: item.value }));

    // Category Focus Processing
    const sectionNames = {
      topPriority: "Top Priority",
      secondary: "Secondary",
      must: "Must Have",
      should: "Should Have",
      could: "Could Have",
      wont: "Won't Have"
    };
    const categoryFocus = categoryStats.map(item => ({
      subject: sectionNames[item._id] || item._id,
      A: item.count,
      fullMark: Math.max(...categoryStats.map(s => s.count)) || 10
    }));

    // Pending Tasks Processing
    const pendingTasks = pendingTasksRaw.map(task => ({
        ...task,
        isOverdue: new Date(task.date) < today
    }));

    // Habits Processing
    const { computeStreak } = require('../controllers/habitController');
    const habitsToCompleteList = allActiveHabits
        .filter(h => isHabitDue(h, today))
        .filter(h => !completedHabitIds.some(id => id.toString() === h._id.toString()))
        .slice(0, 2)
        .map(h => ({
            title: h.title,
            streak: computeStreak(h, allOccurrences)
        }));

    const habitsToCompleteCount = allActiveHabits
        .filter(h => isHabitDue(h, today))
        .filter(h => !completedHabitIds.some(id => id.toString() === h._id.toString()))
        .length;

    // Focus Score Processing
    const totalHabits = allActiveHabits.length;
    const completedTasks = dailyStats[0]?.completed || 0;
    const totalTasks = dailyStats[0]?.total || 0;
    
    let focusScore = 0;
    const taskWeight = 0.7;
    const habitWeight = 0.3;

    const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;
    const habitScore = totalHabits > 0 ? (habitsToday / totalHabits) * 100 : 100;
    
    focusScore = Math.round((taskScore * taskWeight) + (habitScore * habitWeight));

    res.json({
        daily: dailyStats[0] || { total: 0, completed: 0 },
        sections: sectionStats,
        trend: completionTrend,
        habitsToday,
        activityHeatmap,
        weeklyProgress: weeklyProgressData,
        categoryFocus,
        highPriorityCount,
        pendingTasks,
        habitsToCompleteCount,
        habitsToCompleteList,
        focusScore
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /dashboard/upcoming-tasks
// Returns upcoming tasks for today
router.get('/upcoming-tasks', async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || 'default-user-id'; 
    
    let today;
    if (req.query.date) {
        today = new Date(req.query.date);
    } else {
        today = new Date();
    }
    if (isNaN(today.getTime())) today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tasks = await Task.find({
      userId,
      completed: false,
      scope: 'daily',
      $or: [
        { date: today },
        { date: { $lt: today } }
      ]
    })
    .sort({ date: 1, priorityRank: 1 }) // Overdue first
    .limit(10)
    .select('title priority date')
    .lean();


    // Format for frontend
    const formattedTasks = tasks.map(task => {
      const isOverdue = new Date(task.date) < today;
      return {
        title: task.title,
        priority: task.priority === 'critical' || task.priority === 'high' ? 'High' : (task.priority === 'medium' ? 'Medium' : 'Low'),
        time: isOverdue ? 'Overdue' : format(task.date, 'h:mm a'),
        isOverdue
      };
    });


    res.json(formattedTasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
