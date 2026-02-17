const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
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
  icon: {
    type: String,
    default: "Activity"
  },
  frequency: {
    type: String,
    required: true,
    enum: [
      "daily",
      "every_other_day",
      "weekly",
      "monthly",
      "yearly",
      "custom"
    ]
  },
  intervalDays: {
    type: Number,
    required: function() { return this.frequency === 'custom'; }
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  timeOfDay: {
    type: String, // Optional, e.g., "08:00"
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Habit', habitSchema);
