# Products UI Components Documentation

## 📋 Tổng quan

Tài liệu này mô tả các UI components được sử dụng trong module **SaaS Products**, bao gồm modal, table, card, và form components.

---

## 🎨 Component Architecture

```
ProductsPage
├── ProductTable (Table View)
│   └── Product Row (clickable name → opens modal)
├── ProductCard (Grid View)
│   └── View Details Button → opens modal
└── ProductDetailModal (Full Detail View)
    ├── Header Section (Name, Status, Actions)
    ├── Pricing Section (Price, Billing, Trial)
    ├── Features Section
    ├── Limits Section
    ├── Display Settings
    ├── Metadata
    └── System Info
```

---

## 📦 Components

### 1. ProductDetailModal

**Location:** `/components/products/ProductDetailModal.tsx`

Comprehensive modal component để hiển thị đầy đủ thông tin của một product.

#### Props Interface

```typescript
interface ProductDetailModalProps {
  product: SaaSProduct | null;
  isOpen: boolean;
  onClose: () => void;
}
```

#### Features

✅ **Full Product Information Display:**
- Basic info (name, code, description)
- Product type badge
- Status with color-coded badges
- Featured indicator
- Pricing details (base price, currency, billing cycle)
- Trial days information

✅ **Interactive Features:**
- Copy to clipboard (product code, ID)
- Edit button → navigate to edit page
- Close button
- Backdrop click to close

✅ **Detailed Sections:**
- **Features**: Key-value display với icons
- **Limits**: Quota/limit display với icons
- **Display Settings**: display_order, is_featured
- **Metadata**: JSON viewer
- **System Info**: ID, version, created/updated timestamps

✅ **Dark Mode Support**: Fully responsive to theme changes

#### Usage Example

```tsx
import { ProductDetailModal } from '../components/products/ProductDetailModal';

function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<SaaSProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (product: SaaSProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <>
      <ProductTable onView={handleViewDetails} />
      
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
```

#### Visual Structure

```
┌──────────────────────────────────────────────────────────┐
│ HRM Professional  [Featured] [Active]      [Edit] [X]    │
│ hrm-pro [copy icon]                                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Giải pháp quản lý nhân sự toàn diện cho doanh nghiệp    │
│                                                           │
│ [Package Icon] Loại sản phẩm                            │
│ PRODUCT_TYPE_APP                                         │
│                                                           │
│ ┌────────────┬────────────┬────────────┐               │
│ │ 💲 Giá     │ 🕐 Chu kỳ  │ 📅 Thử     │               │
│ │ 2,990,000đ │ Tháng      │ 14 ngày    │               │
│ └────────────┴────────────┴────────────┘               │
│                                                           │
│ ⚡ Tính năng                                             │
│ ┌─────────────────────────────────────────┐            │
│ │ ⚡ Employee Management         [Có]     │            │
│ │ ⚡ Attendance Tracking          [Có]     │            │
│ │ ⚡ Payroll                      [Có]     │            │
│ └─────────────────────────────────────────┘            │
│                                                           │
│ 💾 Giới hạn                                              │
│ ┌─────────────────────────────────────────┐            │
│ │ 💾 Max Employees            [50]        │            │
│ │ 💾 Max Storage Gb           [10]        │            │
│ └─────────────────────────────────────────┘            │
│                                                           │
│ ⚙️ Cài đặt hiển thị                                      │
│ Thứ tự: 1           Featured: [Có]                      │
│                                                           │
│ 👥 Thông tin hệ thống                                    │
│ ID: 01934f... [copy]   Version: v1                      │
│ Ngày tạo: 15/01/2024   Cập nhật: 15/01/2024           │
└──────────────────────────────────────────────────────────┘
```

---

### 2. ProductTable

**Location:** `/components/products/ProductTable.tsx`

Table component để hiển thị danh sách products với actions.

#### Features

✅ **Columns:**
- Product (name + code) - **Clickable** → opens modal
- Product Type
- Price (formatted)
- Billing Cycle
- Status (badge with colors)
- Actions (edit, delete, duplicate, toggle featured)

✅ **Interactive:**
- Click product name → open ProductDetailModal
- Hover effects
- Action buttons với confirmations

#### Visual Example

```
┌────────────────────────────────────────────────────────────────┐
│ Product             │ Type      │ Price      │ Cycle  │ Status │ Actions     │
├────────────────────────────────────────────────────────────────┤
│ ⭐ HRM Professional │ APP       │ 2,990,000đ │ Tháng  │ Active │ [Edit][Del] │
│    hrm-pro          │           │            │        │        │             │
├────────────────────────────────────────────────────────────────┤
│ CRM Basic           │ APP       │ 990,000đ   │ Tháng  │ Active │ [Edit][Del] │
│    crm-basic        │           │            │        │        │             │
└────────────────────────────────────────────────────────────────┘
```

