import { useTheme } from '../themes/ThemeContext';
import { Palette, Check } from 'lucide-react';

const ThemeSwitcher = () => {
  const { currentTheme, switchTheme, availableThemes, theme } = useTheme();

  const themeDisplayNames = {
    dark: { name: 'Dark Blue', preview: 'bg-slate-900', accent: 'bg-blue-500' },
    trophy: { name: 'Trophy Gold', preview: 'bg-gray-900', accent: 'bg-amber-400' },
    light: { name: 'Light Modern', preview: 'bg-white', accent: 'bg-blue-500' },
    purple: { name: 'Purple Dream', preview: 'bg-indigo-950', accent: 'bg-purple-500' },
  };

  return (
    <div className="relative inline-block">
      <div className="bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-2xl p-4 shadow-xl w-80">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-gray-800">
          <Palette size={20} className="text-blue-600 dark:text-amber-400" />
          <h3 className="font-black text-sm uppercase tracking-wider">
            Izaberi temu
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {availableThemes.map((themeName) => {
            const themeInfo = themeDisplayNames[themeName];
            const isActive = currentTheme === themeName;

            return (
              <button
                key={themeName}
                onClick={() => switchTheme(themeName)}
                className={`
                  relative p-3 rounded-xl border-2 transition-all duration-300 group
                  ${isActive 
                    ? 'border-blue-500 dark:border-amber-400 shadow-lg scale-105' 
                    : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 hover:scale-102'
                  }
                `}
              >
                {/* Preview swatch */}
                <div className="flex gap-1.5 mb-2">
                  <div className={`w-full h-8 rounded-lg ${themeInfo.preview} border border-slate-200 dark:border-gray-700`} />
                  <div className={`w-3 h-8 rounded ${themeInfo.accent}`} />
                </div>

                {/* Theme name */}
                <div className="text-xs font-bold text-slate-700 dark:text-gray-300">
                  {themeInfo.name}
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 dark:bg-amber-400 text-white dark:text-gray-900 rounded-full p-1 shadow-lg">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-gray-800">
          <p className="text-[10px] text-slate-500 dark:text-gray-500 text-center">
            Promjena boja primjenjuje se odmah
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
