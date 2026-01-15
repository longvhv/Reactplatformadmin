# Service Packages API Documentation

## 📋 Overview

RESTful API endpoints for managing **Service Packages** (subscription plans/tiers).

**Base URL:** `/api/v1/service-packages`

---

## 🔐 Authentication

All endpoints require Bearer token authentication:
```
Authorization: Bearer {access_token}
```

---

## 📡 API Endpoints

### 1. Get All Service Packages

**GET** `/api/v1/service-packages`

Retrieve list of service packages with optional filters.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `saas_product_id` | UUID | No | Filter by product ID |
| `status` | String | No | Filter by status (ACTIVE/INACTIVE/ARCHIVED) |
| `is_public` | Boolean | No | Filter by visibility |
| `search` | String | No | Search by name or code |
| `limit` | Integer | No | Max results (default: 50) |
| `offset` | Integer | No | Offset for pagination (default: 0) |

#### Response 200 OK

```json
[
  {
    "_id": "01933f12-3456-7890-abcd-ef1234567890",
    "saas_product_id": "01933f11-1111-2222-3333-444444444444",
    "code": "hrm-professional",
    "name": "HRM Professional Plan",
    "description": "Best for companies with 50-200 employees",
    "price_amount": 2990000.0000,
    "currency_code": "VND",
    "entitlements_config": {
      "apps": {
        "hrm": {
          "enabled": true,
          "features": {
            "payroll": true,
            "attendance": true
          }
        }
      }
    },
    "status": "ACTIVE",
    "is_public": true,
    "display_order": 2,
    "trial_days": 14,
    "billing_cycle": "MONTHLY",
    "max_users": 50,
    "max_storage": 100,
    "features": {
      "highlighted": ["Priority Support", "Advanced Analytics"]
    },
    "metadata": {},
    "created_at": "2025-01-13T10:00:00Z",
    "updated_at": "2025-01-13T10:00:00Z",
    "version": 1,
    "product_name": "HRM Suite",
    "product_code": "hrm-suite"
  }
]
```

#### cURL Example

```bash
curl -X GET \
  'https://api.example.com/api/v1/service-packages?status=ACTIVE&is_public=true&limit=20' \
  -H 'Authorization: Bearer {token}'
```

---

### 2. Get Package by ID

**GET** `/api/v1/service-packages/:id`

Retrieve a single package by ID.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Package ID |

#### Response 200 OK

```json
{
  "_id": "01933f12-3456-7890-abcd-ef1234567890",
  "saas_product_id": "01933f11-1111-2222-3333-444444444444",
  "code": "hrm-professional",
  "name": "HRM Professional Plan",
  "description": "Best for companies with 50-200 employees",
  "price_amount": 2990000.0000,
  "currency_code": "VND",
  "entitlements_config": {...},
  "status": "ACTIVE",
  "is_public": true,
  "display_order": 2,
  "trial_days": 14,
  "billing_cycle": "MONTHLY",
  "max_users": 50,
  "max_storage": 100,
  "features": {...},
  "metadata": {},
  "created_at": "2025-01-13T10:00:00Z",
  "updated_at": "2025-01-13T10:00:00Z",
  "version": 1,
  "product_name": "HRM Suite",
  "product_code": "hrm-suite"
}
```

#### Response 404 Not Found

```json
{
  "error": "Package not found"
}
```

---

### 3. Create Package

**POST** `/api/v1/service-packages`

Create a new service package.

#### Request Body

```json
{
  "saas_product_id": "01933f11-1111-2222-3333-444444444444",
  "code": "hrm-starter",
  "name": "HRM Starter Plan",
  "description": "Perfect for small businesses",
  "price_amount": 990000.0000,
  "currency_code": "VND",
  "entitlements_config": {
    "apps": {
      "hrm": {
        "enabled": true,
        "features": {
          "employee_management": true,
          "payroll": false
        }
      }
    },
    "shared_quotas": {
      "users": 10,
      "storage_gb": 10
    }
  },
  "status": "ACTIVE",
  "is_public": true,
  "display_order": 1,
  "trial_days": 7,
  "billing_cycle": "MONTHLY",
  "max_users": 10,
  "max_storage": 10,
  "features": {
    "highlighted": ["Email Support", "Basic Analytics"]
  },
  "metadata": {},
  "created_by": "01933f10-user-uuid"
}
```

