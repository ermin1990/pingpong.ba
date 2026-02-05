import { createContext, useContext, useState, useEffect } from 'react';
import { themes } from './themes';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Load saved theme from localStorage or default to 'dark'
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('pingpong-theme');
    return saved || 'dark';
  });

  // Load light/dark mode preference
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    return saved === 'dark';
  });

  const theme = themes[currentTheme];

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('pingpong-theme', currentTheme);
  }, [currentTheme]);

  // Save mode preference
  useEffect(() => {
    localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
    // Update document class for Tailwind dark mode
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Apply theme CSS variables to root
  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply shadow variables
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
  }, [theme]);

  const switchTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  const value = {
    theme,
    currentTheme,
    switchTheme,
    isDark,
    toggleDarkMode,
    availableThemes: Object.keys(themes),
    themeNames: Object.values(themes).map(t => t.name),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
