## API Usage Statistics Tab - Tenant Monitoring Dashboard

**Date**: 2026-01-16  
**Type**: Feature (New Tab + API)  
**Status**: ✅ COMPLETED  
**Priority**: 🟡 HIGH - Monitoring critical  

---

## 📋 SUMMARY

Added API Usage Statistics tab to Tenant Detail page for monitoring API consumption from `telemetry.api_usage_logs`.

**Solution**: Create API client + Statistics tab with 7 interactive charts.

---

## 🎯 FEATURES IMPLEMENTED

### 1. API Usage Logs API ✅

**New File**: `/api/apiUsageLogsApi.ts`

**Database**: `telemetry.api_usage_logs` (11 fields)
```typescript
_id, tenant_id, app_code, api_endpoint, api_method,
status_code, request_size, response_size, latency_ms,
api_key_id, created_at
```

**API Methods (18)**:
```typescript
// Basic CRUD (4)
getAll(filters?)
getById(id)
create(data)
delete(id)

// Query Methods (7)
getByTenant(tenantId, limit?)
getSuccessful(tenantId?)          // 2xx status codes
getFailed(tenantId?)              // 4xx, 5xx
getByEndpoint(endpoint, tenant?)
getByMethod(method, tenant?)
getByApiKey(apiKeyId)
getRecent(tenantId, hours)

// Analytics (4)
getStats(tenantId, hours?)        // Comprehensive stats
getTimeline(tenantId, hours)      // Hourly timeline
getLatencyPercentiles(tenantId)   // P50-P99

// Maintenance (2)
deleteOlderThan(tenantId, days)
countByTenant(tenantId)

// Utility (1)
formatBytes(bytes)                // Human readable
```

**Statistics Returned**:
```typescript
{
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate: number;
  avg_latency_ms: number;
  min_latency_ms: number;
  max_latency_ms: number;
  total_request_size: number;
  total_response_size: number;
  avg_request_size: number;
  avg_response_size: number;
  by_endpoint: Record<string, number>;
  by_method: Record<string, number>;
  by_status_code: Record<number, number>;
  by_app_code: Record<string, number>;
  top_endpoints: Array<{
    endpoint: string;
    count: number;
    avg_latency: number;
  }>;
  recent_requests: ApiUsageLog[];
}
```

### 2. Enhanced Tenant Detail Page ✅

**Updated**: `/pages/TenantDetailPage.tsx`

**New Tab Added**:
- ✅ **API Usage** - API consumption statistics

**Sidebar Location**: "CẤU HÌNH & TÍCH HỢP" group (after Applications)

### 3. API Usage Statistics Tab ✅

**New File**: `/components/tenants/TenantApiUsageTab.tsx`

**7 Interactive Charts** (using Recharts):

1. **Timeline Chart** (Line Chart)
   - Successful vs Failed requests over time
   - Hourly (24h) or Daily (7 days)
   - X-axis: Time, Y-axis: Request count

2. **Success Rate** (Pie Chart)
   - Successful vs Failed percentage
   - Visual breakdown

3. **HTTP Methods** (Bar Chart)
   - GET, POST, PUT, PATCH, DELETE distribution

4. **HTTP Status Codes** (Bar Chart)
   - Distribution: 200, 404, 500, etc.
   - Color-coded: Green (2xx), Orange (4xx), Red (5xx)

5. **Top 10 API Endpoints** (Horizontal Bar Chart)
   - Most called endpoints
   - Sorted by request count

6. **Latency Percentiles** (Bar Chart)
   - P50, P75, P90, P95, P99
   - Performance distribution

7. **Top Applications** (Bar Chart)
   - By app_code
   - Shows which apps use the API most

**5 Key Metrics Cards**:
- ✅ Successful requests (count + %)
- ✅ Failed requests (count + %)
- ✅ Average latency (+ min/max)
- ✅ Data volume (request + response sizes)
- ✅ Total requests

**Recent Requests Table**:
- ✅ Last 20 API requests
- ✅ Columns: Time, Endpoint, Method, Status, Latency, App
- ✅ Color-coded status codes

---

## 📊 VISUAL LAYOUT

