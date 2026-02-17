const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  section: {
    type: String,
    required: true,
    enum: [
      "topPriority",
      "secondary",
      "must",
      "should",
      "could",
      "wont"
    ]
  },
  scope: {
    type: String,
    required: true,
    enum: [
      "daily",
      "weekly",
      "monthly",
      "quarterly",
      "yearly",
      "random"
    ]
  },
  priority: {
    type: String,
    required: true,
    enum: [
      "critical",
      "high",
      "medium",
      "low",
      "minimal"
    ],
    default: "medium"
  },
  date: {
    type: Date,
    required: function() { return this.scope === 'daily'; }
  },
  periodStart: {
    type: Date,
    required: function() { return this.scope !== 'daily' && this.scope !== 'random'; }
  },
  priorityRank: {
    type: Number,
    required: true,
    min: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  estimateMin: {
    type: Number,
    min: 0
  },
  version: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  optimisticConcurrency: true,
  versionKey: 'version'
});

// Partial unique index for topPriority per bucket (daily)
taskSchema.index(
  { userId: 1, date: 1, section: 1 },
  { unique: true, partialFilterExpression: { section: "topPriority", scope: "daily" } }
);

// Partial unique index for topPriority per bucket (non-daily)
taskSchema.index(
  { userId: 1, periodStart: 1, section: 1 },
  { unique: true, partialFilterExpression: { section: "topPriority", scope: { $ne: "daily" } } }
);

module.exports = mongoose.model('Task', taskSchema);
