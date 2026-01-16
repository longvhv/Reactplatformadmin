# API Usage Logs Module

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Module ID:** api-usage-logs  
**Route:** `/core/api-usage-logs`

## Overview

Module **API Usage Logs** (Thống kê sử dụng API) cung cấp hệ thống giám sát và phân tích telemetry cho việc sử dụng API. Module này cho phép tracking toàn diện các API requests, phân tích performance, và cung cấp insights về usage patterns.

## Features

### Core Features
- ✅ **API Request Tracking**: Ghi lại mọi API request với đầy đủ metadata
- ✅ **Performance Analytics**: Phân tích latency, throughput, và error rates
- ✅ **Usage Statistics**: Thống kê chi tiết theo method, endpoint, status code
- ✅ **Timeline Analysis**: Visualize request trends theo thời gian
- ✅ **Top Endpoints**: Xác định các endpoint được sử dụng nhiều nhất
- ✅ **Multi-tenant Support**: Tách biệt dữ liệu theo tenant
- ✅ **Configurable Settings**: Cấu hình retention, alerts, và data collection

### Advanced Features
- ✅ **Real-time Monitoring**: Theo dõi API usage real-time
- ✅ **Error Tracking**: Phát hiện và phân tích lỗi
- ✅ **Latency Alerts**: Cảnh báo khi latency vượt ngưỡng
- ✅ **Data Export**: Xuất logs dưới dạng CSV
- ✅ **Flexible Filtering**: Lọc theo tenant, app, method, status, date range

## Architecture

### Database Schema

```sql
TABLE: telemetry.api_usage_logs
- _id (UUID, PK)                 -- Primary key
- tenant_id (UUID)               -- Tenant context
- app_code (TEXT)                -- Application identifier
- api_endpoint (TEXT)            -- API endpoint path
- api_method (TEXT)              -- HTTP method (GET, POST, etc.)
- status_code (SMALLINT)         -- HTTP status code
- request_size (BIGINT)          -- Request payload size
- response_size (BIGINT)         -- Response payload size
- latency_ms (INTEGER)           -- Processing time
- api_key_id (UUID)              -- API key used
- created_at (TIMESTAMPTZ)       -- Log timestamp
```

### File Structure

```
/services/apiUsageLogsService.ts          # API layer service (351 lines)
/components/api-usage-logs/
  ├── ApiUsageLogsList.tsx                # List component (377 lines)
  ├── ApiUsageLogDetail.tsx               # Detail view component (215 lines)
  ├── ApiUsageLogsAnalytics.tsx           # Analytics dashboard (336 lines)
  └── ApiUsageLogsSettings.tsx            # Settings panel (273 lines)
/pages/core/api-usage-logs/
  ├── index.tsx                           # Main list page (76 lines)
  ├── [id].tsx                            # Detail page (135 lines)
  ├── analytics.tsx                       # Analytics page (90 lines)
  └── settings.tsx                        # Settings page (41 lines)
/modules/api-usage-logs/
  └── index.tsx                           # Module definition (75 lines)
```

**Total:** 9 files, ~1,969 lines of production-ready code

### Tech Stack

- **Frontend**: React + TypeScript
- **Routing**: React Router v7
- **State**: React Hooks
- **Charts**: Recharts (Timeline, Pie, Bar charts)
- **Icons**: Lucide React
- **Database**: Supabase PostgreSQL
- **i18n**: 6 languages (EN, VI, ES, JA, KO, ZH)

## API Service Layer

### Service Methods

```typescript
// Get all logs with filters
getAll(filters?: ApiUsageLogFilters): Promise<ApiUsageLog[]>

// Get single log by ID
getById(id: string): Promise<ApiUsageLog | null>

// Create new log entry
create(log: Omit<ApiUsageLog, '_id' | 'created_at'>): Promise<ApiUsageLog>

// Update existing log
update(id: string, log: Partial<ApiUsageLog>): Promise<ApiUsageLog>

// Delete log
delete(id: string): Promise<void>

// Get statistics
getStats(filters?: ApiUsageLogFilters): Promise<ApiUsageStats>

// Get timeline data
getTimeline(
  filters?: ApiUsageLogFilters, 
  groupBy: 'hour' | 'day' | 'week' | 'month'
): Promise<TimelineData[]>
```

