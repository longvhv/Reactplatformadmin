# 🚀 Quick Start Guide

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

---

## Optional: Enable Performance Monitoring

Để bật **Performance Monitor** với real-time Web Vitals:

### Install web-vitals

```bash
npm install web-vitals
```

### Usage

Sau khi cài đặt, press `Ctrl+Shift+P` trong development mode để toggle Performance Monitor.

**Features:**
- ✅ Real-time CLS, FCP, INP, LCP, TTFB metrics
- ✅ Color-coded ratings (good/needs-improvement/poor)
- ✅ Draggable floating panel
- ✅ Auto-save visibility state

**Note:** Ứng dụng hoạt động hoàn toàn bình thường KHÔNG CẦN web-vitals. Đây chỉ là optional feature cho performance monitoring.

---

## Project Structure

```
/
├── components/          # UI components
│   ├── ui/             # Base UI components (Button, Card, etc.)
│   ├── layout/         # Layout components (AppLayout, Sidebar)
│   ├── ErrorBoundary.tsx
│   ├── LoadingFallback.tsx
│   ├── PerformanceMonitor.tsx
│   └── ...
├── core/               # Core framework
│   ├── ModuleRegistry.ts
│   └── types.ts
├── hooks/              # Custom hooks
│   ├── useDebounce.ts
│   ├── useVirtualScroll.ts
│   ├── useWebVitals.ts
│   ├── useFetch.ts
│   └── ...
├── modules/            # Feature modules
│   ├── dashboard/
│   ├── auth/
│   └── settings/
├── providers/          # Context providers
│   └── ThemeProvider.tsx
├── utils/              # Utilities
│   ├── performance.ts
│   ├── cache.ts
│   └── ...
└── App.tsx            # Main app entry
```

---

## Key Features

### ✅ Modular Architecture
- Plugin-based module system
- Dynamic module registration
- Hot module replacement ready

### ✅ Modern UI
- Glassmorphism design
- Dark/Light theme
- Tailwind CSS + Radix UI
- Responsive layout

### ✅ Performance Optimized
- React.memo for components
- useMemo & useCallback
- Virtual scrolling for large lists
- Debounced inputs
- Request caching & deduplication

### ✅ Error Handling
- Error boundaries
- Graceful fallbacks
- Loading states
- Skeleton screens

### ✅ Developer Experience
- TypeScript
- ESLint ready
- Hot reload
- Performance monitoring (with web-vitals)

---

## Development Mode Features

### Performance Monitor
Press `Ctrl+Shift+P` to toggle (requires web-vitals)

### Theme Switcher
Click theme icon in sidebar

### Module Hot Reload
Changes auto-reload in development

---

## Building for Production

```bash
npm run build
```

Output sẽ được generate trong `/dist`

### Preview Production Build

```bash
npm run preview
```

---

## Common Issues

### "web-vitals not installed" message

**Solution:** This is just an info message. App works fine without it.

To enable performance monitoring:
```bash
npm install web-vitals
```

### Type errors with hooks

Make sure you're using hooks inside function components and not in conditionals.

### Module not registering

Check that your module implements the `Module` interface and is registered in `App.tsx`:

```typescript
registry.register(YourModule);
```

---

## Next Steps

1. ✅ Explore the dashboard
2. ✅ Check out Settings page
3. ✅ Create your own module
4. ✅ Customize theme in `/styles/globals.css`
5. ✅ Add new routes in modules

---

## Documentation

- 📖 [ARCHITECTURE.md](./ARCHITECTURE.md) - Framework architecture
- ⚡ [PERFORMANCE.md](./PERFORMANCE.md) - Performance optimizations
- 📦 [OPTIONAL-DEPENDENCIES.md](./OPTIONAL-DEPENDENCIES.md) - Optional packages
- 🎨 [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Design guidelines

---

## Support

For issues or questions:
1. Check documentation files
2. Review example modules in `/modules`
3. Check browser console for helpful messages

---

**Happy coding!** 🎉
