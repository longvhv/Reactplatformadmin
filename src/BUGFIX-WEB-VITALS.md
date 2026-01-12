# 🐛 Bug Fixes - Web Vitals Error

## Issue

```
TypeError: onFID is not a function
    at hooks/useWebVitals.ts:58:6
```

## Root Cause

1. **web-vitals library không được cài đặt** - Framework cố gắng import từ package không tồn tại
2. **onFID deprecated** - FID (First Input Delay) đã bị deprecated trong web-vitals v3+ và được thay thế bởi INP (Interaction to Next Paint)
3. **No graceful degradation** - Code không handle trường hợp library missing

## Solutions Applied

### 1. ✅ Graceful Error Handling trong `useWebVitals.ts`

```typescript
// Try-catch cho dynamic import
try {
  const webVitals = await import("web-vitals");
  // ... use webVitals
} catch (error) {
  // Gracefully handle missing library
  console.warn("web-vitals library not available");
}

// Individual try-catch cho từng metric
try {
  if (webVitals.onCLS) webVitals.onCLS(reportMetric);
} catch (e) {
  console.warn("Failed to register CLS metric:", e);
}
```

### 2. ✅ Support cho cả FID và INP

```typescript
// Try INP first (newer), fallback to FID (older)
try {
  if (webVitals.onINP) {
    webVitals.onINP(reportMetric);
  } else if (webVitals.onFID) {
    webVitals.onFID(reportMetric);
  }
} catch (e) {
  console.warn("Failed to register INP/FID metric:", e);
}
```

### 3. ✅ PerformanceMonitor Graceful Handling

```typescript
// Check if web-vitals available
const [hasWebVitals, setHasWebVitals] = useState(true);

useEffect(() => {
  import("web-vitals")
    .then(() => setHasWebVitals(true))
    .catch(() => {
      setHasWebVitals(false);
      console.info("web-vitals not installed");
    });
}, []);

// Show appropriate UI
{!hasWebVitals ? (
  <div>web-vitals not installed</div>
) : (
  <MetricsDisplay />
)}
```

### 4. ✅ App.tsx Safety Guards

```typescript
// Safe performance API usage
if (typeof performance !== "undefined") {
  performance.mark("modules-registration-start");
}

try {
  performance.measure(...);
} catch (e) {
  // Ignore if measure fails
}
```

### 5. ✅ Documentation

Created `/OPTIONAL-DEPENDENCIES.md` với:
- Installation instructions
- Feature explanation
- "Works without" guarantees
- Performance impact table

## Testing Scenarios

### ✅ Scenario 1: web-vitals Installed
- All metrics tracked
- Performance Monitor shows data
- Green status indicator
- No errors in console

### ✅ Scenario 2: web-vitals NOT Installed
- App runs normally
- Performance Monitor shows "not installed" message
- Orange status indicator
- Helpful console message with install command
- No crashes or errors

### ✅ Scenario 3: Old web-vitals Version (v2)
- Falls back to onFID
- Works correctly
- All other metrics tracked

### ✅ Scenario 4: New web-vitals Version (v3+)
- Uses onINP instead of onFID
- All metrics tracked
- Modern performance indicators

## Changes Made

### Files Modified

1. **`/hooks/useWebVitals.ts`**
   - Added dynamic import with error handling
   - Added individual metric registration with try-catch
   - Support for both INP and FID
   - Updated TypeScript interface to include INP
   - Added null checks for all metric functions

2. **`/components/PerformanceMonitor.tsx`**
   - Added web-vitals availability check
   - Conditional UI based on library presence
   - Status indicator (green/orange)
   - Helpful installation message
   - Support for INP metric icon

3. **`/App.tsx`**
   - Added safety guards for performance API
   - Try-catch for performance.measure
   - Updated comments to reflect optional nature

4. **`/OPTIONAL-DEPENDENCIES.md`** (NEW)
   - Installation guide
   - Feature documentation
   - Graceful degradation explanation
   - Bundle size comparison

5. **`/PERFORMANCE.md`**
   - Updated to mention optional web-vitals
   - Added INP metric documentation
   - Updated examples with error handling

## Prevention

### Going Forward

1. ✅ **All external dependencies are optional** - Core framework works standalone
2. ✅ **Graceful degradation** - Features degrade gracefully when dependencies missing
3. ✅ **Clear documentation** - OPTIONAL-DEPENDENCIES.md explains everything
4. ✅ **Helpful messages** - Console tells users how to enable features
5. ✅ **Type safety** - TypeScript catches issues early

### Best Practices Applied

- **Defensive programming** - Always check if things exist
- **Try-catch blocks** - Around dynamic imports and API calls
- **Feature detection** - Check if functions exist before calling
- **User feedback** - Clear messages about what's available
- **Optional enhancements** - Core functionality never depends on optional libs

## Result

✅ **Framework works perfectly với hoặc không có web-vitals**
✅ **No breaking changes**
✅ **Better error messages**
✅ **Future-proof** - Supports new web-vitals versions
✅ **Developer experience** - Clear instructions when features unavailable

---

## Quick Fix Summary

**Before:**
```typescript
// ❌ Crashes if web-vitals not installed
import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals';
onFID(reportMetric);
```

**After:**
```typescript
// ✅ Gracefully handles missing library
const webVitals = await import('web-vitals').catch(() => null);
if (webVitals?.onFID) {
  webVitals.onFID(reportMetric);
}
```

---

**Status:** ✅ RESOLVED  
**Impact:** Zero - Framework works with or without web-vitals  
**Breaking Changes:** None  
**Documentation:** Updated  
**Tests:** All scenarios verified
