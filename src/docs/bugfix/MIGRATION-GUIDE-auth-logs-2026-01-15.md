# Auth Logs Migration Guide
**Date:** 2026-01-15  
**Module:** Auth Logs  
**Breaking Changes:** YES ⚠️

## Overview

Module Auth Logs đã được cập nhật để match 100% với database schema. Nếu bạn đang sử dụng Auth Logs trong code, vui lòng đọc guide này để migrate.

## Breaking Changes Summary

### 1. Field Name Changes

| Old Field | New Field | Type Change | Reason |
|-----------|-----------|-------------|---------|
| `event_type` | `action` | No | Match database column name |
| `success` | `status` | boolean → string | Match database (success/failed/blocked) |
| `failure_reason` | `error_message` | No | Match database column name |

### 2. New Fields Added

Các field mới được thêm vào (match database):
- `tenant_id?: string | null`
- `browser?: string | null`
- `os?: string | null`
- `device_type?: string | null`
- `location?: string | null`
- `country_code?: string | null`

### 3. Type Changes

**Old:**
```typescript
interface AuthLog {
  user_id: string;  // Required
  success: boolean;
}
```

**New:**
```typescript
interface AuthLog {
  user_id?: string | null;  // Nullable (failed login may not have user)
  status: string;  // 'success' | 'failed' | 'blocked'
}
```

## Migration Steps

### Step 1: Update Field Names

**❌ Old Code:**
```typescript
import { AuthLog } from '../api/authLogsApi';

function processLog(log: AuthLog) {
  if (log.event_type === 'LOGIN' && log.success) {
    console.log('Login successful');
  }
  
  if (log.failure_reason) {
    console.error(log.failure_reason);
  }
}
```

**✅ New Code:**
```typescript
import { AuthLog } from '../api/authLogsApi';

function processLog(log: AuthLog) {
  if (log.action === 'login' && log.status === 'success') {
    console.log('Login successful');
  }
  
  if (log.error_message) {
    console.error(log.error_message);
  }
}
```

### Step 2: Update Filters

**❌ Old Code:**
```typescript
const filters: AuthLogFilters = {
  event_type: 'LOGIN',
  success: true
};
```

**✅ New Code:**
```typescript
const filters: AuthLogFilters = {
  action: 'login',
  status: 'success'
};
```

### Step 3: Use Helper Functions (Recommended)

**✅ Better Code:**
```typescript
import { 
  AuthLog, 
  isSuccessfulLog, 
  isFailedLog,
  isLoginAction,
  getActionDisplayName 
} from '../api/authLogsApi';

function processLog(log: AuthLog) {
  // Use helper functions instead of direct property access
  if (isLoginAction(log.action) && isSuccessfulLog(log)) {
    console.log('Login successful');
  }
  
  if (isFailedLog(log) && log.error_message) {
    console.error(log.error_message);
  }
  
  // Display friendly names
  console.log(getActionDisplayName(log.action));
}
```

### Step 4: Handle Nullable Fields

**❌ Old Code:**
```typescript
function getUserId(log: AuthLog): string {
  return log.user_id;  // Assumes always present
}
```

**✅ New Code:**
```typescript
function getUserId(log: AuthLog): string | null {
  return log.user_id ?? null;  // Handle nullable
}

// Or with validation
function requireUserId(log: AuthLog): string {
  if (!log.user_id) {
    throw new Error('User ID is required');
  }
  return log.user_id;
}
```

### Step 5: Update Stats Logic

**❌ Old Code:**
```typescript
const successCount = logs.filter(log => log.success).length;
const failedCount = logs.filter(log => !log.success).length;
```

**✅ New Code:**
```typescript
import { isSuccessfulLog, isFailedLog, isBlockedLog } from '../api/authLogsApi';

const successCount = logs.filter(isSuccessfulLog).length;
const failedCount = logs.filter(isFailedLog).length;
const blockedCount = logs.filter(isBlockedLog).length;

// Or directly
const successCount = logs.filter(log => log.status === 'success').length;
const failedCount = logs.filter(log => log.status === 'failed').length;
```

### Step 6: Update Create/Update Operations

**❌ Old Code:**
```typescript
const newLog: CreateAuthLogRequest = {
  user_id: userId,
  event_type: 'LOGIN',
  success: true,
  ip_address: '192.168.1.1'
};
```

**✅ New Code:**
```typescript
const newLog: CreateAuthLogRequest = {
  user_id: userId,
  tenant_id: tenantId,  // Now available
  action: 'login',
  status: 'success',
  ip_address: '192.168.1.1',
  browser: 'Chrome 120',  // Now available
  os: 'Windows 11',  // Now available
  device_type: 'desktop',  // Now available
  location: 'Ho Chi Minh City, Vietnam',  // Now available
  country_code: 'VN'  // Now available
};
```

## Search & Replace Guide

Use these regex patterns in your IDE:

### 1. Find `event_type` → Replace with `action`
```regex
Find: \.event_type
Replace: .action
```

