# Audit Logs Use Cases

## 📋 Tổng quan

Tài liệu này mô tả các use cases thực tế khi sử dụng hệ thống Audit Logs để giải quyết các vấn đề về security, compliance, và troubleshooting.

---

## 🎯 Use Case Categories

1. **Security & Compliance** - Bảo mật và tuân thủ quy định
2. **User Activity Tracking** - Theo dõi hoạt động người dùng
3. **Troubleshooting** - Xử lý sự cố
4. **Analytics & Insights** - Phân tích và thống kê
5. **Audit & Investigation** - Kiểm toán và điều tra

---

## 🛡️ 1. Security & Compliance

### UC-001: Track Failed Login Attempts

**Mục đích:** Phát hiện các cuộc tấn công brute-force

**Scenario:**
- Hacker cố gắng đăng nhập vào hệ thống bằng cách thử nhiều passwords
- Hệ thống cần phát hiện và block IP sau N lần thất bại

**Implementation:**

```typescript
// Frontend: Track login attempts
async function trackLoginAttempt(email: string, success: boolean, error?: string) {
  await createAuditLog({
    tenant_id: getTenantId(),
    user_id: getUserId() || 'anonymous',
    action: 'LOGIN',
    resource: 'USER',
    resource_id: email,
    details: JSON.stringify({
      email,
      success,
      error: error || null,
      login_method: 'PASSWORD'
    }),
    ip_address: getClientIP(),
    user_agent: navigator.userAgent,
    status: success ? 'SUCCESS' : 'FAILED'
  });
}

// Backend: Detect suspicious activity
async function checkFailedLogins(email: string, ip: string): Promise<boolean> {
  const recentLogs = await getAuditLogs({
    action: 'LOGIN',
    status: 'FAILED',
    start_date: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Last 15 min
    search: email
  });

  const failedAttempts = recentLogs.data.filter(
    log => log.ip_address === ip
  ).length;

  if (failedAttempts >= 5) {
    // Block IP or trigger alert
    await sendSecurityAlert({
      type: 'BRUTE_FORCE_DETECTED',
      email,
      ip,
      attempts: failedAttempts
    });
    return true;
  }

  return false;
}
```

**API Queries:**

```bash
# Get failed login attempts in last hour
GET /audit-logs?action=LOGIN&status=FAILED&start_date=2024-01-13T09:00:00Z

# Group by IP to find suspicious IPs
GET /audit-logs/statistics?action=LOGIN&status=FAILED
```

**Alert Rule:**
- ⚠️ 5 failed attempts in 15 minutes → Send email alert
- 🚨 10 failed attempts in 15 minutes → Block IP temporarily

---

### UC-002: Compliance Audit Trail (SOC 2, GDPR)

**Mục đích:** Chứng minh tuân thủ các quy định bảo mật

**Scenario:**
- Auditor yêu cầu báo cáo tất cả thay đổi về user data trong Q1 2024
- Cần export audit trail cho external audit

**Implementation:**

```typescript
// Track all user data changes
async function updateUser(userId: string, changes: Partial<User>) {
  const oldUser = await getUser(userId);
  
  // Perform update
  await database.update('users', userId, changes);
  
  // Log the change
  await createAuditLog({
    tenant_id: getTenantId(),
    user_id: getCurrentUserId(),
    action: 'UPDATE',
    resource: 'USER',
    resource_id: userId,
    details: JSON.stringify({
      before: oldUser,
      after: { ...oldUser, ...changes },
      changes: Object.keys(changes).reduce((acc, key) => {
        acc[key] = { old: oldUser[key], new: changes[key] };
        return acc;
      }, {})
    }),
    ip_address: getClientIP(),
    user_agent: getUserAgent(),
    status: 'SUCCESS'
  });
}
```

**API Queries:**

```bash
# Export all USER changes in Q1 2024
GET /audit-logs/export?resource=USER&start_date=2024-01-01T00:00:00Z&end_date=2024-03-31T23:59:59Z

# Get specific user's data access history (GDPR Right to Access)
GET /audit-logs?resource=USER&resource_id=user-123&action=VIEW,UPDATE,DELETE
```

**Compliance Reports:**

1. **SOC 2 Type II**: Quarterly report of all admin actions
2. **GDPR Article 30**: Record of Processing Activities
3. **HIPAA**: Access logs for patient data

---

### UC-003: Detect Privilege Escalation

**Mục đích:** Phát hiện khi user cố gắng leo thang quyền hạn

