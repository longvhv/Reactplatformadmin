# Categories Architecture - API Documentation

## Overview

Hệ thống Categories được tách thành **3 bảng riêng biệt** để tối ưu hóa quản lý và mở rộng:

### 1. **system_categories** - Danh mục phân loại hệ thống
Lưu trữ các danh mục phân loại chung được phân biệt bằng trường `type`.

### 2. **app_components** - Thành phần ứng dụng
Bảng riêng cho quản lý cấu trúc components của ứng dụng với hierarchy.

### 3. **regions** - Địa giới hành chính
Bảng riêng cho quản lý quốc gia, tỉnh thành, quận huyện với date range.

---

## 1. System Categories API

### Base URL
```
/api/v1/system-categories
```

### Data Model
```go
type SystemCategory struct {
    ID            uuid.UUID              `json:"id"`
    Code          string                 `json:"code" validate:"required,max=100"`
    Name          string                 `json:"name" validate:"required,max=255"`
    Type          string                 `json:"type" validate:"required,max=50"`
    CategoryGroup string                 `json:"category_group" validate:"required,max=50"`
    Description   string                 `json:"description"`
    IsSystem      bool                   `json:"is_system"`
    IsEditable    bool                   `json:"is_editable"`
    Order         int                    `json:"order"`
    Status        string                 `json:"status" validate:"required,oneof=active inactive"`
    Metadata      map[string]interface{} `json:"metadata"`
    CreatedAt     time.Time              `json:"created_at"`
    UpdatedAt     time.Time              `json:"updated_at"`
    CreatedBy     *uuid.UUID             `json:"created_by"`
    UpdatedBy     *uuid.UUID             `json:"updated_by"`
}
```

### Endpoints

#### 1.1 Get All System Categories
```http
GET /api/v1/system-categories?type={type}&category_group={group}&status={status}&search={keyword}
```

