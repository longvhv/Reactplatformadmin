# Products Detail - Complete Documentation

**Module:** Products Detail View (Modal & Page)  
**Version:** 1.0.0  
**Last Updated:** 2026-01-14  
**Status:** ✅ Production Ready

---

## Table of Contents

- [Overview](#overview)
- [Components](#components)
- [Features](#features)
- [API Integration](#api-integration)
- [Data Structure](#data-structure)
- [UI/UX Design](#uiux-design)
- [Implementation Guide](#implementation-guide)

---

## Overview

Product Detail view cung cấp hai cách hiển thị chi tiết sản phẩm:
1. **ProductDetailModal** - Modal popup nhanh cho preview
2. **ProductDetailPage** - Full page với tabs chi tiết

Cả hai đều aligned 100% với schema trong `docs/DatabaseCommand.md`.

---

## Components

### 1. ProductDetailModal

**File:** `/components/products/ProductDetailModal.tsx`  
**Purpose:** Quick preview modal  
**Usage:** Product list, cards

**Key Features:**
- ✅ Schema-compliant display (product_type, base_price, currency, metadata)
- ✅ Product type badges (APP, DOMAIN, SSL, SERVICE)
- ✅ Metadata JSONB visualization
- ✅ Features from metadata.features[]
- ✅ Limits from metadata.limits{}
- ✅ Tags from metadata.tags[]
- ✅ Copy to clipboard (ID, code)
- ✅ Edit navigation
- ✅ Design tokens compliant

**Props:**
```typescript
interface ProductDetailModalProps {
  product: SaaSProduct;
  isOpen: boolean;
  onClose: () => void;
}
```

**Example Usage:**
```tsx
<ProductDetailModal
  product={selectedProduct}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
/>
```

### 2. ProductDetailPage

**File:** `/pages/ProductDetailPage.tsx`  
**Purpose:** Full detail page with tabs  
**Route:** `/core/products/:id`

**Tabs:**
1. **Overview Tab** (`ProductOverviewTab.tsx`) - Basic info + metadata
2. **Stats Tab** (`ProductStatsTab.tsx`) - Usage statistics
3. **Packages Tab** (`ProductPackagesTab.tsx`) - Service packages list
4. **Revenue Tab** (`ProductRevenueTab.tsx`) - Revenue analytics

**Key Features:**
- ✅ Breadcrumb navigation
- ✅ Action buttons (Edit, Delete, Toggle Status, Duplicate)
- ✅ Product type badge
- ✅ Price display
- ✅ Tabbed interface
- ✅ Responsive design

### 3. ProductOverviewTab

**File:** `/components/products/ProductOverviewTab.tsx`  
**Updated:** 2026-01-14  
**Status:** ✅ 100% Schema Aligned

**Sections:**
1. **Basic Info Card**
   - Name, code, product_type, status, ID
   - Description

2. **Pricing Card**
   - Base price (formatted)
   - Currency (ISO code)
   - Raw price (NUMERIC display)

3. **Features Card** (from metadata.features)
   - List of features với checkmarks
   - Grid layout

4. **Limits Card** (from metadata.limits)
   - Usage limits
   - "Không giới hạn" for -1 values

5. **Tags & Display Card**
   - Tags từ metadata
   - Display order
   - Is featured flag

6. **System Information Card**
   - Created/Updated timestamps
   - Version (optimistic locking)
   - Soft delete info

7. **Metadata Card**
   - Full JSON display
   - JSONB info tooltip

8. **Schema Information Card**
   - Table name
   - Field types
   - Documentation link

---

## Features

### Product Type Visualization

**4 Product Types:**

```typescript
type ProductType = 'APP' | 'DOMAIN' | 'SSL' | 'SERVICE';
```

**Visual Representation:**

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| APP | Boxes | Blue | SaaS Applications |
| DOMAIN | Globe | Purple | Domain Names |
| SSL | Shield | Green | SSL Certificates |
| SERVICE | Wrench | Orange | Additional Services |

**Implementation:**
```tsx
const getProductTypeConfig = (type: ProductType) => {
  const configs = {
    APP: { 
      icon: Boxes,
      color: 'bg-blue-100 text-blue-800',
      label: 'Application'
    },
    // ... other types
  };
  return configs[type];
};
```

### Price Display

**Schema:** `base_price NUMERIC(19, 4)`

**Display Formats:**

1. **Formatted (User-friendly)**
   ```typescript
   formatPrice(999000.0000, 'VND') 
   // → "999.000 ₫"
   ```

2. **Raw (Technical)**
   ```typescript
   product.base_price.toFixed(4)
   // → "999000.0000"
   ```

3. **Currency Info**
   ```
   Currency: VND
   ISO 4217 Code
   ```

### Metadata JSONB Display

**Structure:**
```json
{
  "features": ["feature1", "feature2"],
  "limits": {
    "max_users": 100,
    "storage_gb": 50
  },
  "display_order": 1,
  "is_featured": true,
  "tags": ["popular", "enterprise"],
  "seo": {
    "title": "Product Title",
    "description": "SEO description"
  }
}
```

**Display Sections:**

1. **Features** - Extracted as list
2. **Limits** - Extracted as key-value pairs
3. **Tags** - Displayed as badges
4. **Full JSON** - Syntax-highlighted

### Copy to Clipboard

**Implemented For:**
- Product ID
- Product Code

**Implementation:**
```typescript
const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`Đã sao chép ${label}`);
};
```

### Soft Delete Indicator

**When product.deleted_at is set:**
```tsx
{product.deleted_at && (
  <div className="bg-destructive/10 border-destructive/20">
    ⚠️ Sản phẩm đã bị xóa mềm
    Ngày xóa: {new Date(product.deleted_at).toLocaleString()}
  </div>
)}
```

---

## API Integration

### GET Product by ID

**Endpoint:** `GET /api/v1/saas-products/{id}`

**Golang Handler:**
```go
func (h *SaaSProductHandler) GetProductByID(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    id := vars["id"]
    
    query := `
        SELECT 
            _id, code, name, product_type, description,
            base_price, currency, is_active, metadata,
            created_at, updated_at, deleted_at, version
        FROM saas_products
        WHERE _id = $1 AND deleted_at IS NULL
    `
    
    var product SaaSProduct
    var metadataJSON []byte
    
    err := h.DB.QueryRow(query, id).Scan(
        &product.ID, &product.Code, &product.Name, &product.ProductType,
        &product.Description, &product.BasePrice, &product.Currency,
        &product.IsActive, &metadataJSON, &product.CreatedAt,
        &product.UpdatedAt, &product.DeletedAt, &product.Version,
    )
    
    json.Unmarshal(metadataJSON, &product.Metadata)
    
    respondWithJSON(w, http.StatusOK, map[string]interface{}{
        "data": product,
    })
}
```

**Response:**
```json
{
  "data": {
    "_id": "01940d7e-xxxx",
    "code": "crm-basic",
    "name": "CRM Basic",
    "product_type": "APP",
    "description": "Basic CRM solution",
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

### GET Product with Packages

**Enhancement:** Include service packages in response

**Endpoint:** `GET /api/v1/saas-products/{id}?include=packages`

**Query:**
```sql
SELECT 
  p.*,
  json_agg(
    json_build_object(
      '_id', sp._id,
      'code', sp.code,
      'name', sp.name,
      'price_amount', sp.price_amount,
      'currency_code', sp.currency_code,
      'billing_cycle', sp.billing_cycle
    )
  ) FILTER (WHERE sp._id IS NOT NULL) as packages
FROM saas_products p
LEFT JOIN service_packages sp 
  ON sp.saas_product_id = p._id 
  AND sp.deleted_at IS NULL
WHERE p._id = $1 AND p.deleted_at IS NULL
GROUP BY p._id;
```

**Response:**
```json
{
  "data": {
    "_id": "01940d7e-xxxx",
    "code": "crm-basic",
    "name": "CRM Basic",
    "product_type": "APP",
    "base_price": 99000.0000,
    "currency": "VND",
    "packages": [
      {
        "_id": "pkg-001",
        "code": "crm-basic-monthly",
        "name": "CRM Basic Monthly",
        "price_amount": 99000.0000,
        "currency_code": "VND",
        "billing_cycle": "MONTHLY"
      },
      {
        "_id": "pkg-002",
        "code": "crm-basic-yearly",
        "name": "CRM Basic Yearly",
        "price_amount": 990000.0000,
        "currency_code": "VND",
        "billing_cycle": "YEARLY"
      }
    ]
  }
}
```

---

## Data Structure

### SaaSProduct Interface

**File:** `/api/saasProductApi.ts`

```typescript
export type ProductType = 'APP' | 'DOMAIN' | 'SSL' | 'SERVICE';

export interface SaaSProduct {
  _id?: string;
  code: string;
  name: string;
  product_type: ProductType;
  description?: string;
  base_price: number;
  currency: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  version?: number;
}
```

### Metadata Structure (Recommended)

```typescript
interface ProductMetadata {
  // Features list
  features?: string[];
  
  // Usage limits
  limits?: {
    max_users?: number;
    storage_gb?: number;
    api_calls_per_month?: number;
    max_domains?: number;
    [key: string]: number | undefined;
  };
  
  // Display settings
  display_order?: number;
  is_featured?: boolean;
  icon?: string;
  color?: string;
  
  // Tags for filtering/search
  tags?: string[];
  
  // SEO metadata
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  
  // Domain-specific (for DOMAIN type)
  domain_extension?: string;
  renewal_price?: number;
  
  // SSL-specific (for SSL type)
  ssl_type?: 'DV' | 'OV' | 'EV';
  wildcard?: boolean;
  warranty?: string;
  
  // Service-specific (for SERVICE type)
  sla?: string;
  response_time?: string;
  channels?: string[];
  
  // Custom fields
  [key: string]: any;
}
```

---

## UI/UX Design

### Design Tokens

**All components use semantic tokens:**

```css
/* Colors */
bg-card              /* Card backgrounds */
bg-primary           /* Primary color */
bg-success           /* Success states */
bg-destructive       /* Error states */
bg-muted             /* Muted backgrounds */

text-foreground      /* Primary text */
text-muted-foreground /* Secondary text */

border-border        /* Border colors */
border-primary       /* Primary borders */
```

### Color Scheme

**Product Type Colors:**

```typescript
const typeColors = {
  APP: {
    light: 'bg-blue-100 text-blue-800',
    dark: 'dark:bg-blue-900/20 dark:text-blue-400',
  },
  DOMAIN: {
    light: 'bg-purple-100 text-purple-800',
    dark: 'dark:bg-purple-900/20 dark:text-purple-400',
  },
  SSL: {
    light: 'bg-green-100 text-green-800',
    dark: 'dark:bg-green-900/20 dark:text-green-400',
  },
  SERVICE: {
    light: 'bg-orange-100 text-orange-800',
    dark: 'dark:bg-orange-900/20 dark:text-orange-400',
  },
};
```

### Layout Structure

**Modal Layout:**
```
┌─────────────────────────────────────────┐
│ Header                                   │
│  - Name + Badges                         │
│  - Code + Copy                           │
│  - Edit Button + Close                   │
├─────────────────────────────────────────┤
│ Content (Scrollable)                     │
│  ├─ Description                          │
│  ├─ Product Type Info                    │
│  ├─ Pricing Section                      │
│  ├─ Features                             │
│  ├─ Limits                               │
│  ├─ Tags & Display                       │
│  ├─ Metadata JSON                        │
│  ├─ System Info                          │
│  └─ Schema Info                          │
└─────────────────────────────────────────┘
```

**Page Layout:**
```
┌─────────────────────────────────────────┐
│ Header (Sticky)                          │
│  - Back Button                           │
│  - Product Info                          │
│  - Actions (Edit, Delete, Toggle, More)  │
├─────────────────────────────────────────┤
│ Tabs                                     │
│  [Overview] [Stats] [Packages] [Revenue] │
├─────────────────────────────────────────┤
│ Tab Content                              │
│  (Selected tab component)                │
└─────────────────────────────────────────┘
```

### Responsive Design

**Breakpoints:**
- Mobile: `< 768px` - Single column
- Tablet: `768px - 1024px` - 2 columns
- Desktop: `> 1024px` - 3-4 columns

**Grid Examples:**
```tsx
// Pricing cards
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Features list
className="grid grid-cols-1 md:grid-cols-2 gap-3"

// System info
className="grid grid-cols-2 md:grid-cols-4 gap-4"
```

---

## Implementation Guide

### Step 1: Add Modal to List Page

```tsx
// ProductsPage.tsx
import { ProductDetailModal } from '@/components/products/ProductDetailModal';

function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<SaaSProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleViewDetails = (product: SaaSProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };
  
  return (
    <>
      {/* Product List */}
      <ProductTable onView={handleViewDetails} />
      
      {/* Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
```

### Step 2: Navigate to Detail Page

```tsx
// From ProductTable
const handleRowClick = (product: SaaSProduct) => {
  navigate(`/core/products/${product._id}`);
};
```

### Step 3: Customize Metadata Display

```tsx
// Custom metadata rendering
const renderCustomMetadata = () => {
  const metadata = product.metadata || {};
  
  // Domain-specific
  if (product.product_type === 'DOMAIN') {
    return (
      <div>
        <p>Extension: {metadata.domain_extension}</p>
        <p>Renewal: {metadata.renewal_price}</p>
      </div>
    );
  }
  
  // SSL-specific
  if (product.product_type === 'SSL') {
    return (
      <div>
        <p>Type: {metadata.ssl_type}</p>
        <p>Wildcard: {metadata.wildcard ? 'Yes' : 'No'}</p>
      </div>
    );
  }
  
  // Default
  return <pre>{JSON.stringify(metadata, null, 2)}</pre>;
};
```

### Step 4: Handle Edit Navigation

```tsx
const handleEdit = () => {
  onClose(); // Close modal if open
  navigate(`/core/products/edit/${product._id}`);
};
```

### Step 5: Implement Copy Feedback

```tsx
import { toast } from 'sonner@2.0.3';

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`Đã sao chép ${label}`);
};

// Usage
<button onClick={() => copyToClipboard(product._id, 'ID')}>
  <Copy className="w-4 h-4" />
</button>
```

---

## Testing

### Unit Tests

```typescript
describe('ProductDetailModal', () => {
  it('should display product information correctly', () => {
    const product: SaaSProduct = {
      _id: '123',
      code: 'test-product',
      name: 'Test Product',
      product_type: 'APP',
      base_price: 100,
      currency: 'USD',
      is_active: true,
    };
    
    render(<ProductDetailModal product={product} isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('test-product')).toBeInTheDocument();
    expect(screen.getByText('Application')).toBeInTheDocument();
  });
  
  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<ProductDetailModal product={mockProduct} isOpen={true} onClose={onClose} />);
    
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
describe('ProductDetailPage', () => {
  it('should load product data on mount', async () => {
    const { getByText } = render(<ProductDetailPage />);
    
    await waitFor(() => {
      expect(getByText('CRM Basic')).toBeInTheDocument();
    });
  });
  
  it('should navigate to edit page', async () => {
    const { getByText } = render(<ProductDetailPage />);
    
    fireEvent.click(getByText('Chỉnh sửa'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/core/products/edit/123');
  });
});
```

---

## Performance Optimization

### Lazy Loading

```tsx
// Lazy load detail page
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));

// Usage
<Suspense fallback={<LoadingSpinner />}>
  <ProductDetailPage />
</Suspense>
```

### Memoization

```tsx
const ProductDetailModal = React.memo(({ product, isOpen, onClose }) => {
  // Component implementation
});
```

### Data Caching

```typescript
// Cache product data
const { product } = useSWR(
  `/api/v1/saas-products/${id}`,
  fetcher,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  }
);
```

---

## Accessibility

### ARIA Labels

```tsx
<button
  aria-label="Close product details"
  onClick={onClose}
>
  <X className="w-5 h-5" />
</button>

<button
  aria-label={`Copy product code ${product.code}`}
  onClick={() => copyToClipboard(product.code, 'code')}
>
  <Copy className="w-4 h-4" />
</button>
```

### Keyboard Navigation

```tsx
// Close on Escape
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };
  
  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, [isOpen, onClose]);
```

### Focus Management

```tsx
// Focus trap in modal
import { useFocusTrap } from '@/hooks/useFocusTrap';

const modalRef = useRef<HTMLDivElement>(null);
useFocusTrap(modalRef, isOpen);
```

---

## Migration from Old Schema

### Field Mapping

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `category` | `product_type` | Now enum: APP/DOMAIN/SSL/SERVICE |
| `features` | `metadata.features` | Moved to JSONB |
| `limits` | `metadata.limits` | Moved to JSONB |
| `is_featured` | `metadata.is_featured` | Moved to JSONB |
| `display_order` | `metadata.display_order` | Moved to JSONB |
| `billing_cycle` | ❌ Removed | Moved to service_packages |
| `trial_days` | ❌ Removed | Moved to service_packages |

### Migration Script

```typescript
// Convert old product to new schema
function migrateProduct(oldProduct: OldProduct): SaaSProduct {
  return {
    _id: oldProduct.id,
    code: oldProduct.code,
    name: oldProduct.name,
    product_type: mapCategoryToType(oldProduct.category),
    description: oldProduct.description,
    base_price: oldProduct.price,
    currency: oldProduct.currency || 'VND',
    is_active: oldProduct.status === 'active',
    metadata: {
      features: oldProduct.features || [],
      limits: oldProduct.limits || {},
      display_order: oldProduct.display_order || 0,
      is_featured: oldProduct.is_featured || false,
      tags: oldProduct.tags || [],
    },
    created_at: oldProduct.created_at,
    updated_at: oldProduct.updated_at,
    version: 1,
  };
}

function mapCategoryToType(category: string): ProductType {
  const mapping: Record<string, ProductType> = {
    'application': 'APP',
    'domain': 'DOMAIN',
    'ssl': 'SSL',
    'service': 'SERVICE',
  };
  return mapping[category.toLowerCase()] || 'APP';
}
```

---

## References

- **Database Schema:** `/docs/developer/products-database-schema.md`
- **API Reference:** `/docs/developer/products-api-reference.md`
- **ERD Diagram:** `/docs/developer/products-erd-diagram.md`
- **Use Cases:** `/docs/developer/products-use-cases.md`
- **Main Documentation:** `/docs/PRODUCTS_MODULE_COMPLETE_PACKAGE.md`
- **Source Schema:** `/docs/DatabaseCommand.md` (Lines 1868-1919)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-14 | Initial documentation - 100% schema aligned |

---

**Status:** ✅ Production Ready  
**Last Reviewed:** 2026-01-14