**Scenario:**
- Regular user cố gắng assign admin role cho chính họ
- System admin grant permissions mà không được phép

**Implementation:**

```typescript
// Track role changes
async function grantRole(targetUserId: string, roleId: string) {
  const currentUser = getCurrentUser();
  
  await createAuditLog({
    tenant_id: getTenantId(),
    user_id: currentUser.id,
    action: 'GRANT',
    resource: 'ROLE',
    resource_id: roleId,
    details: JSON.stringify({
      target_user_id: targetUserId,
      role_name: await getRoleName(roleId),
      granted_by: currentUser.name
    }),
    ip_address: getClientIP(),
    user_agent: getUserAgent(),
    status: 'SUCCESS'
  });
}

// Security monitoring
async function detectPrivilegeEscalation() {
  const suspiciousLogs = await getAuditLogs({
    action: 'GRANT',
    resource: 'ROLE',
    start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  });

  // Check if user granted permission to themselves
  const selfGrants = suspiciousLogs.data.filter(log => {
    const details = JSON.parse(log.details);
    return details.target_user_id === log.user_id;
  });

  if (selfGrants.length > 0) {
    await sendSecurityAlert({
      type: 'PRIVILEGE_ESCALATION_DETECTED',
      logs: selfGrants
    });
  }
}
```

---

## 👤 2. User Activity Tracking

### UC-004: Employee Activity Monitoring

**Mục đích:** Theo dõi hoạt động của nhân viên trong giờ làm việc

**Scenario:**
- Manager muốn xem nhân viên đã làm gì trong tuần qua
- HR cần báo cáo productivity

**Dashboard Query:**

```typescript
async function getUserActivityReport(userId: string, days: number = 7) {
  const { logs, statistics } = await getAuditLogs({
    user_id: userId,
    start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
    limit: 1000
  });

  return {
    total_actions: logs.length,
    actions_by_type: statistics.events_by_action,
    most_active_hours: statistics.events_by_hour,
    resources_accessed: statistics.events_by_resource,
    daily_breakdown: groupByDay(logs)
  };
}
```

**API Query:**

```bash
GET /audit-logs?user_id=user-123&start_date=2024-01-06T00:00:00Z&end_date=2024-01-13T23:59:59Z
GET /audit-logs/statistics?user_id=user-123&start_date=2024-01-06T00:00:00Z
```

---

### UC-005: Track Data Export Activities

**Mục đích:** Giám sát việc export dữ liệu nhạy cảm

**Scenario:**
- Employee export customer data
- Cần biết ai, khi nào, export gì

**Implementation:**

```typescript
async function exportData(dataType: string, filters: any) {
  const exportId = uuid();
  
  // Log before export
  await createAuditLog({
    tenant_id: getTenantId(),
    user_id: getCurrentUserId(),
    action: 'EXPORT',
    resource: dataType,
    resource_id: exportId,
    details: JSON.stringify({
      export_type: 'CSV',
      filters: filters,
      estimated_rows: await countRows(dataType, filters),
      export_reason: 'Monthly report'
    }),
    ip_address: getClientIP(),
    user_agent: getUserAgent(),
    status: 'SUCCESS'
  });

  // Perform export
  const data = await fetchData(dataType, filters);
  return generateCSV(data);
}
```

**Monitoring Dashboard:**

```bash
# All exports in last month
GET /audit-logs?action=EXPORT&start_date=2024-01-01T00:00:00Z

# Detect unusual export patterns
GET /audit-logs/statistics?action=EXPORT
```

**Alert Rules:**
- ⚠️ Export > 10,000 records → Notify security team
- 🚨 Export outside business hours → Immediate review

---

## 🔧 3. Troubleshooting

### UC-006: Debug Production Issues

**Mục đích:** Tìm nguyên nhân của lỗi trong production

**Scenario:**
- Customer báo cáo: "Tôi không thể cập nhật profile"
- Dev team cần xem chuyện gì đã xảy ra

**Troubleshooting Steps:**

```typescript
// 1. Find user's recent actions
const recentActions = await getAuditLogs({
  user_id: 'user-123',
  start_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Last 2 hours
  limit: 50
});

// 2. Filter failed actions
const failedActions = recentActions.data.filter(log => log.status === 'FAILED');

// 3. Analyze details
failedActions.forEach(log => {
  const details = JSON.parse(log.details);
  console.log(`Failed ${log.action} on ${log.resource}:`, details.error);
});
```