```
┌─────────────────────────────────────────────────────────┐
│ Thống kê sử dụng API                    [24h] [Refresh]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                   │
│ │✓   │ │✗   │ │⏱  │ │📊  │ │Σ   │  ← Metrics         │
│ │9500│ │500 │ │250 │ │5MB │ │10K │                   │
│ └────┘ └────┘ └────┘ └────┘ └────┘                   │
│                                                          │
│ ┌──────────────────┐ ┌──────────────────┐             │
│ │   Timeline       │ │  Success Rate    │             │
│ │   Line Chart     │ │   Pie Chart      │             │
│ └──────────────────┘ └──────────────────┘             │
│                                                          │
│ ┌──────────────────┐ ┌──────────────────┐             │
│ │ HTTP Methods     │ │  Status Codes    │             │
│ │  Bar Chart       │ │   Bar Chart      │             │
│ └──────────────────┘ └──────────────────┘             │
│                                                          │
│ ┌──────────────────┐ ┌──────────────────┐             │
│ │ Top Endpoints    │ │ Latency P-tiles  │             │
│ │  H-Bar Chart     │ │   Bar Chart      │             │
│ └──────────────────┘ └──────────────────┘             │
│                                                          │
│ ┌──────────────────┐                                   │
│ │ Top Apps         │                                   │
│ │  Bar Chart       │                                   │
│ └──────────────────┘                                   │
│                                                          │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Recent Requests (Table)                         │   │
│ │ Time | Endpoint | Method | Status | Latency ... │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 USE CASES

### Monitor API Usage

```typescript
// Navigate to Tenant Detail → API Usage tab
// → View comprehensive statistics
// → 7 charts + 5 metrics + recent requests table
```

### Analyze Performance

```typescript
// Check latency percentiles:
//   P50: 180ms (median)
//   P90: 450ms (90% under this)
//   P99: 850ms (99% under this)
// → Identify performance issues
```

### Track Success Rate

```typescript
// Success rate: 95%
// Pie chart: 9500 success, 500 failed
// → Monitor API health
```

### Identify Popular Endpoints

```typescript
// Top 10 Endpoints chart:
//   /api/users: 3000 requests, 150ms avg
//   /api/orders: 2500 requests, 200ms avg
//   /api/products: 2000 requests, 120ms avg
// → Optimize high-traffic endpoints
```

### Monitor by Application

```typescript
// Top Applications:
//   mobile-app: 4000 requests
//   web-app: 3500 requests
//   admin-portal: 2500 requests
// → Track which apps use API most
```

### Debug Failures

```typescript
// Recent Requests table shows:
//   2026-01-16 10:30 | /api/users/123 | GET | 404 | 50ms | mobile-app
//   2026-01-16 10:25 | /api/orders | POST | 500 | 2500ms | web-app
// → Debug specific failures
```

### Analyze Trends

```typescript
// Timeline chart (24h):
//   Hour 10: 500 success, 10 failed
//   Hour 11: 450 success, 50 failed ← Spike!
//   Hour 12: 480 success, 5 failed
// → Identify usage patterns
```

### Monitor Data Volume

```typescript
// Data metrics:
//   Request size: ↑ 5.2 MB total, 520 B avg
//   Response size: ↓ 12.8 MB total, 1.3 KB avg
// → Track bandwidth usage
```

### Switch Time Periods

```typescript
// Period selector:
//   [24 giờ qua] ← Default
//   [7 ngày qua] ← Weekly view
// → Charts update automatically
```

---

## 📦 FILES

**New Files** (2):
- `/api/apiUsageLogsApi.ts` - API usage logs API (18 methods)
- `/components/tenants/TenantApiUsageTab.tsx` - Statistics tab

**Updated Files** (1):
- `/pages/TenantDetailPage.tsx` - Added API Usage tab

**Documentation**:
- `/docs/bugfix/2026-01-16-api-usage-statistics-tab.md`

---

## 🎨 DESIGN

**Colors**:
- Success: `#10b981` (Green)
- Failure: `#ef4444` (Red)
- Primary: `#6366f1` (Indigo)
- Secondary: `#8b5cf6` (Purple)
- Warning: `#f59e0b` (Orange)
- Info: `#3b82f6` (Blue)

**Charts Library**: Recharts (responsive, interactive)

**Metrics Cards**: 5 cards with icons and color-coding

**Table**: Scrollable, color-coded status, compact layout

---

## 🔧 TECHNICAL NOTES

### Database Schema

**Table**: `telemetry.api_usage_logs` (Note: Schema is `telemetry`, not `public`)

**Access**: Supabase client automatically handles schema prefix

**Performance**: Indexed on `tenant_id`, `created_at` for fast queries

### Data Aggregation

**Client-side**: All aggregation done in browser (no complex queries)

**Rationale**: 
- Simpler implementation
- Works with existing Supabase setup
- Good for moderate data volumes

**Future**: Can move to server-side aggregation for large datasets

### Formatters

**Bytes**: `formatBytes(bytes)` → "5.2 MB", "1.3 KB", etc.

**Percentages**: `.toFixed(1)` → "95.5%"

**Numbers**: `.toLocaleString()` → "10,000"

**Dates**: `.toLocaleString('vi-VN')` → Vietnamese format

---

## ✅ COMPLETION

**Status**: ✅ **PRODUCTION READY**

**Added**:
- ✅ Complete API usage logs API (18 methods)
- ✅ API Usage tab in tenant detail
- ✅ 7 interactive charts
- ✅ 5 key metrics cards
- ✅ Recent requests table (20 entries)
- ✅ Period selector (24h/7d)
- ✅ Refresh functionality
- ✅ Loading & empty states

**Charts Implemented**:
- ✅ Timeline (Line Chart)
- ✅ Success Rate (Pie Chart)
- ✅ HTTP Methods (Bar Chart)
- ✅ HTTP Status Codes (Bar Chart)
- ✅ Top Endpoints (Horizontal Bar Chart)
- ✅ Latency Percentiles (Bar Chart)
- ✅ Top Applications (Bar Chart)

---

## 🎉 CONCLUSION

**Impact**: 🟡 **HIGH - Monitoring Critical**

**Summary**: Complete API usage monitoring dashboard!

**Monitoring Features**:
- ✅ **Performance**: Latency tracking with percentiles (P50-P99)
- ✅ **Success Tracking**: Success rate, request counts
- ✅ **Endpoint Analytics**: Top endpoints with avg latency
- ✅ **Method Distribution**: GET, POST, PUT, etc.
- ✅ **Status Codes**: HTTP response code breakdown
- ✅ **Application Tracking**: Usage by app_code
- ✅ **Timeline**: Historical trends (hourly/daily)
- ✅ **Data Volume**: Request/response size tracking
- ✅ **Recent Activity**: Last 20 requests table

**User Benefits**:
- 📊 Visual analytics for API consumption
- 🔍 Easy debugging with request details
- 📈 Performance trends over time
- ⚡ Quick health assessment
- 🎯 Endpoint optimization insights
- 📱 Application usage tracking

**Result**: Professional API monitoring system for tenants! 🚀📊✨

---

**Implemented By**: AI Assistant  
**Date**: 2026-01-16  
**Type**: Feature  
**Impact**: Enterprise API monitoring now available! 🎊
