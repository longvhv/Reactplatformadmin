# Audit Logs API Documentation

## 📋 Tổng quan

API quản lý lịch sử hoạt động và kiểm toán hệ thống. Ghi lại tất cả các hành động quan trọng của người dùng trong hệ thống để đảm bảo tính minh bạch và truy vết.

**Base URL:** `/api/v1/audit-logs`

**Storage:** ClickHouse (Time-series OLAP database)

---

## 🔐 Authentication

Tất cả endpoints yêu cầu Bearer token trong header:

```
Authorization: Bearer <your_token>
```

---

## 📡 API Endpoints

### 1. List Audit Logs

Lấy danh sách audit logs với filters và pagination.

**Endpoint:** `GET /audit-logs`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | string (UUID) | No | Lọc theo tenant |
| `user_id` | string (UUID) | No | Lọc theo người dùng |
| `action` | string | No | Lọc theo hành động (CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, etc.) |
| `resource` | string | No | Lọc theo loại tài nguyên (USER, PRODUCT, ORDER, etc.) |
| `resource_id` | string (UUID) | No | Lọc theo ID tài nguyên cụ thể |
| `status` | string | No | Lọc theo trạng thái (SUCCESS, FAILED) |
| `start_date` | string (RFC3339) | No | Ngày bắt đầu |
| `end_date` | string (RFC3339) | No | Ngày kết thúc |
| `search` | string | No | Tìm kiếm trong action, resource, details |
| `limit` | integer | No | Số bản ghi trả về (default: 50, max: 1000) |
| `offset` | integer | No | Vị trí bắt đầu (default: 0) |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "_id": "550e8400-e29b-41d4-a716-446655440000",
      "tenant_id": "tenant-001",
      "user_id": "user-123",
      "impersonator_id": null,
      "event_time": "2024-01-13T10:30:45.123Z",
      "action": "CREATE",
      "resource": "USER",
      "resource_id": "user-456",
      "details": "{\"name\":\"John Doe\",\"email\":\"john@example.com\"}",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "status": "SUCCESS",
      "user_name": "Admin User",
      "user_email": "admin@example.com"
    }
  ],
  "total": 1245,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

**Example Request:**

```bash
curl -X GET "https://api.example.com/api/v1/audit-logs?tenant_id=tenant-001&action=CREATE&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Get Audit Log by ID

Lấy chi tiết một audit log cụ thể.

**Endpoint:** `GET /audit-logs/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Audit log ID |

**Response:** `200 OK`

```json
{
  "_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "tenant-001",
  "user_id": "user-123",
  "impersonator_id": "admin-001",
  "event_time": "2024-01-13T10:30:45.123Z",
  "action": "UPDATE",
  "resource": "PRODUCT",
  "resource_id": "prod-789",
  "details": "{\"changes\":{\"price\":{\"old\":100,\"new\":120},\"status\":{\"old\":\"draft\",\"new\":\"published\"}}}",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "status": "SUCCESS",
  "user_name": "John Doe",
  "user_email": "john@example.com",
  "impersonator_name": "Admin User"
}
```

**Errors:**

- `400 Bad Request` - Invalid UUID
- `404 Not Found` - Audit log not found

---

### 3. Create Audit Log

Tạo audit log mới (thường được gọi tự động bởi hệ thống).

**Endpoint:** `POST /audit-logs`

**Request Body:**

```json
{
  "tenant_id": "tenant-001",
  "user_id": "user-123",
  "impersonator_id": null,
  "action": "CREATE",
  "resource": "USER",
  "resource_id": "user-456",
  "details": "{\"name\":\"John Doe\",\"email\":\"john@example.com\"}",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "status": "SUCCESS"
}
```

**Required Fields:**
- `tenant_id` (UUID)
- `user_id` (UUID)
- `action` (string)
- `resource` (string)
- `ip_address` (valid IP)
- `user_agent` (string)

**Optional Fields:**
- `impersonator_id` (UUID)
- `resource_id` (string)
- `details` (JSON string)
- `status` (default: "SUCCESS")

