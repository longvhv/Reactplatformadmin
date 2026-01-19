/**
 * Standard Page Container
 * 
 * Provides consistent layout wrapper for all pages:
 * - No background (inherited from AppLayout)
 * - No min-h-screen (let content be natural height)
 * - Consistent spacing with gap-6
 * 
 * Usage:
 * ```tsx
 * <PageContainer>
 *   <PageHeader title="..." description="..." />
 *   <Card>Content</Card>
 * </PageContainer>
 * ```
 */

import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  );
}
