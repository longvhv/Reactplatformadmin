# ⚡ PERFORMANCE OPTIMIZATION GUIDE

**Version:** 1.0  
**Last Updated:** 2026-01-15  
**Audience:** Developers  

---

## 🎯 QUICK START

### Running Performance Tools

```bash
# 1. Bundle Analysis (build required)
npm run analyze

# 2. Development Mode (all tools active)
npm run dev
# Then press:
# - Ctrl+Shift+B → Bundle Analyzer
# - Bottom-right → React Query Devtools
# - Bottom-left → Performance Monitor
```

---

## 📦 BUNDLE OPTIMIZATION

### Code Splitting Best Practices

#### ✅ DO: Use Lazy Loading

```typescript
// Register lazy module
const DashboardModule = LazyModuleLoader.register(
  'dashboard',
  () => import('../modules/dashboard')
);

// Module loads automatically when route is accessed
```

#### ❌ DON'T: Import Eagerly

```typescript
// This loads ALL code immediately
import { DashboardModule } from '../modules/dashboard';
```

### Priority-Based Loading

```typescript
// High priority = load on idle
// Medium priority = load on demand
// Low priority = load only when needed

prefetchByPriority([
  { name: 'dashboard', priority: 100 },  // Critical
  { name: 'tenants', priority: 90 },     // High
  { name: 'settings', priority: 60 },    // Medium
  { name: 'reports', priority: 30 },     // Low
]);
```

### Bundle Analysis

```bash
# Generate bundle report
ANALYZE=true npm run build

# Opens http://localhost:8888
# Shows:
# - Bundle size breakdown
# - Duplicate dependencies
# - Large modules
# - Optimization opportunities
```

**Target Sizes:**
- Main chunk: < 300KB
- Vendor chunk: < 200KB
- Module chunks: < 30KB each
- Total initial load: < 500KB

---

## 🚀 VIRTUAL SCROLLING

### When to Use

```typescript
// ✅ Use for large datasets (50+ items)
if (items.length > 50) {
  return <VirtualList items={items} />;
}

// ✅ Use for infinite lists
// ✅ Use for performance-critical pages
// ❌ Don't use for small lists (< 50 items)
```

### Basic Usage

```typescript
import { VirtualList } from '@/components/VirtualList';

<VirtualList
  items={data}
  itemHeight={60}        // Fixed height per item
  renderItem={(item) => <Row data={item} />}
  overscan={5}           // Pre-render 5 items above/below
/>
```

### Advanced: VirtualizedTable

```typescript
import { VirtualizedTable } from '@/components/common/VirtualizedTable';

const columns = [
  { 
    key: 'name', 
    label: 'Name', 
    width: '30%',
    render: (item) => <strong>{item.name}</strong>
  },
  { key: 'email', label: 'Email', width: '40%' },
  { key: 'status', label: 'Status', width: '30%' },
];

<VirtualizedTable
  data={users}
  columns={columns}
  rowHeight={60}
  stickyHeader={true}
  onRowClick={(user) => navigate(`/users/${user._id}`)}
  emptyMessage="No users found"
/>
```

### Important: Container Height

```typescript
// ✅ DO: Specify container height
<div className="h-[600px]">
  <VirtualList ... />
</div>

// ❌ DON'T: Use auto height
<div>
  <VirtualList ... />  {/* Won't work! */}
</div>
```

---

## 💾 CACHING STRATEGY

### TanStack Query Configuration

```typescript
// Already configured in App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 min fresh
      gcTime: 10 * 60 * 1000,        // 10 min cache
      retry: 1,                       // Retry once
      refetchOnWindowFocus: false,    // Don't refetch on focus
    },
  },
});
```

### Using Queries

```typescript
import { useQuery } from '@tanstack/react-query';

// Basic query
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});

// With custom config
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 10 * 60 * 1000,  // Override: 10 min fresh
  enabled: !!userId,           // Only run if userId exists
});
```

### Cache Invalidation

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ['users'] });

// Invalidate all queries starting with 'users'
queryClient.invalidateQueries({ queryKey: ['users'], exact: false });

// Refetch immediately
queryClient.refetchQueries({ queryKey: ['users'] });

// Set query data manually
queryClient.setQueryData(['user', userId], newUserData);
```

### Optimistic Updates

```typescript
import { useMutation } from '@tanstack/react-query';