### 2. Find `success` boolean checks → Replace with `status` string checks
```regex
Find: log\.success === true
Replace: log.status === 'success'

Find: log\.success
Replace: log.status === 'success'

Find: !log\.success
Replace: log.status !== 'success'
```

### 3. Find `failure_reason` → Replace with `error_message`
```regex
Find: \.failure_reason
Replace: .error_message
```

## Common Patterns

### Pattern 1: Check Login Success

**❌ Old:**
```typescript
if (log.event_type === 'LOGIN' && log.success) { }
```

**✅ New:**
```typescript
if (log.action === 'login' && log.status === 'success') { }

// Or use helper
if (isLoginAction(log.action) && isSuccessfulLog(log)) { }
```

### Pattern 2: Filter Failed Attempts

**❌ Old:**
```typescript
const failed = logs.filter(log => !log.success);
```

**✅ New:**
```typescript
const failed = logs.filter(log => log.status === 'failed');

// Or use helper
const failed = logs.filter(isFailedLog);

// Get recent failed attempts
const recentFailed = getRecentFailedAttempts(logs, 10);
```

### Pattern 3: Group by Event Type

**❌ Old:**
```typescript
const byType = logs.reduce((acc, log) => {
  acc[log.event_type] = (acc[log.event_type] || 0) + 1;
  return acc;
}, {});
```

**✅ New:**
```typescript
const byAction = logs.reduce((acc, log) => {
  acc[log.action] = (acc[log.action] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

### Pattern 4: Display Status

**❌ Old:**
```typescript
const statusText = log.success ? 'Success' : 'Failed';
```

**✅ New:**
```typescript
const statusText = getStatusDisplayName(log.status);
// Returns: 'Thành công' | 'Thất bại' | 'Bị chặn'

// Or for English
const statusMap = {
  success: 'Success',
  failed: 'Failed',
  blocked: 'Blocked'
};
const statusText = statusMap[log.status] || log.status;
```

## API Changes

### authLogsApi.getStats()

**Old Return Type:**
```typescript
interface AuthLogStats {
  total_logs: number;
  successful_logins: number;
  failed_logins: number;
  unique_users: number;
  by_event_type: Record<string, number>;
  recent_failures: number;
}
```

**New Return Type:**
```typescript
interface AuthLogStats {
  total_logs: number;
  successful_logins: number;
  failed_logins: number;
  blocked_attempts: number;  // ← NEW
  unique_users: number;
  by_action: Record<string, number>;  // ← RENAMED
  by_status: Record<string, number>;  // ← NEW
  recent_failures: number;
}
```

**Migration:**
```typescript
// Old
const stats = await authLogsApi.getStats();
console.log(stats.by_event_type);

// New
const stats = await authLogsApi.getStats();
console.log(stats.by_action);
console.log(stats.by_status);  // NEW: Group by status
console.log(stats.blocked_attempts);  // NEW: Blocked count
```

## Helper Functions Reference

### Status Checkers
```typescript
isSuccessfulLog(log: AuthLog): boolean
isFailedLog(log: AuthLog): boolean
isBlockedLog(log: AuthLog): boolean
```

### Action Helpers
```typescript
isLoginAction(action: string): boolean
getActionDisplayName(action: string): string
getStatusDisplayName(status: string): string
```

### Filtering Helpers
```typescript
filterLogsByDateRange(logs: AuthLog[], startDate: Date, endDate: Date): AuthLog[]
getLogsByUser(logs: AuthLog[], userId: string): AuthLog[]
getLogsByTenant(logs: AuthLog[], tenantId: string): AuthLog[]
getRecentFailedAttempts(logs: AuthLog[], limit?: number): AuthLog[]
```

## Testing Checklist

After migration, verify:

- [ ] No TypeScript compilation errors
- [ ] All log displays show correct data
- [ ] Filters work with new field names
- [ ] Stats calculations are correct
- [ ] Error messages display properly
- [ ] No runtime errors in console
- [ ] Create/update operations work
- [ ] Nullable fields handled properly

## Rollback Plan

If you need to temporarily rollback:

1. Revert `/api/authLogsApi.ts` to previous version
2. Revert `/components/auth/AuthLogsTable.tsx` to previous version
3. Note: This is NOT recommended as it breaks database compliance

## Support

If you encounter issues:

1. Check TypeScript errors in IDE
2. Review this migration guide
3. Check `/docs/bugfix/FIX-2026-01-15-auth-logs-schema-compliance-complete.md`
4. Use helper functions to simplify logic

## Examples Repository

Full examples available at:
- `/components/auth/AuthLogsTable.tsx` - Complete component example
- `/pages/AuthLogsPage.tsx` - Page usage example
- `/hooks/useAuthLogs.ts` - Hook usage example

---

**Migration Difficulty:** Medium  
**Estimated Time:** 15-30 minutes for typical usage  
**Breaking:** Yes, but with clear upgrade path  
**Status:** Required for database compliance ✅
