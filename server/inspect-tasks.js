const mongoose = require('mongoose');
require('dotenv').config();
const Task = require('./models/Task');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const tasks = await Task.find({ scope: { $in: ['monthly', 'yearly'] } }).sort({ createdAt: -1 });
        console.log('Found', tasks.length, 'monthly/yearly tasks');
        tasks.forEach(t => {
            console.log('ID:', t._id);
            console.log('Title:', t.title);
            console.log('Scope:', t.scope);
            console.log('PeriodStart:', t.periodStart);
            console.log('PeriodStart (ISO):', t.periodStart ? t.periodStart.toISOString() : 'N/A');
            console.log('Date:', t.date);
            console.log('-----------------');
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