const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newUser) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['users'] });
    
    // Snapshot previous value
    const previousUsers = queryClient.getQueryData(['users']);
    
    // Optimistically update
    queryClient.setQueryData(['users'], (old) => [...old, newUser]);
    
    // Return context with snapshot
    return { previousUsers };
  },
  onError: (err, newUser, context) => {
    // Rollback on error
    queryClient.setQueryData(['users'], context.previousUsers);
  },
  onSettled: () => {
    // Refetch after success or error
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

---

## 📊 PERFORMANCE MONITORING

### Built-in Tools

#### 1. BundleAnalyzer (Ctrl+Shift+B)

**Features:**
- Module count and status
- Bundle size by type
- Slow resources detection
- Navigation timing

**Usage:**
```typescript
// Press Ctrl+Shift+B in development
// Click floating "📊 Bundle" button
// View tabs: Modules, Resources, Timing
```

#### 2. React Query Devtools

**Features:**
- Query cache inspection
- Query status monitoring
- Manual cache manipulation
- Performance tracking

**Usage:**
```typescript
// Automatically visible in bottom-right (dev only)
// Click to expand
// View all queries and their states
```

#### 3. PerformanceMonitor

**Features:**
- Core Web Vitals
- FPS monitoring
- Memory usage
- Custom metrics

**Usage:**
```typescript
// Automatically visible in bottom-left (dev only)
// Real-time performance metrics
```

### Custom Performance Tracking

```typescript
import { useWebVitals } from '@/hooks/useWebVitals';

function MyComponent() {
  const { metrics, reportWebVitals } = useWebVitals();
  
  useEffect(() => {
    reportWebVitals((metric) => {
      console.log(`${metric.name}: ${metric.value}`);
      
      // Send to analytics
      analytics.track(metric.name, {
        value: metric.value,
        rating: metric.rating,
      });
    });
  }, []);
}
```

---

## 🎨 IMAGE OPTIMIZATION

### Next.js Image Component

```typescript
import Image from 'next/image';

// ✅ DO: Use Next.js Image
<Image
  src="/logo.png"
  width={200}
  height={100}
  alt="Logo"
  priority={true}  // For above-fold images
/>

// ✅ DO: Lazy load below-fold images
<Image
  src="/hero.jpg"
  width={800}
  height={600}
  alt="Hero"
  loading="lazy"
/>

// ❌ DON'T: Use plain <img>
<img src="/logo.png" alt="Logo" />
```

### External Images (Unsplash)

```typescript
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

// Already optimized
<ImageWithFallback
  src={imageUrl}
  alt="Product"
  className="w-full h-auto"
/>
```

### Image Formats

```typescript
// next.config.mjs already configured
images: {
  formats: ['image/avif', 'image/webp'],  // Modern formats
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

---

## 🎯 CSS OPTIMIZATION

### Tailwind Best Practices

```typescript
// ✅ DO: Use Tailwind classes
<div className="flex items-center gap-4 p-4 bg-white">

// ✅ DO: Extract repeated patterns
const cardClasses = "p-6 bg-white rounded-lg shadow-md";
<div className={cardClasses}>

// ❌ DON'T: Use inline styles
<div style={{ display: 'flex', padding: '16px' }}>

// ❌ DON'T: Create custom CSS for simple styling
```

### Dynamic Classes

```typescript
import { clsx } from 'clsx';

// ✅ DO: Use clsx for conditional classes
<div className={clsx(
  'px-4 py-2 rounded',
  isActive && 'bg-blue-500 text-white',
  !isActive && 'bg-gray-100 text-gray-800'
)}>

// Or use tailwind-merge for conflicts
import { cn } from '@/lib/utils';

<Button className={cn('px-4', className)} />
```

### CSS Optimization (Automatic)

```javascript
// next.config.mjs already configured
experimental: {
  optimizeCss: true,  // Remove unused CSS
  optimizePackageImports: [
    'lucide-react',
    'recharts',
    '@radix-ui/*',
  ],
}
```

---

## 🔧 WEBPACK OPTIMIZATION

### Chunk Splitting Strategy

```javascript
// Already configured in next.config.mjs
cacheGroups: {
  // Core vendor dependencies
  vendor: {
    test: /[\\/]node_modules[\\/]/,
    priority: 10,
  },
  
  // Radix UI components (heavy)
  radixui: {
    test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
    priority: 20,
  },
  
  // React Query (separate from vendor)
  query: {
    test: /[\\/]@tanstack[\\/]react-query[\\/]/,
    priority: 20,
  },
  
  // Charts library (on-demand)
  charts: {
    test: /[\\/](recharts|d3-)[\\/]/,
    priority: 20,
  },
  
  // Shared code across modules
  common: {
    minChunks: 2,
    priority: 5,
  },
}
```

### Tree Shaking

```typescript
// ✅ DO: Import only what you need
import { Button } from '@/components/ui/button';

// ❌ DON'T: Import everything
import * as UI from '@/components/ui';
```

---

## 📈 PERFORMANCE BUDGETS

### Recommended Limits

```javascript
// Size budgets
{
  "initial": "500KB",      // Initial bundle
  "vendor": "200KB",       // Vendor chunk
  "module": "30KB",        // Each module
  "css": "50KB",           // Total CSS
}

// Performance budgets
{
  "TTI": "3s",            // Time to Interactive
  "LCP": "2.5s",          // Largest Contentful Paint
  "FID": "100ms",         // First Input Delay
  "CLS": "0.1",           // Cumulative Layout Shift
}
```

### Monitoring

```bash
# Check bundle size
npm run analyze

# Check performance
# Use Lighthouse in Chrome DevTools
# Or PerformanceMonitor in development
```

---

## 🐛 TROUBLESHOOTING

### Issue: Large Bundle Size

**Solution:**
1. Run `npm run analyze`
2. Identify large dependencies
3. Check for:
   - Duplicate packages
   - Unused dependencies
   - Large libraries (can they be lazy loaded?)
4. Consider alternatives for heavy packages

### Issue: Slow Virtual Scrolling

**Solution:**
```typescript
// ✅ Ensure fixed height container
<div className="h-[600px]">
  <VirtualList ... />
</div>

// ✅ Use appropriate overscan
overscan={5}  // 3-10 is good

// ✅ Memoize renderItem if complex
const renderItem = useCallback((item) => (
  <ComplexRow item={item} />
), []);
```

### Issue: Cache Not Working

**Solution:**
```typescript
// Check queryKey consistency
queryKey: ['users']           // ✅ Same key
queryKey: ['users', 'list']   // ❌ Different key

// Check staleTime configuration
staleTime: 5 * 60 * 1000,  // 5 minutes

// Use React Query Devtools to inspect cache
```

### Issue: Module Not Lazy Loading

**Solution:**
```typescript
// Check LazyModuleLoader registration
console.log(LazyModuleLoader.getModuleNames());

// Ensure module export is correct
export const DashboardModule = { ... };

// Check Suspense boundary
<Suspense fallback={<LoadingFallback />}>
  <Routes />
</Suspense>
```

---

## 📚 REFERENCE

### Key Files

- `/core/LazyModuleLoader.tsx` - Lazy loading system
- `/components/VirtualList.tsx` - Virtual scrolling base
- `/components/common/VirtualizedTable.tsx` - Virtualized table
- `/next.config.mjs` - Webpack & optimization config
- `/App.tsx` - TanStack Query setup

### External Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals](https://web.dev/vitals/)
- [Webpack Optimization](https://webpack.js.org/guides/code-splitting/)

---

## ✅ CHECKLIST

### Before Deployment

- [ ] Run bundle analyzer
- [ ] Check Core Web Vitals
- [ ] Verify lazy loading works
- [ ] Test virtual scrolling with large datasets
- [ ] Confirm cache strategy is effective
- [ ] Ensure no console errors
- [ ] Test on slow 3G connection
- [ ] Verify mobile performance

### Optimization Opportunities

- [ ] Large images → WebP/AVIF
- [ ] Heavy dependencies → Code split
- [ ] Repeated code → Extract to shared module
- [ ] Long lists → Virtual scrolling
- [ ] Frequent API calls → Cache with TanStack Query
- [ ] Large vendor bundle → Analyze and optimize

---

**Created By:** AI Assistant  
**Date:** 2026-01-15  
**Version:** 1.0  
**Status:** Production Ready

⚡ **Performance is a feature!** ⚡
