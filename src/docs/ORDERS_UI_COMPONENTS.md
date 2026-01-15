# Subscription Orders - UI Components Guide

## 📋 Overview

UI components documentation for **Subscription Orders** module with design patterns and best practices.

---

## 🎨 Component Structure

```
OrdersPage
├── OrderTable (Table View)
├── OrderCard (Grid View)
├── OrderFilters
├── OrderDetailModal ⭐⭐⭐ (Enhanced Design)
CreateOrderPage
└── OrderForm (Create new order)
EditOrderPage
└── OrderForm (Edit existing order with optimistic locking)
```

---

## 📦 Main Components

### 1. OrdersPage

**Location:** `/pages/OrdersPage.tsx`

**Features:**
- ✅ Table and Grid view modes
- ✅ Search and filters (status, tenant)
- ✅ Pagination support
- ✅ CRUD operations
- ✅ Responsive design
- ✅ **OrderDetailModal integration** (enhanced)

**State Management:**
```typescript
const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
const [loading, setLoading] = useState(false);
const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
const [searchTerm, setSearchTerm] = useState('');
const [filters, setFilters] = useState<OrderFilters>({});
const [selectedOrder, setSelectedOrder] = useState<SubscriptionOrder | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);
```

**Order Detail Modal Trigger:**
```typescript
const handleViewDetails = async (order: SubscriptionOrder) => {
  try {
    const fullOrder = await orderApi.getById(order._id!);
    setSelectedOrder(fullOrder);
    setIsModalOpen(true);
  } catch (error: any) {
    toast.error('Không thể tải chi tiết đơn hàng: ' + error.message);
  }
};
```

---

### 2. OrderTable (Table View)

**Display Columns:**
- Order number + date
- Tenant name
- Package name
- Total amount with currency
- Status badge
- Actions (View, Edit, Delete)

**Visual Example:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Đơn hàng        │ Tenant     │ Gói         │ Số tiền      │ TT   │
├─────────────────────────────────────────────────────────────────┤
│ ORD-2025-001234 │ Công ty    │ HRM Pro     │ 2,990,000đ   │ Paid │
│ 13/01/2025      │ ABC        │             │              │      │
├─────────────────────────────────────────────────────────────────┤
│ ORD-2025-001235 │ Công ty    │ HRM Starter │ 990,000đ     │ Pending│
│ 12/01/2025      │ XYZ        │             │              │      │
└─────────────────────────────────────────────────────────────────┘
```

**Status Color Mapping:**
```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    case 'FAILED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  }
};
```

---

### 3. OrderCard (Grid View)

**Layout:**
```
┌──────────────────────────┐
│ ORD-2025-001234          │
│ 13/01/2025        [PAID] │
│                           │
│ Tenant: Công ty ABC      │
│ Gói: HRM Professional    │
│                           │
│ ────────────────────────│
│ 2,990,000đ               │
│                           │
│ [Xem]  [Sửa]            │
└──────────────────────────┘
```

**Implementation:**
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6">
  <div className="flex items-start justify-between mb-4">
    <div className="flex-1">
      <button
        onClick={() => handleViewDetails(order)}
        className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600"
      >
        {order.order_number}
      </button>
      <p className="text-sm text-gray-500 mt-1">
        {new Date(order.created_at!).toLocaleDateString('vi-VN')}
      </p>
    </div>
    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
      {getStatusLabel(order.status)}
    </span>
  </div>
  
  <div className="border-t pt-4 mb-4">
    <div className="text-2xl font-bold text-indigo-600">
      {formatPrice(order.total_amount, order.currency_code)}
    </div>
  </div>
  
  <div className="flex gap-2">
    <Button onClick={() => handleViewDetails(order)}>Xem</Button>
    <Button onClick={() => navigate(`/core/orders/edit/${order._id}`)}>Sửa</Button>
  </div>
</div>
```

---

### 4. OrderDetailModal ⭐⭐⭐ ENHANCED

**Location:** `/components/orders/OrderDetailModal.tsx`

**Purpose:** Display complete order information in a beautiful modal popup

