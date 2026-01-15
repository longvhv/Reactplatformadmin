# Nâng Cấp Module Subscription Orders

**Ngày:** 15/01/2026  
**Phiên bản:** 2.0  
**Tác giả:** VHV Platform Team

## 📋 Tổng Quan

Nâng cấp toàn diện module `subscription_orders` từ mô hình "Một đơn hàng = Một gói cước" sang "Một đơn hàng = Danh sách Line Items" với khả năng hỗ trợ cả PLAN (Gói cước) và PRODUCT (Sản phẩm lẻ).

## 🎯 Mục Tiêu

1. **Linh hoạt hơn trong quản lý đơn hàng**: Hỗ trợ nhiều loại sản phẩm trong một đơn
2. **Hỗ trợ Fulfillment**: Tự động xử lý các sản phẩm sau khi thanh toán
3. **Quản lý tài sản số**: Domain, SSL, License keys
4. **Quản lý dịch vụ**: Consulting, Training, Support hours

## 🗄️ Thay Đổi Database Schema

### 1. Bảng `subscription_orders`

#### Trường cập nhật:
- **`type`**: VARCHAR(20)
  - **Cũ**: `NEW | RENEWAL | UPGRADE | DOWNGRADE | ADD_ON`
  - **Mới**: `SUBSCRIPTION | ONE_TIME | HYBRID`
  - Mục đích: Phân loại đơn hàng theo loại sản phẩm

- **`items_snapshot`**: JSONB
  - **Cũ**: Lưu thông tin 1 package
  - **Mới**: Lưu mảng các LineItem
  ```json
  [
    {
      "item_type": "PLAN",
      "id": "uuid-goi-pro",
      "name": "Gói Pro (Tháng)",
      "price": 1000000,
      "quantity": 1,
      "metadata": { "cycle": "MONTHLY" }
    },
    {
      "item_type": "PRODUCT",
      "id": "uuid-san-pham-ssl",
      "name": "Chứng chỉ SSL Wildcard",
      "product_type": "SSL",
      "price": 500000,
      "quantity": 1,
      "metadata": { "domain": "app.hust.edu.vn" }
    }
  ]
  ```

### 2. Bảng mới: `tenant_digital_assets`

Quản lý tài sản số như Domain, SSL certificates, License keys.

```sql
CREATE TABLE tenant_digital_assets (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(_id),
    order_id UUID NOT NULL REFERENCES subscription_orders(_id),
    
    asset_type VARCHAR(20) NOT NULL, -- 'DOMAIN', 'SSL', 'LICENSE_KEY'
    name TEXT NOT NULL,
    
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, ACTIVE, EXPIRED
    
    provider_metadata JSONB DEFAULT '{}',
    
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Bảng mới: `tenant_service_deliveries`

Quản lý các dịch vụ như Consulting hours, Training sessions.

```sql
CREATE TABLE tenant_service_deliveries (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(_id),
    order_id UUID NOT NULL REFERENCES subscription_orders(_id),
    
    service_name TEXT NOT NULL,
    total_units NUMERIC(10, 2) NOT NULL,
    used_units NUMERIC(10, 2) DEFAULT 0,
    unit_type VARCHAR(20) NOT NULL, -- 'HOUR', 'SESSION', 'DAY', 'PROJECT'
    
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    
    delivery_notes JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);
```

## 🔧 API Changes

### 1. Orders API (`/api/ordersApi.ts`)

#### Types mới:
```typescript
export type LineItemType = 'PLAN' | 'PRODUCT';
export type ProductType = 'SSL' | 'DOMAIN' | 'LICENSE' | 'SERVICE' | 'CONSULTING' | 'TRAINING' | 'OTHER';
export type OrderType = 'SUBSCRIPTION' | 'ONE_TIME' | 'HYBRID';

