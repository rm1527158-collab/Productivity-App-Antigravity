const Habit = require('../models/Habit');
const HabitOccurrence = require('../models/HabitOccurrence');

exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id, active: true }).lean();
    res.json(habits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOccurrences = async (req, res) => {
    try {
        const { start, end } = req.query;
        const query = { userId: req.user._id };
        if (start && end) {
            query.dateUTC = { $gte: new Date(start), $lte: new Date(end) };
        }
        const occurrences = await HabitOccurrence.find(query).lean();
        res.json(occurrences);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createHabit = async (req, res) => {
  try {
    const habit = new Habit({ ...req.body, userId: req.user._id });
    const newHabit = await habit.save();
    res.status(201).json(newHabit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.markHabit = async (req, res) => {
  try {
    const { date, completed } = req.body;
    const userId = req.user._id;
    const habitId = req.params.id;

    if (completed === false) {
        await HabitOccurrence.findOneAndDelete({ habitId, userId, dateUTC: new Date(date) });
        return res.json({ message: 'Marked incomplete' });
    }

    const occurrence = await HabitOccurrence.findOneAndUpdate(
        { habitId, userId, dateUTC: new Date(date) },
        { completed: true },
        { upsert: true, new: true }
    );
    res.json(occurrence);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteHabit = async (req, res) => {
  try {
    const habitId = req.params.id;
    const userId = req.user._id;

    // Delete the habit
    const habit = await Habit.findOneAndDelete({ _id: habitId, userId });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Delete all occurrences for this habit
    await HabitOccurrence.deleteMany({ habitId, userId });

    res.json({ message: 'Habit deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Compute streak for a single habit.
 * Walks backward from today counting consecutive completions matching the habit's frequency.
 */
const computeStreak = (habit, occurrences) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  // Build a Set of completed date strings for fast lookup
  const completedDates = new Set(
    occurrences
      .filter(o => o.habitId.toString() === habit._id.toString())
      .map(o => {
        const d = new Date(o.dateUTC);
        d.setUTCHours(0, 0, 0, 0);
        return d.toISOString().split('T')[0];
      })
  );

  let streak = 0;
  const startDate = new Date(habit.startDate);
  startDate.setUTCHours(0, 0, 0, 0);

  if (habit.frequency === 'daily') {
    // Walk backward day by day
    let checkDate = new Date(today);
    while (checkDate >= startDate) {
      const key = checkDate.toISOString().split('T')[0];
      if (completedDates.has(key)) {
        streak++;
      } else {
        // Allow today to be incomplete without breaking streak
        if (checkDate.getTime() === today.getTime()) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } else if (habit.frequency === 'custom') {
    const interval = habit.intervalDays || 1;
    // Walk backward by interval days
    let checkDate = new Date(today);
    // Align to the habit's interval cycle
    const diffFromStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const daysOffset = diffFromStart % interval;
    checkDate.setDate(checkDate.getDate() - daysOffset);
    
    while (checkDate >= startDate) {
      const key = checkDate.toISOString().split('T')[0];
      if (completedDates.has(key)) {
        streak++;
      } else {
        if (checkDate.getTime() >= today.getTime()) {
          checkDate.setDate(checkDate.getDate() - interval);
          continue;
        }
        break;
      }
      checkDate.setDate(checkDate.getDate() - interval);
    }
  } else if (habit.frequency === 'weekly') {
    // Walk backward week by week from start of current week
    let checkDate = new Date(today);
    // Go to Monday of current week
    const dayOfWeek = checkDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    checkDate.setDate(checkDate.getDate() - mondayOffset);

    while (checkDate >= startDate) {
      const key = checkDate.toISOString().split('T')[0];
      if (completedDates.has(key)) {
        streak++;
      } else {
        // Allow current period to be incomplete
        if (checkDate.getTime() + mondayOffset * 86400000 >= today.getTime()) {
          checkDate.setDate(checkDate.getDate() - 7);
          continue;
        }
        break;
      }
      checkDate.setDate(checkDate.getDate() - 7);
    }
  } else if (habit.frequency === 'monthly') {
    // Walk backward month by month from 1st of current month
    let checkDate = new Date(today.getFullYear(), today.getMonth(), 1);
    
    while (checkDate >= startDate) {
      const key = checkDate.toISOString().split('T')[0];
      if (completedDates.has(key)) {
        streak++;
      } else {
        // Allow current month to be incomplete
        if (checkDate.getMonth() === today.getMonth() && checkDate.getFullYear() === today.getFullYear()) {
          checkDate.setMonth(checkDate.getMonth() - 1);
          continue;
        }
        break;
      }
      checkDate.setMonth(checkDate.getMonth() - 1);
    }
  }

  return streak;
};

exports.getStreaks = async (req, res) => {
  try {
    const userId = req.user._id;
    const habits = await Habit.find({ userId, active: true }).lean();
    const occurrences = await HabitOccurrence.find({ userId }).select('habitId dateUTC').lean();

    const streaks = {};
    for (const habit of habits) {
      streaks[habit._id.toString()] = computeStreak(habit, occurrences);
    }

    res.json(streaks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Export computeStreak for use in dashboard route
exports.computeStreak = computeStreak;

