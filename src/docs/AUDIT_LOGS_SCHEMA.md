# Audit Logs Database Schema

## 📊 Table: `audit_logs`

### Engine: ClickHouse MergeTree

**Purpose:** Lưu trữ lịch sử hoạt động và kiểm toán hệ thống với khả năng query nhanh trên hàng tỷ records.

---

## 🗂️ Table Structure

### DDL Statement (ClickHouse)

```sql
CREATE TABLE audit_logs (
    -- I. ĐỊNH DANH & TENANCY
    _id UUID,
    tenant_id UUID,
    user_id UUID,
    impersonator_id Nullable(UUID),
    
    -- II. CHI TIẾT SỰ KIỆN
    event_time DateTime64(3) DEFAULT now(),
    action String,
    resource String,
    resource_id Nullable(String),
    details String,
    
    -- III. CONTEXT & SECURITY
    ip_address String,
    user_agent String,
    status Enum8('SUCCESS' = 1, 'FAILED' = 2) DEFAULT 'SUCCESS'
)
ENGINE = MergeTree()
-- Phân vùng dữ liệu theo tháng để dễ dàng xóa log cũ (Retention Policy)
PARTITION BY toYYYYMM(event_time)
-- Sắp xếp theo Tenant và Thời gian để tối ưu truy vấn tra soát
ORDER BY (tenant_id, event_time, _id)
-- Cấu hình hạt nhân cho chỉ mục
SETTINGS index_granularity = 8192;
```

---

## 📋 Column Specifications

### I. ĐỊNH DANH & TENANCY

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `_id` | UUID | No | - | **Primary Key**: Unique identifier cho mỗi audit log |
| `tenant_id` | UUID | No | - | **Foreign Key**: ID của tenant (multi-tenancy isolation) |
| `user_id` | UUID | No | - | **Foreign Key**: ID của user thực hiện hành động |
| `impersonator_id` | UUID | Yes | NULL | **Foreign Key**: ID của admin đang impersonate (nếu có) |

**Relationships:**
- `tenant_id` → `tenants._id`
- `user_id` → `users._id`
- `impersonator_id` → `users._id`

---

### II. CHI TIẾT SỰ KIỆN

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `event_time` | DateTime64(3) | No | `now()` | Timestamp chính xác đến millisecond |
| `action` | String | No | - | Hành động thực hiện (CREATE, UPDATE, DELETE, etc.) |
| `resource` | String | No | - | Loại tài nguyên bị tác động (USER, PRODUCT, etc.) |
| `resource_id` | String | Yes | NULL | ID của tài nguyên cụ thể bị tác động |
| `details` | String | No | - | Chi tiết JSON về thay đổi (before/after, changes, metadata) |

**action Values:**
- `CREATE` - Tạo mới
- `UPDATE` - Cập nhật
- `DELETE` - Xóa
- `VIEW` - Xem
- `LOGIN` - Đăng nhập
- `LOGOUT` - Đăng xuất
- `EXPORT` - Xuất dữ liệu
- `IMPORT` - Nhập dữ liệu
- `APPROVE` - Phê duyệt
- `REJECT` - Từ chối
- `ACTIVATE` - Kích hoạt
- `DEACTIVATE` - Vô hiệu hóa
- `GRANT` - Cấp quyền
- `REVOKE` - Thu hồi quyền

**resource Values:**
- `USER` - Người dùng
- `TENANT` - Tenant
- `APPLICATION` - Ứng dụng
- `ROLE` - Vai trò
- `PRODUCT` - Sản phẩm
- `ORDER` - Đơn hàng
- `INVOICE` - Hóa đơn
- `SUBSCRIPTION` - Đăng ký
- `WEBHOOK` - Webhook
- `API_KEY` - API Key
- `SETTING` - Cài đặt
- `DOCUMENT` - Tài liệu

---

### III. CONTEXT & SECURITY

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `ip_address` | String | No | - | Địa chỉ IP của user (IPv4 hoặc IPv6) |
| `user_agent` | String | No | - | User agent string từ browser/client |
| `status` | Enum8 | No | `'SUCCESS'` | Trạng thái của hành động (SUCCESS = 1, FAILED = 2) |

---

