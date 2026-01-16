# Traffic Logs Module - Developer Documentation

## Overview

Traffic Logs module provides comprehensive HTTP traffic monitoring and analytics capabilities for the VHV Platform. This module tracks request/response metrics, performance data, and client information to support operational monitoring and business analytics.

## Architecture

### Module Structure
```
traffic-logs/
├── API Layer (trafficLogsApi.ts)
├── Components
│   ├── TrafficLogsTable
│   ├── StatusCodeBadge
│   ├── HttpMethodBadge
│   ├── TrafficLogFilters
│   └── TrafficLogStats
├── Pages
│   ├── TrafficLogsPage (List)
│   ├── TrafficLogDetailPage
│   ├── TrafficLogsAnalyticsPage
│   └── AddTrafficLogPage
└── Module Definition (index.tsx)
```

### Data Flow
```
User Action → Page Component → API Layer → Supabase → Database
                    ↓
            UI Update ← Response ← Data Processing
```

## Database Schema

### Table: `telemetry.traffic_logs`

```sql
CREATE TABLE telemetry.traffic_logs (
  _id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  app_code text,
  method text,
  domain text,
  path text,
  status_code smallint,
  latency_ms integer,
  request_size bigint DEFAULT 0,
  response_size bigint DEFAULT 0,
  ip_address inet,
  user_agent text,
  data_region text DEFAULT 'ap-southeast-1',
  timestamp timestamptz NOT NULL DEFAULT now()
);
```

### Indexes
- **Primary:** `_id` (UUID)
- **Performance:** `timestamp DESC`
- **Filtered:** tenant_id, user_id, app_code, method, status_code, data_region, latency_ms
- **Composite:** (tenant_id, timestamp), (app_code, timestamp)

### Field Descriptions

| Field | Type | Description | Nullable | Default |
|-------|------|-------------|----------|---------|
| _id | UUID | Unique identifier | No | auto |
| tenant_id | UUID | Associated tenant | Yes | null |
| user_id | UUID | Associated user | Yes | null |
| app_code | TEXT | Application identifier | Yes | null |
| method | TEXT | HTTP method (GET, POST, etc.) | Yes | null |
| domain | TEXT | Request domain | Yes | null |
| path | TEXT | Request path | Yes | null |
| status_code | SMALLINT | HTTP status code | Yes | null |
| latency_ms | INTEGER | Response time in milliseconds | Yes | null |
| request_size | BIGINT | Request body size in bytes | Yes | 0 |
| response_size | BIGINT | Response body size in bytes | Yes | 0 |
| ip_address | INET | Client IP address | Yes | null |
| user_agent | TEXT | Client user agent string | Yes | null |
| data_region | TEXT | Processing region | Yes | 'ap-southeast-1' |
| timestamp | TIMESTAMPTZ | Request timestamp | No | now() |

## API Reference

### TypeScript Interfaces

```typescript
interface TrafficLog {
  _id: string;
  tenant_id?: string | null;
  user_id?: string | null;
  app_code?: string | null;
  method?: string | null;
  domain?: string | null;
  path?: string | null;
  status_code?: number | null;
  latency_ms?: number | null;
  request_size?: number | null;
  response_size?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  data_region?: string | null;
  timestamp: string;
}

interface TrafficLogFilters {
  search?: string;
  method?: string;
  status_code?: number;
  app_code?: string;
  domain?: string;
  data_region?: string;
  tenant_id?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  min_latency?: number;
  max_latency?: number;
  limit?: number;
  offset?: number;
}

interface TrafficLogStats {
  total: number;
  byMethod: Record<string, number>;
  byStatus: Record<string, number>;
  byRegion: Record<string, number>;
  byApp: Record<string, number>;
  avgLatency: number;
  totalRequests: number;
  totalDataTransferred: number;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
  errorRate: number;
  successRate: number;
}
```

### API Functions

#### getTrafficLogs(filters?)
Fetch traffic logs with optional filtering.

```typescript
const logs = await getTrafficLogs({
  method: 'GET',
  status_code: 200,
  start_date: '2026-01-01T00:00:00Z',
  limit: 100
});
```

**Parameters:**
- `filters` (TrafficLogFilters) - Optional filter parameters

**Returns:** `Promise<TrafficLog[]>`

**Example Queries:**
```typescript
// Get all logs
const allLogs = await getTrafficLogs();

// Get logs for specific method
const getLogs = await getTrafficLogs({ method: 'GET' });

// Get error logs
const errors = await getTrafficLogs({ status_code: 500 });

// Get slow requests
const slowRequests = await getTrafficLogs({ min_latency: 1000 });

// Search by path
const apiLogs = await getTrafficLogs({ search: '/api/users' });
```

