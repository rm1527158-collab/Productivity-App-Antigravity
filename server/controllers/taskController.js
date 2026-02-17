const mongoose = require('mongoose');
const Task = require('../models/Task');
const { getBucketQuery } = require('../utils/bucketUtils');
const { startOfWeek, startOfMonth, startOfQuarter, startOfYear } = require('date-fns');

exports.getTasks = async (req, res) => {
  try {
    const { scope, date, periodStart, section } = req.query;
    const query = { userId: req.user._id };

    if (scope) query.scope = scope;
    if (date) query.date = new Date(date);
    if (periodStart) query.periodStart = new Date(periodStart);
    if (section) query.section = section;

    const tasks = await Task.find(query).sort({ priorityRank: -1, createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTask = async (req, res) => {
    try {
        const { title, section, scope, date, periodStart, priorityRank, priority } = req.body;
        const userId = req.user._id;
    
        // 1. Capacity Check
        if (section === 'topPriority' || section === 'secondary') {
          const bucketQuery = getBucketQuery(userId, scope, date, periodStart);
          bucketQuery.section = section;
          
          const count = await Task.countDocuments(bucketQuery);
          
          if (section === 'topPriority' && count >= 1) {
            throw new Error('Capacity Limit: Max 1 Top Priority task per day/period.');
          }
          if (section === 'secondary' && count >= 3) {
            throw new Error('Capacity Limit: Max 3 Secondary tasks per day/period.');
          }
        }
    
        // 2. Rank Handling
        let finalRank = priorityRank;
        
        const bucketQuery = getBucketQuery(userId, scope, date, periodStart);
        bucketQuery.section = section;
    
        if (finalRank !== undefined) {
          await Task.updateMany(
            { ...bucketQuery, priorityRank: { $gte: finalRank } },
            { $inc: { priorityRank: 1 } }
          );
        } else {
          const maxRankTask = await Task.findOne(bucketQuery)
            .sort({ priorityRank: -1 });
          finalRank = maxRankTask ? maxRankTask.priorityRank + 1 : 0;
        }
    
        const newTask = new Task({ ...req.body, userId, priorityRank: finalRank });
        const savedTask = await newTask.save();
        res.status(201).json(savedTask);
    
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { version, ...updates } = req.body;
        const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    
        if (!task) return res.status(404).json({ message: 'Task not found' });
        
        if (updates.section && updates.section !== task.section && updates.priorityRank !== undefined) {
             return res.status(400).json({ message: 'Use PATCH /reorder to change rank or section.' });
        }
    
        if (version !== undefined && task.version !== version) {
          return res.status(409).json({ message: 'Version conflict. Please refresh and try again.' });
        }
    
        task.set(updates);
        task.increment(); // increments version
        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (err) {
        if (err.name === 'VersionError') {
            return res.status(409).json({ message: 'Version conflict.' });
        }
        res.status(400).json({ message: err.message });
    }
};

exports.reorderTask = async (req, res) => {
    try {
        const { section, priorityRank, date, periodStart, scope, version, priority } = req.body;
        const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
        if (!task) throw new Error('Task not found');
        if (version !== undefined && task.version !== version) throw new Error('Version conflict');

        const targetScope = scope || task.scope;
        const targetDate = date ? new Date(date) : task.date;
        const targetPeriodStart = periodStart ? new Date(periodStart) : task.periodStart;
        const targetSection = section || task.section;

        if (targetSection === 'topPriority' || targetSection === 'secondary') {
             const isSameBucket = (task.scope === targetScope) &&
                (task.date?.getTime() === targetDate?.getTime()) &&
                (task.periodStart?.getTime() === targetPeriodStart?.getTime());
             
             if (!isSameBucket || task.section !== targetSection) {
                 const bucketQuery = getBucketQuery(req.user._id, targetScope, targetDate, targetPeriodStart);
                 bucketQuery.section = targetSection;
                 const count = await Task.countDocuments(bucketQuery);

                 if (targetSection === 'topPriority' && count >= 1) throw new Error('Capacity Limit: Max 1 Top Priority.');
                 if (targetSection === 'secondary' && count >= 3) throw new Error('Capacity Limit: Max 3 Secondary.');
             }
        }

        const targetBucketQuery = getBucketQuery(req.user._id, targetScope, targetDate, targetPeriodStart);
        targetBucketQuery.section = targetSection;
        
        await Task.updateMany(
            { ...targetBucketQuery, priorityRank: { $gte: priorityRank } },
            { $inc: { priorityRank: 1 } }
        );

        task.section = targetSection;
        task.priorityRank = priorityRank;
        task.scope = targetScope;
        if (targetScope === 'daily') {
            task.date = targetDate;
            task.periodStart = undefined;
        } else {
            task.date = undefined;
            task.periodStart = targetPeriodStart;
        }

        if (priority) task.priority = priority;
        task.increment();
        await task.save();
        res.json(task);

    } catch (err) {
        if (err.message === 'Version conflict') return res.status(409).json({ message: err.message });
        res.status(400).json({ message: err.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.rolloverTasks = async (req, res) => {
    try {
        const userId = req.user._id;
        const clientDateStr = req.body.date || req.query.date; // Expecting YYYY-MM-DD
        
        let today = clientDateStr ? new Date(clientDateStr) : new Date();
        if (isNaN(today.getTime())) today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
        const currentMonthStart = startOfMonth(today);
        const currentQuarterStart = startOfQuarter(today);
        const currentYearStart = startOfYear(today);

        const operations = [];

        // 1. Daily Rollover
        // Determine incomplete daily tasks before 'today'
        const dailyOps = await Task.updateMany(
            { 
                userId, 
                scope: 'daily', 
                completed: false, 
                date: { $lt: today } 
            },
            { $set: { date: today, section: 'should' } } // Reset section to 'should' or keep? User asked to move context. Let's keep section or default to 'should'? "move to the next day in the same sub-section". Okay, keep section.
        );
        // Wait, updateMany doesn't let us keep "same subsection" easily if we change date? 
        // Actually, $set { date: today } KEEPS the section as is. 
        // The user said: "move to the next day in the same sub-section". 
        // So { $set: { date: today } } is correct. I will NOT reset section.

        // However, I need to know how many modified. updateMany returns { nModified: ... }
        
        // 2. Weekly Rollover
        const weeklyOps = await Task.updateMany(
            {
                userId,
                scope: 'weekly',
                completed: false,
                periodStart: { $lt: currentWeekStart }
            },
            { $set: { periodStart: currentWeekStart } }
        );

        // 3. Monthly Rollover
        const monthlyOps = await Task.updateMany(
            {
                userId,
                scope: 'monthly',
                completed: false,
                periodStart: { $lt: currentMonthStart }
            },
            { $set: { periodStart: currentMonthStart } }
        );

        // 4. Quarterly Rollover
        const quarterlyOps = await Task.updateMany(
             {
                userId,
                scope: 'quarterly',
                completed: false,
                periodStart: { $lt: currentQuarterStart }
            },
            { $set: { periodStart: currentQuarterStart } }
        );

        // 5. Yearly Rollover
        const yearlyOps = await Task.updateMany(
             {
                userId,
                scope: 'yearly',
                completed: false,
                periodStart: { $lt: currentYearStart }
            },
            { $set: { periodStart: currentYearStart } }
        );

        res.json({
            message: 'Rollover complete',
            stats: {
                daily: dailyOps.modifiedCount,
                weekly: weeklyOps.modifiedCount,
                monthly: monthlyOps.modifiedCount,
                quarterly: quarterlyOps.modifiedCount,
                yearly: yearlyOps.modifiedCount
            }
        });

    } catch (err) {
        console.error("Rollover error:", err);
        res.status(500).json({ message: err.message });
    }
};
