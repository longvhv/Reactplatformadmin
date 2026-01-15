# SaaS Products API Documentation

## 📋 Tổng quan

API để quản lý sản phẩm SaaS trong hệ thống. Hỗ trợ đầy đủ CRUD operations, filtering, search, và statistics.

**Base URL:** `/api/v1/saas-products`  
**Authentication:** Required (Bearer Token)  
**Content-Type:** `application/json`

---

## 🔐 Authentication

Tất cả API endpoints đều yêu cầu authentication token trong header:

```http
Authorization: Bearer <your_token_here>
```

---

## 📚 Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/saas-products` | Lấy danh sách products với filters |
| GET | `/api/v1/saas-products/{id}` | Lấy chi tiết một product |
| POST | `/api/v1/saas-products` | Tạo product mới |
| PATCH | `/api/v1/saas-products/{id}` | Cập nhật product |
| DELETE | `/api/v1/saas-products/{id}` | Xóa product (soft delete) |
| GET | `/api/v1/saas-products/statistics` | Lấy thống kê tổng quan |

---

## 📖 API Endpoints Chi Tiết

### 1. Lấy danh sách Products

**GET** `/api/v1/saas-products`

Lấy danh sách tất cả products với khả năng filter, search, và pagination.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tenant_id` | string (UUID) | No | - | Lọc theo tenant |
| `status` | string | No | - | Lọc theo status: `active`, `inactive`, `archived` |
| `product_type_code` | string | No | - | Lọc theo loại sản phẩm |
| `is_featured` | boolean | No | - | Lọc sản phẩm nổi bật: `true`, `false` |
| `search` | string | No | - | Tìm kiếm trong name, description, code |
| `limit` | integer | No | 50 | Số lượng records trả về (max: 100) |
| `offset` | integer | No | 0 | Vị trí bắt đầu (pagination) |

#### Request Example

```bash
curl -X GET \
  'https://api.example.com/api/v1/saas-products?tenant_id=01934f7c-1234-5678-9abc-def012345678&status=active&limit=20&offset=0' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

#### Response Example (200 OK)

```json
{
  "data": [
    {
      "_id": "01934f7c-8a2e-7890-b123-456789abcdef",
      "tenant_id": "01934f7c-1234-5678-9abc-def012345678",
      "code": "hrm-pro",
      "name": "HRM Professional",
      "description": "Giải pháp quản lý nhân sự toàn diện",
      "product_type_code": "PRODUCT_TYPE_APP",
      "base_price": 2990000.00,
      "currency": "VND",
      "billing_cycle": "MONTHLY",
      "trial_days": 14,
      "features": {
        "employee_management": true,
        "attendance_tracking": true,
        "payroll": true
      },
      "limits": {
        "max_employees": 50,
        "max_storage_gb": 10
      },
      "status": "active",
      "is_featured": true,
      "display_order": 1,
      "metadata": {
        "badge": "Popular",
        "color": "#6366f1"
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "version": 1
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "error": "Invalid or missing authentication token"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to fetch products: database connection error"
}
```

---

### 2. Lấy chi tiết Product

**GET** `/api/v1/saas-products/{id}`

Lấy thông tin chi tiết của một product theo ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Product ID |

#### Request Example

