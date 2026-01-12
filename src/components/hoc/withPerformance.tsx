/**
 * withPerformance HOC
 * Higher-order component for performance tracking
 */

import { ComponentType, useEffect } from 'react';
import { trackComponentRender } from '../../utils/performanceMonitoring';

export function withPerformance<P extends object>(
  Component: ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || Component.displayName || Component.name || 'Component';

  const WithPerformance = (props: P) => {
    useEffect(() => {
      const endTrack = trackComponentRender(displayName);
      return endTrack;
    }, []);

    return <Component {...props} />;
  };

  WithPerformance.displayName = `withPerformance(${displayName})`;

  return WithPerformance;
}