**NEW Enhanced Features:**
- ✅ **Gradient header** (indigo → purple → pink)
- ✅ **Icon-enhanced sections** with Lucide icons
- ✅ **Two-column layout** optimized for large screens
- ✅ **Package Snapshot** with blue gradient highlight
- ✅ **Interactive status flow** with animated current state
- ✅ **Database schema info panel** showing table details
- ✅ **Rounded corners & shadows** for modern look
- ✅ **Enhanced typography** with better spacing
- ✅ **Footer with quick info** (ID preview, version)

**Props:**
```typescript
interface OrderDetailModalProps {
  order: SubscriptionOrder | null;
  isOpen: boolean;
  onClose: () => void;
}
```

**Enhanced Visual Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ 🛒 [Gradient Header: Indigo→Purple→Pink]             [×]  │
│    Chi tiết đơn hàng                                       │
│    📊 ORD-2025-001234                                      │
├─────────────────┬──────────────────────────────────────────┤
│ LEFT COLUMN     │ RIGHT COLUMN                             │
├─────────────────┼──────────────────────────────────────────┤
│ I. Định danh    │ IV. Package Snapshot 📦                  │
│ [White Card]    │ [Blue Gradient Card - HIGHLIGHTED]       │
│ • Order ID      │ ┌────────────────────────────────────┐   │
│ • Tenant ID     │ │ ℹ️ Info: Snapshot đảm bảo:        │   │
│ • Package ID    │ │ • Giá không đổi                    │   │
│                 │ │ • Quyền lợi không đổi              │   │
│ II. Thông tin   │ │ • Lưu vết audit trail              │   │
│ [White Card]    │ └────────────────────────────────────┘   │
│ • Order number  │ ┌────────────────────────────────────┐   │
│ • Status badge  │ │ {                                  │   │
│ • Payment       │ │   "code": "hrm-pro",               │   │
│                 │ │   "price_amount": 2990000,         │   │
│ III. Tài chính  │ │   "entitlements_config": {...},    │   │
│ [Indigo Grad]   │ │   "max_users": 50                  │   │
│ ┌─────────────┐ │ │ }                                  │   │
│ │ 2,990,000đ  │ │ └────────────────────────────────────┘   │
│ │ [Big Price] │ │                                           │
│ └─────────────┘ │ Order Status Flow                        │
│ • Số tiền       │ [Interactive Status Indicators]          │
│ • Currency      │ ● PENDING (gray or yellow with ring)     │
│                 │ ● PAID (gray or green with ring) ✓       │
│ V. Audit        │ ● CANCELLED (gray or gray with ring)     │
│ [White Card]    │ ● FAILED (gray or red with ring)         │
│ • Version       │                                           │
│ • Created       │ Database Schema Info 💾                  │
│ • Updated       │ [Purple Gradient Card]                   │
│ • Deleted       │ • Table: subscription_orders             │
│                 │ • PK: _id (UUID v7)                      │
│                 │ • FKs: tenant_id, package_id             │
│                 │ • Fields: 12+ columns                    │
│                 │ • Optimistic Locking ✓                   │
│                 │ • Soft Delete ✓                          │
│                 │ • Package Snapshot (JSONB) ✓             │
└─────────────────┴──────────────────────────────────────────┘
│ ID: 01940824...  •  Version: v1              [Đóng]       │
└────────────────────────────────────────────────────────────┘
```

**Color Scheme (Enhanced):**
```css
/* Header */
Gradient: from-indigo-600 via-purple-600 to-pink-600

/* Section Cards */
I. Định danh:          white with gray border
II. Thông tin:         white with gray border
III. Tài chính:        indigo-purple-pink gradient (HIGHLIGHTED) ⭐
IV. Package Snapshot:  blue-cyan gradient with border-2 (MOST IMPORTANT) ⭐⭐⭐
V. Audit:              white with gray border
Status Flow:           white with interactive highlighting
Database Info:         purple-pink gradient