export interface LineItem {
  item_type: LineItemType;
  id: string;
  name: string;
  price: number;
  quantity: number;
  product_type?: ProductType;
  metadata?: Record<string, any>;
}
```

#### Helper Functions mới:
- `getProductTypeLabel(type)`: Lấy label tiếng Việt cho product type
- `calculateOrderTotals(items)`: Tính tổng từ line items
- `determineOrderType(items)`: Xác định order type từ line items

### 2. Digital Assets API (`/api/digitalAssetsApi.ts`)

**Endpoints:**
- `GET /digital-assets` - List all assets
- `GET /digital-assets/:id` - Get asset details
- `POST /digital-assets` - Create new asset
- `PATCH /digital-assets/:id` - Update asset
- `DELETE /digital-assets/:id` - Delete asset
- `POST /digital-assets/:id/activate` - Activate asset
- `POST /digital-assets/:id/expire` - Mark as expired

**Hooks:**
- `useDigitalAssetDetails(id)` - Fetch asset details
- `useDigitalAssetsByOrder(orderId)` - Get assets by order
- `useDigitalAssetsByTenant(tenantId)` - Get assets by tenant

### 3. Service Deliveries API (`/api/serviceDeliveriesApi.ts`)

**Endpoints:**
- `GET /service-deliveries` - List all deliveries
- `GET /service-deliveries/:id` - Get delivery details
- `POST /service-deliveries` - Create new delivery
- `PATCH /service-deliveries/:id` - Update delivery
- `DELETE /service-deliveries/:id` - Delete delivery
- `POST /service-deliveries/:id/start` - Start delivery
- `POST /service-deliveries/:id/complete` - Complete delivery
- `POST /service-deliveries/:id/add-note` - Add delivery note

**Hooks:**
- `useServiceDeliveryDetails(id)` - Fetch delivery details
- `useServiceDeliveriesByOrder(orderId)` - Get deliveries by order
- `useServiceDeliveriesByTenant(tenantId)` - Get deliveries by tenant

## 🎨 UI Components

### 1. LineItemsEditor (`/components/orders/LineItemsEditor.tsx`)

Component để thêm/sửa/xóa line items trong đơn hàng.

**Features:**
- Hỗ trợ cả PLAN và PRODUCT items
- Inline editing cho từng field
- Auto-calculate totals
- Metadata editor cho các trường tùy chỉnh

### 2. OrderFormV2 (`/components/orders/OrderFormV2.tsx`)

Form tạo/sửa đơn hàng mới với line items.

**Features:**
- Multi-step wizard hoặc single form
- Line items editor integration
- Auto-calculate subtotal, tax, total
- Support for multiple payment methods

### 3. SubscriptionOrdersPage (Updated)

**Thay đổi:**
- Hiển thị order type badges (Gói cước, Mua lẻ, Kết hợp)
- Hiển thị tóm tắt items và số lượng
- Search trong items_snapshot
- Updated stats với order type breakdown

## 📱 Pages

### 1. DigitalAssetsPage (`/pages/DigitalAssetsPage.tsx`)

Trang quản lý tài sản số.

**Features:**
- List view với filters (status, type)
- Stats cards (total, active, pending, expired, expiring soon)
- Expiry warnings
- Quick actions (activate, expire)

**Route:** `/core/digital-assets`

### 2. ServiceDeliveriesPage (`/pages/ServiceDeliveriesPage.tsx`)

Trang quản lý dịch vụ.

**Features:**
- List view với filters (status, unit type)
- Progress tracking
- Delivery notes history
- Quick actions (start, add note, complete)

**Route:** `/core/service-deliveries`

## 🚀 Module Registration

Đã thêm 2 modules mới vào `moduleRegistration.tsx`:

```typescript
import { DigitalAssetsModule } from '../modules/digital-assets/index';
import { ServiceDeliveriesModule } from '../modules/service-deliveries/index';

// In registerAllModules():
registry.register(DigitalAssetsModule);
registry.register(ServiceDeliveriesModule);
```

## 🔄 Migration Guide

### Cho Frontend Developers:

1. **Cập nhật imports:**
   ```typescript
   // Old
   import { Order } from '../api/ordersApi';
   
   // New - Import thêm types mới
   import { 
     Order, 
     LineItem, 
     OrderType, 
     LineItemType,
     ProductType 
   } from '../api/ordersApi';
   ```

2. **Cập nhật code xử lý orders:**
   ```typescript
   // Old
   const packageName = order.package_snapshot?.name;
   
   // New
   const items = order.items_snapshot;
   const firstItem = items[0]?.name;
   const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
   ```

3. **Tạo đơn hàng mới:**
   ```typescript
   const newOrder = {
     tenant_id: tenantId,
     order_number: 'ORD-001',
     type: 'HYBRID', // hoặc determineOrderType(items)
     items_snapshot: [
       {
         item_type: 'PLAN',
         id: planId,
         name: 'Gói Pro',
         price: 1000000,
         quantity: 1,
       },
       {
         item_type: 'PRODUCT',
         id: productId,
         name: 'SSL Certificate',
         price: 500000,
         quantity: 1,
         product_type: 'SSL',
       }
     ],
     subtotal_amount: 1500000,
     total_amount: 1500000,
   };
   ```

### Cho Backend Developers:

1. **Fulfillment Logic:**
   Khi order chuyển sang status `PAID`, cần xử lý từng line item:
   
   ```typescript
   for (const item of order.items_snapshot) {
     if (item.item_type === 'PLAN') {
       // Create/update tenant_subscription
     } else if (item.item_type === 'PRODUCT') {
       if (['DOMAIN', 'SSL', 'LICENSE'].includes(item.product_type)) {
         // Create digital_asset
       } else if (['SERVICE', 'CONSULTING', 'TRAINING'].includes(item.product_type)) {
         // Create service_delivery
       }
     }
   }
   ```

2. **Webhook Events:**
   Cân nhắc thêm events mới:
   - `order.line_item.fulfilled`
   - `digital_asset.activated`
   - `digital_asset.expiring`
   - `service_delivery.completed`

## ⚠️ Breaking Changes

1. **Order.type field:**
   - Giá trị cũ (`NEW`, `RENEWAL`, etc.) không tương thích
   - Cần migration data nếu có orders cũ

2. **items_snapshot structure:**
   - Schema mới hoàn toàn khác
   - Cần migrate data từ package_snapshot sang items_snapshot

## ✅ Testing Checklist

- [ ] Tạo đơn hàng chỉ có PLAN items
- [ ] Tạo đơn hàng chỉ có PRODUCT items
- [ ] Tạo đơn hàng HYBRID (cả PLAN và PRODUCT)
- [ ] Test fulfillment khi order PAID
- [ ] Test tạo digital assets
- [ ] Test activate/expire digital assets
- [ ] Test tạo service deliveries
- [ ] Test add delivery notes
- [ ] Test search trong line items
- [ ] Test filters và stats

## 📚 Related Documentation

- [Adapter Pattern Guide](/docs/adapter-pattern.md)
- [Module System Guide](/docs/module-system.md)
- [Supabase Integration](/docs/supabase.md)

## 🔮 Future Enhancements

1. **Auto-renewal cho digital assets**
2. **Email notifications cho expiring assets**
3. **Service delivery calendar integration**
4. **Bulk operations cho assets**
5. **Asset transfer giữa các tenants**
6. **Advanced analytics cho deliveries**

---

**Status:** ✅ Completed  
**Last Updated:** 15/01/2026
