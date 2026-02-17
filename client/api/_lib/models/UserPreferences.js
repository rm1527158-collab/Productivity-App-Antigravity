import mongoose from 'mongoose';

const userPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    index: true,
  },
  notifications: {
    dailyReminder: { type: Boolean, default: true },
    reminderTime: { type: String, default: '09:00' },
    weeklyReport: { type: Boolean, default: true },
    habitReminders: { type: Boolean, default: true },
  },
  goals: {
    dailyTaskTarget: { type: Number, default: 5 },
    weeklyTaskTarget: { type: Number, default: 15 },
    habitCompletionTarget: { type: Number, default: 80 },
  },
  workHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
    workDays: { type: [Number], default: [1, 2, 3, 4, 5] },
  },
  autoArchive: {
    enabled: { type: Boolean, default: true },
    afterDays: { type: Number, default: 30 },
  },
  display: {
    theme: { type: String, default: 'emerald' },
    darkMode: { type: Boolean, default: false },
    compactView: { type: Boolean, default: false },
    showCompletedTasks: { type: Boolean, default: true },
    dashboardLayout: { type: String, default: 'default' },
  },
  privacy: {
    shareProgress: { type: Boolean, default: false },
    publicProfile: { type: Boolean, default: false },
  },
  account: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    avatar: { type: String, default: '' },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
  },
}, {
  timestamps: true,
});

export default mongoose.models.UserPreferences || mongoose.model('UserPreferences', userPreferencesSchema);