## 🔍 Indexes

### Primary Ordering Key

```sql
ORDER BY (tenant_id, event_time, _id)
```

**Purpose:** 
- Tối ưu cho query theo tenant (multi-tenancy)
- Sort theo thời gian để dễ dàng query time-range
- `_id` để đảm bảo uniqueness

**Performance:**
- ✅ Query theo tenant_id: **VERY FAST**
- ✅ Query theo time range: **FAST**
- ❌ Query chỉ theo user_id: **SLOW** (cần filter thêm tenant_id)

---

### Skipping Indexes (Bloom Filter)

#### 1. Index for Action Search

```sql
ALTER TABLE audit_logs 
ADD INDEX idx_action_search action TYPE bloom_filter(0.01) GRANULARITY 1;
```

**Purpose:** Tìm kiếm nhanh các hành động cụ thể trong hàng tỷ bản ghi

**Use Case:**
```sql
SELECT * FROM audit_logs WHERE action = 'DELETE';
```

---

#### 2. Index for User Search

```sql
ALTER TABLE audit_logs 
ADD INDEX idx_user_search user_id TYPE minmax GRANULARITY 1;
```

**Purpose:** Tra soát lịch sử của một nhân viên cụ thể nhanh hơn

**Use Case:**
```sql
SELECT * FROM audit_logs WHERE user_id = 'user-123';
```

---

## 🗄️ Storage Strategy

### Partitioning Strategy

```sql
PARTITION BY toYYYYMM(event_time)
```

**Benefits:**
1. **Easy Data Lifecycle Management**: Drop old partitions dễ dàng
2. **Query Performance**: ClickHouse chỉ scan partitions cần thiết
3. **Backup/Restore**: Backup theo partition riêng biệt

**Example Partitions:**
- `202401` - January 2024
- `202402` - February 2024
- `202403` - March 2024

**Drop Old Data:**
```sql
-- Xóa data cũ hơn 2 năm
ALTER TABLE audit_logs DROP PARTITION '202201';
```

---

### Data Retention Policy

| Environment | Retention Period | Partition Strategy |
|-------------|------------------|-------------------|
| **Production** | 2 years | Monthly partitions |
| **Staging** | 6 months | Monthly partitions |
| **Development** | 1 month | Weekly partitions |

**Auto-cleanup Script:**
```sql
-- Run monthly
ALTER TABLE audit_logs 
DROP PARTITION WHERE toYYYYMM(event_time) < toYYYYMM(now() - INTERVAL 24 MONTH);
```

---

## 📊 Storage Estimates

### Size Calculations

**Assumptions:**
- 1 million events per day
- Average row size: ~500 bytes

**Daily:**
```
1,000,000 events × 500 bytes = 500 MB/day
```

**Monthly:**
```
500 MB × 30 days = 15 GB/month
```

**Yearly:**
```
15 GB × 12 months = 180 GB/year
```

**With Compression (ClickHouse ~10x):**
```
180 GB / 10 = ~18 GB/year compressed
```

---

## 🔐 Security Considerations

### 1. Data Immutability

Audit logs **KHÔNG BAO GIỜ** được phép:
- ❌ UPDATE
- ❌ DELETE individual rows
- ✅ Only DROP entire partitions (for retention)

**Enforcement:**
```sql
-- Không có UPDATE/DELETE permissions
GRANT INSERT, SELECT ON audit_logs TO audit_writer;
REVOKE UPDATE, DELETE ON audit_logs FROM ALL;
```

---

### 2. PII (Personally Identifiable Information)

**Sensitive data KHÔNG được lưu trong audit logs:**
- ❌ Passwords
- ❌ Credit card numbers
- ❌ Social security numbers
- ❌ Authentication tokens

**Safe to log:**
- ✅ User IDs
- ✅ Email addresses
- ✅ IP addresses (with proper consent)
- ✅ Action types
- ✅ Resource IDs

---

### 3. Encryption

| Data | Encryption Method |
|------|------------------|
| `ip_address` | AES-256 at rest |
| `user_agent` | AES-256 at rest |
| `details` | Field-level encryption for sensitive fields |

---

## 📈 Query Examples

### Common Queries

#### 1. Get User Activity History

