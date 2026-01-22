/**
 * Card Component
 * Standardized card with design tokens
 */

import { HTMLAttributes, forwardRef } from 'react';
import { cn, CARD_VARIANTS } from '../../constants/ui';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Card variant
   */
  variant?: 'default' | 'flat' | 'elevated' | 'interactive' | 'compact';
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Card Component
 * 
 * @example
 * // Default card with hover effect
 * <Card>Content</Card>
 * 
 * // Flat card (no shadow)
 * <Card variant="flat">Content</Card>
 * 
 * // Interactive card (clickable)
 * <Card variant="interactive" onClick={handleClick}>
 *   Clickable content
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(CARD_VARIANTS[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader - Optional header section
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mb-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * CardTitle - Optional title
 */
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, as: Component = 'h3', ...props }, ref) => {
    return (
      <Component
        ref={ref as any}
        className={cn('text-lg font-semibold', className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'CardTitle';

/**
 * CardDescription - Optional description
 */
export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

/**
 * CardContent - Optional content wrapper
 */
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

/**
 * CardFooter - Optional footer section
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mt-4 flex items-center gap-2', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';