#### getTrafficLogById(id)
Get a single traffic log by ID.

```typescript
const log = await getTrafficLogById('uuid-here');
```

**Returns:** `Promise<TrafficLog | null>`

#### createTrafficLog(data)
Create a new traffic log entry.

```typescript
const newLog = await createTrafficLog({
  method: 'POST',
  path: '/api/v1/orders',
  status_code: 201,
  latency_ms: 150,
  request_size: 1024,
  response_size: 512
});
```

**Returns:** `Promise<TrafficLog>`

#### getTrafficStats(filters?)
Get comprehensive traffic statistics.

```typescript
const stats = await getTrafficStats({
  start_date: '2026-01-01T00:00:00Z',
  end_date: '2026-01-31T23:59:59Z'
});

console.log(stats.totalRequests); // 15234
console.log(stats.avgLatency); // 245ms
console.log(stats.successRate); // 98.5%
```

**Returns:** `Promise<TrafficLogStats>`

#### getTrafficTrend(days, filters?)
Get time-series trend data for charts.

```typescript
const trend = await getTrafficTrend(30, { app_code: 'web-app' });
// Returns: [{ date: '2026-01-01', count: 1523, avgLatency: 234 }, ...]
```

**Returns:** `Promise<Array<{ date: string; count: number; avgLatency: number }>>`

## Component Usage

### TrafficLogsTable

```tsx
import { TrafficLogsTable } from '@/components/traffic-logs/TrafficLogsTable';

<TrafficLogsTable
  logs={trafficLogs}
  loading={isLoading}
  onDelete={handleDelete}
/>
```

**Props:**
- `logs: TrafficLog[]` - Array of traffic logs
- `loading?: boolean` - Loading state
- `onDelete?: (id: string) => void` - Delete handler

### TrafficLogStats

```tsx
import { TrafficLogStats } from '@/components/traffic-logs/TrafficLogStats';

<TrafficLogStats
  stats={statistics}
  loading={isLoading}
/>
```

**Props:**
- `stats: TrafficLogStats` - Statistics object
- `loading?: boolean` - Loading state

### TrafficLogFilters

```tsx
import { TrafficLogFilters } from '@/components/traffic-logs/TrafficLogFilters';

<TrafficLogFilters
  filters={currentFilters}
  onFilterChange={setFilters}
  methods={['GET', 'POST', 'PUT']}
  appCodes={['web-app', 'mobile-app']}
  regions={['ap-southeast-1', 'us-east-1']}
/>
```

**Props:**
- `filters: TrafficLogFilters` - Current filters
- `onFilterChange: (filters) => void` - Filter change handler
- `methods?: string[]` - Available HTTP methods
- `appCodes?: string[]` - Available app codes
- `regions?: string[]` - Available regions

## Common Use Cases

### 1. Monitor Real-time Traffic

```typescript
// Setup polling for real-time updates
useEffect(() => {
  const interval = setInterval(async () => {
    const logs = await getTrafficLogs({ limit: 100 });
    setTrafficLogs(logs);
  }, 5000); // Poll every 5 seconds

  return () => clearInterval(interval);
}, []);
```

### 2. Analyze Performance

```typescript
// Get slow requests
const slowRequests = await getTrafficLogs({
  min_latency: 1000,
  start_date: startOfDay,
  end_date: endOfDay
});

// Calculate percentiles
const latencies = slowRequests.map(r => r.latency_ms).sort();
const p95 = latencies[Math.floor(latencies.length * 0.95)];
const p99 = latencies[Math.floor(latencies.length * 0.99)];
```

### 3. Track Error Rates

```typescript
// Get error statistics
const stats = await getTrafficStats({ tenant_id: currentTenant });

if (stats.errorRate > 5) {
  // Alert: Error rate too high
  sendAlert(`Error rate is ${stats.errorRate}%`);
}
```

### 4. Regional Analysis

```typescript
// Compare regions
const stats = await getTrafficStats();

Object.entries(stats.byRegion).forEach(([region, count]) => {
  console.log(`${region}: ${count} requests`);
});
```

### 5. Export Reports

```typescript
// Export to CSV
const logs = await getTrafficLogs({ start_date, end_date });
const csv = convertToCSV(logs);
downloadFile(csv, 'traffic-report.csv');
```

## Performance Optimization

### Query Optimization

