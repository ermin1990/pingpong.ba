// Centralized Theme System
// All color schemes and design tokens in one place

export const themes = {
  // Original Dark Theme (Blue-focused)
  dark: {
    name: 'Dark Blue',
    colors: {
      // Backgrounds
      primary: '#0f172a',      // slate-900
      secondary: '#1e293b',    // slate-800
      tertiary: '#334155',     // slate-700
      card: '#1e293b',
      cardHover: '#334155',
      
      // Accents
      accent: '#3b82f6',       // blue-500
      accentHover: '#2563eb',  // blue-600
      accentLight: '#60a5fa',  // blue-400
      
      // Text
      textPrimary: '#ffffff',
      textSecondary: '#cbd5e1', // slate-300
      textMuted: '#64748b',     // slate-500
      
      // Borders
      border: '#334155',        // slate-700
      borderLight: '#475569',   // slate-600
      
      // Status
      success: '#10b981',       // emerald-500
      warning: '#f59e0b',       // amber-500
      error: '#ef4444',         // red-500
      info: '#3b82f6',          // blue-500
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    }
  },

  // BL Trophy Inspired Theme (Gold/Dark)
  trophy: {
    name: 'Trophy Gold',
    colors: {
      // Backgrounds - Deep dark blues/blacks
      primary: '#0a0a0b',      // Almost black
      secondary: '#111827',    // gray-900
      tertiary: '#1f2937',     // gray-800
      card: '#111827',
      cardHover: '#1f2937',
      
      // Accents - Gold/Yellow
      accent: '#fbbf24',       // amber-400 (gold)
      accentHover: '#f59e0b',  // amber-500
      accentLight: '#fcd34d',  // amber-300
      
      // Text
      textPrimary: '#ffffff',
      textSecondary: '#d1d5db', // gray-300
      textMuted: '#6b7280',     // gray-500
      
      // Borders
      border: '#374151',        // gray-700
      borderLight: '#4b5563',   // gray-600
      
      // Status
      success: '#10b981',       // emerald-500
      warning: '#fbbf24',       // amber-400
      error: '#ef4444',         // red-500
      info: '#60a5fa',          // blue-400
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(251 191 36 / 0.05)',
      md: '0 4px 6px -1px rgb(251 191 36 / 0.1)',
      lg: '0 10px 15px -3px rgb(251 191 36 / 0.15)',
      xl: '0 20px 25px -5px rgb(251 191 36 / 0.2)',
      glow: '0 0 30px rgb(251 191 36 / 0.3)',
    }
  },

  // Light Modern Theme (keeping existing light mode)
  light: {
    name: 'Light Modern',
    colors: {
      // Backgrounds
      primary: '#ffffff',
      secondary: '#f8fafc',    // slate-50
      tertiary: '#f1f5f9',     // slate-100
      card: '#ffffff',
      cardHover: '#f8fafc',
      
      // Accents
      accent: '#3b82f6',       // blue-500
      accentHover: '#2563eb',  // blue-600
      accentLight: '#60a5fa',  // blue-400
      
      // Text
      textPrimary: '#0f172a',  // slate-900
      textSecondary: '#475569', // slate-600
      textMuted: '#94a3b8',     // slate-400
      
      // Borders
      border: '#e2e8f0',        // slate-200
      borderLight: '#cbd5e1',   // slate-300
      
      // Status
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    }
  },

  // Purple Dream Theme (bonus option)
  purple: {
    name: 'Purple Dream',
    colors: {
      primary: '#1e1b4b',      // indigo-950
      secondary: '#312e81',    // indigo-900
      tertiary: '#3730a3',     // indigo-800
      card: '#312e81',
      cardHover: '#3730a3',
      
      accent: '#a855f7',       // purple-500
      accentHover: '#9333ea',  // purple-600
      accentLight: '#c084fc',  // purple-400
      
      textPrimary: '#ffffff',
      textSecondary: '#e9d5ff', // purple-200
      textMuted: '#a78bfa',     // purple-400
      
      border: '#4c1d95',        // purple-900
      borderLight: '#6d28d9',   // purple-700
      
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#a855f7',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(168 85 247 / 0.05)',
      md: '0 4px 6px -1px rgb(168 85 247 / 0.1)',
      lg: '0 10px 15px -3px rgb(168 85 247 / 0.15)',
      xl: '0 20px 25px -5px rgb(168 85 247 / 0.2)',
      glow: '0 0 30px rgb(168 85 247 / 0.3)',
    }
  }
};

// Animation presets inspired by BL Trophy
export const animations = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' }
  },
  fadeInUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: 'easeOut' }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  slideInLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.7, ease: 'easeOut' }
  },
  slideInRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.7, ease: 'easeOut' }
  },
  pulse: {
    animate: { scale: [1, 1.05, 1] },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
  },
  glow: {
    animate: { 
      boxShadow: [
        '0 0 10px rgba(251, 191, 36, 0.3)',
        '0 0 20px rgba(251, 191, 36, 0.5)',
        '0 0 10px rgba(251, 191, 36, 0.3)'
      ]
    },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
  }
};

// Typography scale
export const typography = {
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem',   // 72px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  }
};

// Spacing system
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
};

// Border radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

export default themes;
