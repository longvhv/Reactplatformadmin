# Performance Optimization Guide

## 🚀 Overview

This guide covers all performance optimizations implemented in the VHV Platform framework.

## 📊 Performance Features

### 1. **Code Splitting & Lazy Loading**

#### Module-Based Code Splitting
```typescript
// Automatic code splitting per module
import { lazy } from 'react';

export const DashboardModule = {
  component: lazy(() => import('./DashboardPage')),
};
```

#### Lazy Loading with Retry
```typescript
import { lazyWithRetry } from './utils/bundleOptimization';

const HeavyComponent = lazyWithRetry(
  () => import('./HeavyComponent'),
  3 // retry 3 times
);
```

#### Preload on Hover
```typescript
import { preloadOnHover } from './utils/bundleOptimization';

const preload = preloadOnHover(() => import('./Component'));

<button onMouseEnter={preload}>
  Navigate
</button>
```

### 2. **Image Optimization**

#### Lazy Loading Images
```tsx
import { LazyImage } from './components/performance';

<LazyImage
  src="/large-image.jpg"
  alt="Description"
  blurDataURL="/blur-placeholder.jpg"
  aspectRatio="16/9"
  objectFit="cover"
/>
```

#### Custom Lazy Load Hook
```tsx
import { useImageLazyLoad } from './hooks';

function MyComponent() {
  const { imgRef, imageSrc, isLoaded } = useImageLazyLoad(src);
  
  return (
    <img ref={imgRef} src={imageSrc} alt="" />
  );
}
```

### 3. **Virtual Scrolling**

#### Virtual List Component
```tsx
import { VirtualList } from './components/performance';

<VirtualList
  items={largeArray}
  itemHeight={50}
  containerHeight={600}
  renderItem={(item) => <div>{item.name}</div>}
  overscan={5}
/>
```

#### Virtual List Hook
```tsx
import { useVirtualList } from './hooks';

function MyList({ items }) {
  const { containerRef, visibleItems, offsetY } = useVirtualList(items, {
    itemHeight: 50,
    containerHeight: 600,
  });
  
  return (
    <div ref={containerRef}>
      {visibleItems.map(item => <Item {...item} />)}
    </div>
  );
}
```

### 4. **Infinite Scrolling**

```tsx
import { useInfiniteScroll } from './hooks';

function InfiniteList() {
  const { observerTarget } = useInfiniteScroll({
    hasMore: hasMore,
    isLoading: isLoading,
    onLoadMore: fetchMore,
  });
  
  return (
    <div>
      {items.map(item => <Item {...item} />)}
      <div ref={observerTarget} />
    </div>
  );
}
```

### 5. **Advanced Caching**

#### Cache Manager
```typescript
import { cacheManager } from './lib/cache';

// Set cache
cacheManager.set('user-data', userData, 5 * 60 * 1000); // 5 min TTL

// Get cache
const cached = cacheManager.get('user-data');

// Get or fetch
const data = await cacheManager.getOrSet(
  'api-data',
  () => fetchData(),
  10 * 60 * 1000 // 10 min TTL
);

// Invalidate pattern
cacheManager.invalidatePattern(/^user-/);
```

#### Cache Decorator
```typescript
import { withCache } from './lib/cache';

const fetchUserData = withCache(
  async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
  {
    key: (userId) => `user-${userId}`,
    ttl: 5 * 60 * 1000,
  }
);
```

### 6. **Performance Utilities**

#### Debounce & Throttle
```typescript
import { debounce, throttle } from './lib/performance';

// Debounce search
const debouncedSearch = debounce((query: string) => {
  search(query);
}, 300);

// Throttle scroll handler
const throttledScroll = throttle(() => {
  handleScroll();
}, 100);
```

#### Memoization
```typescript
import { memoize } from './lib/performance';

const expensiveCalculation = memoize((a: number, b: number) => {
  return heavyComputation(a, b);
});
```

#### Measure Performance
```typescript
import { measureTime } from './lib/performance';

const result = await measureTime(
  () => fetchData(),
  'Data Fetch'
);
// Logs: [Performance] Data Fetch: 123.45ms
```

### 7. **Optimistic UI Updates**

```tsx
import { useOptimistic } from './hooks';

function TodoList() {
  const { value: todos, updateOptimistic } = useOptimistic(initialTodos);
  
  const addTodo = async (todo: Todo) => {
    await updateOptimistic(
      [...todos, todo], // optimistic value
      () => api.createTodo(todo) // async action
    );
  };
}
```

### 8. **Responsive Utilities**

#### Media Query Hooks
```tsx
import { useIsMobile, useIsTablet, useIsDesktop } from './hooks';

function ResponsiveComponent() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  
  return (
    <div>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
    </div>
  );
}
```

#### Custom Media Query
```tsx
import { useMediaQuery } from './hooks';

const isLargeScreen = useMediaQuery('(min-width: 1440px)');
```

#### Reduced Motion
```tsx
import { usePrefersReducedMotion } from './hooks';

function AnimatedComponent() {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  return (
    <motion.div
      animate={prefersReducedMotion ? {} : { scale: 1.2 }}
    />
  );
}
```

### 9. **Performance Monitoring**

#### Automatic Monitoring
```typescript
import { initPerformanceMonitoring } from './utils/performanceMonitoring';

// In App.tsx
initPerformanceMonitoring();
```