#### Usage

```tsx
<ProductTable
  products={products}
  onEdit={(product) => navigate(`/core/products/edit/${product._id}`)}
  onDelete={handleDelete}
  onView={handleViewDetails}  // Opens modal
  onDuplicate={handleDuplicate}
  onToggleFeatured={handleToggleFeatured}
  loading={loading}
/>
```

---

### 3. ProductCard

**Location:** `/components/products/ProductCard.tsx`

Card component cho grid view.

#### Features

✅ **Card Layout:**
- Product name & code
- Featured star badge
- Status badge
- Price (large, prominent)
- Billing cycle
- Trial days badge
- Action buttons

✅ **Actions:**
- View Details → opens modal
- Edit
- Delete
- Duplicate
- Toggle Featured

#### Visual Example

```
┌────────────────────────────┐
│ ⭐ HRM Professional        │
│ [Active]                   │
│                            │
│ 2,990,000 đ                │
│ Tháng                      │
│ [14 ngày dùng thử]        │
│                            │
│ hrm-pro                    │
│                            │
│ [View] [Edit] [⭐] [...]  │
└────────────────────────────┘
```

---

### 4. ProductsPage

**Location:** `/pages/ProductsPage.tsx`

Main page component với state management.

#### State Management

```typescript
const [products, setProducts] = useState<SaaSProduct[]>([]);
const [loading, setLoading] = useState(false);
const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
const [searchTerm, setSearchTerm] = useState('');
const [selectedProduct, setSelectedProduct] = useState<SaaSProduct | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const [filters, setFilters] = useState<ProductFilters>({...});
```

#### Key Handlers

```typescript
// Open modal
const handleViewDetails = (product: SaaSProduct) => {
  setSelectedProduct(product);
  setIsModalOpen(true);
};

// Close modal
const handleCloseModal = () => {
  setIsModalOpen(false);
  setSelectedProduct(null);
};

// CRUD operations
const handleDelete = async (product: SaaSProduct) => {...};
const handleToggleFeatured = async (product: SaaSProduct) => {...};
const handleDuplicate = async (product: SaaSProduct) => {...};
```

---

## 🎨 Design System

### Color Scheme

```css
/* Indigo Primary */
--indigo-50: #eef2ff;
--indigo-600: #6366f1;  /* Main brand color */
--indigo-900: #312e81;

/* Status Colors */
--green: Active products
--gray: Inactive products
--red: Archived products
--yellow: Featured badge
```

### Typography

```css
/* Headers */
h1: text-3xl font-bold (Products page title)
h2: text-2xl font-bold (Modal title)
h3: text-lg font-semibold (Section headers)

/* Body */
body: text-sm (Regular text)
code: text-xs font-mono (Product codes, IDs)

/* Special */
price: text-2xl font-bold text-indigo-600 (Pricing display)
```

### Spacing

```css
/* Page Padding */
.page: p-6 max-w-7xl mx-auto

/* Card Padding */
.card: p-6 rounded-lg

/* Section Spacing */
.section: space-y-6 (between sections)
.grid-gap: gap-4 (grid items)
```

### Icons

**Icon Library:** Lucide React

```typescript
import {
  Star,         // Featured products
  DollarSign,   // Pricing
  Clock,        // Billing cycle
  Calendar,     // Trial days
  Package,      // Product type
  Zap,          // Features
  Database,     // Limits
  Settings,     // Settings section
  Users,        // System info
  Copy,         // Copy to clipboard
  Edit2,        // Edit action
  X,            // Close modal
  CheckCircle2, // Active status
  AlertCircle,  // Inactive status
} from 'lucide-react';
```

---

## 🔄 User Flows

### Flow 1: View Product Details

```
User clicks product name in table
  ↓
handleViewDetails(product) called
  ↓
setSelectedProduct(product)
setIsModalOpen(true)
  ↓
ProductDetailModal renders with full info
  ↓
User views details, can copy code/ID
  ↓
User clicks [Edit] → navigate to edit page
OR
User clicks [X] or backdrop → handleCloseModal()
  ↓
Modal closes, return to list
```

### Flow 2: Edit Product from Modal

```
User opens ProductDetailModal
  ↓
User clicks [Chỉnh sửa] button
  ↓
handleEdit() called
  ↓
onClose() - close modal
  ↓
navigate(`/core/products/edit/${product._id}`)
  ↓
User lands on EditProductPage
```

