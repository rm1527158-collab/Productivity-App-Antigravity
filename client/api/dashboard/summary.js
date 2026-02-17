import { createHandler } from '../_lib/handler.js';
import Task from '../_lib/models/Task.js';
import Habit from '../_lib/models/Habit.js';
import HabitOccurrence from '../_lib/models/HabitOccurrence.js';

function computeStreak(habit, occurrences) {
  const dateSet = new Set(
    occurrences
      .filter(o => o.habitId.toString() === habit._id.toString() && o.completed)
      .map(o => o.dateUTC)
  );
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (dateSet.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

function isHabitDueOnDate(habit, date) {
  const day = date.getDay();
  switch (habit.frequency) {
    case 'daily': return true;
    case 'weekdays': return day >= 1 && day <= 5;
    case 'weekends': return day === 0 || day === 6;
    case 'weekly': return day === new Date(habit.startDate).getDay();
    case 'custom': return (habit.customDays || []).includes(day);
    default: return true;
  }
}

export default createHandler(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const userId = req.user._id;
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  // --- Tasks ---
  const allTasks = await Task.find({ userId });
  const todayTasks = allTasks.filter(t => t.scope === 'daily' && t.date === today);
  const completedToday = todayTasks.filter(t => t.completed).length;
  const totalToday = todayTasks.length;

  // Completion rate over last 7 days
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayTasks = allTasks.filter(t => t.scope === 'daily' && t.date === key);
    const done = dayTasks.filter(t => t.completed).length;
    last7.push({
      date: key,
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      completed: done,
      total: dayTasks.length,
      rate: dayTasks.length ? Math.round((done / dayTasks.length) * 100) : 0,
    });
  }

  // --- Habits ---
  const habits = await Habit.find({ userId, active: true });
  const occurrences = await HabitOccurrence.find({ userId });

  const habitsDueToday = habits.filter(h => isHabitDueOnDate(h, now));
  const todayOccs = occurrences.filter(o => o.dateUTC === today && o.completed);
  const habitsCompletedToday = todayOccs.length;

  // Streaks
  const topStreaks = habits
    .map(h => ({ title: h.title, icon: h.icon, streak: computeStreak(h, occurrences) }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5);

  // Activity heatmap (last 90 days)
  const heatmap = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayTasksDone = allTasks.filter(t => t.scope === 'daily' && t.date === key && t.completed).length;
    const dayHabitsDone = occurrences.filter(o => o.dateUTC === key && o.completed).length;
    heatmap.push({ date: key, count: dayTasksDone + dayHabitsDone });
  }

  return res.json({
    tasks: {
      completedToday,
      totalToday,
      rate: totalToday ? Math.round((completedToday / totalToday) * 100) : 0,
      trend: last7,
    },
    habits: {
      dueToday: habitsDueToday.length,
      completedToday: habitsCompletedToday,
      rate: habitsDueToday.length
        ? Math.round((habitsCompletedToday / habitsDueToday.length) * 100)
        : 0,
      topStreaks,
    },
    heatmap,
    totalTasks: allTasks.length,
    totalHabits: habits.length,
  });
});
