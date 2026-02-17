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

    // 1. Today completion % (completed / total daily tasks including overdue)
    const dailyStats = await Task.aggregate([
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
    ]);


    // 2. Task count by section (Pie Chart) - Active tasks only? Or all? Spec says "Task count by section".
    // Usually means for Today? Or All backlog? "Dashboard shows visual aggregates...".
    // Let's assume Today's Breakdown.
    const sectionStats = await Task.aggregate([
        { $match: { userId, scope: 'daily', date: today } },
        { $group: { _id: "$section", count: { $sum: 1 } } }
    ]);

    // 3. 30-day completion trend (Line Chart)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const completionTrend = await Task.aggregate([
        { $match: { userId, scope: 'daily', date: { $gte: thirtyDaysAgo, $lte: today } } },
        { $group: {
            _id: "$date",
            completedCount: { $sum: { $cond: ["$completed", 1, 0] } },
            totalCount: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
    ]);

    // 4. Habit streak summary & Activity Heatmap
    // Return total habits completed today
    const habitsToday = await HabitOccurrence.countDocuments({
        userId,
        dateUTC: today,
        completed: true
    });

    // 5. Activity Heatmap (Last 365 days)
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    // Aggregate completed tasks by day
    const taskActivity = await Task.aggregate([
        { 
          $match: { 
            userId, 
            completed: true, 
            date: { $gte: oneYearAgo, $lte: today },
            scope: 'daily' // Only count daily tasks for now to avoid skewing with subtasks/project tasks if they exist
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            count: { $sum: 1 }
          }
        }
    ]);

    // Aggregate completed habits by day
    const habitActivity = await HabitOccurrence.aggregate([
        {
          $match: {
            userId,
            completed: true,
            dateUTC: { $gte: oneYearAgo, $lte: today }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$dateUTC" } },
            count: { $sum: 1 }
          }
        }
    ]);

    // Merge into a map with separate task and habit counts
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

    // Convert map to array for frontend
    const activityHeatmap = Array.from(activityMap.values());

    // 6. Weekly Progress (Last 7 days including today)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 days total including today

    const weeklyProgress = await Task.aggregate([
        {
          $match: {
            userId,
            completed: true,
            date: { $gte: sevenDaysAgo, $lte: today },
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
    ]);

    // Transform to array with date property
    const weeklyProgressData = weeklyProgress.map(item => ({ date: item._id, value: item.value }));

    // 7. Category Focus (Tasks per section from last 7 days)
    const categoryStats = await Task.aggregate([
        {
          $match: {
            userId,
            date: { $gte: sevenDaysAgo, $lte: today },
            scope: 'daily'
          }
        },
        {
          $group: {
            _id: "$section",
            count: { $sum: 1 }
          }
        }
    ]);

    // Transform to radar chart format
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
      fullMark: Math.max(...categoryStats.map(s => s.count)) || 10 // Dynamic max or default 10
    }));

    // 8. Header stats: High priority count (including overdue)
    const highPriorityCount = await Task.countDocuments({
        userId,
        scope: 'daily',
        completed: false,
        $or: [
          { date: today },
          { date: { $lt: today } }
        ],
        priority: { $in: ['critical', 'high'] }
    });


    const pendingTasksRaw = await Task.find({
        userId,
        scope: 'daily',
        completed: false,
        $or: [
          { date: today },
          { date: { $lt: today } }
        ]
    })
    .sort({ date: 1, priorityRank: 1 }) // Overdue first
    .limit(2)
    .select('title priority section date');

    const pendingTasks = pendingTasksRaw.map(task => ({
        ...task.toObject(),
        isOverdue: new Date(task.date) < today
    }));


    // 10. Habits to complete list
    const allActiveHabits = await require('../models/Habit').find({ userId, active: true });
    const completedHabitIds = await HabitOccurrence.find({
        userId,
        dateUTC: today,
        completed: true
    }).distinct('habitId');

    // Compute real streaks
    const { computeStreak } = require('../controllers/habitController');
    const allOccurrences = await HabitOccurrence.find({ userId });

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


    // 11. Focus Score Calculation
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
    .select('title priority date');


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
