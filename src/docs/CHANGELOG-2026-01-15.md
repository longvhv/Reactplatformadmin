# Changelog - 15/01/2026

## 🎉 Major Features

### Subscription Orders 2.0 - Line Items Support

Nâng cấp toàn diện module quản lý đơn hàng từ "một gói/đơn" sang "nhiều line items/đơn".

#### ✨ New Features

1. **Multi-item Orders**
   - Hỗ trợ nhiều PLAN và PRODUCT trong một đơn hàng
   - Order types: SUBSCRIPTION, ONE_TIME, HYBRID
   - Line items với đầy đủ metadata

2. **Digital Assets Management**
   - Quản lý Domain, SSL Certificates, License Keys
   - Lifecycle tracking: PENDING → ACTIVE → EXPIRED
   - Expiry warnings và auto-notifications
   - New page: `/core/digital-assets`

3. **Service Deliveries Management**
   - Quản lý Consulting, Training, Support hours
   - Progress tracking với delivery notes
   - Unit types: HOUR, SESSION, DAY, PROJECT
   - New page: `/core/service-deliveries`

#### 📦 New Components

- `LineItemsEditor` - Edit multiple line items in orders
- `OrderFormV2` - Create/edit orders with line items support

#### 🔧 API Updates

**New APIs:**
- `/api/digitalAssetsApi.ts` - Full CRUD for digital assets
- `/api/serviceDeliveriesApi.ts` - Full CRUD for service deliveries

**Updated APIs:**
- `/api/ordersApi.ts`:
  - New types: `LineItem`, `LineItemType`, `ProductType`, `OrderType`
  - New helpers: `calculateOrderTotals()`, `determineOrderType()`
  - Updated `Order.type` and `Order.items_snapshot`

#### 📄 Updated Pages

- `SubscriptionOrdersPage`:
  - Display line items summary
  - Show order type badges
  - Search in items_snapshot
  - Updated stats with order type breakdown

#### 🗄️ Database Schema

**Modified Tables:**
- `subscription_orders`:
  - `type`: Now supports SUBSCRIPTION/ONE_TIME/HYBRID
  - `items_snapshot`: Now stores array of LineItem objects

**New Tables:**
- `tenant_digital_assets`: Store digital assets (domains, SSL, licenses)
- `tenant_service_deliveries`: Track service delivery progress

#### 🎯 Module Registration

New modules added:
- `DigitalAssetsModule` (order: 45)
- `ServiceDeliveriesModule` (order: 46)

#### 📚 Documentation

- `/docs/subscription-orders-upgrade.md` - Complete upgrade guide
- Migration guide for existing orders
- Breaking changes documentation

## 🐛 Bug Fixes

- None in this release (pure feature addition)

## ⚠️ Breaking Changes

1. **Order.type field values changed:**
   - Old: `NEW | RENEWAL | UPGRADE | DOWNGRADE | ADD_ON`
   - New: `SUBSCRIPTION | ONE_TIME | HYBRID`
   - Migration required for existing orders

2. **items_snapshot structure:**
   - Changed from single package object to array of LineItem
   - Data migration required

## 📊 Stats

- **Files Added:** 8
- **Files Modified:** 3
- **Lines of Code:** ~2,500
- **New API Endpoints:** 20+
- **New React Components:** 4

## 🚀 Migration Path

For existing applications using subscription orders:

1. **Update imports** to include new types
2. **Migrate data** from old schema to new LineItem format
3. **Update UI code** to use `items_snapshot` instead of `package_snapshot`
4. **Test fulfillment logic** with new order types

See `/docs/subscription-orders-upgrade.md` for detailed migration guide.

## 👥 Contributors

- VHV Platform Team

---

**Next Release:** TBD  
**Focus Areas:** Fulfillment automation, Email notifications, Analytics
