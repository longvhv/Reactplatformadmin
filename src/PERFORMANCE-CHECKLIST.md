# Performance Optimization Checklist

## 🎯 Quick Reference

### ✅ Implemented Features

#### Code Splitting & Lazy Loading
- [x] Module-based code splitting
- [x] Lazy component loading with retry
- [x] Dynamic imports
- [x] Preload on hover
- [x] Intelligent prefetching

#### Image Optimization
- [x] LazyImage component with blur-up
- [x] Intersection Observer lazy loading
- [x] Responsive image loading
- [x] useImageLazyLoad hook

#### Virtual Scrolling
- [x] VirtualList component
- [x] useVirtualList hook
- [x] Optimized for large lists (10,000+ items)
- [x] Configurable overscan

#### Infinite Scrolling
- [x] useInfiniteScroll hook
- [x] Intersection Observer based
- [x] Loading state management

#### Caching
- [x] Memory cache with TTL
- [x] LocalStorage persistence
- [x] Cache invalidation
- [x] Pattern-based invalidation
- [x] Cache decorator
- [x] getOrSet pattern

#### Performance Utilities
- [x] Debounce function
- [x] Throttle function
- [x] Memoization
- [x] Performance measurement
- [x] Connection speed detection
- [x] Device detection
- [x] Adaptive loading

#### Optimistic Updates
- [x] useOptimistic hook
- [x] Automatic rollback on error
- [x] Loading state tracking

#### Responsive Design
- [x] useMediaQuery hook
- [x] useIsMobile/Tablet/Desktop hooks
- [x] usePrefersReducedMotion
- [x] useIsDarkMode

#### Performance Monitoring
- [x] Web Vitals tracking (LCP, FID, CLS)
- [x] Navigation timing
- [x] Resource timing
- [x] Long task detection
- [x] Component render tracking
- [x] withPerformance HOC
- [x] Performance summary

#### Bundle Optimization
- [x] Lazy loading with retry
- [x] Preload components
- [x] Dynamic import tracking
- [x] Bundle analyzer (dev)

## 📋 Usage Checklist

### When Adding New Pages

```typescript
// ✅ DO: Lazy load the page
const NewPage = lazy(() => import('./NewPage'));

// ❌ DON'T: Import directly
import NewPage from './NewPage';
```

### When Displaying Images

```typescript
// ✅ DO: Use LazyImage
<LazyImage src="image.jpg" alt="..." />

// ❌ DON'T: Use regular img
<img src="image.jpg" alt="..." />
```

### When Rendering Large Lists

```typescript
// ✅ DO: Use VirtualList for > 100 items
<VirtualList items={largeArray} itemHeight={50} />

// ❌ DON'T: Render all items
{largeArray.map(item => <Item />)}
```

### When Making API Calls

```typescript
// ✅ DO: Use caching
const data = await cacheManager.getOrSet('key', fetcher);

// ❌ DON'T: Fetch every time
const data = await fetch('/api/data');
```

### When Implementing Search

```typescript
// ✅ DO: Debounce search input
const search = debounce(handleSearch, 300);

// ❌ DON'T: Search on every keystroke
onChange={(e) => handleSearch(e.target.value)}
```

### When Creating Heavy Components

```typescript
// ✅ DO: Use React.memo
export const HeavyComponent = React.memo(({ data }) => {
  // Expensive render
});

// ❌ DON'T: Re-render unnecessarily
export function HeavyComponent({ data }) {
  // Re-renders on every parent update
}
```

### When Computing Expensive Values

```typescript
// ✅ DO: Use useMemo
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ❌ DON'T: Compute on every render
const expensiveValue = computeExpensiveValue(data);
```

### When Passing Callbacks

```typescript
// ✅ DO: Use useCallback
const handleClick = useCallback(() => {
  doSomething();
}, []);

// ❌ DON'T: Create new function every render
const handleClick = () => doSomething();
```

### When Building Responsive UI

```typescript
// ✅ DO: Use media query hooks
const isMobile = useIsMobile();

// ❌ DON'T: Check window.innerWidth
const isMobile = window.innerWidth < 640;
```

## 🎨 Component Optimization Examples

### Before: Unoptimized Component