### Ready for Golang Migration

Service methods được thiết kế sẵn sàng migrate sang Golang microservices:

```
GET    /api/v1/telemetry/api-usage-logs           -> getAll()
GET    /api/v1/telemetry/api-usage-logs/:id       -> getById()
POST   /api/v1/telemetry/api-usage-logs           -> create()
PUT    /api/v1/telemetry/api-usage-logs/:id       -> update()
DELETE /api/v1/telemetry/api-usage-logs/:id       -> delete()
GET    /api/v1/telemetry/api-usage-logs/stats     -> getStats()
GET    /api/v1/telemetry/api-usage-logs/timeline  -> getTimeline()
```

## Components

### 1. ApiUsageLogsList

**Purpose**: Display và filter API usage logs

**Features**:
- Search by endpoint, app code, method
- Filter by method, status code, app code
- Export to CSV
- Pagination and sorting
- Real-time refresh
- Color-coded status badges
- Method badges (GET, POST, PUT, DELETE, etc.)

**Props**:
```typescript
interface ApiUsageLogsListProps {
  onSelectLog?: (log: ApiUsageLog) => void;
  initialFilters?: ApiUsageLogFilters;
}
```

### 2. ApiUsageLogDetail

**Purpose**: Chi tiết một API log entry

**Sections**:
- Request overview (method, endpoint, status)
- Performance metrics (latency, request/response sizes)
- Request details (app code, API key, tenant)
- Timestamp information

**Props**:
```typescript
interface ApiUsageLogDetailProps {
  log: ApiUsageLog;
}
```

### 3. ApiUsageLogsAnalytics

**Purpose**: Analytics dashboard với charts và statistics

**Metrics**:
- Total requests
- Success rate / Error rate
- Average latency
- Total data transferred
- Requests by HTTP method (Pie chart)
- Requests by status code (Bar chart)
- Timeline chart (Line chart)
- Top 10 endpoints

**Features**:
- Time range selector (hour/day/week/month)
- Interactive charts
- Real-time data updates

**Props**:
```typescript
interface ApiUsageLogsAnalyticsProps {
  filters?: ApiUsageLogFilters;
}
```

### 4. ApiUsageLogsSettings

**Purpose**: Cấu hình logging behavior

**Settings Categories**:

1. **General Settings**:
   - Enable/disable logging
   - Data retention period (days)

2. **Data Collection**:
   - Log request bodies
   - Log response bodies
   - Enable analytics processing

3. **Alerts & Notifications**:
   - Alert on error threshold
   - Error rate threshold (%)
   - Latency alert threshold (ms)

## Pages

### 1. List Page (`/core/api-usage-logs`)
- Main list view với tabs
- Quick actions: Analytics, Settings
- Full-featured table với search và filters

### 2. Detail Page (`/core/api-usage-logs/:id`)
- Comprehensive log details
- Delete functionality
- Navigation back to list

### 3. Analytics Page (`/core/api-usage-logs/analytics`)
- Full analytics dashboard
- Date range selector (7d, 30d, 90d, all)
- Export analytics report

### 4. Settings Page (`/core/api-usage-logs/settings`)
- Configuration panel
- Real-time settings updates
- Save confirmation feedback

## Routing

```typescript
routes: [
  '/core/api-usage-logs'           // List page
  '/core/api-usage-logs/analytics' // Analytics (must be before :id)
  '/core/api-usage-logs/settings'  // Settings (must be before :id)
  '/core/api-usage-logs/:id'       // Detail page
]
```

**⚠️ Route Order Important**: Specific routes (analytics, settings) phải đứng trước dynamic route (:id).

