# Products - API Reference

**Module:** Products (SaaS Products)  
**Version:** 1.0.0  
**Base URL:** `/api/v1/saas-products`  
**Last Updated:** 2026-01-14

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Code Examples](#code-examples)

---

## Overview

Products API cung cấp các endpoint để quản lý danh mục sản phẩm SaaS. API hỗ trợ CRUD operations, filtering, searching, và statistics.

### Base URL

```
Production:  https://api.vhvplatform.com/api/v1/saas-products
Development: http://localhost:8080/api/v1/saas-products
```

### Content Type

```
Content-Type: application/json
Accept: application/json
```

---

## Authentication

### API Key (Recommended)

```http
Authorization: Bearer {api_key}
```

### JWT Token

```http
Authorization: Bearer {jwt_token}
```

---

## Endpoints

### 1. Get All Products

**GET** `/api/v1/saas-products`

Lấy danh sách tất cả products với filtering và pagination.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `product_type` | string | No | - | Filter by type (APP, DOMAIN, SSL, SERVICE) |
| `is_active` | boolean | No | - | Filter by active status |
| `search` | string | No | - | Search in name, description, code |
| `limit` | integer | No | 50 | Number of results per page |
| `offset` | integer | No | 0 | Offset for pagination |

#### Request Example

```http
GET /api/v1/saas-products?product_type=APP&is_active=true&limit=20&offset=0
Authorization: Bearer {token}
```

#### Response 200 OK

```json
{
  "data": [
    {
      "_id": "01940d7e-1234-7890-abcd-000000000001",
      "code": "crm-basic",
      "name": "CRM Basic",
      "product_type": "APP",
      "description": "Giải pháp quản lý khách hàng cơ bản",
      "base_price": 99000.0000,
      "currency": "VND",
      "is_active": true,
      "metadata": {
        "features": ["contact_management", "basic_reports"],
        "limits": {"max_users": 5, "storage_gb": 10},
        "display_order": 1,
        "is_featured": false
      },
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "deleted_at": null,
      "version": 1
    }
  ],
  "pagination": {
    "total": 8,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized |
| 500 | Internal Server Error |

---

### 2. Get Product by ID

**GET** `/api/v1/saas-products/{id}`

Lấy thông tin chi tiết một product theo ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Product ID |

#### Request Example

```http
GET /api/v1/saas-products/01940d7e-1234-7890-abcd-000000000001
Authorization: Bearer {token}
```

#### Response 200 OK

```json
{
  "data": {
    "_id": "01940d7e-1234-7890-abcd-000000000001",
    "code": "crm-basic",
    "name": "CRM Basic",
    "product_type": "APP",
    "description": "Giải pháp quản lý khách hàng cơ bản",
    "base_price": 99000.0000,
    "currency": "VND",
    "is_active": true,
    "metadata": {
      "features": ["contact_management", "basic_reports"],
      "limits": {"max_users": 5, "storage_gb": 10}
    },
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z",
    "deleted_at": null,
    "version": 1
  }
}
```

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 404 | Product not found |
| 401 | Unauthorized |

---

### 3. Create Product

**POST** `/api/v1/saas-products`

Tạo product mới.

#### Request Body

```json
{
  "code": "crm-enterprise",
  "name": "CRM Enterprise",
  "product_type": "APP",
  "description": "Giải pháp CRM doanh nghiệp lớn",
  "base_price": 999000.0000,
  "currency": "VND",
  "metadata": {
    "features": ["all_features", "custom_dev", "priority_support"],
    "limits": {"max_users": -1, "storage_gb": 500},
    "display_order": 3,
    "is_featured": true
  }
}
```

#### Request Example

```http
POST /api/v1/saas-products
Content-Type: application/json
Authorization: Bearer {token}

{
  "code": "crm-enterprise",
  "name": "CRM Enterprise",
  "product_type": "APP",
  "base_price": 999000.0000,
  "currency": "VND"
}
```

#### Response 201 Created

```json
{
  "data": {
    "_id": "01940d7e-1234-7890-abcd-000000000003",
    "code": "crm-enterprise",
    "name": "CRM Enterprise",
    "product_type": "APP",
    "description": "Giải pháp CRM doanh nghiệp lớn",
    "base_price": 999000.0000,
    "currency": "VND",
    "is_active": true,
    "metadata": {},
    "created_at": "2024-01-15T11:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z",
    "deleted_at": null,
    "version": 1
  }
}
```

#### Response Codes

| Code | Description |
|------|-------------|
| 201 | Created successfully |
| 400 | Bad Request (validation error) |
| 409 | Conflict (code already exists) |
| 401 | Unauthorized |

---

### 4. Update Product

**PATCH** `/api/v1/saas-products/{id}`

Cập nhật thông tin product. Hỗ trợ optimistic locking với version.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Product ID |

#### Request Body

```json
{
  "name": "CRM Basic Plus",
  "base_price": 129000.0000,
  "metadata": {
    "features": ["contact_management", "basic_reports", "email_integration"],
    "is_featured": true
  },
  "version": 1
}
```

**Note:** `version` field is REQUIRED for optimistic locking.

#### Request Example

```http
PATCH /api/v1/saas-products/01940d7e-1234-7890-abcd-000000000001
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "CRM Basic Plus",
  "base_price": 129000.0000,
  "version": 1
}
```

#### Response 200 OK

```json
{
  "data": {
    "_id": "01940d7e-1234-7890-abcd-000000000001",
    "code": "crm-basic",
    "name": "CRM Basic Plus",
    "product_type": "APP",
    "base_price": 129000.0000,
    "currency": "VND",
    "is_active": true,
    "metadata": {},
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T12:00:00Z",
    "deleted_at": null,
    "version": 2
  }
}
```

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Updated successfully |
| 400 | Bad Request (validation error) |
| 404 | Product not found |
| 409 | Conflict (version mismatch) |
| 401 | Unauthorized |

---

### 5. Delete Product (Soft Delete)

**DELETE** `/api/v1/saas-products/{id}`

Xóa mềm product (set deleted_at = NOW()).

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Product ID |

#### Request Example

```http
DELETE /api/v1/saas-products/01940d7e-1234-7890-abcd-000000000001
Authorization: Bearer {token}
```

#### Response 200 OK

```json
{
  "message": "Product deleted successfully",
  "data": {
    "_id": "01940d7e-1234-7890-abcd-000000000001"
  }
}
```

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Deleted successfully |
| 404 | Product not found or already deleted |
| 401 | Unauthorized |

---

### 6. Get Product Statistics

**GET** `/api/v1/saas-products/statistics`

Lấy thống kê tổng quan về products.

#### Request Example

```http
GET /api/v1/saas-products/statistics
Authorization: Bearer {token}
```

#### Response 200 OK

```json
{
  "data": {
    "total": 8,
    "active": 7,
    "inactive": 1,
    "archived": 0,
    "total_revenue": 2847000.0000
  }
}
```

---

## Data Models

### SaaSProduct

```typescript
interface SaaSProduct {
  _id: string;                    // UUID
  code: string;                   // Unique code, lowercase alphanumeric + hyphens
  name: string;                   // Display name
  product_type: ProductType;      // APP | DOMAIN | SSL | SERVICE
  description?: string;           // Optional description
  base_price: number;             // Decimal(19, 4)
  currency: string;               // ISO 4217 currency code (3 chars)
  is_active: boolean;             // Active status
  metadata: Record<string, any>; // JSONB metadata
  created_at: string;             // ISO 8601 timestamp
  updated_at: string;             // ISO 8601 timestamp
  deleted_at: string | null;      // ISO 8601 timestamp or null
  version: number;                // Version for optimistic locking
}

