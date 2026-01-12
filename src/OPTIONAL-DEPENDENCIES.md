# 📦 Optional Dependencies

Framework có một số dependencies tùy chọn cho advanced features.

## Web Vitals (Recommended for Production)

**Performance monitoring** với real-time Web Vitals tracking.

### Installation

```bash
npm install web-vitals
```

hoặc

```bash
yarn add web-vitals
```

### Features

Khi installed, bạn sẽ có:

✅ Real-time performance metrics (CLS, FCP, INP/FID, LCP, TTFB)
✅ Performance Monitor UI (Development mode - `Ctrl+Shift+P`)
✅ Google Analytics integration ready
✅ Custom analytics endpoint support

### Without web-vitals

Framework vẫn hoạt động hoàn toàn bình thường nếu không cài web-vitals:

- ✅ Tất cả features khác work normally
- ⚠️ Performance monitoring sẽ không available
- ℹ️ Bạn sẽ thấy console message: "web-vitals not installed"

### Usage

```typescript
import { useWebVitals } from './hooks/useWebVitals';

// In your component
useWebVitals((metric) => {
  console.log(metric.name, metric.value, metric.rating);
  
  // Send to your analytics
  analytics.track('web-vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  });
});
```

## Future Optional Dependencies

### React Query (Planned)

Advanced data fetching và caching.

```bash
npm install @tanstack/react-query
```

### Framer Motion (Alternative to Motion)

Nếu bạn muốn sử dụng Framer Motion thay vì Motion:

```bash
npm install framer-motion
```

### React Hook Form (For Complex Forms)

```bash
npm install react-hook-form
```

### Zod (Schema Validation)

```bash
npm install zod
```

---

## Current Dependencies

### Required (Core)

- ✅ `react` - UI library
- ✅ `react-dom` - React DOM bindings
- ✅ `react-router-dom` - Routing
- ✅ `lucide-react` - Icons

### UI Components (Included)

- ✅ Tailwind CSS - Styling
- ✅ Radix UI - Headless components
- ✅ Custom UI component library

### Optional (Advanced Features)

- ⚠️ `web-vitals` - Performance monitoring (recommended)

---

## Installation Commands

### Minimal Setup (Current)

Framework hoạt động với current dependencies.

### Recommended Setup

```bash
npm install web-vitals
```

### Full Setup (Future)

```bash
npm install web-vitals @tanstack/react-query react-hook-form zod
```

---

## Performance Impact

| Package | Bundle Size | Purpose | Required? |
|---------|-------------|---------|-----------|
| web-vitals | ~3KB | Performance monitoring | No |
| @tanstack/react-query | ~12KB | Data fetching | No |
| react-hook-form | ~9KB | Form management | No |
| zod | ~14KB | Validation | No |

---

## Notes

1. **web-vitals** được highly recommended cho production apps
2. Framework được thiết kế để gracefully degrade nếu thiếu optional dependencies
3. Không có breaking changes nếu bạn không cài optional packages
4. Performance Monitor tự động detect và hiển thị installation instructions

---

**Last updated:** December 2025
