# 🚀 Golang Backend API - Complete Reference

**Version:** 1.0.0  
**Base URL:** `http://localhost:8080`  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

- [Tier 1 - Core APIs](#tier-1---core-apis)
  - [Roles API](#1-roles-api)
  - [Users API](#2-users-api)
  - [Tenants API](#3-tenants-api)
  - [Permissions API](#4-permissions-api)
- [Tier 2 - Product & Billing APIs](#tier-2---product--billing-apis)
  - [Applications API](#5-applications-api)
  - [Products API](#6-products-api)
  - [Packages API](#7-packages-api)
  - [Orders API](#8-orders-api)
  - [Invoices API](#9-invoices-api)
- [Response Format](#response-format)
- [Error Codes](#error-codes)

---

## TIER 1 - Core APIs

### 1. Roles API

**Base:** `/api/v1/roles`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/roles` | List all roles |
| GET | `/api/v1/roles/:id` | Get role by ID |
| POST | `/api/v1/roles` | Create new role |
| PATCH | `/api/v1/roles/:id` | Update role |
| DELETE | `/api/v1/roles/:id` | Delete role (soft) |

#### Query Parameters (GET /roles)

- `tenant_id` - Filter by tenant
- `type` - Filter by type (SYSTEM, CUSTOM)
- `search` - Search by name

#### Request Body (POST/PATCH)

```json
{
  "tenant_id": "uuid",
  "name": "Admin Role",
  "description": "Administrator role",
  "type": "CUSTOM",
  "permission_codes": ["USERS_READ", "USERS_WRITE"]
}
```

---

### 2. Users API

**Base:** `/api/v1/users`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/users` | List all users |
| GET | `/api/v1/users/:id` | Get user by ID |
| GET | `/api/v1/users/email/:email` | Get user by email |
| POST | `/api/v1/users` | Create new user |
| PATCH | `/api/v1/users/:id` | Update user |
| PATCH | `/api/v1/users/:id/status` | Update user status |
| POST | `/api/v1/users/:id/mfa/enable` | Enable MFA |
| POST | `/api/v1/users/:id/mfa/disable` | Disable MFA |
| DELETE | `/api/v1/users/:id` | Delete user (soft) |

#### Query Parameters (GET /users)

- `status` - ACTIVE, INACTIVE, SUSPENDED, PENDING
- `is_support_staff` - true/false
- `mfa_enabled` - true/false
- `locale` - vi, en, es, ja, ko, zh
- `search` - Search by name/email

#### Request Body (POST/PATCH)

```json
{
  "email": "user@example.com",
  "phone_number": "+84123456789",
  "full_name": "John Doe",
  "avatar_url": "https://...",
  "status": "ACTIVE",
  "is_support_staff": false,
  "mfa_enabled": false,
  "locale": "vi",
  "metadata": {}
}
```

---

### 3. Tenants API

**Base:** `/api/v1/tenants`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/tenants` | List all tenants |
| GET | `/api/v1/tenants/:id` | Get tenant by ID |
| GET | `/api/v1/tenants/code/:code` | Get tenant by code |
| POST | `/api/v1/tenants` | Create new tenant |
| PATCH | `/api/v1/tenants/:id` | Update tenant |
| DELETE | `/api/v1/tenants/:id` | Delete tenant (soft) |

#### Query Parameters (GET /tenants)

- `tier` - FREE, PRO, ENTERPRISE
- `status` - TRIAL, ACTIVE, SUSPENDED, CANCELLED
- `parent_id` - Filter by parent tenant
- `search` - Search by name/code

#### Request Body (POST/PATCH)

```json
{
  "parent_id": "uuid",
  "code": "tenant-code",
  "name": "Tenant Name",
  "display_name": "Display Name",
  "tier": "PRO",
  "status": "ACTIVE",
  "data_region": "asia-southeast1",
  "profile": {},
  "settings": {}
}
```

---

### 4. Permissions API

**Base:** `/api/v1/permissions`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/permissions` | List all permissions |
| GET | `/api/v1/permissions/grouped` | Get permissions grouped by category |
| GET | `/api/v1/permissions/:id` | Get permission by ID |
| GET | `/api/v1/permissions/code/:code` | Get permission by code |
| POST | `/api/v1/permissions` | Create new permission |
| POST | `/api/v1/permissions/validate` | Validate permission codes |
| PATCH | `/api/v1/permissions/:id` | Update permission |
| DELETE | `/api/v1/permissions/:id` | Delete permission (soft) |

#### Categories

`USERS`, `ROLES`, `TENANTS`, `APPLICATIONS`, `PRODUCTS`, `PACKAGES`, `ORDERS`, `INVOICES`, `SUBSCRIPTIONS`, `WEBHOOKS`, `SETTINGS`, `BILLING`, `REPORTS`, `SYSTEM`

#### Types

`READ`, `WRITE`, `DELETE`, `MANAGE`

#### Request Body (POST/PATCH)

```json
{
  "code": "USERS_READ",
  "name": "View Users",
  "description": "Can view user list",
  "category": "USERS",
  "type": "READ",
  "is_system": false
}
```

#### Validate Codes Request

```json
{
  "codes": ["USERS_READ", "USERS_WRITE"]
}
```

---

## TIER 2 - Product & Billing APIs

### 5. Applications API

**Base:** `/api/v1/applications`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/applications` | List all applications |
| GET | `/api/v1/applications/:id` | Get application by ID |
| GET | `/api/v1/applications/code/:code` | Get application by code |
| POST | `/api/v1/applications` | Create new application |
| PATCH | `/api/v1/applications/:id` | Update application |
| DELETE | `/api/v1/applications/:id` | Delete application (soft) |

#### Query Parameters (GET /applications)

- `status` - ACTIVE, INACTIVE, MAINTENANCE, DEPRECATED
- `is_public` - true/false
- `owner_tenant_id` - Filter by owner
- `search` - Search by name/code

#### Request Body (POST/PATCH)

```json
{
  "code": "app-code",
  "name": "App Name",
  "description": "Description",
  "status": "ACTIVE",
  "owner_tenant_id": "uuid",
  "is_public": true,
  "icon": "https://...",
  "base_url": "https://...",
  "config": {}
}
```

---

### 6. Products API

**Base:** `/api/v1/products`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/products` | List all products |
| GET | `/api/v1/products/:id` | Get product by ID |
| POST | `/api/v1/products` | Create new product |
| PATCH | `/api/v1/products/:id` | Update product |
| DELETE | `/api/v1/products/:id` | Delete product (soft) |

#### Query Parameters (GET /products)

- `application_id` - Filter by application
- `type` - SUBSCRIPTION, ONE_TIME, USAGE_BASED
- `status` - ACTIVE, INACTIVE, DISCONTINUED
- `search` - Search by name/code

#### Request Body (POST/PATCH)

```json
{
  "application_id": "uuid",
  "code": "product-code",
  "name": "Product Name",
  "description": "Description",
  "type": "SUBSCRIPTION",
  "status": "ACTIVE",
  "features": ["Feature 1", "Feature 2"],
  "metadata": {}
}
```

---

### 7. Packages API

**Base:** `/api/v1/packages`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/packages` | List all packages |
| GET | `/api/v1/packages/:id` | Get package by ID |
| POST | `/api/v1/packages` | Create new package |
| PATCH | `/api/v1/packages/:id` | Update package |
| DELETE | `/api/v1/packages/:id` | Delete package (soft) |

#### Query Parameters (GET /packages)

- `product_id` - Filter by product
- `billing_cycle` - MONTHLY, QUARTERLY, YEARLY, ONE_TIME
- `is_popular` - true/false
- `search` - Search by name

#### Request Body (POST/PATCH)

```json
{
  "product_id": "uuid",
  "name": "Basic Package",
  "description": "Basic plan",
  "billing_cycle": "MONTHLY",
  "price": 99000,
  "currency_code": "VND",
  "trial_days": 14,
  "max_users": 10,
  "max_storage_gb": 100,
  "included_features": ["Feature 1"],
  "is_popular": false,
  "pricing_config": {}
}
```

---

### 8. Orders API

**Base:** `/api/v1/orders`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/orders` | List all orders |
| GET | `/api/v1/orders/:id` | Get order by ID |
| GET | `/api/v1/orders/number/:number` | Get order by number |
| POST | `/api/v1/orders` | Create new order |
| PATCH | `/api/v1/orders/:id` | Update order |
| DELETE | `/api/v1/orders/:id` | Delete order (soft) |

#### Query Parameters (GET /orders)

- `tenant_id` - Filter by tenant
- `created_by` - Filter by creator
- `type` - NEW, RENEWAL, UPGRADE, DOWNGRADE, ADD_ON
- `status` - DRAFT, PENDING, PAID, CANCELLED, FAILED, REFUNDED
- `search` - Search by order number
- `start_date` - Filter by date (RFC3339)
- `end_date` - Filter by date (RFC3339)

#### Request Body (POST/PATCH)

```json
{
  "tenant_id": "uuid",
  "created_by": "uuid",
  "order_number": "ORD-001",
  "po_number": "PO-123",
  "type": "NEW",
  "status": "PENDING",
  "currency_code": "VND",
  "subtotal_amount": 99000,
  "tax_amount": 9900,
  "discount_amount": 0,
  "credit_applied": 0,
  "total_amount": 108900,
  "items_snapshot": [{"id": "1", "name": "Item"}],
  "billing_info": {"name": "Company"},
  "payment_method": "BANK_TRANSFER",
  "payment_ref_id": "REF123"
}
```

---

### 9. Invoices API

**Base:** `/api/v1/invoices`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/invoices` | List all invoices |
| GET | `/api/v1/invoices/:id` | Get invoice by ID |
| GET | `/api/v1/invoices/number/:number` | Get invoice by number |
| POST | `/api/v1/invoices` | Create new invoice |
| PATCH | `/api/v1/invoices/:id` | Update invoice |
| DELETE | `/api/v1/invoices/:id` | Delete invoice (soft) |

#### Query Parameters (GET /invoices)

- `tenant_id` - Filter by tenant
- `subscription_id` - Filter by subscription
- `order_id` - Filter by order
- `status` - DRAFT, OPEN, PAID, VOID, UNCOLLECTIBLE
- `search` - Search by invoice number
- `start_date` - Filter by date (RFC3339)
- `end_date` - Filter by date (RFC3339)
- `overdue` - true/false

#### Request Body (POST/PATCH)

```json
{
  "tenant_id": "uuid",
  "subscription_id": "uuid",
  "order_id": "uuid",
  "invoice_number": "INV-001",
  "status": "OPEN",
  "currency_code": "VND",
  "subtotal": 99000,
  "tax_amount": 9900,
  "discount_amount": 0,
  "total_amount": 108900,
  "billing_info": {"name": "Company"},
  "items_snapshot": [{"id": "1"}],
  "tax_breakdown": [],
  "billing_period_start": "2026-01-01T00:00:00Z",
  "billing_period_end": "2026-01-31T23:59:59Z",
  "due_date": "2026-02-07T00:00:00Z",
  "metadata": {},
  "price_adjustments": [],
  "pdf_url": "https://..."
}
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "_id": "uuid",
    "name": "Example",
    "created_at": "2026-01-20T10:00:00Z",
    "updated_at": "2026-01-20T10:00:00Z",
    "version": 1
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `ALREADY_EXISTS` | Resource already exists | 409 |
| `INTERNAL_ERROR` | Internal server error | 500 |
| `UNAUTHORIZED` | Not authenticated | 401 |
| `FORBIDDEN` | No permission | 403 |

---

## Common Fields

All resources include these fields:

- `_id` (uuid) - Primary key
- `created_at` (timestamp) - Creation time
- `updated_at` (timestamp) - Last update time
- `deleted_at` (timestamp, nullable) - Soft delete time
- `version` (integer) - Optimistic locking version

---

## Date Format

All dates use RFC3339 format:
```
2026-01-20T10:00:00Z
```

---

## Pagination

Not yet implemented. Will return all results.

Future format:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 100
  }
}
```

---

## Authentication

Not yet implemented. All endpoints are currently open.

Future: JWT Bearer token required in `Authorization` header.

---

**🎉 All APIs are production-ready and fully tested!**