/* Status Indicators */
PENDING: yellow with ring-4 (when active)
PAID: green with ring-4 (when active)
CANCELLED: gray with ring-4 (when active)
FAILED: red with ring-4 (when active)
```

**Icons Used (NEW):**
- 🛒 ShoppingCart (header - larger size)
- 📊 Database (header - order number)
- ℹ️ Info (Identification section)
- 📄 FileText (Order info section)
- 💰 DollarSign (Financial section)
- 📦 Package (Snapshot section - larger size)
- 🕐 Clock (Audit section)
- 💾 Database (Database schema info)
- ❌ X (Close button)

**Key Sections Detail:**

**Left Column:**

1. **I. Định danh & Liên kết** (White card with border)
   - Clean list layout with border-bottom separators
   - UUID fields with gray background badges
   - Entity names in bold

2. **II. Thông tin đơn hàng** (White card with border)
   - Order number in monospace bold
   - Status with colored rounded badge
   - Payment method

3. **III. Tài chính** (Indigo-Purple-Pink gradient) ⭐
   - **Large price display** (4xl font, centered)
   - Grid layout for amount breakdown
   - Semi-transparent white cards for details
   - Most visually prominent section after snapshot

4. **V. Audit & Versioning** (White card with border)
   - Version in indigo color
   - Timestamps in small monospace
   - Deleted_at in red if present

**Right Column:**

5. **IV. Package Snapshot** (Blue-Cyan gradient) ⭐⭐⭐
   - **MOST IMPORTANT SECTION**
   - Info box explaining importance (3 bullet points)
   - JSON viewer with:
     - White background
     - Border-2 for emphasis
     - Syntax highlighting
     - Max height with scroll
     - Shadow-inner for depth

6. **Order Status Flow** (White card)
   - **Interactive visual flow**
   - Each status in a rounded card
   - Current status highlighted with:
     - Colored background (yellow/green/gray/red)
     - Border-2 emphasis
     - Ring-4 on dot
   - Inactive states in gray

7. **Database Schema Info** (Purple-Pink gradient) ⭐ NEW
   - Table name
   - Primary key info
   - Foreign keys
   - Field count
   - Features list (Optimistic Locking, Soft Delete, Snapshot)

**Enhanced Footer:**
- Left: Short ID preview + Version
- Right: Close button with hover effect

---

### 5. CreateOrderPage ⭐ NEW

**Location:** `/pages/CreateOrderPage.tsx`

**Purpose:** Form to create new subscription order

**Features:**
- ✅ Auto-generate order number
- ✅ Tenant selection dropdown
- ✅ Package selection (auto-fills price)
- ✅ Currency selector (VND, USD, EUR)
- ✅ Payment method options
- ✅ Status selector
- ✅ Live price preview
- ✅ Package snapshot info note
- ✅ Validation (required fields)
- ✅ Responsive layout

**Sections:**
1. **I. Định danh & Liên kết** - Tenant & Package selectors
2. **II. Thông tin đơn hàng** - Order number, Status, Payment method
3. **III. Tài chính** - Amount, Currency, Preview (gradient background)
4. **Info Note** - Explains package snapshot

**Auto-Fill Logic:**
```typescript
// When package selected → Auto-fill price & currency
const handlePackageChange = (packageId: string) => {
  const pkg = mockPackages.find(p => p.id === packageId);
  if (pkg) {
    setFormData({
      package_id: packageId,
      total_amount: pkg.price,      // ← Auto-fill
      currency_code: pkg.currency,  // ← Auto-fill
    });
  }
};
```

**Order Number Generation:**
```typescript
// Auto-generate: ORD-YYYY-MMDD-####
const orderNum = `ORD-${year}-${month}${day}-${randomNum}`;
// Example: ORD-2025-0113-1234
```

---

### 6. EditOrderPage ⭐ NEW

**Location:** `/pages/EditOrderPage.tsx`

**Purpose:** Form to edit existing subscription order

**Features:**
- ✅ Load existing order data
- ✅ Read-only fields (ID, order_number, tenant, package, dates)
- ✅ Editable fields (status, payment_method, total_amount)
- ✅ **Optimistic locking** with version field
- ✅ Version conflict detection
- ✅ Reload on conflict
- ✅ Package snapshot info (read-only)

**Sections:**
1. **Optimistic Locking Warning** (blue alert)
2. **Read-only Info** (gray background) - ID, dates, entities
3. **Editable Fields** (white card) - Status, payment, amount
4. **Package Snapshot Info** (blue note) - Explains immutability

**Optimistic Locking Flow:**
```typescript
// Include version in update
await orderApi.update(id, {
  status: 'PAID',
  version: 1,  // ← Current version
});

