import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Premium Loader component with multiple sizing variants
 * @param {('full'|'inline'|'mini')} variant - Layout style (default: 'inline')
 * @param {string} text - Optional text to display
 * @param {string} className - Additional CSS classes
 */
export const Loader = ({ variant = 'inline', text = 'Loading...', className }) => {
  const isMini = variant === 'mini';
  const isFull = variant === 'full';

  const containerClasses = cn(
    "flex items-center justify-center gap-3 transition-all duration-300",
    isFull ? "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex-col" : 
    isMini ? "py-4 w-full flex-row" : 
    "py-12 w-full flex-col",
    className
  );

  return (
    <div className={containerClasses}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring (hidden in mini) */}
        {!isMini && (
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        )}
        
        {/* Main Spinner */}
        <Loader2 
          className={cn(
            "text-primary animate-spin relative z-10",
            isMini ? "w-5 h-5" : "w-10 h-10"
          )} 
          strokeWidth={isMini ? 2 : 2.5} 
        />
      </div>
      
      {text && (
        <p className={cn(
          "font-medium tracking-wide font-heading transition-all",
          isMini ? "text-xs text-primary" : "text-sm text-muted-foreground animate-pulse",
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;
