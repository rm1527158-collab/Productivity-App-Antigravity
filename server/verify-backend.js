const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const Task = require('./models/Task');
const Habit = require('./models/Habit');
require('dotenv').config();

async function verify() {
  let replSet;
  try {
      console.log('Starting MongoDB Memory Replica Set...');
      replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      const uri = replSet.getUri();
      console.log('Connecting to MongoDB at', uri);
      await mongoose.connect(uri);
      
      // Clear Data
      await Task.deleteMany({});
      await Habit.deleteMany({});
      console.log('Database cleared.');
    
      const session = await mongoose.startSession();
      
      // 1. Test Capacity: Top Priority
      console.log('Test 1: Top Priority Capacity');
      const userId = new mongoose.Types.ObjectId();
      const date = new Date().toISOString().split('T')[0];
      
      await Task.create([{ 
          userId, 
          title: 'Top 1', 
          section: 'topPriority', 
          scope: 'daily', 
          date: date, 
          priorityRank: 10 
      }]);
      console.log('  - Created Top 1: Success');

      try {
          await Task.create([{ 
              userId, 
              title: 'Top 2', 
              section: 'topPriority', 
              scope: 'daily', 
              date: date, 
              priorityRank: 9 
          }]);
          console.error('  - Created Top 2: FAILED (Should have thrown duplicate error)');
      } catch (err) {
          console.log('  - Created Top 2: Success (Caught expected error: ' + err.message + ')');
      }

      // 2. Test Capacity: Secondary
      console.log('Test 2: Secondary Capacity (Simulated Logic)');
      
      session.startTransaction();
      const count = await Task.countDocuments({ userId, section: 'secondary', scope: 'daily', date: date }).session(session);
      if (count >= 3) throw new Error("Capacity");
      await Task.create([{ 
          userId, title: 'Sec 1', section: 'secondary', scope: 'daily', date, priorityRank: 5 
      }], { session });
      await session.commitTransaction();
      console.log('  - Created Sec 1: Success');

      // Add 2 more
      await Task.create({ userId, title: 'Sec 2', section: 'secondary', scope: 'daily', date, priorityRank: 4 });
      await Task.create({ userId, title: 'Sec 3', section: 'secondary', scope: 'daily', date, priorityRank: 3 });
      console.log('  - Created Sec 2 & 3: Success');
      
      // Try 4th (Simulate API logic)
      session.startTransaction();
      const count2 = await Task.countDocuments({ userId, section: 'secondary', scope: 'daily', date: date }).session(session);
      if (count2 >= 3) {
          console.log('  - Created Sec 4: Success (Caught expected logic error: Capacity Limit)');
          await session.abortTransaction();
      } else {
          try {
             await Task.create([{ userId, title: 'Sec 4', section: 'secondary', scope: 'daily', date, priorityRank: 2 }], { session });
             await session.commitTransaction();
             console.error('  - Created Sec 4: FAILED (Should have been blocked)');
          } catch(e) { console.log(e.message); await session.abortTransaction(); }
      }

      // 3. Test Transaction Rank Shift (Simulate API)
      console.log('Test 3: Rank Shift');
      session.startTransaction();
      await Task.updateMany(
          { userId, section: 'secondary', scope: 'daily', date: date, priorityRank: { $gte: 4 } },
          { $inc: { priorityRank: 1 } }
      ).session(session);
      
      await Task.create([{ 
          userId, title: 'Sec Inserted', section: 'secondary', scope: 'daily', date, priorityRank: 4 
      }], { session });
      await session.commitTransaction();
      
      const tasks = await Task.find({ userId, section: 'secondary' }).sort({ priorityRank: -1 });
      console.log('  - Ranks post-insert (Expected: 6, 5, 4(new), 3):');
      tasks.forEach(t => console.log(`    - ${t.title}: ${t.priorityRank}`));

      session.endSession();

  } catch (err) {
      console.error('Verification failed:', err);
  } finally {
      await mongoose.connection.close();
      if (replSet) await replSet.stop();
  }
}

verify();