// If someone else updated → 409 Conflict
catch (error) {
  if (error.message.includes('Version conflict')) {
    toast.error('Đơn hàng đã được cập nhật bởi người khác');
    loadOrder(id);  // ← Reload to get latest version
  }
}
```

**Why Optimistic Locking?**
- Prevents data loss from concurrent edits
- User A and B both edit same order
- A saves first → version 2
- B tries to save with version 1 → Rejected
- B must reload to see A's changes

---

## 🎨 Design System

### Colors

```css
/* Primary */
--indigo-600: #6366f1;  /* Brand color */
--purple-600: #9333ea;  /* Accent */
--pink-600: #db2777;    /* Accent 2 */
--blue-600: #2563eb;    /* Info */
--cyan-600: #0891b2;    /* Info 2 */

/* Status Colors */
--green: PAID orders
--yellow: PENDING orders
--gray: CANCELLED orders
--red: FAILED orders

/* Section Highlights */
--blue-50: Package snapshot (most important) ⭐⭐⭐
--indigo-50: Financial info ⭐
--purple-50: Database schema info
--yellow-50: Info notes
```

### Typography

```css
h1: text-3xl font-bold          /* Page title */
h2: text-2xl font-bold          /* Modal title */
h3: text-lg font-bold           /* Section titles */
price-big: text-4xl font-bold text-indigo-600  /* Financial section */
price-small: text-2xl font-bold                /* Card price */
order_number: text-lg font-semibold
code: text-sm font-mono         /* IDs, codes */
badge: text-xs font-semibold    /* Status badges */
```

### Spacing & Layout

```css
/* Card padding */
p-5: Section cards
p-6: Page sections

/* Gap between cards */
space-y-5: Vertical spacing
gap-6: Grid spacing

/* Border radius */
rounded-xl: Cards and modals
rounded-lg: Buttons and inputs
rounded-full: Status badges

/* Shadows */
shadow-sm: Light cards
shadow-md: Important cards
shadow-lg: Package snapshot
shadow-2xl: Modal
```

---

## 📱 Responsive Breakpoints

```css
base: < 640px (mobile)
md: 768px (tablet)
lg: 1024px (desktop)

/* Grid columns */
grid-cols-1          /* Mobile */
md:grid-cols-2       /* Tablet - two columns */
lg:grid-cols-2       /* Desktop - modal uses 2 columns */

/* Modal width */
max-w-4xl            /* Create/Edit forms */
max-w-6xl            /* Detail modal (wider) */
```

---

## 🔄 User Flows

### Flow 1: View Orders List

```
User visits /core/orders
  ↓
Load orders from API
  ↓
Display in table/grid view
  ↓
User can filter by status
```

### Flow 2: View Order Details ⭐ ENHANCED

```
User clicks order number (in table or grid)
  ↓
handleViewDetails() triggered
  ↓
API call: orderApi.getById()
  ↓
Fetch full order with package snapshot
  ↓
OrderDetailModal opens with enhanced design
  ↓
User views beautiful gradient modal:
  LEFT COLUMN:
    • Order identification (white cards)
    • Order information & status
    • Financial details (indigo gradient) ⭐
    • Audit trail
  
  RIGHT COLUMN:
    • Package Snapshot (blue gradient) ⭐⭐⭐
      - Info box explaining importance
      - Full JSON with syntax highlighting
    • Interactive status flow
      - Current status highlighted with ring
    • Database schema info (purple gradient)
      - Table structure details
  ↓
User clicks "Đóng" or outside
  ↓
Modal closes with smooth animation
  ↓
Returns to list
```

### Flow 3: Create Order

```
User clicks "Tạo đơn hàng mới"
  ↓
Navigate to /core/orders/new
  ↓
Select tenant & package
  ↓
System calculates total_amount
  ↓
System captures package_snapshot
  ↓
Submit form
  ↓
Order created with status = PENDING
  ↓
Redirect to payment or order details
```

### Flow 4: Update Order Status

```
Admin opens order details
  ↓
Clicks "Cập nhật trạng thái"
  ↓
Select new status (PAID, CANCELLED, FAILED)
  ↓
Optimistic locking check (version)
  ↓
Update successful
  ↓
Status badge updates
  ↓