**Response:** `201 Created`

```json
{
  "_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "tenant-001",
  "user_id": "user-123",
  "event_time": "2024-01-13T10:30:45.123Z",
  "action": "CREATE",
  "resource": "USER",
  "resource_id": "user-456",
  "details": "{\"name\":\"John Doe\"}",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "status": "SUCCESS"
}
```

---

### 4. Get Statistics

Lấy thống kê tổng hợp về audit logs.

**Endpoint:** `GET /audit-logs/statistics`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | string (UUID) | No | Lọc theo tenant |
| `start_date` | string (RFC3339) | No | Ngày bắt đầu |
| `end_date` | string (RFC3339) | No | Ngày kết thúc |

**Response:** `200 OK`

```json
{
  "total_events": 1245,
  "success_count": 1180,
  "failed_count": 65,
  "unique_users": 42,
  "events_by_action": {
    "CREATE": 450,
    "UPDATE": 380,
    "DELETE": 120,
    "VIEW": 295
  },
  "events_by_resource": {
    "USER": 320,
    "PRODUCT": 280,
    "ORDER": 245,
    "SUBSCRIPTION": 200,
    "TENANT": 200
  },
  "events_by_hour": [
    {"hour": "00:00", "count": 45},
    {"hour": "01:00", "count": 32},
    {"hour": "02:00", "count": 28}
  ],
  "top_users": [
    {"user_id": "user-001", "user_name": "Admin User", "count": 234},
    {"user_id": "user-002", "user_name": "John Doe", "count": 189}
  ]
}
```

---

### 5. Export Audit Logs

Xuất audit logs ra file CSV.

**Endpoint:** `GET /audit-logs/export`

**Query Parameters:** (Same as List Audit Logs)

**Response:** `200 OK` (CSV file)