type ProductType = 'APP' | 'DOMAIN' | 'SSL' | 'SERVICE';
```

### CreateProductRequest

```typescript
interface CreateProductRequest {
  code: string;                   // Required, unique
  name: string;                   // Required
  product_type: ProductType;      // Required
  description?: string;           // Optional
  base_price?: number;            // Optional, default 0
  currency?: string;              // Optional, default 'VND'
  metadata?: Record<string, any>; // Optional, default {}
}
```

### UpdateProductRequest

```typescript
interface UpdateProductRequest {
  code?: string;                  // Optional
  name?: string;                  // Optional
  product_type?: ProductType;     // Optional
  description?: string;           // Optional
  base_price?: number;            // Optional
  currency?: string;              // Optional
  is_active?: boolean;            // Optional
  metadata?: Record<string, any>; // Optional
  version: number;                // Required for optimistic locking
}
```

### ProductFilters

```typescript
interface ProductFilters {
  product_type?: ProductType;     // Filter by type
  is_active?: boolean;            // Filter by status
  search?: string;                // Search query
  limit?: number;                 // Default 50
  offset?: number;                // Default 0
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error message here"
}
```

### Common Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Missing or invalid auth token |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Version conflict or code already exists |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server error |

### Error Examples

#### 400 Bad Request

```json
{
  "error": "code is required"
}
```

#### 409 Conflict (Duplicate Code)

```json
{
  "error": "Product code already exists"
}
```

#### 409 Conflict (Version Mismatch)

```json
{
  "error": "Version conflict: Product was modified by another user"
}
```

#### 422 Validation Error

```json
{
  "error": "base_price must be non-negative"
}
```

---

## Code Examples

### JavaScript/TypeScript

#### Fetch All Products

```typescript
async function getProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams(filters as any);
  
  const response = await fetch(
    `https://api.vhvplatform.com/api/v1/saas-products?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return await response.json();
}

// Usage
const products = await getProducts({
  product_type: 'APP',
  is_active: true,
  limit: 20,
});
```

#### Create Product

```typescript
async function createProduct(data: CreateProductRequest) {
  const response = await fetch(
    'https://api.vhvplatform.com/api/v1/saas-products',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return await response.json();
}

// Usage
const product = await createProduct({
  code: 'crm-basic',
  name: 'CRM Basic',
  product_type: 'APP',
  base_price: 99000,
  currency: 'VND',
});
```

#### Update Product (with Optimistic Locking)

```typescript
async function updateProduct(
  id: string,
  data: UpdateProductRequest
) {
  const response = await fetch(
    `https://api.vhvplatform.com/api/v1/saas-products/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    if (response.status === 409) {
      throw new Error('Product was modified by another user. Please refresh and try again.');
    }
    throw new Error(error.error);
  }
  
  return await response.json();
}