#### Track Component Renders
```typescript
import { trackComponentRender } from './utils/performanceMonitoring';

function MyComponent() {
  useEffect(() => {
    const endTrack = trackComponentRender('MyComponent');
    return endTrack;
  }, []);
}
```

#### HOC for Performance Tracking
```tsx
import { withPerformance } from './components/hoc';

const MyComponent = withPerformance(() => {
  return <div>Content</div>;
}, 'MyComponent');
```

#### Get Performance Metrics
```typescript
import { performanceMonitor } from './utils/performanceMonitoring';

// Get all metrics
const metrics = performanceMonitor.getMetrics();

// Get average
const avgLCP = performanceMonitor.getAverageMetric('LCP');

// Get summary
const summary = performanceMonitor.getSummary();
```

### 10. **Adaptive Loading**

```typescript
import { shouldLoadHeavyContent, getConnectionSpeed } from './lib/performance';

function AdaptiveComponent() {
  const canLoadHeavy = shouldLoadHeavyContent();
  const speed = getConnectionSpeed();
  
  return (
    <div>
      {canLoadHeavy ? <HighQualityImage /> : <LowQualityImage />}
      {speed === 'fast' && <HeavyFeature />}
    </div>
  );
}
```

## 📈 Performance Metrics Tracked

### Core Web Vitals
- **LCP** (Largest Contentful Paint) - < 2.5s
- **FID** (First Input Delay) - < 100ms
- **CLS** (Cumulative Layout Shift) - < 0.1

### Custom Metrics
- Page Load Time
- DOM Ready Time
- Component Render Time
- API Response Time
- Resource Load Time
- Long Tasks (> 50ms)

## ⚡ Optimization Checklist

### Components
- [ ] Use `React.memo()` for expensive components
- [ ] Use `useMemo()` for expensive calculations
- [ ] Use `useCallback()` for function props
- [ ] Avoid inline functions in render
- [ ] Split large components into smaller ones

### Images
- [ ] Use LazyImage component
- [ ] Provide blur placeholders
- [ ] Optimize image sizes
- [ ] Use WebP format
- [ ] Implement responsive images

### Lists
- [ ] Use VirtualList for large lists (> 100 items)
- [ ] Implement pagination or infinite scroll
- [ ] Use proper `key` props
- [ ] Memoize list items

### API Calls
- [ ] Implement caching strategy
- [ ] Use debouncing for search
- [ ] Batch API requests
- [ ] Implement optimistic updates
- [ ] Handle loading states

### Bundle Size
- [ ] Lazy load routes/modules
- [ ] Use dynamic imports
- [ ] Tree shake unused code
- [ ] Analyze bundle with BundleAnalyzer
- [ ] Remove unused dependencies

### Network
- [ ] Enable compression (gzip/brotli)
- [ ] Use CDN for static assets
- [ ] Implement service worker
- [ ] Preconnect to external domains
- [ ] Use HTTP/2

## 🔍 Performance Testing

### Development Tools
```typescript
// Enable performance monitoring in dev
process.env.NODE_ENV === 'development' && <PerformanceMonitor />

// Enable bundle analyzer
process.env.NODE_ENV === 'development' && <BundleAnalyzer />
```

### Browser DevTools
1. Open Chrome DevTools
2. Go to Performance tab
3. Record page load
4. Analyze metrics:
   - FCP, LCP, CLS
   - Long tasks
   - Layout shifts
   - JavaScript execution time

### Lighthouse
```bash
# Run Lighthouse audit
npx lighthouse http://localhost:5173 --view
```

## 📊 Performance Budget

### Targets
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Total Bundle Size**: < 200KB (gzipped)
- **JavaScript Bundle**: < 150KB (gzipped)
- **CSS Bundle**: < 50KB (gzipped)

### Route Budgets
- **Home**: < 100KB
- **Dashboard**: < 150KB
- **Heavy Page**: < 250KB

## 🛠️ Advanced Techniques

### 1. **Request Batching**
```typescript
import { batchRequests } from './utils/requestBatching';

const [user, posts, comments] = await batchRequests([
  () => api.getUser(),
  () => api.getPosts(),
  () => api.getComments(),
]);
```

### 2. **Web Workers**
```typescript
import { runInWorker } from './utils/webWorker';

const result = await runInWorker((data) => {
  // Heavy computation
  return processData(data);
}, heavyData);
```

### 3. **Service Worker (PWA)**
```typescript
// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### 4. **Prefetch Critical Resources**
```typescript
import { prefetchDNS, preconnect } from './lib/performance';

prefetchDNS(['https://api.example.com']);
preconnect(['https://cdn.example.com']);
```

## 📱 Mobile Optimization

### Device Detection
```typescript
import { isMobileDevice } from './lib/performance';

if (isMobileDevice()) {
  // Load mobile-optimized version
}
```

### Touch Optimization
- Use `passive` event listeners
- Avoid hover effects
- Increase tap target sizes
- Reduce animations

## 🎯 Best Practices

1. **Measure First**: Always measure before optimizing
2. **Focus on UX**: Optimize what users feel
3. **Progressive Enhancement**: Start with basics, add features
4. **Monitor Production**: Track real user metrics
5. **Iterate**: Continuously improve

## 🔗 Resources

- [Web.dev Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

**Performance is a feature!** 🚀
