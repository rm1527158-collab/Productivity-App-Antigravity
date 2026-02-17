import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'emerald');
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? savedMode === 'true' : false; // Default to false (light) if not set, or true if prefer-color-scheme matches? Let's stick to false as base.
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('darkMode', darkMode);

    const root = document.documentElement;
    // Remove all potential theme classes
    root.classList.remove('theme-emerald', 'theme-sunset', 'theme-ocean', 'theme-lavender', 'theme-rose', 'theme-midnight');
    // Add current theme class
    root.classList.add(`theme-${theme}`);
    
    // Handle dark mode
    if (darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme, darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, darkMode, setDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
