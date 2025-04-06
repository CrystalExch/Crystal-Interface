import React, { useState, useEffect } from 'react';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  useEffect(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial theme based on saved preference or system preference
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
      setTheme('light');
    } else if (savedTheme === 'dark') {
      document.body.classList.remove('light-mode');
      setTheme('dark');
    } else {
      // No saved preference, use system preference
      if (prefersDarkScheme.matches) {
        document.body.classList.remove('light-mode');
        setTheme('dark');
      } else {
        document.body.classList.add('light-mode');
        setTheme('light');
      }
    }
    
    // Listen for system theme changes
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      // Only change if user hasn't set a preference
      if (!localStorage.getItem('theme')) {
        if (event.matches) {
          document.body.classList.remove('light-mode');
          setTheme('dark');
        } else {
          document.body.classList.add('light-mode');
          setTheme('light');
        }
      }
    };
    
    prefersDarkScheme.addEventListener('change', handleSystemThemeChange);
    
    // Cleanup
    return () => {
      prefersDarkScheme.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);
  
  const toggleTheme = () => {
    if (theme === 'light') {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    }
  };
  
  return (
    <button 
      className="theme-toggle-button" 
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <svg className="theme-toggle-icon" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      ) : (
        <svg className="theme-toggle-icon" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;