```sql
SELECT 
    event_time,
    action,
    resource,
    resource_id,
    status
FROM audit_logs
WHERE 
    tenant_id = 'tenant-001'
    AND user_id = 'user-123'
    AND event_time >= now() - INTERVAL 30 DAY
ORDER BY event_time DESC
LIMIT 100;
```

---

#### 2. Track Failed Actions

```sql
SELECT 
    user_id,
    action,
    resource,
    ip_address,
    count() as failed_count
FROM audit_logs
WHERE 
    tenant_id = 'tenant-001'
    AND status = 'FAILED'
    AND event_time >= now() - INTERVAL 7 DAY
GROUP BY user_id, action, resource, ip_address
ORDER BY failed_count DESC
LIMIT 10;
```

---

#### 3. Audit Trail for Specific Resource

```sql
SELECT 
    event_time,
    user_id,
    action,
    details,
    impersonator_id
FROM audit_logs
WHERE 
    tenant_id = 'tenant-001'
    AND resource = 'USER'
    AND resource_id = 'user-456'
ORDER BY event_time ASC;
```

---

#### 4. Daily Activity Statistics

```sql
SELECT 
    toDate(event_time) as date,
    action,
    count() as event_count
FROM audit_logs
WHERE 
    tenant_id = 'tenant-001'
    AND event_time >= now() - INTERVAL 30 DAY
GROUP BY date, action
ORDER BY date DESC, event_count DESC;
```

---

#### 5. Detect Suspicious Activity

```sql
SELECT 
    user_id,
    ip_address,
    count() as action_count,
    countIf(status = 'FAILED') as failed_count,
    uniq(resource) as resource_types
FROM audit_logs
WHERE 
    tenant_id = 'tenant-001'
    AND event_time >= now() - INTERVAL 1 HOUR
GROUP BY user_id, ip_address
HAVING failed_count > 5 OR action_count > 100
ORDER BY failed_count DESC;
```

---

## 🎯 Performance Optimization

### Best Practices

#### ✅ DO:

1. **Always filter by tenant_id first**
   ```sql
   WHERE tenant_id = 'xxx' AND event_time >= ...
   ```

2. **Use time ranges**
   ```sql
   WHERE event_time >= now() - INTERVAL 7 DAY
   ```

3. **Limit result sets**
   ```sql
   LIMIT 1000
   ```

#### ❌ DON'T:

1. **Avoid full table scans**
   ```sql
   -- Bad: No tenant_id or time filter
   SELECT * FROM audit_logs WHERE action = 'DELETE';
   ```

2. **Don't use SELECT ***
   ```sql
   -- Bad: Returns all columns
   SELECT * FROM audit_logs;
   
   -- Good: Select only needed columns
   SELECT event_time, action, resource FROM audit_logs;
   ```

---

## 🔧 Maintenance

### Regular Tasks

#### 1. Check Table Size

```sql
SELECT 
    partition,
    sum(rows) as rows,
    formatReadableSize(sum(bytes)) as size
FROM system.parts
WHERE table = 'audit_logs' AND active
GROUP BY partition
ORDER BY partition DESC;
```

---

#### 2. Optimize Table

```sql
-- Run weekly to merge small parts
OPTIMIZE TABLE audit_logs FINAL;
```

---

#### 3. Monitor Query Performance

```sql
SELECT 
    query,
    query_duration_ms,
    read_rows,
    formatReadableSize(read_bytes) as read_size
FROM system.query_log
WHERE 
    query LIKE '%audit_logs%'
    AND type = 'QueryFinish'
    AND event_time >= now() - INTERVAL 1 DAY
ORDER BY query_duration_ms DESC
LIMIT 10;
```

---

## 📚 References

1. [ClickHouse Documentation](https://clickhouse.com/docs/)
2. [MergeTree Engine](https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/mergetree)
3. [Partitioning](https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/custom-partitioning-key)
4. [Indexes](https://clickhouse.com/docs/en/guides/improving-query-performance/skipping-indexes)

---

## 📞 Support

Nếu có câu hỏi về database schema, vui lòng liên hệ:

- **DBA Team**: dba@vhvplatform.com
- **Documentation**: https://docs.vhvplatform.com/database