## i18n Support

### Supported Languages
- 🇬🇧 English (en)
- 🇻🇳 Tiếng Việt (vi)
- 🇪🇸 Español (es)
- 🇯🇵 日本語 (ja)
- 🇰🇷 한국어 (ko)
- 🇨🇳 中文 (zh)

### Translation Keys

```typescript
apiUsageLogs: {
  menu, title, description,
  allLogs, analytics, detail, settings,
  method, endpoint, status, latency,
  requestSize, responseSize, appCode,
  stats: { totalRequests, avgLatency, ... },
  // ... và 40+ keys khác
}
```

## Database

### Indexes

8 indexes được tạo để optimize performance:

1. `idx_api_usage_logs_tenant_id` - Tenant queries
2. `idx_api_usage_logs_app_code` - App filtering
3. `idx_api_usage_logs_endpoint` - Endpoint search
4. `idx_api_usage_logs_method` - Method filtering
5. `idx_api_usage_logs_status` - Status code analysis
6. `idx_api_usage_logs_created_at` - Time-based queries
7. `idx_api_usage_logs_analytics` - Composite for analytics
8. `idx_api_usage_logs_api_key` - API key tracking

### Row Level Security (RLS)

3 policies implemented:

1. **service_role_policy**: Full access for service role
2. **tenant_read_policy**: Users can view their tenant's data
3. **tenant_insert_policy**: Users can insert for their tenant

### PostgreSQL Functions

3 helper functions:

1. `get_api_usage_stats()` - Calculate statistics
2. `get_top_api_endpoints()` - Get top endpoints
3. `cleanup_old_api_logs()` - Data retention cleanup

## Usage Examples

### Basic Usage

```typescript
import { apiUsageLogsService } from './services/apiUsageLogsService';

// Get all logs
const logs = await apiUsageLogsService.getAll();

// Get with filters
const filtered = await apiUsageLogsService.getAll({
  api_method: 'POST',
  status_code: 200,
  date_from: '2026-01-01',
});

// Get statistics
const stats = await apiUsageLogsService.getStats({
  tenant_id: 'xxx-yyy-zzz',
  date_from: '2026-01-01',
});

// Get timeline
const timeline = await apiUsageLogsService.getTimeline(
  { tenant_id: 'xxx-yyy-zzz' },
  'day'
);
```

### Log API Request (Example)

```typescript
// Log an API request
const log = await apiUsageLogsService.create({
  tenant_id: currentTenantId,
  app_code: 'my-app',
  api_endpoint: '/api/v1/users',
  api_method: 'GET',
  status_code: 200,
  request_size: 1024,
  response_size: 4096,
  latency_ms: 125,
  api_key_id: apiKeyId,
});
```

## Performance Considerations

### Optimization Strategies

1. **Indexing**: 8 strategic indexes cho common queries
2. **Partitioning**: Optional partitioning by date for high volume
3. **Data Retention**: Automatic cleanup function
4. **Lazy Loading**: Components lazy-loaded via React.lazy()
5. **Pagination**: Client-side pagination cho large datasets

### Scalability

- **Storage**: Estimated ~200 bytes per log entry
- **Volume**: Designed for millions of logs
- **Partitioning**: Ready for date-based partitioning
- **Cleanup**: Automated retention policy

## Security

### Data Protection

- ✅ Row Level Security enabled
- ✅ Tenant isolation
- ✅ Authentication required
- ✅ Service role for admin operations
- ⚠️ Request/Response bodies optional (privacy concern)

### Best Practices

1. Don't log sensitive data in request/response bodies
2. Use appropriate retention periods
3. Regularly review error patterns
4. Monitor storage usage
5. Set up alerts for anomalies

## Integration Guide

### Adding to Existing App

1. **Import module** in `/core/moduleRegistration.tsx`:
```typescript
import { ApiUsageLogsModule } from '../modules/api-usage-logs/index';
registry.register(ApiUsageLogsModule);
```

