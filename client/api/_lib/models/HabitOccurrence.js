import mongoose from 'mongoose';

const habitOccurrenceSchema = new mongoose.Schema({
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  dateUTC: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

habitOccurrenceSchema.index({ habitId: 1, dateUTC: 1 }, { unique: true });
habitOccurrenceSchema.index({ userId: 1, dateUTC: 1 });

export default mongoose.models.HabitOccurrence || mongoose.model('HabitOccurrence', habitOccurrenceSchema);