**API Query:**

```bash
# Get all failed actions for troubleshooting
GET /audit-logs?user_id=user-123&status=FAILED&start_date=2024-01-13T08:00:00Z

# Find error patterns
GET /audit-logs?status=FAILED&search=ValidationError&start_date=2024-01-13T00:00:00Z
```

**Common Patterns:**

| Error Pattern | Cause | Solution |
|--------------|-------|----------|
| Multiple FAILED UPDATE | Permission issue | Check user role |
| FAILED VIEW with 404 | Resource deleted | Check resource existence |
| FAILED CREATE with validation | Bad input | Check validation rules |

---

### UC-007: Trace Request Flow

**Mục đích:** Theo dõi luồng xử lý của một request

**Scenario:**
- Order creation failed
- Cần xem tất cả các bước đã thực hiện

**Implementation:**

```typescript
// Add request_id to track related actions
async function createOrder(orderData: OrderInput) {
  const requestId = generateRequestId();
  
  try {
    // Step 1: Validate user
    await createAuditLog({
      tenant_id: getTenantId(),
      user_id: getCurrentUserId(),
      action: 'CREATE',
      resource: 'ORDER',
      details: JSON.stringify({
        request_id: requestId,
        step: 'VALIDATE_USER',
        status: 'in_progress'
      }),
      ip_address: getClientIP(),
      user_agent: getUserAgent(),
      status: 'SUCCESS'
    });
    
    // Step 2: Check inventory
    await createAuditLog({
      tenant_id: getTenantId(),
      user_id: getCurrentUserId(),
      action: 'CREATE',
      resource: 'ORDER',
      details: JSON.stringify({
        request_id: requestId,
        step: 'CHECK_INVENTORY',
        items: orderData.items
      }),
      ip_address: getClientIP(),
      user_agent: getUserAgent(),
      status: 'SUCCESS'
    });
    
    // ... more steps
    
  } catch (error) {
    // Log failure
    await createAuditLog({
      tenant_id: getTenantId(),
      user_id: getCurrentUserId(),
      action: 'CREATE',
      resource: 'ORDER',
      details: JSON.stringify({
        request_id: requestId,
        error: error.message,
        stack: error.stack
      }),
      ip_address: getClientIP(),
      user_agent: getUserAgent(),
      status: 'FAILED'
    });
  }
}
```

**Query by request_id:**

```bash
GET /audit-logs?search=req-123456&start_date=2024-01-13T10:00:00Z
```

---

## 📊 4. Analytics & Insights

### UC-008: Product Usage Analytics

**Mục đích:** Hiểu cách users sử dụng features

**Scenario:**
- Product team muốn biết feature nào được dùng nhiều nhất
- Identify unused features để deprecate

**Analytics Query:**

```typescript
async function getFeatureUsageStats(days: number = 30) {
  const stats = await getAuditLogStatistics({
    start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  });

  return {
    most_used_features: stats.events_by_action,
    most_accessed_resources: stats.events_by_resource,
    active_users: stats.unique_users,
    peak_hours: stats.events_by_hour
  };
}
```

**Dashboard Metrics:**

1. **Daily Active Users (DAU)**
   ```sql
   SELECT uniqExact(user_id) as dau
   FROM audit_logs
   WHERE event_time >= today()
   ```

2. **Feature Adoption Rate**
   ```sql
   SELECT 
     action,
     count() as usage_count,
     uniqExact(user_id) as users
   FROM audit_logs
   WHERE event_time >= now() - INTERVAL 30 DAY
   GROUP BY action
   ORDER BY usage_count DESC
   ```

---

### UC-009: User Behavior Analysis

**Mục đích:** Phân tích hành vi người dùng để cải thiện UX

**Scenario:**
- UX team muốn biết user flow thông thường
- Identify pain points trong user journey

**Analysis:**

```typescript
async function analyzeUserJourney(userId: string) {
  const logs = await getAuditLogs({
    user_id: userId,
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    limit: 10000
  });

  // Build action sequences
  const sequences = logs.data.map(log => ({
    timestamp: log.event_time,
    action: log.action,
    resource: log.resource,
    success: log.status === 'SUCCESS'
  }));

  // Find common patterns
  const patterns = findSequentialPatterns(sequences);
  
  // Detect drop-off points
  const dropOffs = findFailedSequences(sequences);

  return { patterns, dropOffs };
}
```

**Common Patterns:**