// Usage
const updated = await updateProduct(productId, {
  name: 'CRM Basic Plus',
  base_price: 129000,
  version: currentVersion,
});
```

### Golang

#### Get All Products

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
)

type ProductResponse struct {
    Data       []SaaSProduct `json:"data"`
    Pagination Pagination    `json:"pagination"`
}

func getProducts(apiKey string, filters map[string]string) (*ProductResponse, error) {
    client := &http.Client{}
    
    req, err := http.NewRequest("GET", "https://api.vhvplatform.com/api/v1/saas-products", nil)
    if err != nil {
        return nil, err
    }
    
    // Add query parameters
    q := req.URL.Query()
    for k, v := range filters {
        q.Add(k, v)
    }
    req.URL.RawQuery = q.Encode()
    
    // Add authorization header
    req.Header.Add("Authorization", "Bearer "+apiKey)
    req.Header.Add("Content-Type", "application/json")
    
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("API error: %d", resp.StatusCode)
    }
    
    var result ProductResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    
    return &result, nil
}

// Usage
products, err := getProducts(apiKey, map[string]string{
    "product_type": "APP",
    "is_active": "true",
    "limit": "20",
})
```

#### Create Product

```go
func createProduct(apiKey string, data CreateProductRequest) (*SaaSProduct, error) {
    client := &http.Client{}
    
    jsonData, err := json.Marshal(data)
    if err != nil {
        return nil, err
    }
    
    req, err := http.NewRequest("POST", 
        "https://api.vhvplatform.com/api/v1/saas-products",
        bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    
    req.Header.Add("Authorization", "Bearer "+apiKey)
    req.Header.Add("Content-Type", "application/json")
    
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusCreated {
        return nil, fmt.Errorf("API error: %d", resp.StatusCode)
    }
    
    var result struct {
        Data SaaSProduct `json:"data"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    
    return &result.Data, nil
}
```

### Python

```python
import requests

class ProductsAPI:
    def __init__(self, api_key: str, base_url: str = "https://api.vhvplatform.com"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
    
    def get_products(self, filters: dict = None):
        """Get all products with optional filters"""
        url = f"{self.base_url}/api/v1/saas-products"
        response = requests.get(url, headers=self.headers, params=filters)
        response.raise_for_status()
        return response.json()
    
    def create_product(self, data: dict):
        """Create a new product"""
        url = f"{self.base_url}/api/v1/saas-products"
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()
    
    def update_product(self, product_id: str, data: dict):
        """Update a product with optimistic locking"""
        url = f"{self.base_url}/api/v1/saas-products/{product_id}"
        response = requests.patch(url, headers=self.headers, json=data)
        
        if response.status_code == 409:
            raise ValueError("Product was modified by another user")
        
        response.raise_for_status()
        return response.json()

# Usage
api = ProductsAPI(api_key="your-api-key")
products = api.get_products({"product_type": "APP", "is_active": True})
```

---

## Rate Limiting

**Limits:**
- 1000 requests per hour per API key
- 100 requests per minute per IP

**Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1640995200
```

---

## Webhooks

Products API hỗ trợ webhooks cho các events:

### Events

| Event | Description |
|-------|-------------|
| `product.created` | Product được tạo mới |
| `product.updated` | Product được cập nhật |
| `product.deleted` | Product bị xóa (soft delete) |

### Webhook Payload

```json
{
  "event": "product.created",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "_id": "01940d7e-1234-7890-abcd-000000000001",
    "code": "crm-basic",
    "name": "CRM Basic",
    ...
  }
}
```

---

## References

- Database Schema: `/docs/developer/products-database-schema.md`
- ERD Diagram: `/docs/developer/products-erd-diagram.md`
- Use Cases: `/docs/developer/products-use-cases.md`
- Golang Handler: `/golang-api/handlers/saas_products_handler.go`
- Frontend API Client: `/api/saasProductApi.ts`
