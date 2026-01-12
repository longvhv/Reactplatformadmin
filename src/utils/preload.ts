/**
 * Preload & Prefetch Utilities
 * 
 * Smart resource loading for better performance
 */

/**
 * Preload critical resources
 * Call this early in app initialization
 */
export function preloadCriticalResources() {
  // Preload fonts
  const fontPreload = document.createElement('link');
  fontPreload.rel = 'preload';
  fontPreload.as = 'font';
  fontPreload.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
  fontPreload.crossOrigin = 'anonymous';
  document.head.appendChild(fontPreload);
  
  // DNS prefetch for common CDNs
  const dnsPrefetchUrls = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://cdn.jsdelivr.net',
  ];
  
  dnsPrefetchUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Preload a specific route/module
 */
export function preloadRoute(moduleName: string) {
  // This is a placeholder - implement based on your routing strategy
  console.log(`Preloading route: ${moduleName}`);
  
  // Example: You can use dynamic import to preload the module
  // import(`../modules/${moduleName}`).catch(() => {
  //   console.warn(`Failed to preload module: ${moduleName}`);
  // });
}

/**
 * Preload multiple routes
 */
export function preloadRoutes(moduleNames: string[]) {
  moduleNames.forEach(name => preloadRoute(name));
}

/**
 * Intelligent prefetching based on user behavior
 * Prefetch links when user hovers over them
 */
export function setupIntelligentPrefetch() {
  let hoverTimer: number | null = null;
  
  const handleMouseEnter = (e: MouseEvent) => {
    const target = e.target;
    
    // Check if target is an Element (not text node or other node types)
    if (!target || !(target instanceof Element)) {
      return;
    }
    
    const link = target.closest('a[data-prefetch]');
    
    if (link) {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/')) {
        // Delay prefetch by 100ms to avoid prefetching accidental hovers
        hoverTimer = window.setTimeout(() => {
          const moduleName = href.split('/')[1];
          if (moduleName) {
            preloadRoute(moduleName);
          }
        }, 100);
      }
    }
  };
  
  const handleMouseLeave = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  };
  
  document.addEventListener('mouseenter', handleMouseEnter, { capture: true });
  document.addEventListener('mouseleave', handleMouseLeave, { capture: true });
  
  // Cleanup function
  return () => {
    document.removeEventListener('mouseenter', handleMouseEnter, { capture: true });
    document.removeEventListener('mouseleave', handleMouseLeave, { capture: true });
  };
}

/**
 * Prefetch on idle using requestIdleCallback
 */
export function prefetchOnIdle(moduleNames: string[], timeout = 2000) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        preloadRoutes(moduleNames);
      },
      { timeout }
    );
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadRoutes(moduleNames);
    }, 1000);
  }
}

/**
 * Adaptive prefetching based on connection speed
 */
export function adaptivePrefetch(moduleNames: string[]) {
  // @ts-ignore - NetworkInformation API not in all browsers
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) {
    // No connection info, prefetch conservatively
    prefetchOnIdle(moduleNames, 3000);
    return;
  }
  
  const effectiveType = connection.effectiveType;
  
  switch (effectiveType) {
    case '4g':
      // Fast connection - prefetch immediately
      preloadRoutes(moduleNames);
      break;
    case '3g':
      // Medium connection - prefetch on idle
      prefetchOnIdle(moduleNames, 2000);
      break;
    case '2g':
    case 'slow-2g':
      // Slow connection - don't prefetch
      console.log('Slow connection detected, skipping prefetch');
      break;
    default:
      // Unknown - prefetch conservatively
      prefetchOnIdle(moduleNames, 3000);
  }
}
