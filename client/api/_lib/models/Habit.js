import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true },
  icon: { type: String, default: '📌' },
  frequency: {
    type: String,
    enum: ['daily', 'weekdays', 'weekends', 'weekly', 'custom'],
    default: 'daily',
  },
  customDays: {
    type: [Number],
    default: [],
  },
  startDate: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export default mongoose.models.Habit || mongoose.model('Habit', habitSchema);
