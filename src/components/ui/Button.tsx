/**
 * Button Component
 * Standardized button with design tokens
 * Replaces hardcoded button styles throughout the app
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn, BUTTON_VARIANTS, UI_SPACING } from '../../constants/ui';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button visual variant
   */
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'icon';
  
  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Full width button
   */
  fullWidth?: boolean;
  
  /**
   * Loading state
   */
  loading?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Button Component
 * 
 * @example
 * // Primary button
 * <Button variant="primary">Save</Button>
 * 
 * // Destructive button
 * <Button variant="destructive">Delete</Button>
 * 
 * // Loading state
 * <Button loading>Saving...</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    loading = false,
    className,
    children,
    disabled,
    ...props 
  }, ref) => {
    // Size classes
    const sizeClasses = {
      sm: UI_SPACING.paddingSm,
      md: UI_SPACING.paddingMd,
      lg: UI_SPACING.paddingLg,
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          BUTTON_VARIANTS[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          loading && 'opacity-50 pointer-events-none',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';