#### Response 201 Created

```json
{
  "_id": "01933f12-new-uuid",
  "saas_product_id": "01933f11-1111-2222-3333-444444444444",
  "code": "hrm-starter",
  "name": "HRM Starter Plan",
  "price_amount": 990000.0000,
  "currency_code": "VND",
  "status": "ACTIVE",
  "created_at": "2025-01-13T11:00:00Z",
  "updated_at": "2025-01-13T11:00:00Z",
  "version": 1
}
```

#### Response 400 Bad Request

```json
{
  "error": "code is required"
}
```

#### Response 409 Conflict

```json
{
  "error": "Package code already exists"
}
```

---

### 4. Update Package

**PATCH** `/api/v1/service-packages/:id`

Update an existing package (with optimistic locking).

#### Request Body

```json
{
  "name": "HRM Professional Plan (Updated)",
  "price_amount": 3490000.0000,
  "entitlements_config": {
    "apps": {
      "hrm": {
        "enabled": true,
        "features": {
          "payroll": true,
          "attendance": true,
          "advanced_reports": true
        }
      }
    }
  },
  "version": 1,
  "updated_by": "01933f10-user-uuid"
}
```

#### Response 200 OK

```json
{
  "message": "Package updated successfully",
  "version": 2,
  "updated_at": "2025-01-13T12:00:00Z"
}
```

#### Response 409 Conflict

```json
{
  "error": "Package not found or version conflict"
}
```

---

### 5. Soft Delete Package

**DELETE** `/api/v1/service-packages/:id`

Soft delete a package.

#### Request Body (Optional)

```json
{
  "deleted_by": "01933f10-user-uuid"
}
```

#### Response 200 OK

```json
{
  "message": "Package deleted successfully"
}
```

#### Response 404 Not Found

```json
{
  "error": "Package not found"
}
```

---

### 6. Get Packages by Product

**GET** `/api/v1/saas-products/:product_id/packages`

Get all packages for a specific product.

#### Response 200 OK

```json
[
  {
    "_id": "01933f12-starter-uuid",
    "code": "hrm-starter",
    "name": "HRM Starter",
    "price_amount": 990000.0000,
    "display_order": 1
  },
  {
    "_id": "01933f12-pro-uuid",
    "code": "hrm-pro",
    "name": "HRM Professional",
    "price_amount": 2990000.0000,
    "display_order": 2
  }
]
```

---

### 7. Get Package Statistics

**GET** `/api/v1/service-packages/statistics`

Get aggregate statistics about packages.

#### Response 200 OK

```json
{
  "total_packages": 45,
  "active_packages": 38,
  "public_packages": 35,
  "avg_price": 1890000.5000,
  "min_price": 0.0000,
  "max_price": 9990000.0000
}
```

---

## 🔄 Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 404 | Not Found |
| 409 | Conflict (duplicate code, version mismatch) |
| 500 | Internal Server Error |

---

## 📝 Example Use Cases

### Use Case 1: Public Pricing Page

```bash
# Get all public active packages sorted by display order
curl -X GET \
  'https://api.example.com/api/v1/service-packages?status=ACTIVE&is_public=true' \
  -H 'Authorization: Bearer {token}'
```

### Use Case 2: Product Details Page

```bash
# Get all packages for a product
curl -X GET \
  'https://api.example.com/api/v1/saas-products/01933f11-uuid/packages' \
  -H 'Authorization: Bearer {token}'
```

### Use Case 3: Create Tiered Pricing

```bash
# Create Starter package
curl -X POST \
  'https://api.example.com/api/v1/service-packages' \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "saas_product_id": "01933f11-uuid",
    "code": "hrm-starter",
    "name": "Starter",
    "price_amount": 990000,
    "currency_code": "VND",
    "display_order": 1,
    "max_users": 10
  }'

# Create Professional package
curl -X POST \
  'https://api.example.com/api/v1/service-packages' \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "saas_product_id": "01933f11-uuid",
    "code": "hrm-pro",
    "name": "Professional",
    "price_amount": 2990000,
    "currency_code": "VND",
    "display_order": 2,
    "max_users": 50
  }'
```

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team