**Query Parameters:**
- `type` (optional): Filter by type (e.g., `entity_status`, `user_role`)
- `category_group` (optional): Filter by group (e.g., `workflow_states`, `system_roles`)
- `status` (optional): Filter by status (`active`, `inactive`)
- `search` (optional): Search by code or name
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "SYS_TENANT_ENTERPRISE",
      "name": "Enterprise",
      "type": "tenant_type",
      "category_group": "tenant_classification",
      "description": "Enterprise organization with full features",
      "is_system": true,
      "is_editable": false,
      "order": 1,
      "status": "active",
      "metadata": {
        "max_users": -1,
        "features": ["all"]
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

#### 1.2 Get Category Types
```http
GET /api/v1/system-categories/types
```

**Response:**
```json
{
  "success": true,
  "data": [
    "entity_status",
    "status_type",
    "priority_level",
    "document_type",
    "tenant_type",
    "integration_type",
    "api_type",
    "user_role",
    "user_status"
  ]
}
```

#### 1.3 Get Category Groups
```http
GET /api/v1/system-categories/groups
```

**Response:**
```json
{
  "success": true,
  "data": [
    "workflow_states",
    "tenant_classification",
    "system_roles",
    "api_types"
  ]
}
```

#### 1.4 Create System Category
```http
POST /api/v1/system-categories
```

**Request Body:**
```json
{
  "code": "SYS_TENANT_STARTER",
  "name": "Starter",
  "type": "tenant_type",
  "category_group": "tenant_classification",
  "description": "Small organization with basic features",
  "is_editable": true,
  "order": 3,
  "status": "active",
  "metadata": {
    "max_users": 10,
    "features": ["basic"]
  }
}
```

#### 1.5 Update System Category
```http
PUT /api/v1/system-categories/{id}
PATCH /api/v1/system-categories/{id}
```

#### 1.6 Delete System Category
```http
DELETE /api/v1/system-categories/{id}
```

**Note:** Cannot delete if `is_editable` is false.

---

## 2. App Components API

### Base URL
```
/api/v1/app-components
```

### Data Model
```go
type AppComponent struct {
    ID          uuid.UUID              `json:"id"`
    CustomID    string                 `json:"_id" validate:"required,max=100"`  // Manual ID
    Title       string                 `json:"title" validate:"required,max=255"`
    ParentID    *string                `json:"parent_id"`  // References CustomID
    Description string                 `json:"description"`
    IsActive    bool                   `json:"is_active"`
    Order       int                    `json:"order"`
    Metadata    map[string]interface{} `json:"metadata"`
    CreatedAt   time.Time              `json:"created_at"`
    UpdatedAt   time.Time              `json:"updated_at"`
    CreatedBy   *uuid.UUID             `json:"created_by"`
    UpdatedBy   *uuid.UUID             `json:"updated_by"`
}
```

### Endpoints

#### 2.1 Get All Components
```http
GET /api/v1/app-components?parent_id={parent}&is_active={status}&search={keyword}
```

**Query Parameters:**
- `parent_id` (optional): Filter by parent component (use `null` for root)
- `is_active` (optional): Filter by active status (`true`, `false`)
- `search` (optional): Search by _id or title

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "_id": "APP_COMP_ROOT",
      "title": "Root Container",
      "parent_id": null,
      "description": "Root level application container",
      "is_active": true,
      "order": 1,
      "metadata": {
        "level": 0
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 2.2 Get Component by ID
```http
GET /api/v1/app-components/{id}
```

#### 2.3 Get Component by Custom ID
```http
GET /api/v1/app-components/by-custom-id/{customId}
```

#### 2.4 Get Component Hierarchy
```http
GET /api/v1/app-components/hierarchy
```

**Response:** Returns tree structure of all components.

#### 2.5 Get Children
```http
GET /api/v1/app-components/{customId}/children
```

#### 2.6 Create Component
```http
POST /api/v1/app-components
```

**Request Body:**
```json
{
  "_id": "APP_COMP_HEADER",
  "title": "Header Component",
  "parent_id": "APP_COMP_ROOT",
  "description": "Application header with navigation",
  "is_active": true,
  "order": 2,
  "metadata": {
    "level": 1,
    "position": "top"
  }
}
```

**Validation:**
- `_id` must be unique
- `_id` format: uppercase, numbers, underscores only
- If `parent_id` is provided, it must exist
- Cannot create circular references

#### 2.7 Update Component
```http
PUT /api/v1/app-components/{id}
PATCH /api/v1/app-components/{id}
```

#### 2.8 Delete Component
```http
DELETE /api/v1/app-components/{id}
```

**Note:** Cannot delete if component has children.

---

## 3. Regions API

### Base URL
```
/api/v1/regions
```

### Data Model
```go
type Region struct {
    ID          uuid.UUID              `json:"id"`
    Code        string                 `json:"code" validate:"required,max=50"`
    Name        string                 `json:"name" validate:"required,max=255"`
    NameEN      string                 `json:"name_en"`
    Type        string                 `json:"type" validate:"required,oneof=country province district"`
    ParentID    *uuid.UUID             `json:"parent_id"`
    StartDate   time.Time              `json:"start_date" validate:"required"`
    EndDate     *time.Time             `json:"end_date"`
    Description string                 `json:"description"`
    Metadata    map[string]interface{} `json:"metadata"`
    CreatedAt   time.Time              `json:"created_at"`
    UpdatedAt   time.Time              `json:"updated_at"`
    CreatedBy   *uuid.UUID             `json:"created_by"`
    UpdatedBy   *uuid.UUID             `json:"updated_by"`
}
```

### Endpoints

#### 3.1 Get All Regions
```http
GET /api/v1/regions?type={type}&parent_id={parent}&search={keyword}&active_only={bool}
```

**Query Parameters:**
- `type` (optional): Filter by type (`country`, `province`, `district`)
- `parent_id` (optional): Filter by parent region
- `search` (optional): Search by code, name, or name_en
- `active_only` (optional): Only show currently active regions (default: false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "code": "VN",
      "name": "Việt Nam",
      "name_en": "Vietnam",
      "type": "country",
      "parent_id": null,
      "start_date": "1945-09-02",
      "end_date": null,
      "description": "Socialist Republic of Vietnam",
      "metadata": {
        "iso_code": "VN",
        "phone_code": "+84",
        "currency": "VND"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 3.2 Get Countries
```http
GET /api/v1/regions/countries
```

Returns all regions with `type=country`.

#### 3.3 Get Provinces by Country
```http
GET /api/v1/regions/countries/{countryId}/provinces
```

#### 3.4 Get Districts by Province
```http
GET /api/v1/regions/provinces/{provinceId}/districts
```

#### 3.5 Get Region Hierarchy
```http
GET /api/v1/regions/hierarchy
```

Returns complete hierarchy tree.

#### 3.6 Create Region
```http
POST /api/v1/regions
```

**Request Body:**
```json
{
  "code": "VN-HN",
  "name": "Hà Nội",
  "name_en": "Hanoi",
  "type": "province",
  "parent_id": "550e8400-e29b-41d4-a716-446655440002",
  "start_date": "2008-01-01",
  "end_date": null,
  "description": "Capital city of Vietnam",
  "metadata": {
    "timezone": "Asia/Ho_Chi_Minh",
    "area": "3359.82 km²"
  }
}
```

**Validation:**
- `code` must be unique
- `type=country` → `parent_id` must be null
- `type=province/district` → `parent_id` is required
- `start_date` is required
- If `end_date` is provided, must be > `start_date`
- Cannot create circular references

#### 3.7 Update Region
```http
PUT /api/v1/regions/{id}
PATCH /api/v1/regions/{id}
```

#### 3.8 Delete Region
```http
DELETE /api/v1/regions/{id}
```

**Note:** Cannot delete if region has sub-regions.

---

## Error Responses

All APIs return consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "code",
      "issue": "Code already exists"
    }
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid input
- `NOT_FOUND` - Resource not found
- `ALREADY_EXISTS` - Duplicate key
- `FORBIDDEN` - Cannot delete/edit protected resource
- `HAS_CHILDREN` - Cannot delete parent with children

---

## Implementation Notes

### Backend (Golang)

1. **File Structure:**
```
golang-backend/
├── api/
│   ├── system_category_api.go
│   ├── app_component_api.go
│   └── region_api.go
├── models/
│   ├── system_category.go
│   ├── app_component.go
│   └── region.go
├── handlers/
│   ├── system_category_handler.go
│   ├── app_component_handler.go
│   └── region_handler.go
└── repositories/
    ├── system_category_repository.go
    ├── app_component_repository.go
    └── region_repository.go
```

2. **Database Migrations:**
- `006_create_system_categories_table.sql`
- `007_create_app_components_table.sql`
- `008_create_regions_table.sql`

3. **Caching Strategy:**
- Cache frequently accessed data (types, groups, countries)
- Invalidate cache on create/update/delete operations
- TTL: 1 hour for static data

4. **Performance:**
- Index on foreign keys, search fields, date ranges
- Pagination for list endpoints
- Lazy loading for hierarchy trees

---

## Testing

### Unit Tests Required
- CRUD operations for each table
- Validation rules
- Hierarchy operations
- Date range validation for regions
- Circular reference prevention

### Integration Tests
- Cross-table queries
- Parent-child relationships
- Cascade operations
- Transaction rollback scenarios

---

## Security

### Authorization Rules
1. **System Categories:**
   - View: All authenticated users
   - Create/Edit: Admin only
   - Delete: Admin only (if `is_editable=true`)

2. **App Components:**
   - View: All authenticated users
   - Create/Edit/Delete: System Admin only

3. **Regions:**
   - View: All authenticated users
   - Create/Edit/Delete: System Admin only

### Audit Logging
Log all CUD operations with:
- User ID
- Action type
- Before/after values
- Timestamp