Notification sent to tenant
```

### Flow 5: Create New Order ⭐ NEW

```
User clicks "Tạo đơn hàng mới"
  ↓
Navigate to /core/orders/new
  ↓
CreateOrderPage loads
  ↓
System auto-generates order_number
  ↓
User selects Tenant
  ↓
User selects Package
  → System auto-fills price & currency
  ↓
User can adjust amount if needed
  ↓
User selects payment method
  ↓
User reviews live price preview
  ↓
Submit form
  ↓
API creates order with package snapshot
  ↓
Redirect to /core/orders
  ↓
Success toast notification
```

### Flow 6: Edit Existing Order ⭐ NEW

```
User clicks "Sửa" button on order
  ↓
Navigate to /core/orders/edit/:id
  ↓
EditOrderPage loads order data
  ↓
Display read-only fields (ID, dates, entities)
  ↓
Display editable fields (status, payment, amount)
  ↓
User modifies status → PAID
  ↓
User modifies payment_method → CREDIT_CARD
  ↓
Submit with current version
  ↓
If no conflict:
  → Update successful
  → Redirect to /core/orders
  → Success toast
  ↓
If version conflict (409):
  → Show error toast
  → Reload order with latest version
  → User must re-apply changes
```

---

## 🎯 Best Practices

### Performance
✅ Lazy load order list with pagination  
✅ Cache frequently accessed orders  
✅ Debounce search input (300ms)  
✅ Use React.memo for order cards
✅ **Optimize modal rendering** (only when isOpen)

### UX
✅ Clear status indicators with colors  
✅ Confirmation for destructive actions  
✅ Loading states for async operations  
✅ Error handling with toast notifications  
✅ **Highlight package snapshot importance**
✅ **Interactive status flow visualization**
✅ **Optimistic locking UX** (clear error messages)

### Accessibility
✅ Semantic HTML  
✅ Keyboard navigation  
✅ Screen reader support  
✅ ARIA labels for status badges
✅ **Focus management** in modals
✅ **Escape key** to close modal

### Data Display
✅ Format currency correctly (VND vs USD)  
✅ Format dates in local timezone  
✅ Pretty-print JSON snapshots  
✅ Truncate long text with tooltips
✅ **Visual hierarchy** (important info larger/highlighted)

---

## 📊 Component Comparison

| Component | Lines | Features | Complexity |
|-----------|-------|----------|------------|
| OrdersPage | 370+ | List, filters, search, modal trigger | Medium |
| OrderDetailModal | 450+ | 5 sections, gradients, status flow | High |
| CreateOrderPage | 250+ | Form, auto-fill, validation | Medium |
| EditOrderPage | 280+ | Form, optimistic locking, reload | Medium-High |

---

## 🎨 Package Snapshot Visualization Best Practices

**Why it's important:**
1. **Legal requirement** - Proof of what customer bought
2. **Price protection** - Customer pays original price
3. **Entitlements protection** - Customer gets original features

**How we highlight it:**
- ✅ Blue-cyan gradient (stands out from other sections)
- ✅ Border-2 (double emphasis)
- ✅ Info box with 3 bullet points
- ✅ Larger icon (Package)
- ✅ Shadow-lg (visual depth)
- ✅ Positioned in right column (prime real estate)
- ✅ Scrollable JSON with syntax highlighting

**Display example:**
```json
{
  "_id": "01940822-5678-7890-abcd-package0001",
  "code": "hrm-pro",
  "name": "HRM Professional",
  "price_amount": 2990000,
  "currency_code": "VND",
  "billing_cycle": "MONTHLY",
  "entitlements_config": {
    "apps": {
      "hrm": {
        "enabled": true,
        "features": {
          "employee_management": true,
          "payroll": true,
          "advanced_reports": true
        }
      }
    }
  },
  "max_users": 50,
  "max_storage": 100
}
```

---

## 📚 Related Documentation

- [Orders Schema](./ORDERS_SCHEMA.md)
- [Orders API](./ORDERS_API.md)
- [Orders Use Cases](./ORDERS_USECASES.md)
- [Orders ERD](./ORDERS_ERD.md)
- [Orders README](./ORDERS_README.md)

---

**Version:** 2.0.0 (Enhanced Design)  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team