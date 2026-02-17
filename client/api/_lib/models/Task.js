import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true },
  section: {
    type: String,
    enum: ['topPriority', 'secondary', 'backlog'],
    default: 'backlog',
  },
  scope: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'random'],
    default: 'daily',
  },
  date: { type: String },
  periodStart: { type: String },
  rank: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  notes: { type: String, default: '' },
}, {
  timestamps: true,
});

// Compound indexes for scoped queries
taskSchema.index({ userId: 1, scope: 1, date: 1 });
taskSchema.index({ userId: 1, scope: 1, periodStart: 1 });

// Partial unique indexes for capacity limits
taskSchema.index(
  { userId: 1, scope: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: {
      section: 'topPriority',
      completed: false,
      scope: 'daily',
    },
    name: 'unique_daily_top_priority',
    sparse: true,
  }
);

taskSchema.index(
  { userId: 1, scope: 1, periodStart: 1, section: 1 },
  {
    partialFilterExpression: {
      section: 'secondary',
      completed: false,
    },
    name: 'secondary_capacity_check',
    sparse: true,
  }
);

export default mongoose.models.Task || mongoose.model('Task', taskSchema);
