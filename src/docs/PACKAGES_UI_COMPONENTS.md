# Service Packages - UI Components Guide

## 📋 Overview

UI components for **Service Packages** module with design patterns and best practices.

---

## 🎨 Component Structure

```
PackagesPage
├── PackageTable (Table View)
├── PackageCard (Grid View)
├── PackageFilters
└── PackageDetailModal ⭐ NEW
```

---

## 📦 Main Components

### 1. PackagesPage

**Location:** `/pages/PackagesPage.tsx`

**Features:**
- ✅ Table and Grid view modes
- ✅ Search and filters (status, visibility)
- ✅ Pagination support
- ✅ CRUD operations
- ✅ Responsive design
- ✅ **PackageDetailModal integration** ⭐ NEW

**State Management:**
```typescript
const [packages, setPackages] = useState<ServicePackage[]>([]);
const [loading, setLoading] = useState(false);
const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
const [searchTerm, setSearchTerm] = useState('');
const [filters, setFilters] = useState<PackageFilters>({});
const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);
```

**Package Detail Modal Trigger:**
```typescript
const handleViewDetails = async (pkg: ServicePackage) => {
  try {
    const fullPackage = await servicePackageApi.getById(pkg._id!);
    setSelectedPackage(fullPackage);
    setIsModalOpen(true);
  } catch (error: any) {
    toast.error('Không thể tải chi tiết gói: ' + error.message);
  }
};
```

---

### 2. PackageTable

**Display Columns:**
- Package name + code
- Product name
- Price + billing cycle
- Status badge
- Actions (Edit, Delete)

**Visual Example:**
```
┌────────────────────────────────────────────────────────────┐
│ Package             │ Product  │ Price      │ Status │ Actions │
├────────────────────────────────────────────────────────────┤
│ HRM Professional    │ HRM      │ 2,990,000đ │ Active │ [Edit]  │
│ hrm-pro             │ Suite    │ /month     │        │ [Del]   │
└────────────────────────────────────────────────────────────┘
```

---

### 3. PackageCard (Grid View)

**Layout:**
```
┌─────────────────────┐
│ HRM Professional    │
│ hrm-pro             │
│                     │
│ 2,990,000đ/month    │
│                     │
│ [View] [Edit]       │
└─────────────────────┘
```

---

### 4. PackageDetailModal ⭐ NEW

**Location:** `/components/packages/PackageDetailModal.tsx`

**Purpose:** Display complete package information in a modal popup

**Features:**
- ✅ **27+ fields** organized in 9 sections
- ✅ **Gradient header** with indigo-purple gradient
- ✅ **Two-column layout** for optimal space usage
- ✅ **JSONB visualization** for entitlements, features, metadata
- ✅ **Color-coded sections** for easy navigation
- ✅ **Dark mode support**
- ✅ **Responsive design**

**Props:**
```typescript
interface PackageDetailModalProps {
  package: ServicePackage | null;
  isOpen: boolean;
  onClose: () => void;
}
```

**Sections Display:**

**Left Column:**
1. ✅ **I. Định danh & Liên kết** (gray background)
   - Package ID, Product ID, Product name/code
   
2. ✅ **II. Thông tin thương mại** (gray background)
   - Code, Name, Description
   
3. ✅ **III. Tài chính (Pricing)** (indigo gradient background) ⭐
   - Large price display
   - Currency, Billing cycle
   - Trial days (if applicable)
   
4. ✅ **V. Trạng thái vận hành** (gray background)
   - Status badge with colors
   - Public/Private with icons
   - Display order

**Right Column:**
5. ✅ **VII. Giới hạn tài nguyên** (gray background)
   - Max users, Max storage
   - Shows "Không giới hạn" for null values
   
6. ✅ **IV. Cấu hình quyền hạn** (blue background) ⭐
   - JSONB entitlements_config
   - Syntax-highlighted JSON
   - Scrollable pre element
   
7. ✅ **VIII. Tính năng nổi bật** (purple background)
   - JSONB features
   - Syntax-highlighted JSON
   
8. ✅ **VIII. Metadata** (gray background)
   - JSONB metadata
   - Additional custom data
   
9. ✅ **IX. Audit & Versioning** (gray background)
   - Version number
   - Created/Updated/Deleted timestamps
   - Created/Updated/Deleted by user IDs