```
Pattern 1: LOGIN → VIEW Dashboard → CREATE Product → VIEW Orders
Pattern 2: LOGIN → VIEW Products → UPDATE Product → EXPORT Data
Pattern 3: LOGIN → VIEW Users → GRANT Permission → VIEW Audit Logs
```

---

## 🕵️ 5. Audit & Investigation

### UC-010: Data Breach Investigation

**Mục đích:** Điều tra khi có nghi ngờ data breach

**Scenario:**
- Phát hiện customer data bị leak
- Cần tìm ai đã access data đó và khi nào

**Investigation Steps:**

```typescript
async function investigateDataBreach(resourceId: string) {
  // 1. Find all access to the resource
  const accessLogs = await getAuditLogs({
    resource_id: resourceId,
    start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() // Last 90 days
  });

  // 2. Group by user
  const accessByUser = groupBy(accessLogs.data, 'user_id');

  // 3. Find suspicious patterns
  const suspiciousActivity = Object.entries(accessByUser)
    .filter(([userId, logs]) => {
      // Multiple access + export
      const hasView = logs.some(l => l.action === 'VIEW');
      const hasExport = logs.some(l => l.action === 'EXPORT');
      return hasView && hasExport;
    })
    .map(([userId, logs]) => ({
      user_id: userId,
      user_name: logs[0].user_name,
      access_count: logs.length,
      exported: logs.some(l => l.action === 'EXPORT'),
      ip_addresses: unique(logs.map(l => l.ip_address)),
      first_access: min(logs.map(l => l.event_time)),
      last_access: max(logs.map(l => l.event_time))
    }));

  return {
    total_accesses: accessLogs.data.length,
    unique_users: unique(accessLogs.data.map(l => l.user_id)).length,
    suspicious_activity: suspiciousActivity
  };
}
```

**API Queries:**

```bash
# Timeline of all access
GET /audit-logs?resource_id=customer-123&start_date=2023-10-01T00:00:00Z

# Find who exported the data
GET /audit-logs?resource_id=customer-123&action=EXPORT

# Check for unusual IPs
GET /audit-logs?resource_id=customer-123&search=<suspicious_ip>
```

---

### UC-011: Insider Threat Detection

**Mục đích:** Phát hiện nhân viên có hành vi đáng ngờ

**Scenario:**
- Employee about to leave company
- Access nhiều sensitive data bất thường

**Monitoring:**

```typescript
async function detectInsiderThreats() {
  const stats = await getAuditLogStatistics({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  });

  const threats = [];

  // Pattern 1: Excessive exports
  for (const user of stats.top_users) {
    const userLogs = await getAuditLogs({
      user_id: user.user_id,
      action: 'EXPORT'
    });

    if (userLogs.data.length > 10) { // Threshold
      threats.push({
        type: 'EXCESSIVE_EXPORT',
        user_id: user.user_id,
        export_count: userLogs.data.length,
        severity: 'HIGH'
      });
    }
  }

  // Pattern 2: Access outside business hours
  const logs = await getAuditLogs({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  });

  const afterHoursAccess = logs.data.filter(log => {
    const hour = new Date(log.event_time).getHours();
    return hour < 8 || hour > 18; // Outside 8AM-6PM
  });

  // ... more patterns

  return threats;
}
```

**Alert Rules:**

| Pattern | Threshold | Action |
|---------|-----------|--------|
| Excessive exports | > 10/day | Email to security team |
| After hours access | > 5 events | Flag for review |
| Failed access attempts | > 20/hour | Immediate alert |
| Data access spike | 5x normal | Block account temporarily |

---

## 📞 Support & Resources

### Additional Documentation

- [API Documentation](./AUDIT_LOGS_API.md)
- [Database Schema](./AUDIT_LOGS_SCHEMA.md)
- [ERD Diagram](./AUDIT_LOGS_ERD.md)

### Contact

- **Security Team**: security@vhvplatform.com
- **Compliance**: compliance@vhvplatform.com
- **DevOps**: devops@vhvplatform.com

---

## 📝 Template for New Use Cases

```markdown
### UC-XXX: [Use Case Title]

**Mục đích:** [Purpose]

**Scenario:**
- [Describe the situation]

**Implementation:**

\`\`\`typescript
// Code example
\`\`\`

**API Query:**

\`\`\`bash
GET /audit-logs?param=value
\`\`\`

**Expected Outcome:**
- [Describe the result]
```