### Flow 3: Toggle Featured Status

```
User clicks star icon in table/card
  ↓
handleToggleFeatured(product) called
  ↓
API call: saasProductApi.toggleFeatured(id, version)
  ↓
Success: Show toast, reload products
  ↓
Table updates, star icon reflects new state
```

---

## 🎯 Best Practices

### 1. Modal UX

✅ **DO:**
- Close on backdrop click
- Close on ESC key (implement if needed)
- Show loading state while fetching
- Scroll long content inside modal
- Keep modal max-width reasonable (max-w-4xl)
- Center modal vertically and horizontally
- Use backdrop blur for better focus

❌ **DON'T:**
- Open multiple modals at once
- Make modal too wide (> 90vw)
- Block all interactions without close option
- Forget to reset state on close

### 2. Performance

✅ **DO:**
- Only render modal when isOpen = true
- Clean up selectedProduct on close
- Use React.memo for ProductCard/Table if needed
- Debounce search input
- Lazy load modal content

❌ **DON'T:**
- Render hidden modal in DOM
- Keep large state when not needed
- Re-fetch data unnecessarily

### 3. Accessibility

✅ **DO:**
- Use semantic HTML (button, nav, header)
- Add aria-labels for icon buttons
- Keyboard navigation support
- Focus management (trap focus in modal)
- Color contrast ratio ≥ 4.5:1

❌ **DON'T:**
- Use div for clickable elements
- Forget alt text for images
- Rely only on color for information

### 4. Responsive Design

✅ **DO:**
- Mobile-first approach
- Stack sections vertically on mobile
- Reduce padding on small screens
- Use responsive grid (grid-cols-1 md:grid-cols-3)
- Touch-friendly button sizes (min 44x44px)

❌ **DON'T:**
- Fixed pixel widths
- Horizontal scroll
- Tiny text on mobile (< 14px)
- Overlapping elements

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
base: < 640px (mobile)
sm: 640px  (small tablet)
md: 768px  (tablet)
lg: 1024px (desktop)
xl: 1280px (large desktop)

/* Usage Examples */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>

<div className="p-4 md:p-6">
  {/* Smaller padding on mobile */}
</div>
```

---

## 🎨 Theme Support

### Light Mode
- Background: white
- Text: gray-900
- Borders: gray-200
- Hover: gray-50

### Dark Mode
- Background: gray-800, gray-900
- Text: white
- Borders: gray-700
- Hover: gray-750 (custom)

### Implementation

```tsx
// Always provide dark mode variants
<div className="bg-white dark:bg-gray-800">
  <p className="text-gray-900 dark:text-white">
    Content
  </p>
</div>
```

---

## 🔧 Component Customization

### Extending ProductDetailModal

```tsx
// Add custom section
<div>
  <div className="flex items-center gap-2 mb-4">
    <CustomIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
      Custom Section
    </h3>
  </div>
  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
    {/* Custom content */}
  </div>
</div>
```

### Custom Status Colors

```tsx
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'coming_soon':  // Custom status
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    // ...
  }
};
```

---

## 📚 Related Documentation

- [Products Schema Documentation](./PRODUCTS_SCHEMA.md)
- [Products API Documentation](./PRODUCTS_API.md)
- [Products Use Cases](./PRODUCTS_USECASES.md)
- [UI Component Library](./UI_COMPONENTS.md)

---

## 🧪 Testing Guidelines

### Unit Tests

```typescript
// Test modal open/close
test('opens modal when product is selected', () => {
  const { getByText, queryByRole } = render(<ProductsPage />);
  
  fireEvent.click(getByText('HRM Professional'));
  
  expect(queryByRole('dialog')).toBeInTheDocument();
});

// Test modal close
test('closes modal on close button click', () => {
  const { getByText, getByLabelText, queryByRole } = render(<ProductsPage />);
  
  fireEvent.click(getByText('HRM Professional'));
  fireEvent.click(getByLabelText('Close'));
  
  expect(queryByRole('dialog')).not.toBeInTheDocument();
});
```

### E2E Tests

```typescript
// Cypress example
describe('Product Details', () => {
  it('shows full product information in modal', () => {
    cy.visit('/core/products');
    cy.contains('HRM Professional').click();
    
    cy.get('[role="dialog"]')
      .should('be.visible')
      .within(() => {
        cy.contains('HRM Professional');
        cy.contains('hrm-pro');
        cy.contains('2,990,000');
        cy.contains('Tính năng');
        cy.contains('Giới hạn');
      });
  });
});
```

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team
