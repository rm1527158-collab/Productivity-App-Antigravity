const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const HabitOccurrence = require('../models/HabitOccurrence');
const UserPreferences = require('../models/UserPreferences');

// GET /settings/export
router.get('/export', async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await Task.find({ userId });
    const habits = await Habit.find({ userId });
    const occurrences = await HabitOccurrence.find({ userId });
    
    const data = {
        version: 1,
        exportedAt: new Date(),
        tasks,
        habits,
        occurrences
    };
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /settings/export-pdf
router.get('/export-pdf', async (req, res) => {
    try {
        const userId = req.user._id;
        const tasks = await Task.find({ userId }).sort({ date: 1 });
        const habits = await Habit.find({ userId });
        const occurrences = await HabitOccurrence.find({ userId });
        const preferences = await UserPreferences.findOne({ userId });

        const data = {
            tasks,
            habits,
            occurrences,
            preferences
        };

        const { generatePDF } = require('../utils/pdfGenerator');

        const stream = res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment;filename=productivity_export_${new Date().toISOString().split('T')[0]}.pdf`,
        });

        generatePDF(
            data,
            (chunk) => stream.write(chunk),
            () => stream.end()
        );

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// POST /settings/import
router.post('/import', async (req, res) => {
    try {
        const { tasks, habits, occurrences, mode = 'merge' } = req.body;
        const userId = req.user._id;

        if (mode === 'overwrite') {
            await Task.deleteMany({ userId });
            await Habit.deleteMany({ userId });
            await HabitOccurrence.deleteMany({ userId });
        }

        const habitIdMap = {}; // oldId -> newId

        // 1. Process Habits (First, to get IDs for mapping)
        if (habits && Array.isArray(habits)) {
            for (const h of habits) {
                const oldId = h._id;
                delete h._id;
                h.userId = userId;

                if (mode === 'merge' || mode === 'skip') {
                    const existing = await Habit.findOne({ userId, title: h.title });
                    if (existing) {
                        habitIdMap[oldId] = existing._id;
                        if (mode === 'skip') continue;
                        // For merge, we could update, but skipping for safety
                        continue;
                    }
                }
                const newHabit = await Habit.create(h);
                habitIdMap[oldId] = newHabit._id;
            }
        }

        // 2. Process Occurrences (Remapping habitId)
        if (occurrences && Array.isArray(occurrences)) {
            for (const o of occurrences) {
                const oldHabitId = o.habitId;
                const newHabitId = habitIdMap[oldHabitId];
                
                if (!newHabitId) continue; // Skip if linked habit wasn't imported/found

                delete o._id;
                o.userId = userId;
                o.habitId = newHabitId;

                if (mode === 'merge' || mode === 'skip') {
                    const existing = await HabitOccurrence.findOne({ 
                        userId, 
                        habitId: newHabitId, 
                        dateUTC: new Date(o.dateUTC) 
                    });
                    if (existing) continue;
                }
                await HabitOccurrence.create(o);
            }
        }

        // 3. Process Tasks
        if (tasks && Array.isArray(tasks)) {
            for (const t of tasks) {
                delete t._id;
                t.userId = userId;

                if (mode === 'merge' || mode === 'skip') {
                    const query = { 
                        userId, 
                        title: t.title, 
                        section: t.section,
                        ...(t.date ? { date: new Date(t.date) } : { periodStart: new Date(t.periodStart) })
                    };
                    const existing = await Task.findOne(query);
                    if (existing) continue;
                }
                await Task.create(t);
            }
        }
        
        res.json({ message: 'Import successful' });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET /settings/preferences
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.user._id;
    let preferences = await UserPreferences.findOne({ userId });
    
    // Create default preferences if none exist
    if (!preferences) {
      preferences = await UserPreferences.create({ userId });
    }
    
    res.json(preferences);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /settings/preferences
router.put('/preferences', async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;
    
    let preferences = await UserPreferences.findOne({ userId });
    
    if (!preferences) {
      preferences = await UserPreferences.create({ userId, ...updates });
    } else {
      // Deep merge updates
      Object.keys(updates).forEach(key => {
        if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
          preferences[key] = { ...preferences[key], ...updates[key] };
        } else {
          preferences[key] = updates[key];
        }
      });
      await preferences.save();
    }
    
    res.json(preferences);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /settings/stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const totalTasks = await Task.countDocuments({ userId });
    const completedTasks = await Task.countDocuments({ userId, completed: true });
    const totalHabits = await Habit.countDocuments({ userId, active: true });
    const totalOccurrences = await HabitOccurrence.countDocuments({ userId });
    const completedOccurrences = await HabitOccurrence.countDocuments({ userId, completed: true });
    
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
    const habitCompletionRate = totalOccurrences > 0 ? ((completedOccurrences / totalOccurrences) * 100).toFixed(1) : 0;
    
    res.json({
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate: parseFloat(completionRate)
      },
      habits: {
        total: totalHabits,
        totalOccurrences,
        completedOccurrences,
        completionRate: parseFloat(habitCompletionRate)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /settings/clear-completed
router.delete('/clear-completed', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const result = await Task.deleteMany({ userId, completed: true });
    
    res.json({ 
      message: 'Completed tasks cleared successfully',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /settings/clear-all
router.delete('/clear-all', async (req, res) => {
  try {
    const userId = req.user._id;
    
    await Task.deleteMany({ userId });
    await Habit.deleteMany({ userId });
    await HabitOccurrence.deleteMany({ userId });
    await UserPreferences.deleteMany({ userId });
    
    res.json({ message: 'All data cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