```typescript
// Use indexes effectively
const logs = await getTrafficLogs({
  tenant_id: 'uuid', // Uses index
  start_date: '2026-01-01', // Uses index
  limit: 100 // Limit results
});

// Avoid full table scans
// ❌ Bad: No filters
const allLogs = await getTrafficLogs();

// ✅ Good: With filters
const recentLogs = await getTrafficLogs({
  start_date: lastWeek,
  limit: 1000
});
```

### Pagination

```typescript
const PAGE_SIZE = 100;

// Page 1
const page1 = await getTrafficLogs({ limit: PAGE_SIZE, offset: 0 });

// Page 2
const page2 = await getTrafficLogs({ limit: PAGE_SIZE, offset: PAGE_SIZE });
```

### Caching

```typescript
// Cache statistics
const CACHE_TTL = 60000; // 1 minute
let cachedStats: TrafficLogStats | null = null;
let lastFetch = 0;

async function getCachedStats() {
  if (cachedStats && Date.now() - lastFetch < CACHE_TTL) {
    return cachedStats;
  }
  
  cachedStats = await getTrafficStats();
  lastFetch = Date.now();
  return cachedStats;
}
```

## Golang Migration Guide

### Current Supabase Implementation

```typescript
// frontend/api/trafficLogsApi.ts
export const getTrafficLogs = async (filters) => {
  const { data, error } = await supabase
    .from('traffic_logs')
    .select('*')
    .order('timestamp', { ascending: false });
  return data;
};
```

### Future Golang API

```typescript
// frontend/api/trafficLogsApi.ts
export const getTrafficLogs = async (filters) => {
  const response = await fetch('/api/v1/traffic-logs', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  });
  return response.json();
};
```

### Golang Handler (Example)

```go
// golang-api/handlers/traffic_logs_handler.go
package handlers

import (
    "encoding/json"
    "net/http"
)

func GetTrafficLogs(w http.ResponseWriter, r *http.Request) {
    var filters TrafficLogFilters
    json.NewDecoder(r.Body).Decode(&filters)
    
    logs, err := trafficLogsService.GetLogs(filters)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    json.NewEncoder(w).Encode(logs)
}
```

## Best Practices

### 1. Data Retention
```sql
-- Schedule cleanup job
SELECT cron.schedule(
  'cleanup-traffic-logs',
  '0 2 * * *', -- Daily at 2 AM
  $$SELECT telemetry.cleanup_old_traffic_logs(90)$$
);
```

### 2. Privacy Compliance
```typescript
// Sanitize IP addresses
const sanitizeIP = (ip: string) => {
  const parts = ip.split('.');
  return `${parts[0]}.${parts[1]}.XXX.XXX`;
};

// Truncate user agents
const truncateUserAgent = (ua: string) => {
  return ua.substring(0, 100);
};
```

### 3. Error Handling
```typescript
try {
  const logs = await getTrafficLogs(filters);
  setLogs(logs);
} catch (error) {
  console.error('Failed to fetch traffic logs:', error);
  toast.error(t('trafficLogs.fetchError'));
  // Fallback to cached data
  setLogs(cachedLogs);
}
```

### 4. Loading States
```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  const load = async () => {
    setLoading(true);
    try {
      const data = await getTrafficLogs();
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };
  load();
}, [filters]);
```

## Troubleshooting

### Issue: Slow Queries
**Solution:** Add appropriate indexes and use filters

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM telemetry.traffic_logs
WHERE tenant_id = 'uuid'
AND timestamp > NOW() - INTERVAL '7 days';
```

### Issue: High Storage Usage
**Solution:** Implement data retention policy

```sql
-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('telemetry.traffic_logs'));

-- Run cleanup
SELECT telemetry.cleanup_old_traffic_logs(30);
```

### Issue: Missing Logs
**Solution:** Check RLS policies and permissions

```sql
-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'traffic_logs';

-- Grant permissions
GRANT ALL ON telemetry.traffic_logs TO authenticated;
```

## Conclusion

Traffic Logs module provides a robust foundation for HTTP traffic monitoring and analytics. Follow this documentation for implementation details, API usage, and best practices.

For additional support, refer to:
- Database Schema: `/supabase/migrations/027_create_traffic_logs_table.sql`
- Implementation: `/docs/FINAL-2026-01-15-traffic-logs-complete.md`
- API Code: `/api/trafficLogsApi.ts`

---

**Last Updated:** 2026-01-15  
**Version:** 1.0.0  
**Status:** Production Ready ✅