```typescript
function ProductList({ products }) {
  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>
          <img src={product.image} alt={product.name} />
          <h3>{product.name}</h3>
          <button onClick={() => addToCart(product)}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}
```

### After: Optimized Component

```typescript
import { LazyImage } from './components/performance';
import { VirtualList } from './components/performance';
import { useCallback } from 'react';

const ProductItem = React.memo(({ product, onAddToCart }) => (
  <div>
    <LazyImage 
      src={product.image} 
      alt={product.name}
      aspectRatio="1/1"
    />
    <h3>{product.name}</h3>
    <button onClick={() => onAddToCart(product)}>
      Add to Cart
    </button>
  </div>
));

function ProductList({ products }) {
  const handleAddToCart = useCallback((product) => {
    addToCart(product);
  }, []);

  // Use VirtualList if > 100 products
  if (products.length > 100) {
    return (
      <VirtualList
        items={products}
        itemHeight={300}
        containerHeight={600}
        renderItem={(product) => (
          <ProductItem
            product={product}
            onAddToCart={handleAddToCart}
          />
        )}
      />
    );
  }

  return (
    <div>
      {products.map((product) => (
        <ProductItem
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
}
```

## 📊 Performance Targets

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP    | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| FID    | ≤ 100ms | 100ms - 300ms | > 300ms |
| CLS    | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |

### Bundle Size Targets

| Bundle | Target | Max |
|--------|--------|-----|
| Total  | < 150KB | < 200KB |
| JS     | < 100KB | < 150KB |
| CSS    | < 30KB  | < 50KB |

### Performance Scores

| Category | Target |
|----------|--------|
| Lighthouse Performance | > 90 |
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3.5s |
| Speed Index | < 3.0s |

## 🔍 Testing Commands

```bash
# Run Lighthouse
npx lighthouse http://localhost:5173

# Analyze bundle
npm run build
npm run analyze

# Check bundle size
npm run build -- --report

# Performance profiling
# Open DevTools > Performance > Record
```

## 📈 Monitoring in Production

### Metrics to Track

1. **Page Load Time**
   - Target: < 3s
   - Monitor: 95th percentile

2. **API Response Time**
   - Target: < 500ms
   - Monitor: Average & P95

3. **JavaScript Errors**
   - Target: < 0.1% error rate
   - Monitor: Error count & rate

4. **Bundle Size**
   - Track: Total size over time
   - Alert: If increases > 10%

5. **Cache Hit Rate**
   - Target: > 80%
   - Monitor: Cache effectiveness

## ✨ Advanced Optimizations

### When to Use What

| Scenario | Solution |
|----------|----------|
| Large list (100+ items) | VirtualList |
| Infinite data | useInfiniteScroll |
| Heavy images | LazyImage |
| Expensive computation | useMemo |
| Callback to child | useCallback |
| Pure component | React.memo |
| API data | Cache + useAsync |
| Search input | Debounce |
| Scroll handler | Throttle |
| Optimistic UI | useOptimistic |
| Responsive | useMediaQuery |

## 🚨 Common Pitfalls

### ❌ Anti-patterns to Avoid

1. **No lazy loading**
   - Importing all components at once
   
2. **Missing keys in lists**
   - Using index as key
   
3. **Inline functions in render**
   - Creating new functions every render
   
4. **No memoization**
   - Computing same values repeatedly
   
5. **Unoptimized images**
   - Loading full-size images
   
6. **No debouncing**
   - API calls on every keystroke
   
7. **Rendering large lists**
   - Not using virtualization
   
8. **No error boundaries**
   - One error crashes entire app

## 🎓 Learning Path

1. **Week 1**: Implement lazy loading
2. **Week 2**: Add image optimization
3. **Week 3**: Use caching effectively
4. **Week 4**: Optimize large lists
5. **Week 5**: Monitor & measure

## 📚 Resources

- [Performance Examples](./examples/PerformanceExamples.tsx)
- [Performance Guide](./PERFORMANCE-OPTIMIZATION.md)
- [Web.dev Performance](https://web.dev/performance/)
- [React Performance Docs](https://react.dev/learn/render-and-commit)

---

**Remember**: Measure, Optimize, Monitor, Repeat! 🚀
