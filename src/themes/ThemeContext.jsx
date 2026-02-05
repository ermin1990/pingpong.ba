import { createContext, useContext, useState, useEffect } from 'react';
import { themes } from './themes';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Theme Context - Global Theme Management
 * 
 * IMPORTANT:
 * - Global Theme (Trophy, Dark, Purple, Light) - Set by SuperAdmin, applies to ALL users
 * - Light/Dark Mode Toggle - Individual preference per user
 * 
 * SuperAdmin can change the global theme in Settings.
 * All users will see the same color scheme, but can toggle light/dark independently.
 */

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // GLOBAL THEME - Loaded from Firestore, applies to all users
  const [currentTheme, setCurrentTheme] = useState('trophy'); // Default to trophy theme
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  // INDIVIDUAL PREFERENCE - Light/Dark mode per user
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('user-dark-mode-preference');
    return saved === null ? true : saved === 'true'; // Default to dark
  });

  const theme = themes[currentTheme];

  // Load global theme from Firestore on mount
  useEffect(() => {
    const loadGlobalTheme = async () => {
      try {
        const themeDoc = await getDoc(doc(db, 'settings', 'globalTheme'));
        if (themeDoc.exists()) {
          const savedTheme = themeDoc.data().theme;
          if (themes[savedTheme]) {
            setCurrentTheme(savedTheme);
          }
        } else {
          // Initialize with default theme
          await setDoc(doc(db, 'settings', 'globalTheme'), {
            theme: 'trophy',
            updatedAt: new Date(),
            updatedBy: 'system'
          });
        }
      } catch (error) {
        console.warn('Failed to load global theme, using default:', error);
      } finally {
        setIsLoadingTheme(false);
      }
    };

    loadGlobalTheme();
  }, []);

  // Save user's light/dark mode preference locally
  useEffect(() => {
    localStorage.setItem('user-dark-mode-preference', isDark.toString());
    
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
    
    // Set theme name as data attribute
    root.setAttribute('data-theme', currentTheme);
    
    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply shadow variables
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
    
    // Apply accent color to Tailwind blue variants
    root.style.setProperty('--tw-color-accent', theme.colors.accent);
    root.style.setProperty('--tw-color-accent-hover', theme.colors.accentHover);
  }, [theme, currentTheme]);

  // Switch global theme (SuperAdmin only - enforced in UI)
  const switchTheme = async (themeName) => {
    if (!themes[themeName]) return;
    
    try {
      // Save to Firestore - applies globally to all users
      await setDoc(doc(db, 'settings', 'globalTheme'), {
        theme: themeName,
        updatedAt: new Date(),
        updatedBy: 'superadmin' // This should be actual user ID in production
      });
      
      setCurrentTheme(themeName);
    } catch (error) {
      console.error('Failed to save global theme:', error);
      alert('Greška pri čuvanju teme. Pokušajte ponovo.');
    }
  };

  // Toggle individual user's light/dark preference
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
    isLoadingTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