**Visual Example:**
```
┌────────────────────────────────────────────────────────┐
│ 🎁 HRM Professional Plan                          [×]  │ ← Gradient header
│    hrm-professional                                     │
├─────────────────┬──────────────────────────────────────┤
│ LEFT COLUMN     │ RIGHT COLUMN                         │
├─────────────────┼──────────────────────────────────────┤
│ I. Định danh    │ VII. Giới hạn tài nguyên            │
│ ┌─────────────┐ │ ┌────────────────────────────────┐  │
│ │ Package ID  │ │ │ Max users: 50                  │  │
│ │ Product ID  │ │ │ Max storage: 100 GB            │  │
│ └─────────────┘ │ └────────────────────────────────┘  │
│                 │                                       │
│ II. Thương mại  │ IV. Entitlements 🔐 (Blue)          │
│ ┌─────────────┐ │ ┌────────────────────────────────┐  │
│ │ Code        │ │ │ {                              │  │
│ │ Name        │ │ │   "apps": {                    │  │
│ │ Description │ │ │     "hrm": { ... }             │  │
│ └─────────────┘ │ │   }                            │  │
│                 │ │ }                              │  │
│ III. Pricing 💰 │ └────────────────────────────────┘  │
│ ┌─────────────┐ │                                       │
│ │ 2,990,000đ  │ │ VIII. Features ✨ (Purple)          │
│ │ /month      │ │ ┌────────────────────────────────┐  │
│ │ 14-day trial│ │ │ { "highlighted": [...] }       │  │
│ └─────────────┘ │ └────────────────────────────────┘  │
│                 │                                       │
│ V. Trạng thái   │ IX. Audit & Version                 │
│ ┌─────────────┐ │ ┌────────────────────────────────┐  │
│ │ ✅ ACTIVE   │ │ │ Version: v1                    │  │
│ │ 👁 Public   │ │ │ Created: 2025-01-13 10:00     │  │
│ │ Order: #2   │ │ │ Updated: 2025-01-13 10:00     │  │
│ └─────────────┘ │ └────────────────────────────────┘  │
└─────────────────┴──────────────────────────────────────┘
│                      [Đóng]                            │ ← Footer
└────────────────────────────────────────────────────────┘
```

**Color Coding:**
```css
/* Section backgrounds */
I. Định danh:     gray-50
II. Thương mại:   gray-50
III. Pricing:     indigo-50 with border (highlighted) ⭐
IV. Entitlements: blue-50 with border (highlighted) ⭐
V. Trạng thái:    gray-50
VII. Giới hạn:    gray-50
VIII. Features:   purple-50 with border
VIII. Metadata:   gray-50
IX. Audit:        gray-50
```

**Icons Used:**
- 📦 Package (header, sections)
- 💰 DollarSign (Pricing section)
- ⚙️ Settings (Status section)
- 👥 Users (Resource limits)
- 💾 Database (Metadata)
- 📅 Calendar (Audit)
- ℹ️ Info (Identification)
- 👁 Eye (Public visibility)
- 🚫 EyeOff (Private visibility)
- 🛡️ Shield (Entitlements)
- ⬆️ ArrowUpCircle (Features)

**Usage Example:**
```tsx
// In PackagesPage
import { PackageDetailModal } from '../components/packages/PackageDetailModal';

const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);

const handleViewDetails = async (pkg: ServicePackage) => {
  const fullPackage = await servicePackageApi.getById(pkg._id!);
  setSelectedPackage(fullPackage);
  setIsModalOpen(true);
};

// Render modal
<PackageDetailModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  package={selectedPackage}
/>
```

**Interaction Flow:**
```
User clicks package name
  ↓
handleViewDetails() called
  ↓
Fetch full package details from API
  ↓
setSelectedPackage() & setIsModalOpen(true)
  ↓
Modal appears with full details
  ↓
User views all 27+ fields
  ↓
User clicks "Đóng" or outside modal
  ↓
Modal closes
```

---

## 🎨 Design System

### Colors

```css
/* Primary */
--indigo-600: #6366f1;  /* Brand color */

/* Status */
--green: Active packages
--gray: Inactive packages
--red: Archived packages
```

### Typography

```css
h1: text-3xl font-bold
h3: text-lg font-bold
price: text-3xl font-bold text-indigo-600
code: text-sm font-mono
```

---

## 📱 Responsive Breakpoints

```css
base: < 640px (mobile)
md: 768px (tablet)
lg: 1024px (desktop)

/* Grid columns */
grid-cols-1          /* Mobile */
md:grid-cols-2       /* Tablet */
lg:grid-cols-3       /* Desktop */
```

---

## 🔄 User Flows

### Flow 1: View Packages List

```
User visits /core/packages
  ↓
Load packages from API
  ↓
Display in table/grid view
  ↓
User can filter by status/visibility
```

### Flow 2: View Package Details ⭐ NEW

```
User clicks package name (in table or grid)
  ↓
handleViewDetails() triggered
  ↓
API call: servicePackageApi.getById()
  ↓
Fetch full package with all 27+ fields
  ↓
PackageDetailModal opens
  ↓
User views:
  • Identification & Links
  • Commercial Info
  • Pricing (highlighted)
  • Entitlements (JSONB)
  • Status & Visibility
  • Resource Limits
  • Features (JSONB)
  • Metadata (JSONB)
  • Audit Trail & Version
  ↓
User clicks "Đóng" or outside
  ↓
Modal closes, returns to list
```

### Flow 3: Edit Package

```
User clicks Edit
  ↓
Navigate to /core/packages/edit/:id
  ↓
Load package data
  ↓
User modifies fields
  ↓
Save with version control
```

---

## 🎯 Best Practices

### Performance
✅ Lazy load package images  
✅ Paginate large lists  
✅ Cache frequently accessed data

### UX
✅ Clear status indicators  
✅ Confirmation for delete  
✅ Loading states  
✅ Error handling

### Accessibility
✅ Semantic HTML  
✅ Keyboard navigation  
✅ Screen reader support

---

## 📚 Related Documentation

- [Packages Schema](./PACKAGES_SCHEMA.md)
- [Packages API](./PACKAGES_API.md)
- [Products UI Components](./PRODUCTS_UI_COMPONENTS.md)

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team