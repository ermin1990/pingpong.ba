/**
 * ThemeCard - Unified card component that uses global theme
 * 
 * Provides consistent styling for cards, panels, and containers
 */

const ThemeCard = ({ 
  children, 
  variant = 'default',
  padding = 'md',
  className = '',
  ...props 
}) => {
  
  const baseClasses = 'rounded-2xl transition-all';
  
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };
  
  const variantClasses = {
    // Standard white card with border
    default: 'bg-white dark:bg-slate-800/40 backdrop-blur-xl border-2 border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-xl',
    
    // Elevated card with more shadow
    elevated: 'bg-white dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 shadow-lg dark:shadow-2xl',
    
    // Subtle background card
    subtle: 'bg-slate-50 dark:bg-slate-800/20 backdrop-blur-sm border border-slate-100 dark:border-slate-800/50',
    
    // Glass effect card
    glass: 'bg-white/80 dark:bg-slate-800/30 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/30 shadow-xl',
    
    // Outlined card (transparent with border)
    outlined: 'bg-transparent border-2 border-slate-300 dark:border-slate-700',
    
    // Dashed border (for empty states)
    dashed: 'bg-white dark:bg-slate-900/20 border-2 border-dashed border-slate-300 dark:border-slate-700',
    
    // Accent colored card
    accent: 'bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-200 dark:border-blue-500/30',
  };
  
  return (
    <div
      className={`${baseClasses} ${paddingClasses[padding]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default ThemeCard;
