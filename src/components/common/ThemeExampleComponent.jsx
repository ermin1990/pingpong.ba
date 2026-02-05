import { useTheme } from '../themes/ThemeContext';

/**
 * Example component showing how to use the new theme system
 * This is a reference guide - you can copy these patterns to other components
 */

const ThemeExampleComponent = () => {
  const { theme, currentTheme } = useTheme();

  return (
    <div className="p-8 space-y-8">
      
      {/* METHOD 1: Using Tailwind with dark mode (recommended for most cases) */}
      <div className="bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-2xl p-6">
        <h2 className="text-slate-900 dark:text-white font-bold mb-4">
          Method 1: Tailwind Dark Mode Classes
        </h2>
        <p className="text-slate-600 dark:text-gray-400">
          This method works automatically with light/dark toggle
        </p>
      </div>

      {/* METHOD 2: Using CSS variables (for theme-specific colors) */}
      <div 
        className="rounded-2xl p-6 border-2"
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-textPrimary)'
        }}
      >
        <h2 className="font-bold mb-4" style={{ color: 'var(--color-textPrimary)' }}>
          Method 2: CSS Variables
        </h2>
        <p style={{ color: 'var(--color-textSecondary)' }}>
          Use this when you need theme-specific colors (like gold for Trophy theme)
        </p>
        <button 
          className="mt-4 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: currentTheme === 'trophy' ? '#000' : '#fff'
          }}
        >
          Themed Button
        </button>
      </div>

      {/* METHOD 3: Using theme object directly */}
      <div 
        className="rounded-2xl p-6 border-2"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border
        }}
      >
        <h2 className="font-bold mb-4" style={{ color: theme.colors.textPrimary }}>
          Method 3: Direct Theme Object Access
        </h2>
        <p style={{ color: theme.colors.textSecondary }}>
          Most flexible, but requires more code
        </p>
      </div>

      {/* ANIMATIONS EXAMPLES */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Animation Examples
        </h2>

        {/* Fade In Up */}
        <div className="animate-fade-in-up bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-2xl p-6">
          <h3 className="font-bold mb-2">Fade In Up Animation</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Add className="animate-fade-in-up"
          </p>
        </div>

        {/* Scale In */}
        <div className="animate-scale-in bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-2xl p-6">
          <h3 className="font-bold mb-2">Scale In Animation</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Add className="animate-scale-in"
          </p>
        </div>

        {/* Slide In Left */}
        <div className="animate-slide-in-left bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-2xl p-6">
          <h3 className="font-bold mb-2">Slide In Left Animation</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Add className="animate-slide-in-left"
          </p>
        </div>

        {/* Glow effect (Trophy theme specific) */}
        <div className="animate-glow bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-2xl p-6">
          <h3 className="font-bold mb-2">Glow Animation</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Add className="animate-glow" (best with Trophy theme)
          </p>
        </div>

        {/* Staggered animations */}
        <div className="stagger-fade grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div 
              key={i}
              className="bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-xl p-4 text-center"
            >
              Item {i}
            </div>
          ))}
        </div>

        {/* Card with hover effect */}
        <div className="card-hover bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-2xl p-6 cursor-pointer">
          <h3 className="font-bold mb-2">Card Hover Effect</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Add className="card-hover" for smooth lift on hover
          </p>
        </div>

        {/* Trophy card with shimmer */}
        <div className="trophy-card bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-2xl p-6 cursor-pointer">
          <h3 className="font-bold mb-2">Trophy Card Effect</h3>
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Add className="trophy-card" for gold shimmer on hover
          </p>
        </div>

        {/* Trophy gradient text */}
        <div className="bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-2xl p-6">
          <h3 className="text-4xl font-black text-gradient-gold">
            Gold Gradient Text
          </h3>
          <p className="text-sm text-slate-600 dark:text-gray-400 mt-2">
            Add className="text-gradient-gold"
          </p>
        </div>

        {/* Trophy themed button */}
        <button className="btn-trophy px-8 py-4 rounded-xl font-bold text-gray-900 relative z-10">
          Trophy Button with Ripple Effect
        </button>
      </div>

      {/* THEME-SPECIFIC STYLING */}
      <div className="bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-2xl p-6">
        <h2 className="text-2xl font-black mb-4">Conditional Theme Styling</h2>
        <div className="space-y-4">
          <div 
            className={`p-4 rounded-xl font-bold ${
              currentTheme === 'trophy' 
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-gray-900' 
                : 'bg-blue-600 text-white'
            }`}
          >
            This changes based on active theme
          </div>
          
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Current theme: <span className="font-bold">{theme.name}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThemeExampleComponent;