**Headers:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename=audit-logs-2024-01-13.csv
```

**CSV Format:**
```csv
"Event Time","User ID","Action","Resource","Resource ID","Status","IP Address"
"2024-01-13 10:30:00","user-001","CREATE","USER","user-123","SUCCESS","192.168.1.100"
```

---

## 📊 Data Models

### AuditLog

| Field | Type | Description |
|-------|------|-------------|
| `_id` | UUID | Unique identifier |
| `tenant_id` | UUID | Tenant ID |
| `user_id` | UUID | User who performed the action |
| `impersonator_id` | UUID (nullable) | User who is impersonating (if applicable) |
| `event_time` | DateTime64(3) | Timestamp of the event |
| `action` | String | Action performed (CREATE, UPDATE, DELETE, etc.) |
| `resource` | String | Resource type (USER, PRODUCT, etc.) |
| `resource_id` | String (nullable) | ID of the affected resource |
| `details` | String (JSON) | Additional details about the action |
| `ip_address` | String (IPv6) | IP address of the user |
| `user_agent` | String | User agent string |
| `status` | Enum | Status of the action (SUCCESS, FAILED) |

### Action Types

| Action | Description |
|--------|-------------|
| `CREATE` | Created a new resource |
| `UPDATE` | Updated an existing resource |
| `DELETE` | Deleted a resource |
| `VIEW` | Viewed a resource |
| `LOGIN` | User logged in |
| `LOGOUT` | User logged out |
| `EXPORT` | Exported data |
| `IMPORT` | Imported data |
| `APPROVE` | Approved something |
| `REJECT` | Rejected something |
| `ACTIVATE` | Activated a resource |
| `DEACTIVATE` | Deactivated a resource |
| `GRANT` | Granted permission |
| `REVOKE` | Revoked permission |

### Resource Types

| Resource | Description |
|----------|-------------|
| `USER` | User account |
| `TENANT` | Tenant/Organization |
| `APPLICATION` | Application |
| `ROLE` | User role |
| `PRODUCT` | Product/Service |
| `ORDER` | Subscription order |
| `INVOICE` | Invoice |
| `SUBSCRIPTION` | Subscription |
| `WEBHOOK` | Webhook |
| `API_KEY` | API Key |
| `SETTING` | System setting |
| `DOCUMENT` | Document |

---

## 🔍 Best Practices

### 1. Filtering Large Datasets

Luôn sử dụng date range khi query logs:

```bash
GET /audit-logs?start_date=2024-01-01T00:00:00Z&end_date=2024-01-31T23:59:59Z
```

### 2. Pagination

Sử dụng pagination cho datasets lớn:

```bash
GET /audit-logs?limit=50&offset=0  # Page 1
GET /audit-logs?limit=50&offset=50 # Page 2
```

### 3. Details Field Format

Lưu details dưới dạng JSON với structure rõ ràng:

**Good:**
```json
{
  "changes": {
    "email": {"old": "old@example.com", "new": "new@example.com"},
    "status": {"old": "inactive", "new": "active"}
  },
  "metadata": {
    "request_id": "req-123",
    "source": "admin_panel"
  }
}
```

**Bad:**
```json
{
  "message": "Updated user email from old@example.com to new@example.com and status from inactive to active"
}
```

### 4. Error Handling

Luôn log cả successful và failed actions:

```json
{
  "action": "UPDATE",
  "resource": "USER",
  "status": "FAILED",
  "details": "{\"error\":\"Permission denied\",\"attempted_change\":\"role\"}"
}
```

---

## 🛡️ Security Considerations

1. **Data Retention**: Audit logs được lưu trữ tối thiểu 1 năm theo quy định
2. **Immutability**: Audit logs không thể xóa hoặc sửa sau khi tạo
3. **Sensitive Data**: Không lưu passwords hoặc tokens trong details field
4. **Access Control**: Chỉ admin và compliance officers có quyền xem audit logs
5. **Encryption**: IP addresses và user agents được encrypt at rest

---

## 📈 Performance Tips

### ClickHouse Optimization

1. **Partition by Month**: Dữ liệu được phân vùng theo tháng
   ```sql
   PARTITION BY toYYYYMM(event_time)
   ```

2. **Ordering Key**: Tối ưu cho query theo tenant và time
   ```sql
   ORDER BY (tenant_id, event_time, _id)
   ```

3. **Bloom Filter Indexes**: Tìm kiếm nhanh theo action
   ```sql
   INDEX idx_action_search action TYPE bloom_filter(0.01)
   ```

### Query Optimization

```bash
# ✅ Good - specific filters
GET /audit-logs?tenant_id=xxx&start_date=2024-01-01&end_date=2024-01-31

# ❌ Bad - no filters, large dataset
GET /audit-logs?limit=10000
```

---

## 🧪 Example Use Cases

### Use Case 1: Track User Activity

```bash
# Get all actions by a specific user
GET /audit-logs?user_id=user-123&start_date=2024-01-01T00:00:00Z

# Get failed login attempts
GET /audit-logs?action=LOGIN&status=FAILED&start_date=2024-01-13T00:00:00Z
```

### Use Case 2: Compliance Audit

```bash
# Export all deletion actions for audit
GET /audit-logs/export?action=DELETE&start_date=2024-01-01T00:00:00Z&end_date=2024-12-31T23:59:59Z

# Track admin actions
GET /audit-logs?resource=ROLE&action=GRANT
```

### Use Case 3: Security Investigation

```bash
# Track impersonation activities
GET /audit-logs?impersonator_id=admin-001

# Suspicious IP analysis
GET /audit-logs?search=192.168.1.100&status=FAILED
```

### Use Case 4: System Analytics

```bash
# Get statistics for dashboard
GET /audit-logs/statistics?tenant_id=tenant-001&start_date=2024-01-01T00:00:00Z

# Most active users
GET /audit-logs/statistics
```

---

## 📞 Support

Nếu có câu hỏi hoặc vấn đề về API, vui lòng liên hệ:

- **Email**: dev-support@vhvplatform.com
- **Documentation**: https://docs.vhvplatform.com/audit-logs
- **Status Page**: https://status.vhvplatform.com
