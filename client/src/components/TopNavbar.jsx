import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlass, User, Bell, ArrowRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const TopNavbar = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: 'Loading...',
    title: '...',
    avatar: ''
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ tasks: [], habits: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/settings/preferences');
      if (res.data && res.data.account) {
        setProfile({
          username: res.data.account.username || 'User',
          title: res.data.account.title || 'Productivity Enthusiast',
          avatar: res.data.account.avatar || ''
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile in navbar:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
    
    // Listen for profile update events
    const handleProfileUpdate = () => {
      fetchProfile();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    // Refresh every 5 seconds to keep in sync
    const interval = setInterval(fetchProfile, 5000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Debounced search
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults({ tasks: [], habits: [] });
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const [tasksRes, habitsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/habits')
      ]);

      const queryLower = query.toLowerCase();
      
      // Filter tasks
      const filteredTasks = tasksRes.data
        .filter(task => 
          task.title.toLowerCase().includes(queryLower) ||
          (task.description && task.description.toLowerCase().includes(queryLower))
        )
        .slice(0, 5);

      // Filter habits
      const filteredHabits = habitsRes.data
        .filter(habit => 
          habit.title.toLowerCase().includes(queryLower)
        )
        .slice(0, 5);

      setSearchResults({ tasks: filteredTasks, habits: filteredHabits });
      setShowDropdown(true);
      setSelectedIndex(-1);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allResults = [
    ...searchResults.tasks.map(t => ({ ...t, type: 'task' })),
    ...searchResults.habits.map(h => ({ ...h, type: 'habit' }))
  ];

  const handleResultClick = (result) => {
    if (result.type === 'task') {
      navigate('/daily');
    } else if (result.type === 'habit') {
      navigate('/routine');
    }
    setSearchQuery('');
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || allResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allResults.length) {
          handleResultClick(allResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-primary/20 text-primary font-semibold">{part}</mark>
        : part
    );
  };

  return (
    <header className="h-20 px-8 flex items-center justify-between bg-cream-50 border-b border-border/40 sticky top-0 z-40 backdrop-blur-sm bg-opacity-80">
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl relative" ref={dropdownRef}>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlass weight="bold" className="h-4 w-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery && setShowDropdown(true)}
            className="block w-full pl-10 pr-3 py-2.5 border-b border-dashed border-muted-foreground/30 bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-0 transition-colors font-mono text-sm uppercase tracking-wider"
            placeholder="Search tasks, habits, or insights..."
          />
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && (searchResults.tasks.length > 0 || searchResults.habits.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
            {isSearching && (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                Searching...
              </div>
            )}

            {!isSearching && searchResults.tasks.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-muted/30 border-b border-border/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tasks</span>
                </div>
                {searchResults.tasks.map((task, idx) => {
                  const globalIdx = idx;
                  return (
                    <button
                      key={task._id}
                      onClick={() => handleResultClick({ ...task, type: 'task' })}
                      className={`w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors flex items-center justify-between group ${
                        selectedIndex === globalIdx ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {highlightMatch(task.title, searchQuery)}
                        </p>
                        {task.category && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {task.category}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="text-muted-foreground group-hover:text-primary transition-colors ml-2" size={16} />
                    </button>
                  );
                })}
              </div>
            )}

            {!isSearching && searchResults.habits.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-muted/30 border-b border-border/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Habits</span>
                </div>
                {searchResults.habits.map((habit, idx) => {
                  const globalIdx = searchResults.tasks.length + idx;
                  return (
                    <button
                      key={habit._id}
                      onClick={() => handleResultClick({ ...habit, type: 'habit' })}
                      className={`w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors flex items-center justify-between group ${
                        selectedIndex === globalIdx ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {highlightMatch(habit.title, searchQuery)}
                        </p>
                        {habit.frequency && (
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                            {habit.frequency}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="text-muted-foreground group-hover:text-primary transition-colors ml-2" size={16} />
                    </button>
                  );
                })}
              </div>
            )}

            {!isSearching && searchResults.tasks.length === 0 && searchResults.habits.length === 0 && searchQuery && (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No results found for "<span className="font-semibold">{searchQuery}</span>"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6 ml-8">
        <button className="text-muted-foreground hover:text-primary transition-colors relative">
            <Bell size={20} weight="duotone" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-border/40">
            <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-foreground leading-none">{profile.username}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{profile.title}</p>
            </div>
            <div className="h-14 w-14 bg-sage-200 rounded-full flex items-center justify-center text-primary-foreground border-2 border-sage-300 shadow-md overflow-hidden transition-transform hover:scale-105">
                {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                    <User size={28} weight="fill" className="text-forest-900" />
                )}
            </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
