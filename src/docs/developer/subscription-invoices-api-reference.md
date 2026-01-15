# Subscription Invoices - API Reference

**Module:** Hóa đơn Thuê bao (Subscription Invoices)  
**API Version:** 1.0.0  
**Last Updated:** 2026-01-14  
**Base URL:** `/api/v1`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Data Models](#data-models)
4. [Endpoints](#endpoints)
   - [1. List Invoices](#1-list-invoices)
   - [2. Get Invoice by ID](#2-get-invoice-by-id)
   - [3. Get Invoice by Number](#3-get-invoice-by-number)
   - [4. Create Invoice](#4-create-invoice)
   - [5. Update Invoice](#5-update-invoice)
   - [6. Delete Invoice (Soft Delete)](#6-delete-invoice-soft-delete)
   - [7. Get Invoice with Details (JOINs)](#7-get-invoice-with-details-joins)
   - [8. Pay Invoice](#8-pay-invoice)
   - [9. Get Overdue Invoices](#9-get-overdue-invoices)
   - [10. Get Invoice Statistics](#10-get-invoice-statistics)
5. [Invoice Lifecycle](#invoice-lifecycle)
6. [Billing Period Logic](#billing-period-logic)
7. [Price Adjustments Pattern](#price-adjustments-pattern)
8. [Error Handling](#error-handling)
9. [Performance Considerations](#performance-considerations)

---

## Overview

API cho module **Subscription Invoices** quản lý toàn bộ lifecycle của hóa đơn thuê bao, từ tạo mới, theo dõi thanh toán, đến quản lý công nợ và báo cáo.

### Key Features

- ✅ **Auto-Generate Invoice Number** - Format `INV-YYYYMMDD-XXXXXX`
- ✅ **Billing Period Management** - Chu kỳ thanh toán rõ ràng
- ✅ **Payment Processing** - Xử lý thanh toán với status transition
- ✅ **Overdue Tracking** - Tự động tracking hóa đơn quá hạn
- ✅ **Partner Distribution** - Hỗ trợ mô hình phân phối đa tầng
- ✅ **Price Adjustments** - JSONB array cho discounts/credits/surcharges
- ✅ **Metadata Extensibility** - JSONB cho thông tin bổ sung
- ✅ **Optimistic Locking** - Version field chống concurrent updates
- ✅ **Soft Delete** - Giữ lại dữ liệu audit trail

### Business Rules

1. **Invoice Number**: Unique, auto-generated, format `INV-YYYYMMDD-XXXXXX`
2. **Status Flow**: `DRAFT → OPEN → PAID` (hoặc `VOID`/`UNCOLLECTIBLE`)
3. **Billing Period**: `billing_period_end` MUST be after `billing_period_start`
4. **Payment**: Chỉ invoice với status `OPEN` mới có thể thanh toán
5. **Price Adjustments**: Immutable array, không sửa sau khi tạo invoice
6. **Partner Distribution**: Optional, nullable `partner_id`
7. **Overdue**: Auto-calculate based on `due_date < NOW()` và `status = 'OPEN'`

---

## Authentication

**Tất cả endpoints đều yêu cầu authentication.**

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Permissions

| Endpoint | Required Permission | Notes |
|----------|---------------------|-------|
| List Invoices | `invoices:read` | Tenant chỉ xem được invoices của mình |
| Get Invoice | `invoices:read` | Tenant chỉ xem được invoices của mình |
| Create Invoice | `invoices:write` | Admin hoặc System |
| Update Invoice | `invoices:write` | Admin only |
| Delete Invoice | `invoices:delete` | Admin only |
| Pay Invoice | `invoices:pay` | Tenant hoặc Admin |
| Overdue | `invoices:read` | Admin only |
| Statistics | `invoices:read` | Admin or filtered by tenant |

---

## Data Models

### Invoice Object

```typescript
interface Invoice {
  // I. Định danh & Liên kết
  _id: string;                    // UUID v7
  tenant_id: string;              // FK -> tenants._id
  partner_id?: string;            // FK -> tenants._id (nullable)
  subscription_id: string;        // FK -> tenant_subscriptions._id
  invoice_number: string;         // UNIQUE, format: INV-YYYYMMDD-XXXXXX
  
  // II. Tài chính (STRICT FINANCIAL RULES)
  amount: number;                 // NUMERIC(19, 4)
  currency_code: string;          // ISO 4217 (VND, USD, etc.)
  status: InvoiceStatus;          // DRAFT | OPEN | PAID | VOID | UNCOLLECTIBLE
  
  // III. Chu kỳ & Hạn thanh toán
  billing_period_start: string;   // ISO 8601 timestamp
  billing_period_end: string;     // ISO 8601 timestamp
  due_date: string;               // ISO 8601 timestamp
  paid_at?: string;               // ISO 8601 timestamp (nullable)
  
  // IV. Dữ liệu Snapshot & Mở rộng
  price_adjustments: PriceAdjustment[];  // JSONB array
  metadata: Record<string, any>;         // JSONB object
  
  // V. Quản trị & Audit
  version: number;                // Optimistic locking
  created_at: string;             // ISO 8601 timestamp
  updated_at: string;             // ISO 8601 timestamp
  deleted_at?: string;            // ISO 8601 timestamp (soft delete)
}
```

### Invoice Status Enum

```typescript
enum InvoiceStatus {
  DRAFT = 'DRAFT',                // Hóa đơn nháp, chưa gửi
  OPEN = 'OPEN',                  // Đã phát hành, chờ thanh toán
  PAID = 'PAID',                  // Đã thanh toán
  VOID = 'VOID',                  // Hủy bỏ
  UNCOLLECTIBLE = 'UNCOLLECTIBLE' // Không thu hồi được (bad debt)
}
```

### Price Adjustment Object

```typescript
interface PriceAdjustment {
  type: string;                   // DISCOUNT | CREDIT | SURCHARGE | etc.
  description: string;            // Human-readable description
  amount: number;                 // Positive (increase) or negative (decrease)
  reason?: string;                // Optional reason
}
```

### Invoice with Details

```typescript
interface InvoiceWithDetails extends Invoice {
  // JOIN data
  tenant_name?: string;
  partner_name?: string;
  subscription_package_name?: string;
  subscription_status?: string;
}
```

---

## Endpoints

### 1. List Invoices

Lấy danh sách hóa đơn với filtering và pagination.

**Endpoint:**
```
GET /invoices
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | string (UUID) | No | Filter by tenant |
| `partner_id` | string (UUID) | No | Filter by partner |
| `subscription_id` | string (UUID) | No | Filter by subscription |
| `status` | string | No | Filter by status |
| `overdue` | boolean | No | Filter only overdue invoices (true/false) |
| `limit` | number | No | Max results (default: 100) |
| `offset` | number | No | Pagination offset |

**Example Request:**

```bash
curl -X GET "https://api.example.com/invoices?tenant_id=<uuid>&status=OPEN" \
  -H "Authorization: Bearer <token>"
```

**Example Response:**

```json
[
  {
    "_id": "01234567-89ab-7def-0123-456789abcdef",
    "tenant_id": "tenant-uuid",
    "partner_id": null,
    "subscription_id": "sub-uuid",
    "invoice_number": "INV-20260114-123456",
    "amount": 1000000.0000,
    "currency_code": "VND",
    "status": "OPEN",
    "billing_period_start": "2026-01-01T00:00:00Z",
    "billing_period_end": "2026-01-31T23:59:59Z",
    "due_date": "2026-02-07T23:59:59Z",
    "paid_at": null,
    "price_adjustments": [
      {
        "type": "DISCOUNT",
        "description": "Early payment discount",
        "amount": -50000.0000,
        "reason": "Promotion"
      }
    ],
    "metadata": {
      "auto_generated": true,
      "billing_cycle": "MONTHLY"
    },
    "version": 1,
    "created_at": "2026-01-14T10:00:00Z",
    "updated_at": "2026-01-14T10:00:00Z"
  }
]
```

**Response Codes:**

- `200 OK` - Success
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

### 2. Get Invoice by ID

Lấy thông tin chi tiết một hóa đơn theo ID.

**Endpoint:**
```
GET /invoices/:id
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Invoice ID |

**Example Request:**

```bash
curl -X GET "https://api.example.com/invoices/01234567-89ab-7def-0123-456789abcdef" \
  -H "Authorization: Bearer <token>"
```

**Example Response:**

```json
{
  "_id": "01234567-89ab-7def-0123-456789abcdef",
  "tenant_id": "tenant-uuid",
  "subscription_id": "sub-uuid",
  "invoice_number": "INV-20260114-123456",
  "amount": 1000000.0000,
  "currency_code": "VND",
  "status": "OPEN",
  "billing_period_start": "2026-01-01T00:00:00Z",
  "billing_period_end": "2026-01-31T23:59:59Z",
  "due_date": "2026-02-07T23:59:59Z",
  "price_adjustments": [],
  "metadata": {},
  "version": 1,
  "created_at": "2026-01-14T10:00:00Z",
  "updated_at": "2026-01-14T10:00:00Z"
}
```

**Response Codes:**

- `200 OK` - Success
- `404 Not Found` - Invoice not found
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

### 3. Get Invoice by Number

Tra cứu hóa đơn theo invoice number.

**Endpoint:**
```
GET /invoices/number/:number
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `number` | string | Yes | Invoice number (e.g., INV-20260114-123456) |

**Example Request:**

```bash
curl -X GET "https://api.example.com/invoices/number/INV-20260114-123456" \
  -H "Authorization: Bearer <token>"
```

**Example Response:**

Same as [Get Invoice by ID](#2-get-invoice-by-id)

**Response Codes:**

- `200 OK` - Success
- `404 Not Found` - Invoice not found
- `401 Unauthorized` - Missing or invalid token

---

### 4. Create Invoice

Tạo hóa đơn mới.

**Endpoint:**
```
POST /invoices
```

**Request Body:**

```typescript
{
  tenant_id: string;              // Required
  partner_id?: string;            // Optional
  subscription_id: string;        // Required
  amount: number;                 // Required
  currency_code: string;          // Default: 'VND'
  status: InvoiceStatus;          // Default: 'OPEN'
  billing_period_start: string;   // Required (ISO 8601)
  billing_period_end: string;     // Required (ISO 8601)
  due_date: string;               // Required (ISO 8601)
  price_adjustments?: PriceAdjustment[];  // Optional
  metadata?: Record<string, any>; // Optional
}
```

**Example Request:**

```bash
curl -X POST "https://api.example.com/invoices" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "tenant-uuid",
    "subscription_id": "sub-uuid",
    "amount": 1000000.0000,
    "currency_code": "VND",
    "status": "OPEN",
    "billing_period_start": "2026-01-01T00:00:00Z",
    "billing_period_end": "2026-01-31T23:59:59Z",
    "due_date": "2026-02-07T23:59:59Z",
    "price_adjustments": [
      {
        "type": "DISCOUNT",
        "description": "Early payment discount",
        "amount": -50000.0000,
        "reason": "Promotion"
      }
    ],
    "metadata": {
      "auto_generated": true
    }
  }'
```

**Example Response:**

```json
{
  "_id": "01234567-89ab-7def-0123-456789abcdef",
  "tenant_id": "tenant-uuid",
  "subscription_id": "sub-uuid",
  "invoice_number": "INV-20260114-123456",
  "amount": 1000000.0000,
  "currency_code": "VND",
  "status": "OPEN",
  "billing_period_start": "2026-01-01T00:00:00Z",
  "billing_period_end": "2026-01-31T23:59:59Z",
  "due_date": "2026-02-07T23:59:59Z",
  "price_adjustments": [
    {
      "type": "DISCOUNT",
      "description": "Early payment discount",
      "amount": -50000.0000,
      "reason": "Promotion"
    }
  ],
  "metadata": {
    "auto_generated": true
  },
  "version": 1,
  "created_at": "2026-01-14T10:00:00Z",
  "updated_at": "2026-01-14T10:00:00Z"
}
```

**Business Logic:**

1. **Validate Tenant**: Tenant must exist and be ACTIVE
2. **Validate Subscription**: Subscription must exist and not be deleted
3. **Validate Partner** (if provided): Partner must exist
4. **Validate Billing Period**: `billing_period_end > billing_period_start`
5. **Auto-Generate Invoice Number**: Format `INV-YYYYMMDD-XXXXXX`
6. **Set Defaults**:
   - `currency_code`: 'VND'
   - `status`: 'OPEN'
   - `price_adjustments`: []
   - `metadata`: {}
   - `version`: 1

**Response Codes:**

- `201 Created` - Invoice created successfully
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

### 5. Update Invoice

Cập nhật thông tin hóa đơn (partial update).

**Endpoint:**
```
PATCH /invoices/:id
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Invoice ID |

**Request Body:**

```typescript
{
  amount?: number;
  status?: InvoiceStatus;
  due_date?: string;              // ISO 8601
  price_adjustments?: PriceAdjustment[];
  metadata?: Record<string, any>;
  version: number;                // Required for optimistic locking
}
```

**Example Request:**

```bash
curl -X PATCH "https://api.example.com/invoices/01234567-89ab-7def-0123-456789abcdef" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 950000.0000,
    "due_date": "2026-02-14T23:59:59Z",
    "version": 1
  }'
```

**Example Response:**

```json
{
  "message": "Invoice updated successfully",
  "version": 2
}
```

**Business Logic:**

1. **Optimistic Locking**: Check `version` field matches current version
2. **Partial Update**: Only update provided fields
3. **Auto-Increment Version**: `version = version + 1`
4. **Update Timestamp**: `updated_at = NOW()`

**Response Codes:**

- `200 OK` - Invoice updated successfully
- `400 Bad Request` - No fields to update
- `404 Not Found` - Invoice not found
- `409 Conflict` - Version conflict (optimistic locking)
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

### 6. Delete Invoice (Soft Delete)

Xóa mềm hóa đơn (soft delete).

**Endpoint:**
```
DELETE /invoices/:id
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Invoice ID |

**Example Request:**

```bash
curl -X DELETE "https://api.example.com/invoices/01234567-89ab-7def-0123-456789abcdef" \
  -H "Authorization: Bearer <token>"
```

**Example Response:**

```json
{
  "message": "Invoice deleted successfully"
}
```

**Business Logic:**

1. **Soft Delete**: Set `deleted_at = NOW()`
2. **Version Increment**: `version = version + 1`
3. **Preserve Data**: Data vẫn tồn tại trong database

**Response Codes:**

- `200 OK` - Invoice deleted successfully
- `404 Not Found` - Invoice not found
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

### 7. Get Invoice with Details (JOINs)

Lấy thông tin hóa đơn kèm theo dữ liệu từ các bảng liên quan.

**Endpoint:**
```
GET /invoices/:id/details
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Invoice ID |

**Example Request:**

```bash
curl -X GET "https://api.example.com/invoices/01234567-89ab-7def-0123-456789abcdef/details" \
  -H "Authorization: Bearer <token>"
```

**Example Response:**

```json
{
  "_id": "01234567-89ab-7def-0123-456789abcdef",
  "tenant_id": "tenant-uuid",
  "tenant_name": "Công ty ABC",
  "partner_id": "partner-uuid",
  "partner_name": "Đối tác XYZ",
  "subscription_id": "sub-uuid",
  "subscription_package_name": "HRM Pro - Annual",
  "subscription_status": "ACTIVE",
  "invoice_number": "INV-20260114-123456",
  "amount": 1000000.0000,
  "currency_code": "VND",
  "status": "OPEN",
  "billing_period_start": "2026-01-01T00:00:00Z",
  "billing_period_end": "2026-01-31T23:59:59Z",
  "due_date": "2026-02-07T23:59:59Z",
  "price_adjustments": [],
  "metadata": {},
  "version": 1,
  "created_at": "2026-01-14T10:00:00Z",
  "updated_at": "2026-01-14T10:00:00Z"
}
```

**JOINs Performed:**

- `LEFT JOIN tenants` on `tenant_id` → `tenant_name`
- `LEFT JOIN tenants` on `partner_id` → `partner_name`
- `LEFT JOIN tenant_subscriptions` on `subscription_id` → `subscription_status`
- `LEFT JOIN service_packages` on subscription's `package_id` → `subscription_package_name`

**Response Codes:**

- `200 OK` - Success
- `404 Not Found` - Invoice not found
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

### 8. Pay Invoice

Đánh dấu hóa đơn đã thanh toán.

**Endpoint:**
```
POST /invoices/:id/pay
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Invoice ID |

**Request Body:**

```typescript
{
  payment_method: string;         // CREDIT_CARD | BANK_TRANSFER | WALLET
  payment_date?: string;          // ISO 8601 (default: NOW())
  metadata?: Record<string, any>; // Additional payment info
}
```

**Example Request:**

```bash
curl -X POST "https://api.example.com/invoices/01234567-89ab-7def-0123-456789abcdef/pay" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "CREDIT_CARD",
    "metadata": {
      "transaction_id": "txn_abc123",
      "gateway": "stripe"
    }
  }'
```

**Example Response:**

```json
{
  "message": "Invoice paid successfully",
  "paid_at": "2026-01-14T15:30:00Z",
  "version": 2,
  "status": "PAID"
}
```

**Business Logic:**

1. **Validate Status**: Chỉ invoice với `status = 'OPEN'` mới có thể thanh toán
2. **Status Transition**: `OPEN → PAID`
3. **Set paid_at**: Timestamp khi thanh toán
4. **Update Metadata**: Merge payment info vào metadata
5. **Version Increment**: `version = version + 1`

**Response Codes:**

- `200 OK` - Payment successful
- `400 Bad Request` - Invoice không ở trạng thái OPEN
- `404 Not Found` - Invoice not found
- `409 Conflict` - Status changed (concurrent modification)
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

### 9. Get Overdue Invoices

Lấy danh sách các hóa đơn quá hạn thanh toán.

**Endpoint:**
```
GET /invoices/overdue
```

**Query Parameters:** None

**Example Request:**

```bash
curl -X GET "https://api.example.com/invoices/overdue" \
  -H "Authorization: Bearer <token>"
```

**Example Response:**

```json
[
  {
    "_id": "01234567-89ab-7def-0123-456789abcdef",
    "tenant_id": "tenant-uuid",
    "subscription_id": "sub-uuid",
    "invoice_number": "INV-20260101-999999",
    "amount": 1000000.0000,
    "currency_code": "VND",
    "status": "OPEN",
    "billing_period_start": "2025-12-01T00:00:00Z",
    "billing_period_end": "2025-12-31T23:59:59Z",
    "due_date": "2026-01-07T23:59:59Z",
    "price_adjustments": [],
    "metadata": {},
    "version": 1,
    "created_at": "2025-12-01T10:00:00Z",
    "updated_at": "2025-12-01T10:00:00Z",
    "overdue_duration": "7 days"
  }
]
```

**Business Logic:**

1. **Filter Criteria**: `status = 'OPEN' AND due_date < NOW()`
2. **Order**: `due_date ASC` (oldest first)
3. **Calculate Duration**: `NOW() - due_date`

**Response Codes:**

- `200 OK` - Success (may return empty array)
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

### 10. Get Invoice Statistics

Lấy thống kê tổng hợp về hóa đơn.

**Endpoint:**
```
GET /invoices/stats
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | string (UUID) | No | Filter stats by tenant |

**Example Request:**

```bash
curl -X GET "https://api.example.com/invoices/stats?tenant_id=tenant-uuid" \
  -H "Authorization: Bearer <token>"
```

**Example Response:**

```json
{
  "total_invoices": 150,
  "draft_count": 5,
  "open_count": 30,
  "paid_count": 100,
  "void_count": 10,
  "uncollectible_count": 5,
  "overdue_count": 8,
  "total_amount": 150000000.0000,
  "paid_amount": 100000000.0000,
  "outstanding_amount": 30000000.0000
}
```

**Metrics Included:**

- `total_invoices`: Tổng số hóa đơn
- `draft_count`: Số hóa đơn DRAFT
- `open_count`: Số hóa đơn OPEN
- `paid_count`: Số hóa đơn PAID
- `void_count`: Số hóa đơn VOID
- `uncollectible_count`: Số hóa đơn UNCOLLECTIBLE
- `overdue_count`: Số hóa đơn quá hạn
- `total_amount`: Tổng số tiền tất cả hóa đơn
- `paid_amount`: Tổng số tiền đã thanh toán
- `outstanding_amount`: Tổng số tiền chưa thanh toán (OPEN)

**Response Codes:**

- `200 OK` - Success
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

## Invoice Lifecycle

### Status Flow Diagram

```
DRAFT ──────> OPEN ──────> PAID
                │
                ├──────> VOID (manual cancellation)
                │
                └──────> UNCOLLECTIBLE (bad debt write-off)
```

### Status Descriptions

| Status | Description | Can Transition To | Can Be Paid? |
|--------|-------------|-------------------|--------------|
| **DRAFT** | Hóa đơn nháp, chưa gửi cho khách hàng | OPEN, VOID | No |
| **OPEN** | Đã phát hành, chờ thanh toán | PAID, VOID, UNCOLLECTIBLE | **Yes** |
| **PAID** | Đã thanh toán thành công | *(terminal state)* | No |
| **VOID** | Hủy bỏ (admin action) | *(terminal state)* | No |
| **UNCOLLECTIBLE** | Không thu hồi được (bad debt) | *(terminal state)* | No |

### Transition Rules

1. **DRAFT → OPEN**
   - Manual admin action
   - Auto-generate when subscription renews

2. **OPEN → PAID**
   - Via `/invoices/:id/pay` endpoint
   - Sets `paid_at` timestamp
   - Updates `metadata` with payment info

3. **OPEN → VOID**
   - Manual admin action
   - Via `PATCH /invoices/:id` with `status: 'VOID'`

4. **OPEN → UNCOLLECTIBLE**
   - Manual admin action after collection attempts failed
   - Via `PATCH /invoices/:id` with `status: 'UNCOLLECTIBLE'`

5. **Terminal States**
   - `PAID`, `VOID`, `UNCOLLECTIBLE` are final
   - Cannot transition to other states

---

## Billing Period Logic

### Billing Period Definition

```typescript
interface BillingPeriod {
  billing_period_start: Date;   // Ngày bắt đầu chu kỳ
  billing_period_end: Date;     // Ngày kết thúc chu kỳ
  due_date: Date;               // Hạn thanh toán
}
```

### Rules

1. **Period Validity**
   ```typescript
   billing_period_end > billing_period_start  // MUST be true
   ```

2. **Due Date Calculation**
   ```typescript
   // Typically 7-30 days after period_end
   due_date = billing_period_end + payment_terms_days
   
   // Example: Monthly billing with 7 days payment terms
   period_start = 2026-01-01
   period_end   = 2026-01-31
   due_date     = 2026-02-07  // 7 days after period_end
   ```

3. **Overdue Calculation**
   ```typescript
   is_overdue = (status === 'OPEN' && due_date < NOW())
   overdue_days = Math.floor((NOW() - due_date) / (24 * 60 * 60 * 1000))
   ```

### Common Billing Cycles

| Cycle | Period Start | Period End | Typical Payment Terms |
|-------|--------------|------------|----------------------|
| **Monthly** | 1st of month | Last day of month | 7-14 days |
| **Quarterly** | 1st of quarter | Last day of quarter | 14-30 days |
| **Annual** | Subscription start date | Start date + 1 year | 30 days |
| **Custom** | Flexible | Flexible | Configurable |

### Example: Auto-Generate Monthly Invoice

```typescript
function generateMonthlyInvoice(subscription: Subscription): Invoice {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const dueDate = new Date(periodEnd);
  dueDate.setDate(dueDate.getDate() + 7); // 7 days payment terms
  
  return {
    tenant_id: subscription.tenant_id,
    subscription_id: subscription._id,
    amount: subscription.price_amount,
    currency_code: subscription.currency_code,
    status: 'OPEN',
    billing_period_start: periodStart.toISOString(),
    billing_period_end: periodEnd.toISOString(),
    due_date: dueDate.toISOString(),
    // ... other fields
  };
}
```

---

## Price Adjustments Pattern

### Purpose

Price adjustments cho phép điều chỉnh số tiền hóa đơn một cách minh bạch, giữ lại audit trail đầy đủ.

### Structure

```typescript
interface PriceAdjustment {
  type: string;                 // DISCOUNT | CREDIT | SURCHARGE | TAX | etc.
  description: string;          // Human-readable description
  amount: number;               // Positive (increase) or Negative (decrease)
  reason?: string;              // Optional reason/note
}
```

### Common Adjustment Types

| Type | Amount Sign | Description |
|------|-------------|-------------|
| **DISCOUNT** | Negative (-) | Giảm giá (promotion, early payment) |
| **CREDIT** | Negative (-) | Credit note (refund, service issue) |
| **SURCHARGE** | Positive (+) | Phụ phí (late payment, rush service) |
| **TAX** | Positive (+) | Thuế VAT, GST |
| **LATE_FEE** | Positive (+) | Phí trả chậm |
| **ADJUSTMENT** | +/- | Điều chỉnh khác |

### Example Usage

```json
{
  "invoice_number": "INV-20260114-123456",
  "amount": 1000000.0000,
  "price_adjustments": [
    {
      "type": "DISCOUNT",
      "description": "Early payment discount (5%)",
      "amount": -50000.0000,
      "reason": "Paid within 3 days"
    },
    {
      "type": "TAX",
      "description": "VAT 10%",
      "amount": 100000.0000
    },
    {
      "type": "CREDIT",
      "description": "Service credit from previous month",
      "amount": -20000.0000,
      "reason": "Downtime compensation"
    }
  ]
}
```

### Calculation Logic

```typescript
// Base amount (from subscription or custom)
const baseAmount = 1000000.0000;

// Calculate total adjustments
const totalAdjustments = invoice.price_adjustments.reduce(
  (sum, adj) => sum + adj.amount,
  0
);

// Final invoice amount
const finalAmount = baseAmount + totalAdjustments;
// = 1000000 - 50000 + 100000 - 20000 = 1030000.0000
```

### Best Practices

1. **Immutability**: Price adjustments KHÔNG được sửa sau khi invoice tạo
2. **Transparency**: Mỗi adjustment phải có description rõ ràng
3. **Audit Trail**: Lưu reason để dễ audit
4. **Validation**: Validate total amount không âm (trừ credit notes)

---

## Error Handling

### Error Response Format

```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "additional context"
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_REQUEST` | Invalid request body or parameters |
| 400 | `INVALID_BILLING_PERIOD` | billing_period_end <= billing_period_start |
| 400 | `INVALID_STATUS_TRANSITION` | Cannot transition from current status |
| 400 | `TENANT_NOT_FOUND` | Tenant doesn't exist or inactive |
| 400 | `SUBSCRIPTION_NOT_FOUND` | Subscription doesn't exist |
| 401 | `UNAUTHORIZED` | Missing or invalid auth token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `INVOICE_NOT_FOUND` | Invoice not found |
| 409 | `VERSION_CONFLICT` | Optimistic locking conflict |
| 409 | `DUPLICATE_INVOICE_NUMBER` | Invoice number already exists |
| 500 | `INTERNAL_SERVER_ERROR` | Server error |

### Example Error Responses

**Invalid Billing Period:**
```json
{
  "error": "billing_period_end must be after billing_period_start",
  "code": "INVALID_BILLING_PERIOD"
}
```

**Version Conflict:**
```json
{
  "error": "Version conflict. Invoice was modified by another request.",
  "code": "VERSION_CONFLICT",
  "details": {
    "current_version": 5,
    "provided_version": 3
  }
}
```

**Invalid Status Transition:**
```json
{
  "error": "Cannot pay invoice with status PAID. Only OPEN invoices can be paid.",
  "code": "INVALID_STATUS_TRANSITION",
  "details": {
    "current_status": "PAID",
    "attempted_action": "pay"
  }
}
```

---

## Performance Considerations

### Indexes Strategy

Bảng `subscription_invoices` có 4 strategic indexes:

```sql
-- 1. Tenant lookup (most common query)
CREATE INDEX idx_invoices_tenant_lookup 
ON subscription_invoices (tenant_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- 2. Partner debt reconciliation
CREATE INDEX idx_invoices_partner_debt 
ON subscription_invoices (partner_id, status) 
WHERE partner_id IS NOT NULL AND status != 'PAID';

-- 3. Overdue tracking
CREATE INDEX idx_invoices_overdue_tracker 
ON subscription_invoices (status, due_date) 
WHERE status = 'OPEN' AND deleted_at IS NULL;

-- 4. Invoice number lookup (unique)
CREATE UNIQUE INDEX idx_invoices_number_search 
ON subscription_invoices (invoice_number) 
WHERE deleted_at IS NULL;
```

### Query Performance

| Operation | Expected Time | Index Used |
|-----------|---------------|------------|
| List by tenant | < 15ms | `idx_invoices_tenant_lookup` |
| Get by invoice number | < 5ms | `idx_invoices_number_search` |
| Find overdue | < 20ms | `idx_invoices_overdue_tracker` |
| Partner debt query | < 25ms | `idx_invoices_partner_debt` |
| Create invoice | < 100ms | All indexes |
| Pay invoice | < 150ms | Transaction |

### Optimization Tips

1. **Pagination**: Always use `limit` và `offset` cho large datasets
2. **Filter Early**: Sử dụng `tenant_id` filter để reduce result set
3. **Avoid Full Scan**: Luôn filter với `deleted_at IS NULL`
4. **Cache Stats**: Cache invoice statistics, refresh mỗi 5 phút
5. **Batch Operations**: Khi tạo nhiều invoices, use bulk insert
6. **JSONB Indexing**: Nếu cần search trong `price_adjustments` hoặc `metadata`, tạo GIN index

---

## 🎯 Quick Reference

### Typical Workflows

**1. Monthly Auto-Billing:**
```
1. System tạo invoice (OPEN) vào đầu tháng
2. Email reminder gửi đến tenant
3. Tenant thanh toán qua `/invoices/:id/pay`
4. Status → PAID
5. System gửi receipt
```

**2. Overdue Management:**
```
1. Daily job query `/invoices/overdue`
2. For each overdue invoice:
   - Send reminder email
   - If > 30 days: escalate to admin
   - If > 60 days: mark UNCOLLECTIBLE
```

**3. Partner Distribution:**
```
1. Tenant thanh toán qua partner
2. Invoice có `partner_id` set
3. Monthly reconciliation: query invoices by partner
4. Generate partner commission report
```

---

**Last Updated:** 2026-01-14  
**API Version:** 1.0.0  
**Status:** ✅ Production Ready