2. **Run migration**: Execute `/docs/migrations/036_api_usage_logs.sql`

3. **Configure**: Access settings at `/core/api-usage-logs/settings`

### Logging API Calls

Integrate vào Golang API middleware:

```go
// Pseudo-code
func apiLoggingMiddleware(next http.Handler) http.Handler {
  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    start := time.Now()
    
    // Capture request
    requestSize := r.ContentLength
    
    // Process request
    recorder := &responseRecorder{ResponseWriter: w}
    next.ServeHTTP(recorder, r)
    
    // Log to database
    logEntry := ApiUsageLog{
      TenantID: getTenantID(r),
      AppCode: getAppCode(r),
      Endpoint: r.URL.Path,
      Method: r.Method,
      StatusCode: recorder.statusCode,
      RequestSize: requestSize,
      ResponseSize: recorder.size,
      LatencyMs: time.Since(start).Milliseconds(),
      ApiKeyID: getApiKeyID(r),
    }
    
    db.Create(&logEntry)
  })
}
```

## Testing

### Manual Testing Checklist

- [ ] List page loads correctly
- [ ] Search and filters work
- [ ] Detail page shows complete information
- [ ] Analytics charts render properly
- [ ] Settings can be updated
- [ ] Export to CSV works
- [ ] Multi-tenant filtering works
- [ ] RLS policies enforced
- [ ] i18n translations complete

### Test Data

```sql
-- Insert test data
INSERT INTO telemetry.api_usage_logs 
  (tenant_id, app_code, api_endpoint, api_method, status_code, latency_ms)
VALUES
  ('test-tenant-id', 'test-app', '/api/v1/users', 'GET', 200, 125),
  ('test-tenant-id', 'test-app', '/api/v1/products', 'POST', 201, 250),
  ('test-tenant-id', 'test-app', '/api/v1/orders', 'GET', 404, 50);
```

## Troubleshooting

### Common Issues

**Issue**: Logs not appearing
- **Check**: RLS policies, tenant_id matches user's tenants

**Issue**: Charts not rendering
- **Check**: Browser console for errors, recharts library loaded

**Issue**: Slow performance
- **Solution**: Check indexes, consider partitioning

**Issue**: Storage growing too fast
- **Solution**: Adjust retention period, disable body logging

## Changelog

### Version 1.0.0 (2026-01-15)
- ✅ Initial release
- ✅ Complete CRUD operations
- ✅ Analytics dashboard
- ✅ Settings panel
- ✅ 6-language i18n support
- ✅ Database migration script
- ✅ Full documentation

## Future Enhancements

### Planned Features (v1.1.0)
- [ ] Real-time streaming dashboard
- [ ] Anomaly detection
- [ ] Custom alert rules
- [ ] API usage quotas and throttling
- [ ] Advanced filtering (regex, wildcards)
- [ ] Scheduled reports
- [ ] Webhook notifications
- [ ] Cost analysis per endpoint

### Potential Improvements
- [ ] GraphQL support
- [ ] Machine learning insights
- [ ] Comparative analytics
- [ ] API documentation integration
- [ ] Rate limit recommendations

## Dependencies

### NPM Packages
- `react` ^18.3.1
- `react-router` ^7.1.3
- `react-i18next` ^15.2.0
- `recharts` ^2.15.0
- `lucide-react` ^0.469.0
- `@supabase/supabase-js` latest

### Database
- PostgreSQL 14+ (via Supabase)
- UUID extension
- Timestamp with timezone support

## Support

### Documentation
- Module docs: `/docs/modules/API_USAGE_LOGS.md`
- Migration: `/docs/migrations/036_api_usage_logs.sql`
- API docs: Inline JSDoc comments

### Contact
- Module ID: `api-usage-logs`
- Version: `1.0.0`
- Status: Production Ready ✅

---

**Module #36** - API Usage Logs  
Last updated: 2026-01-15  
Maintained by: VHV Platform Team
