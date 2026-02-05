/**
 * ThemeButton - Unified button component that uses global theme
 * 
 * Variants:
 * - primary: Main action buttons (blue/amber accent)
 * - secondary: Secondary actions (gray)
 * - success: Positive actions (green)
 * - danger: Destructive actions (red)
 * - ghost: Minimal style
 */

const ThemeButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) => {
  
  const baseClasses = 'font-bold uppercase tracking-wider transition-all rounded-xl flex items-center justify-center gap-2';
  
  const sizeClasses = {
    xs: 'px-2 py-1 text-[9px]',
    sm: 'px-3 py-1.5 text-[10px]',
    md: 'px-4 py-2.5 text-xs',
    lg: 'px-6 py-3 text-sm',
    xl: 'px-8 py-4 text-base',
  };
  
  const variantClasses = {
    primary: 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-500/30 hover:shadow-xl',
    
    secondary: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 shadow-sm',
    
    success: 'bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/30',
    
    danger: 'bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white shadow-lg shadow-red-500/20 dark:shadow-red-500/30',
    
    warning: 'bg-amber-400 dark:bg-amber-400 hover:bg-amber-500 dark:hover:bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20 dark:shadow-amber-500/30 font-bold',
    
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700',
    
    outline: 'bg-transparent border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10',
  };
  
  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default ThemeButton;
