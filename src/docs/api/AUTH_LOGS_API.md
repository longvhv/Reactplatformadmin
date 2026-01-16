# Auth Logs API Reference
**Module:** Auth Logs  
**Last Updated:** 2026-01-15  
**Status:** Production-ready ✅

## Overview

Auth Logs module provides comprehensive authentication and access logging with 100% database schema compliance.

## Table of Contents
- [Interfaces](#interfaces)
- [API Methods](#api-methods)
- [Helper Functions](#helper-functions)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Interfaces

### AuthLog

Main interface representing an auth log entry.

```typescript
interface AuthLog {
  _id: string;
  user_id?: string | null;
  tenant_id?: string | null;
  action: string;
  status: string;
  ip_address?: string | null;
  user_agent?: string | null;
  browser?: string | null;
  os?: string | null;
  device_type?: string | null;
  location?: string | null;
  country_code?: string | null;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}
```

**Fields:**
- `_id` - UUID primary key
- `user_id` - User UUID (nullable for failed login attempts)
- `tenant_id` - Tenant UUID (nullable)
- `action` - Action type: 'login', 'logout', 'login_failed', 'password_reset', 'signup', 'token_refresh', etc.
- `status` - Status: 'success', 'failed', 'blocked'
- `ip_address` - Client IP address
- `user_agent` - Full user agent string
- `browser` - Browser name and version (e.g., 'Chrome 120')
- `os` - Operating system (e.g., 'Windows 11')
- `device_type` - Device type: 'desktop', 'mobile', 'tablet', 'other'
- `location` - Geographic location (e.g., 'Ho Chi Minh City, Vietnam')
- `country_code` - ISO country code (e.g., 'VN')
- `error_message` - Error message for failed attempts
- `metadata` - Additional metadata as JSON
- `created_at` - Timestamp (ISO 8601)

### CreateAuthLogRequest

Interface for creating new auth logs.

```typescript
interface CreateAuthLogRequest {
  user_id?: string | null;
  tenant_id?: string | null;
  action: string;
  status: string;
  ip_address?: string | null;
  user_agent?: string | null;
  browser?: string | null;
  os?: string | null;
  device_type?: string | null;
  location?: string | null;
  country_code?: string | null;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
}
```

### AuthLogFilters

Interface for filtering auth logs.

```typescript
interface AuthLogFilters extends BaseFilters {
  user_id?: string;
  tenant_id?: string;
  action?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}
```

### AuthLogStats

Interface for auth log statistics.

```typescript
interface AuthLogStats {
  total_logs: number;
  successful_logins: number;
  failed_logins: number;
  blocked_attempts: number;
  unique_users: number;
  by_action: Record<string, number>;
  by_status: Record<string, number>;
  recent_failures: number;
}
```

---

## API Methods

### authLogsApi.getAll()

Get all auth logs with optional filters.

```typescript
async function getAll(filters?: AuthLogFilters): Promise<AuthLog[]>
```

**Parameters:**
- `filters` - Optional filters object

**Returns:** Array of auth logs

**Example:**
```typescript
import { authLogsApi } from '../api/authLogsApi';

// Get all logs
const allLogs = await authLogsApi.getAll();

// Get logs with filters
const userLogs = await authLogsApi.getAll({
  user_id: 'user-uuid',
  status: 'success',
  limit: 50
});

// Get failed login attempts
const failedLogins = await authLogsApi.getAll({
  action: 'login_failed',
  date_from: '2026-01-01',
  date_to: '2026-01-15'
});
```

### authLogsApi.getById()

Get a specific auth log by ID.

```typescript
async function getById(id: string): Promise<AuthLog>
```

**Parameters:**
- `id` - Auth log UUID

**Returns:** Auth log object

**Example:**
```typescript
const log = await authLogsApi.getById('log-uuid');
console.log(log.action, log.status);
```

### authLogsApi.create()

Create a new auth log entry.

```typescript
async function create(data: CreateAuthLogRequest): Promise<AuthLog>
```

**Parameters:**
- `data` - Auth log data

**Returns:** Created auth log

**Example:**
```typescript
const newLog = await authLogsApi.create({
  user_id: 'user-uuid',
  tenant_id: 'tenant-uuid',
  action: 'login',
  status: 'success',
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...',
  browser: 'Chrome 120',
  os: 'Windows 11',
  device_type: 'desktop',
  location: 'Ho Chi Minh City, Vietnam',
  country_code: 'VN'
});
```

### authLogsApi.getStats()

Get statistics about auth logs.

```typescript
async function getStats(filters?: AuthLogFilters): Promise<AuthLogStats>
```

**Parameters:**
- `filters` - Optional filters to apply before calculating stats

**Returns:** Statistics object

**Example:**
```typescript
// Get overall stats
const stats = await authLogsApi.getStats();
console.log('Total logs:', stats.total_logs);
console.log('Success rate:', stats.successful_logins / stats.total_logs);

// Get stats for specific user
const userStats = await authLogsApi.getStats({
  user_id: 'user-uuid'
});

// Get stats for date range
const weekStats = await authLogsApi.getStats({
  date_from: '2026-01-08',
  date_to: '2026-01-15'
});
```

---

## Helper Functions

### Status Checkers

#### isSuccessfulLog()
```typescript
function isSuccessfulLog(log: AuthLog): boolean
```
Check if auth log represents a successful action.

**Example:**
```typescript
if (isSuccessfulLog(log)) {
  console.log('Action succeeded');
}
```

#### isFailedLog()
```typescript
function isFailedLog(log: AuthLog): boolean
```
Check if auth log represents a failed action.

**Example:**
```typescript
if (isFailedLog(log)) {
  console.error('Action failed:', log.error_message);
}
```

#### isBlockedLog()
```typescript
function isBlockedLog(log: AuthLog): boolean
```
Check if auth log represents a blocked action.

**Example:**
```typescript
if (isBlockedLog(log)) {
  console.warn('Action was blocked');
}
```

### Action Helpers

#### isLoginAction()
```typescript
function isLoginAction(action: string): boolean
```
Check if action is login-related ('login' or 'login_failed').

**Example:**
```typescript
if (isLoginAction(log.action)) {
  console.log('This is a login attempt');
}
```

#### getActionDisplayName()
```typescript
function getActionDisplayName(action: string): string
```
Get user-friendly display name for action (Vietnamese).

**Returns:** Vietnamese display name

**Example:**
```typescript
const displayName = getActionDisplayName('login');
// Returns: "Đăng nhập"

const displayName = getActionDisplayName('password_reset');
// Returns: "Đặt lại mật khẩu"
```

#### getStatusDisplayName()
```typescript
function getStatusDisplayName(status: string): string
```
Get user-friendly display name for status (Vietnamese).

**Returns:** Vietnamese display name

**Example:**
```typescript
const displayName = getStatusDisplayName('success');
// Returns: "Thành công"

const displayName = getStatusDisplayName('failed');
// Returns: "Thất bại"
```

### Filtering Helpers

#### filterLogsByDateRange()
```typescript
function filterLogsByDateRange(
  logs: AuthLog[],
  startDate: Date,
  endDate: Date
): AuthLog[]
```
Filter logs by date range.

**Example:**
```typescript
const startDate = new Date('2026-01-01');
const endDate = new Date('2026-01-15');
const filtered = filterLogsByDateRange(logs, startDate, endDate);
```

#### getLogsByUser()
```typescript
function getLogsByUser(logs: AuthLog[], userId: string): AuthLog[]
```
Get all logs for a specific user.

**Example:**
```typescript
const userLogs = getLogsByUser(allLogs, 'user-uuid');
console.log(`User has ${userLogs.length} log entries`);
```

#### getLogsByTenant()
```typescript
function getLogsByTenant(logs: AuthLog[], tenantId: string): AuthLog[]
```
Get all logs for a specific tenant.

**Example:**
```typescript
const tenantLogs = getLogsByTenant(allLogs, 'tenant-uuid');
```

#### getRecentFailedAttempts()
```typescript
function getRecentFailedAttempts(
  logs: AuthLog[],
  limit: number = 10
): AuthLog[]
```
Get recent failed or blocked login attempts, sorted by date descending.

**Parameters:**
- `logs` - Array of auth logs
- `limit` - Maximum number of results (default: 10)

**Returns:** Array of recent failed attempts

**Example:**
```typescript
const recentFailed = getRecentFailedAttempts(logs, 5);
recentFailed.forEach(log => {
  console.log(`Failed attempt from ${log.ip_address} at ${log.created_at}`);
});
```

---

## Usage Examples

### Example 1: Track User Login
```typescript
import { authLogsApi } from '../api/authLogsApi';

async function trackUserLogin(userId: string, tenantId: string, success: boolean) {
  const log = await authLogsApi.create({
    user_id: userId,
    tenant_id: tenantId,
    action: success ? 'login' : 'login_failed',
    status: success ? 'success' : 'failed',
    ip_address: getClientIP(),
    user_agent: navigator.userAgent,
    browser: detectBrowser(),
    os: detectOS(),
    device_type: detectDeviceType(),
    location: await getGeoLocation(),
    country_code: await getCountryCode(),
    error_message: success ? null : 'Invalid credentials'
  });
  
  return log;
}
```

### Example 2: Security Dashboard
```typescript
import { authLogsApi, isFailedLog } from '../api/authLogsApi';

async function getSecurityOverview() {
  const logs = await authLogsApi.getAll({
    date_from: getLastWeekDate(),
    limit: 1000
  });
  
  const stats = await authLogsApi.getStats({
    date_from: getLastWeekDate()
  });
  
  // Get suspicious activity
  const failedAttempts = logs.filter(isFailedLog);
  const suspiciousIPs = findRepeatedFailures(failedAttempts);
  
  return {
    totalAttempts: stats.total_logs,
    successRate: (stats.successful_logins / stats.total_logs * 100).toFixed(2),
    failedAttempts: stats.failed_logins,
    blockedAttempts: stats.blocked_attempts,
    suspiciousIPs,
    byAction: stats.by_action,
    byStatus: stats.by_status
  };
}
```

### Example 3: User Activity Timeline
```typescript
import { authLogsApi, getLogsByUser, getActionDisplayName } from '../api/authLogsApi';

async function getUserActivityTimeline(userId: string) {
  const allLogs = await authLogsApi.getAll({
    user_id: userId,
    limit: 100
  });
  
  return allLogs.map(log => ({
    id: log._id,
    timestamp: log.created_at,
    action: getActionDisplayName(log.action),
    status: log.status,
    location: log.location || 'Unknown',
    device: `${log.browser} on ${log.os}`,
    ipAddress: log.ip_address
  }));
}
```

### Example 4: Failed Login Alert System
```typescript
import { 
  authLogsApi, 
  getRecentFailedAttempts,
  isFailedLog 
} from '../api/authLogsApi';

async function checkFailedLoginAlerts() {
  const recentLogs = await authLogsApi.getAll({
    date_from: getLastHourDate(),
    action: 'login_failed'
  });
  
  // Group by IP
  const byIP = recentLogs.reduce((acc, log) => {
    const ip = log.ip_address || 'unknown';
    acc[ip] = (acc[ip] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Alert if more than 5 attempts from same IP
  const alerts = Object.entries(byIP)
    .filter(([_, count]) => count > 5)
    .map(([ip, count]) => ({
      ip,
      count,
      message: `Possible brute force attack from ${ip}: ${count} failed attempts`
    }));
  
  return alerts;
}
```

### Example 5: Audit Report
```typescript
import { authLogsApi } from '../api/authLogsApi';

async function generateAuditReport(tenantId: string, startDate: Date, endDate: Date) {
  const logs = await authLogsApi.getAll({
    tenant_id: tenantId,
    date_from: startDate.toISOString(),
    date_to: endDate.toISOString()
  });
  
  const stats = await authLogsApi.getStats({
    tenant_id: tenantId,
    date_from: startDate.toISOString(),
    date_to: endDate.toISOString()
  });
  
  return {
    period: { start: startDate, end: endDate },
    summary: {
      totalEvents: stats.total_logs,
      uniqueUsers: stats.unique_users,
      successRate: (stats.successful_logins / stats.total_logs * 100).toFixed(2) + '%'
    },
    breakdown: {
      byAction: stats.by_action,
      byStatus: stats.by_status
    },
    recentFailures: logs.filter(log => log.status === 'failed').slice(0, 20),
    topUsers: getTopUsers(logs),
    topLocations: getTopLocations(logs)
  };
}
```

---

## Best Practices

### 1. Always Log Auth Events
```typescript
// ✅ GOOD: Log all authentication events
await authLogsApi.create({
  user_id: userId,
  action: 'login',
  status: 'success',
  // ... other fields
});

// ❌ BAD: Don't skip logging
// (No logging at all)
```

### 2. Include Context Information
```typescript
// ✅ GOOD: Include all available context
await authLogsApi.create({
  user_id: userId,
  tenant_id: tenantId,
  action: 'login',
  status: 'success',
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
  browser: detectBrowser(),
  os: detectOS(),
  device_type: detectDeviceType(),
  location: await getLocation(req.ip),
  country_code: await getCountryCode(req.ip)
});

// ❌ BAD: Minimal information
await authLogsApi.create({
  user_id: userId,
  action: 'login',
  status: 'success'
});
```

### 3. Use Helper Functions
```typescript
// ✅ GOOD: Use helper functions
if (isSuccessfulLog(log) && isLoginAction(log.action)) {
  updateLastLogin(log.user_id);
}

// ❌ BAD: Direct property checks
if (log.status === 'success' && (log.action === 'login' || log.action === 'login_failed')) {
  updateLastLogin(log.user_id);
}
```

### 4. Handle Nullable Fields
```typescript
// ✅ GOOD: Check for null
const userId = log.user_id ?? 'anonymous';
const location = log.location || 'Unknown';

// ❌ BAD: Assume always present
const userId = log.user_id;  // May be null for failed logins
```

### 5. Use Filters for Performance
```typescript
// ✅ GOOD: Filter on server side
const logs = await authLogsApi.getAll({
  user_id: userId,
  date_from: '2026-01-01',
  limit: 50
});

// ❌ BAD: Fetch all then filter client side
const allLogs = await authLogsApi.getAll();
const userLogs = allLogs.filter(log => log.user_id === userId);
```

### 6. Monitor Failed Attempts
```typescript
// ✅ GOOD: Track and alert on suspicious activity
const recentFailed = await getRecentFailedAttempts(logs, 10);
if (recentFailed.length > 5) {
  sendSecurityAlert('Multiple failed login attempts detected');
}
```

---

## See Also

- [Migration Guide](../bugfix/MIGRATION-GUIDE-auth-logs-2026-01-15.md)
- [Fix Summary](../bugfix/SUMMARY-2026-01-15-auth-logs-fix.md)
- [Database Schema](/sql/auth_logs.sql)

---

**Version:** 2.0  
**Database Compliance:** 100% ✅  
**Production Ready:** YES ✅
