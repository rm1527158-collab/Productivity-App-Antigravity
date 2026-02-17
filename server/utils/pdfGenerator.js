const PDFDocument = require('pdfkit');
const { format } = require('date-fns');

const generatePDF = (data, dataCallback, endCallback) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.on('data', dataCallback);
  doc.on('end', endCallback);

  // -- Header --
  doc.fontSize(20).text('Productivity App Export', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Export Date: ${format(new Date(), 'PPP p')}`, { align: 'center', color: 'grey' });
  doc.moveDown(2);

  // -- Profile Section --
  if (data.preferences && data.preferences.account) {
    const { username, email, title, bio } = data.preferences.account;
    doc.fontSize(16).text('User Profile', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Username: ${username || 'N/A'}`);
    doc.text(`Email: ${email || 'N/A'}`);
    doc.text(`Title: ${title || 'N/A'}`);
    if (bio) {
        doc.moveDown(0.5);
        doc.text('Bio:', { underline: false });
        doc.text(bio, { oblique: true });
    }
    doc.moveDown(2);
  }

  // -- Habits Section --
  doc.fontSize(16).text('Habits', { underline: true });
  doc.moveDown(0.5);
  
  if (data.habits && data.habits.length > 0) {
    data.habits.forEach(habit => {
        doc.fontSize(12).font('Helvetica-Bold').text(habit.title);
        doc.fontSize(10).font('Helvetica').text(`Frequency: ${habit.frequency} | Streak: ${getStreak(habit, data.occurrences)} days`);
        if(habit.description) doc.text(habit.description, { color: 'grey' });
        doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(12).text('No habits found.');
  }
  doc.moveDown(2);

  // -- Tasks Section --
  doc.fontSize(16).font('Helvetica').text('Pending Tasks', { underline: true });
  doc.moveDown(0.5);

  const pendingTasks = data.tasks.filter(t => !t.completed);
  if (pendingTasks.length > 0) {
      pendingTasks.forEach(task => {
          doc.fontSize(12).font('Helvetica-Bold').text(`[ ] ${task.title}`);
          doc.fontSize(10).font('Helvetica').text(`Due: ${task.date ? format(new Date(task.date), 'PPP') : 'No Date'} | Priority: ${task.priority}`);
          doc.moveDown(0.5);
      });
  } else {
      doc.fontSize(12).text('No pending tasks.');
  }

  doc.moveDown(2);
  
  // -- Completed Tasks --
  doc.fontSize(16).font('Helvetica').text('Completed Tasks (Recent)', { underline: true });
  doc.moveDown(0.5);
  
  const completedTasks = data.tasks.filter(t => t.completed).slice(0, 20); // Limit to 20
  if (completedTasks.length > 0) {
      completedTasks.forEach(task => {
        doc.fontSize(12).font('Helvetica').text(`[x] ${task.title}`, { strike: true });
        doc.fontSize(10).text(`Completed: ${task.date ? format(new Date(task.date), 'PPP') : 'N/A'}`);
        doc.moveDown(0.5);
      });
      if (data.tasks.filter(t => t.completed).length > 20) {
          doc.text('... and more completed tasks.');
      }
  } else {
      doc.fontSize(12).text('No completed tasks.');
  }

  doc.end();
};

function getStreak(habit, occurrences) {
    // Basic streak calculation placeholder
    // In a real app, this would reuse the controller logic or be passed in pre-calculated
    if (!occurrences) return 0;
    const habitOccurrences = occurrences.filter(o => o.habitId.toString() === habit._id.toString() && o.completed);
    return habitOccurrences.length; 
}

module.exports = { generatePDF };
