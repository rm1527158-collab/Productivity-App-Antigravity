const mongoose = require('mongoose');

const habitOccurrenceSchema = new mongoose.Schema({
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  dateUTC: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Ensure one occurrence record per habit per day (if that's the minimal granularity)
// Though the spec doesn't explicitly forbid multiple, usually extensive logic implies checking existence.
// Sticking to basic schema for now.
habitOccurrenceSchema.index({ habitId: 1, dateUTC: 1 }, { unique: true });

module.exports = mongoose.model('HabitOccurrence', habitOccurrenceSchema);
