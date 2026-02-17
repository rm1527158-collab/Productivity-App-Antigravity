require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, stopMemoryDB } = require('./config/db');
const Task = require('./models/Task');
const Habit = require('./models/Habit');
const HabitOccurrence = require('./models/HabitOccurrence');

// Test user ID from .env
const testUserId = process.env.TEST_USER_ID || '507f1f77bcf86cd799439011';

const sampleTasks = [
  {
    userId: testUserId,
    title: 'Complete project proposal',
    description: 'Draft and finalize the Q1 project proposal for review',
    section: 'topPriority',
    scope: 'daily',
    date: new Date(),
    priorityRank: 0,
    tags: ['work', 'urgent'],
    estimateMin: 120
  },
  {
    userId: testUserId,
    title: 'Review team pull requests',
    description: 'Code review for pending PRs',
    section: 'must',
    scope: 'daily',
    date: new Date(),
    priorityRank: 1,
    tags: ['work', 'code-review'],
    estimateMin: 60
  },
  {
    userId: testUserId,
    title: 'Weekly report preparation',
    description: 'Prepare weekly status report for stakeholders',
    section: 'should',
    scope: 'weekly',
    periodStart: new Date(),
    priorityRank: 2,
    tags: ['work', 'reporting'],
    estimateMin: 90
  },
  {
    userId: testUserId,
    title: 'Update documentation',
    description: 'Update API documentation with recent changes',
    section: 'could',
    scope: 'weekly',
    periodStart: new Date(),
    priorityRank: 3,
    tags: ['documentation'],
    estimateMin: 45
  },
  {
    userId: testUserId,
    title: 'Quarterly planning session',
    description: 'Plan Q2 objectives and key results',
    section: 'must',
    scope: 'quarterly',
    periodStart: new Date(),
    priorityRank: 4,
    tags: ['planning', 'strategy'],
    estimateMin: 180
  }
];

const sampleHabits = [
  {
    userId: testUserId,
    title: 'Morning meditation',
    description: '10 minutes of mindfulness meditation',
    frequency: 'daily',
    startDate: new Date(),
    timeOfDay: '07:00',
    active: true
  },
  {
    userId: testUserId,
    title: 'Exercise routine',
    description: '30 minutes workout session',
    frequency: 'every_other_day',
    startDate: new Date(),
    timeOfDay: '18:00',
    active: true
  },
  {
    userId: testUserId,
    title: 'Read technical book',
    description: 'Read at least one chapter',
    frequency: 'weekly',
    startDate: new Date(),
    timeOfDay: '20:00',
    active: true
  },
  {
    userId: testUserId,
    title: 'Weekly review',
    description: 'Reflect on progress and plan ahead',
    frequency: 'weekly',
    startDate: new Date(),
    timeOfDay: '16:00',
    active: true
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('Clearing existing data...');
    await Task.deleteMany({ userId: testUserId });
    await Habit.deleteMany({ userId: testUserId });
    await HabitOccurrence.deleteMany({ userId: testUserId });
    console.log('✓ Existing data cleared\n');
    
    // Insert sample tasks
    console.log('Inserting sample tasks...');
    const tasks = await Task.insertMany(sampleTasks);
    console.log(`✓ Created ${tasks.length} tasks\n`);
    
    // Insert sample habits
    console.log('Inserting sample habits...');
    const habits = await Habit.insertMany(sampleHabits);
    console.log(`✓ Created ${habits.length} habits\n`);
    
    // Create habit occurrences for the past week
    console.log('Creating habit occurrences...');
    const habitOccurrences = [];
    const now = new Date();
    
    for (const habit of habits) {
      // Create occurrences for the past 7 days
      for (let i = 0; i < 7; i++) {
        const occurrenceDate = new Date(now);
        occurrenceDate.setDate(occurrenceDate.getDate() - i);
        occurrenceDate.setHours(0, 0, 0, 0); // Normalize to start of day
        
        // Randomly mark some as completed
        const completed = Math.random() > 0.3;
        
        habitOccurrences.push({
          userId: testUserId,
          habitId: habit._id,
          dateUTC: occurrenceDate,
          completed
        });
      }
    }
    
    await HabitOccurrence.insertMany(habitOccurrences);
    console.log(`✓ Created ${habitOccurrences.length} habit occurrences\n`);
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Tasks: ${tasks.length}`);
    console.log(`Habits: ${habits.length}`);
    console.log(`Habit Occurrences: ${habitOccurrences.length}`);
    console.log(`Test User ID: ${testUserId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    await stopMemoryDB();
    process.exit(0);
  }
}

// Run seeding
seedDatabase();
