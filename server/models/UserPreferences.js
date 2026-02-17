const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    index: true
  },
  
  // Notifications
  notifications: {
    dailyReminderEnabled: {
      type: Boolean,
      default: false
    },
    dailyReminderTime: {
      type: String,
      default: '09:00'
    },
    habitRemindersEnabled: {
      type: Boolean,
      default: true
    },
    soundEffectsEnabled: {
      type: Boolean,
      default: true
    }
  },

  // Productivity Goals
  goals: {
    dailyTaskTarget: {
      type: Number,
      default: 5,
      min: 1,
      max: 50
    },
    weeklyTaskTarget: {
      type: Number,
      default: 25,
      min: 1,
      max: 200
    },
    focusSessionDuration: {
      type: Number,
      default: 25,
      min: 5,
      max: 120
    }
  },

  // Work Hours
  workHours: {
    startTime: {
      type: String,
      default: '09:00'
    },
    endTime: {
      type: String,
      default: '17:00'
    },
    workDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  },

  // Auto-Archive Settings
  autoArchive: {
    enabled: {
      type: Boolean,
      default: false
    },
    daysBeforeArchiving: {
      type: Number,
      default: 30,
      min: 1,
      max: 365
    },
    archiveOldHabits: {
      type: Boolean,
      default: false
    }
  },

  // Display Preferences
  display: {
    defaultView: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'daily'
    },
    showTimeEstimates: {
      type: Boolean,
      default: true
    },
    showStreakCounter: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['emerald', 'sunset', 'ocean', 'lavender', 'rose', 'midnight'],
      default: 'emerald'
    },
    accentColor: {
      type: String,
      default: '#10b981'
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    }
  },

  // Data & Privacy
  privacy: {
    allowAnalytics: {
      type: Boolean,
      default: false
    },
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'never'],
      default: 'weekly'
    }
  },

  // Account
  account: {
    username: {
      type: String,
      trim: true,
      default: 'User'
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    title: {
      type: String,
      trim: true,
      default: 'Productivity Enthusiast'
    },
    bio: {
      type: String,
      trim: true,
      default: ''
    },
    avatar: {
      type: String,
      trim: true,
      default: ''
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);
