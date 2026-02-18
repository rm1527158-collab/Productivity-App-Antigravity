import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Download, Upload, Moon, Sun, Save, Mail, Info, Image as ImageIcon, Link } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { CheckCircle, XCircle, User, IdentificationCard } from '@phosphor-icons/react';
import AvatarUpload from '../components/AvatarUpload';

const THEMES = [
  { id: 'emerald', name: 'Emerald', color: 'bg-emerald-700' },
  { id: 'sunset', name: 'Sunset', color: 'bg-orange-600' },
  { id: 'ocean', name: 'Ocean', color: 'bg-cyan-600' },
  { id: 'lavender', name: 'Lavender', color: 'bg-purple-600' },
  { id: 'rose', name: 'Rose', color: 'bg-rose-600' },
  { id: 'midnight', name: 'Midnight', color: 'bg-indigo-900' },
];

const Settings = () => {
  const { theme, setTheme, darkMode, setDarkMode } = useTheme();
  const [mode, setMode] = useState('merge');
  const [json, setJson] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [profile, setProfile] = useState({
    username: '',
    email: '',
    title: '',
    bio: '',
    avatar: ''
  });
  const [useUrlInput, setUseUrlInput] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/preferences');
      if (res.data && res.data.account) {
        setProfile({
          username: res.data.account.username || '',
          email: res.data.account.email || '',
          title: res.data.account.title || '',
          bio: res.data.account.bio || '',
          avatar: res.data.account.avatar || ''
        });
      }
    } catch (err) {
      console.error("Failed to fetch preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await api.put('/settings/preferences', {
        account: profile
      });
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      
      // Dispatch event to notify TopNavbar to refresh immediately
      window.dispatchEvent(new Event('profileUpdated'));
      
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update profile.';
      setFeedback({ type: 'error', message: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/settings/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `operability_${new Date().toISOString()}.json`;
      a.click();
    } catch { alert("Export failed"); }
  };

  const handleExportPDF = async () => {
    try {
      const res = await api.get('/settings/export-pdf', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `productivity_export_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF");
    }
  };

  const handleImport = async () => {
    try {
      await api.post('/settings/import', { ...JSON.parse(json), mode });
      alert("Imported! Refresh to see changes.");
      setJson('');
    } catch (e) { alert("Import failed: " + e.message); }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        {feedback && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
            feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {feedback.type === 'success' ? <CheckCircle size={20} weight="fill" /> : <XCircle size={20} weight="fill" />}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <User size={24} weight="duotone" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Profile</h2>
            <p className="text-sm text-muted-foreground">Manage your public information</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <IdentificationCard size={16} /> Username
              </label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-shadow"
                placeholder="Your username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Mail size={16} /> Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-shadow"
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <IdentificationCard size={16} /> Professional Title
              </label>
              <input
                type="text"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-shadow"
                placeholder="e.g. Software Engineer"
              />
            </div>

          {/* Avatar Upload/URL Section */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <ImageIcon size={16} /> Profile Picture
              </label>
              <button
                type="button"
                onClick={() => setUseUrlInput(!useUrlInput)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Link size={14} />
                {useUrlInput ? 'Use Upload' : 'Use URL Instead'}
              </button>
            </div>

            {useUrlInput ? (
              <input
                type="text"
                value={profile.avatar}
                onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-shadow"
                placeholder="https://example.com/avatar.jpg"
              />
            ) : (
              <AvatarUpload
                currentAvatar={profile.avatar}
                onAvatarChange={(avatar) => setProfile({ ...profile, avatar })}
              />
            )}
          </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Info size={16} /> Bio
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full bg-background border border-input rounded-lg px-3 py-3 outline-none focus:ring-2 focus:ring-primary transition-shadow h-24 resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Appearance</h2>
        
        <div className="space-y-8">
          {/* Theme Selector */}
          <div>
            <span className="text-muted-foreground font-medium block mb-4">Color Theme</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`group relative flex flex-col items-center gap-3 p-3 rounded-xl border transition-all duration-200 outline-none ${
                    theme === t.id 
                      ? 'border-primary ring-1 ring-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full shadow-sm ${t.color} ${theme === t.id ? 'ring-2 ring-offset-2 ring-offset-card ring-primary' : ''}`} />
                  <span className={`text-sm font-medium ${theme === t.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {t.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-muted-foreground font-medium">Display Mode</span>
            <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
              <button 
                onClick={() => setDarkMode(false)} 
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  !darkMode 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sun size={16} /> Light
              </button>
              <button 
                onClick={() => setDarkMode(true)} 
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  darkMode 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Moon size={16} /> Dark
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>
        <button onClick={handleExport} className="flex items-center gap-2 px-6 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 mb-6 border border-border transition-colors">
          <Download size={18} />Export JSON
        </button>
        <button onClick={handleExportPDF} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 mb-6 border border-border transition-colors ml-4">
            <Download size={18} />Export PDF
        </button>
        <div className="border-t border-border pt-6">
          <h3 className="font-medium mb-4 flex items-center gap-2 text-muted-foreground"><Upload size={18} />Import Data</h3>
          <textarea 
            value={json} 
            onChange={(e) => setJson(e.target.value)} 
            placeholder="Paste your exported JSON here..." 
            className="w-full h-32 bg-background border border-input rounded-lg p-3 font-mono text-sm mb-4 outline-none focus:ring-2 focus:ring-primary transition-shadow resize-none" 
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary transition-shadow w-full sm:w-auto">
              <option value="merge">Merge</option>
              <option value="skip">Skip Duplicates</option>
              <option value="overwrite">Overwrite</option>
            </select>
            <button 
              onClick={handleImport} 
              disabled={!json}
              className="w-full sm:w-auto px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