```bash
curl -X GET \
  'https://api.example.com/api/v1/saas-products/01934f7c-8a2e-7890-b123-456789abcdef' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

#### Response Example (200 OK)

```json
{
  "data": {
    "_id": "01934f7c-8a2e-7890-b123-456789abcdef",
    "tenant_id": "01934f7c-1234-5678-9abc-def012345678",
    "code": "hrm-pro",
    "name": "HRM Professional",
    "description": "Giải pháp quản lý nhân sự toàn diện cho doanh nghiệp vừa và nhỏ",
    "product_type_code": "PRODUCT_TYPE_APP",
    "base_price": 2990000.00,
    "currency": "VND",
    "billing_cycle": "MONTHLY",
    "trial_days": 14,
    "features": {
      "employee_management": true,
      "attendance_tracking": true,
      "payroll": true,
      "leave_management": true,
      "performance_review": false
    },
    "limits": {
      "max_employees": 50,
      "max_storage_gb": 10,
      "api_calls_per_month": 10000
    },
    "status": "active",
    "is_featured": true,
    "display_order": 1,
    "metadata": {
      "badge": "Popular",
      "color": "#6366f1",
      "icon_url": "https://cdn.example.com/icons/hrm.png"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "created_by": "01934f7c-1111-2222-3333-444444444444",
    "version": 1
  }
}
```

#### Error Responses

**404 Not Found**
```json
{
  "error": "Product not found"
}
```

---

### 3. Tạo Product mới

**POST** `/api/v1/saas-products`

Tạo một product mới trong hệ thống.

#### Request Body

```json
{
  "tenant_id": "01934f7c-1234-5678-9abc-def012345678",
  "code": "crm-enterprise",
  "name": "CRM Enterprise",
  "description": "Giải pháp CRM dành cho doanh nghiệp lớn",
  "product_type_code": "PRODUCT_TYPE_APP",
  "base_price": 9990000.00,
  "currency": "VND",
  "billing_cycle": "YEARLY",
  "trial_days": 30,
  "features": {
    "lead_management": true,
    "sales_pipeline": true,
    "email_integration": true,
    "advanced_reporting": true,
    "api_access": true
  },
  "limits": {
    "max_users": 100,
    "max_contacts": 50000,
    "max_storage_gb": 100,
    "api_calls_per_day": 100000
  },
  "status": "active",
  "is_featured": false,
  "display_order": 5,
  "metadata": {
    "badge": "New",
    "color": "#10b981",
    "icon_url": "https://cdn.example.com/icons/crm.png",
    "recommended_for": ["enterprise", "large-business"]
  },
  "created_by": "01934f7c-1111-2222-3333-444444444444"
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tenant_id` | UUID | Yes | ID của tenant sở hữu product |
| `code` | string | Yes | Mã product (unique, lowercase, chỉ chứa a-z, 0-9, dấu -) |
| `name` | string | Yes | Tên product hiển thị |
| `description` | string | No | Mô tả chi tiết |
| `product_type_code` | string | No | Mã loại sản phẩm |
| `base_price` | number | Yes | Giá cơ bản (>= 0) |
| `currency` | string | Yes | Mã tiền tệ (VND, USD,...) |
| `billing_cycle` | string | Yes | Chu kỳ thanh toán: DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY, LIFETIME |
| `trial_days` | integer | No | Số ngày dùng thử (default: 0) |
| `features` | object | No | Object chứa features (default: {}) |
| `limits` | object | No | Object chứa limits (default: {}) |
| `status` | string | No | Trạng thái: active, inactive, archived (default: active) |
| `is_featured` | boolean | No | Đánh dấu nổi bật (default: false) |
| `display_order` | integer | No | Thứ tự hiển thị (default: 0) |
| `metadata` | object | No | Metadata tùy chỉnh (default: {}) |
| `created_by` | UUID | No | ID người tạo |

#### Response Example (201 Created)

```json
{
  "data": {
    "_id": "01934f7c-9999-8888-7777-666666666666",
    "tenant_id": "01934f7c-1234-5678-9abc-def012345678",
    "code": "crm-enterprise",
    "name": "CRM Enterprise",
    "description": "Giải pháp CRM dành cho doanh nghiệp lớn",
    "product_type_code": "PRODUCT_TYPE_APP",
    "base_price": 9990000.00,
    "currency": "VND",
    "billing_cycle": "YEARLY",
    "trial_days": 30,
    "features": {
      "lead_management": true,
      "sales_pipeline": true,
      "email_integration": true,
      "advanced_reporting": true,
      "api_access": true
    },
    "limits": {
      "max_users": 100,
      "max_contacts": 50000,
      "max_storage_gb": 100,
      "api_calls_per_day": 100000
    },
    "status": "active",
    "is_featured": false,
    "display_order": 5,
    "metadata": {
      "badge": "New",
      "color": "#10b981",
      "icon_url": "https://cdn.example.com/icons/crm.png",
      "recommended_for": ["enterprise", "large-business"]
    },
    "created_at": "2024-01-15T14:30:00Z",
    "updated_at": "2024-01-15T14:30:00Z",
    "created_by": "01934f7c-1111-2222-3333-444444444444",
    "version": 1
  }
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "error": "code is required"
}
```

**409 Conflict**
```json
{
  "error": "Product code already exists for this tenant"
}
```

---

### 4. Cập nhật Product

**PATCH** `/api/v1/saas-products/{id}`

Cập nhật thông tin của product. Sử dụng Optimistic Locking với version.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Product ID |

#### Request Body

```json
{
  "name": "HRM Professional Plus",
  "base_price": 3490000.00,
  "features": {
    "employee_management": true,
    "attendance_tracking": true,
    "payroll": true,
    "leave_management": true,
    "performance_review": true
  },
  "limits": {
    "max_employees": 100,
    "max_storage_gb": 20,
    "api_calls_per_month": 20000
  },
  "is_featured": true,
  "updated_by": "01934f7c-1111-2222-3333-444444444444",
  "version": 1
}
```

#### Field Descriptions

Tất cả fields đều **optional** (partial update), ngoại trừ `version` là **required** để Optimistic Locking.

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Mã product |
| `name` | string | Tên product |
| `description` | string | Mô tả |
| `product_type_code` | string | Loại sản phẩm |
| `base_price` | number | Giá cơ bản |
| `currency` | string | Mã tiền tệ |
| `billing_cycle` | string | Chu kỳ thanh toán |
| `trial_days` | integer | Số ngày dùng thử |
| `features` | object | Features (sẽ replace toàn bộ) |
| `limits` | object | Limits (sẽ replace toàn bộ) |
| `status` | string | Trạng thái |
| `is_featured` | boolean | Đánh dấu nổi bật |
| `display_order` | integer | Thứ tự hiển thị |
| `metadata` | object | Metadata |
| `updated_by` | UUID | ID người cập nhật |
| `version` | integer | **REQUIRED** - Version hiện tại (Optimistic Locking) |

#### Response Example (200 OK)

```json
{
  "data": {
    "_id": "01934f7c-8a2e-7890-b123-456789abcdef",
    "tenant_id": "01934f7c-1234-5678-9abc-def012345678",
    "code": "hrm-pro",
    "name": "HRM Professional Plus",
    "description": "Giải pháp quản lý nhân sự toàn diện",
    "product_type_code": "PRODUCT_TYPE_APP",
    "base_price": 3490000.00,
    "currency": "VND",
    "billing_cycle": "MONTHLY",
    "trial_days": 14,
    "features": {
      "employee_management": true,
      "attendance_tracking": true,
      "payroll": true,
      "leave_management": true,
      "performance_review": true
    },
    "limits": {
      "max_employees": 100,
      "max_storage_gb": 20,
      "api_calls_per_month": 20000
    },
    "status": "active",
    "is_featured": true,
    "display_order": 1,
    "metadata": {
      "badge": "Popular",
      "color": "#6366f1"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T15:45:00Z",
    "created_by": "01934f7c-1111-2222-3333-444444444444",
    "updated_by": "01934f7c-1111-2222-3333-444444444444",
    "version": 2
  }
}
```

#### Error Responses

**404 Not Found**
```json
{
  "error": "Product not found"
}
```

**409 Conflict**
```json
{
  "error": "Version conflict: Product was modified by another user"
}
```

---

### 5. Xóa Product (Soft Delete)

**DELETE** `/api/v1/saas-products/{id}`

Xóa product (soft delete). Product không bị xóa vĩnh viễn mà chỉ đánh dấu `deleted_at`.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Product ID |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deleted_by` | string (UUID) | No | ID người xóa |

#### Request Example

```bash
curl -X DELETE \
  'https://api.example.com/api/v1/saas-products/01934f7c-8a2e-7890-b123-456789abcdef?deleted_by=01934f7c-1111-2222-3333-444444444444' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

#### Response Example (200 OK)

```json
{
  "message": "Product deleted successfully",
  "data": {
    "_id": "01934f7c-8a2e-7890-b123-456789abcdef"
  }
}
```

#### Error Responses

**404 Not Found**
```json
{
  "error": "Product not found or already deleted"
}
```

---

### 6. Lấy thống kê Products

**GET** `/api/v1/saas-products/statistics`

Lấy thống kê tổng quan về products.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | string (UUID) | No | Lọc theo tenant |

#### Request Example

```bash
curl -X GET \
  'https://api.example.com/api/v1/saas-products/statistics?tenant_id=01934f7c-1234-5678-9abc-def012345678' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

#### Response Example (200 OK)

```json
{
  "data": {
    "total": 45,
    "active": 32,
    "inactive": 10,
    "archived": 3,
    "featured": 8,
    "total_revenue": 156750000.00
  }
}
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `total` | integer | Tổng số products (không bao gồm deleted) |
| `active` | integer | Số products có status = active |
| `inactive` | integer | Số products có status = inactive |
| `archived` | integer | Số products có status = archived |
| `featured` | integer | Số products featured |
| `total_revenue` | number | Tổng giá trị của tất cả products (base_price) |

---

## 🔄 Common Use Cases

### Use Case 1: Lấy danh sách products active cho pricing page

```bash
GET /api/v1/saas-products?tenant_id={tenant_id}&status=active&is_featured=true&limit=10
```

### Use Case 2: Search products

```bash
GET /api/v1/saas-products?tenant_id={tenant_id}&search=hrm&limit=20
```

### Use Case 3: Lọc theo loại sản phẩm

```bash
GET /api/v1/saas-products?tenant_id={tenant_id}&product_type_code=PRODUCT_TYPE_APP&status=active
```

### Use Case 4: Update giá sản phẩm

```bash
PATCH /api/v1/saas-products/{id}
Body: {
  "base_price": 3990000,
  "version": 3,
  "updated_by": "user-id"
}
```

### Use Case 5: Toggle featured status

```bash
PATCH /api/v1/saas-products/{id}
Body: {
  "is_featured": true,
  "display_order": 1,
  "version": 2
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request thành công |
| 201 | Created - Tạo resource thành công |
| 400 | Bad Request - Request body không hợp lệ |
| 401 | Unauthorized - Thiếu hoặc sai authentication token |
| 404 | Not Found - Resource không tồn tại |
| 409 | Conflict - Version conflict hoặc duplicate code |
| 500 | Internal Server Error - Lỗi server |

### Error Response Format

```json
{
  "error": "Human-readable error message"
}
```

---

## 🔐 Security Best Practices

1. **Authentication**: Luôn gửi Bearer token trong Authorization header
2. **HTTPS Only**: Chỉ sử dụng HTTPS trong production
3. **Rate Limiting**: API có rate limit, tối đa 1000 requests/phút/user
4. **Input Validation**: Server sẽ validate tất cả input, không tin tưởng client
5. **Optimistic Locking**: Luôn gửi version khi update để tránh race condition

---

## 📊 Rate Limiting

| Tier | Requests per minute | Burst |
|------|---------------------|-------|
| Free | 100 | 120 |
| Pro | 1000 | 1200 |
| Enterprise | 10000 | 12000 |

Khi vượt rate limit, API sẽ trả về:

```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "retry_after": 60
}
```

---

## 🧪 Testing

### Postman Collection

Download Postman collection: [SaaS Products API.postman_collection.json](./postman/saas-products.json)

### Example cURL Commands

**Get all products:**
```bash
curl -X GET https://api.example.com/api/v1/saas-products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create product:**
```bash
curl -X POST https://api.example.com/api/v1/saas-products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "tenant-uuid",
    "code": "test-product",
    "name": "Test Product",
    "base_price": 1000000,
    "currency": "VND",
    "billing_cycle": "MONTHLY"
  }'
```

---

## 📚 Related Documentation

- [Products Schema Documentation](./PRODUCTS_SCHEMA.md)
- [Products Use Cases](./PRODUCTS_USECASES.md)
- [System Categories API](./SYSTEM_CATEGORIES_API.md)
- [Service Packages API](./SERVICE_PACKAGES_API.md)

---

## 📝 Changelog

### Version 1.0.0 (2025-01-13)
- ✅ Initial release
- ✅ Full CRUD operations
- ✅ Filtering and search
- ✅ Statistics endpoint
- ✅ Optimistic locking support

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team
