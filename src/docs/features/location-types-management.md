# Location Types Management

**Module**: Location Types  
**Route**: `/core/location-types`  
**Category**: Master Data  
**Created**: 2026-01-15  

---

## 📋 OVERVIEW

Tính năng quản lý **Location Types** (Loại địa điểm) cho phép định nghĩa các loại địa điểm khác nhau trong hệ thống với các trường thông tin tùy chỉnh (extra fields). Mỗi location type có thể có cấu trúc dữ liệu riêng để phù hợp với nghiệp vụ cụ thể.

### Use Cases:
- **WAREHOUSE**: Kho hàng với thông tin (capacity, temperature_controlled, dock_count)
- **RETAIL_STORE**: Cửa hàng bán lẻ với thông tin (store_size, parking_spaces, opening_hours)
- **OFFICE**: Văn phòng với thông tin (floor_count, meeting_rooms, desks)
- **DISTRIBUTION_CENTER**: Trung tâm phân phối với thông tin (sorting_capacity, vehicle_bays)

---

## 🗄️ DATABASE SCHEMA

### Table: `location_types`

```sql
CREATE TABLE public.location_types (
  _id uuid NOT NULL,
  tenant_id uuid NULL,
  code character varying(50) NOT NULL,
  name text NOT NULL,
  description text NULL,
  extra_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1,
  
  CONSTRAINT location_types_pkey PRIMARY KEY (_id),
  CONSTRAINT fk_loctype_tenant FOREIGN KEY (tenant_id) 
    REFERENCES tenants (_id) ON DELETE CASCADE,
  CONSTRAINT chk_loctype_code_fmt CHECK ((code)::text ~ '^[A-Z0-9_]+$'::text),
  CONSTRAINT chk_loctype_dates CHECK (updated_at >= created_at),
  CONSTRAINT chk_loctype_name_len CHECK (length(name) > 0),
  CONSTRAINT chk_loctype_version CHECK (version >= 1)
);
```

### Key Features:
- ✅ **Optimistic Locking**: `version` field prevents concurrent update conflicts
- ✅ **Tenant Isolation**: `tenant_id` FK with CASCADE delete
- ✅ **Code Format Validation**: Uppercase letters, numbers, underscores only (`^[A-Z0-9_]+$`)
- ✅ **Dynamic Fields**: `extra_fields` JSONB array for custom field definitions
- ✅ **System Types Protection**: `is_system` flag prevents deletion of critical types
- ✅ **No Soft Delete**: Hard delete only (no `deleted_at` field)
- ✅ **No Audit Fields**: No `created_by`/`updated_by` (minimal design)

---

## 🏗️ ARCHITECTURE

### Files Structure:

```
/api/locationTypesApi.ts                        # API client with optimistic locking
/hooks/useLocationTypes.ts                       # React hook for state management
/components/locationTypes/
  └── LocationTypeFormDialog.tsx                 # Form dialog with extra fields editor
/pages/LocationTypesPage.tsx                     # Main management page
/modules/location-types/index.tsx                # Module definition for routing
```

### API Interface:

```typescript
export interface LocationType {
  _id: string;
  id?: string;                          // Alias for _id (auto-mapped)
  tenant_id: string;
  code: string;                         // ^[A-Z0-9_]+$ format
  name: string;
  description?: string;
  extra_fields: ExtraFieldDefinition[]; // JSONB array
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  version: number;                      // For optimistic locking
}

export interface ExtraFieldDefinition {
  code: string;                         // Field identifier (lowercase)
  name: string;                         // Display name
  type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect';
  required?: boolean;
  default_value?: any;
  options?: string[];                   // For select/multiselect
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  order?: number;
  description?: string;
}
```

### API Methods:

```typescript
// Basic CRUD
locationTypesApi.getAll(filters?)
locationTypesApi.getById(id)
locationTypesApi.create(data)              // ✅ Auto-validates code format
locationTypesApi.update(id, data)          // ✅ Requires version for optimistic locking
locationTypesApi.delete(id)                // ✅ Prevents deletion of system types

// Utility Methods
locationTypesApi.getActive(filters?)
locationTypesApi.getByTenant(tenantId, activeOnly?)
locationTypesApi.toggleActive(id, version)
locationTypesApi.validateCode(code, tenantId, excludeId?)
```

---

## 🎨 USER INTERFACE

### Main Page Features:

1. **Statistics Cards**:
   - Total location types
   - Active count
   - Inactive count
   - System types count
   - Custom types count

2. **Filters**:
   - Search by code, name, description
   - Filter by status (All / Active / Inactive)
   - Filter by type (All / System / Custom)

3. **Table Columns**:
   - Code (monospace font)
   - Name + Description
   - Extra Fields count
   - Type badge (System / Custom)
   - Status toggle (Active / Inactive)
   - Actions (Edit / Delete)

4. **Actions**:
   - ✅ Add new location type
   - ✅ Edit existing (with version validation)
   - ✅ Delete (prevented for system types)
   - ✅ Toggle active status
   - ✅ View extra fields count

### Form Dialog Features:

1. **General Information**:
   - Code (auto-formatted to uppercase)
   - Name (required)
   - Description (optional)
   - Active status toggle

2. **Extra Fields Editor**:
   - ✅ Add unlimited custom fields
   - ✅ Drag-and-drop reordering
   - ✅ Field configuration:
     - Code (lowercase, auto-formatted)
     - Name (display label)
     - Type selector (6 types)
     - Required checkbox
     - Options (for select types)
   - ✅ Remove fields
   - ✅ Real-time validation

3. **Validation**:
   - Code format: `^[A-Z0-9_]+$`
   - Name required & non-empty
   - Extra field code: `^[a-z0-9_]+$`
   - Select fields must have options
   - Version required for updates

---

## 🔒 BUSINESS RULES

### 1. Code Format Validation
```typescript
// ✅ Valid codes
WAREHOUSE
RETAIL_STORE
OFFICE_01
DC_WEST

// ❌ Invalid codes
warehouse          // Must be uppercase
Retail-Store       // No hyphens allowed
Office #1          // No special characters
```

### 2. System Types Protection
```typescript
// System types cannot be deleted
if (locationType.is_system) {
  throw new Error('Cannot delete system location type');
}

// But can be toggled active/inactive
locationTypesApi.toggleActive(id, version); // ✅ Allowed
```

### 3. Optimistic Locking
```typescript
// Update requires current version
await locationTypesApi.update(id, {
  name: 'New Name',
  version: currentVersion,  // ✅ Required!
});

// If version mismatch → error
// "This location type was modified by another user. Please refresh and try again."
```

### 4. Extra Fields Naming
```typescript
// Location Type code: UPPERCASE
code: "WAREHOUSE"

// Extra field codes: lowercase
extra_fields: [
  { code: "max_capacity", name: "Maximum Capacity" },
  { code: "temperature_controlled", name: "Temperature Controlled" }
]
```

---

## 📊 EXAMPLE DATA

### Example 1: Warehouse Location Type

```json
{
  "_id": "uuid-123",
  "tenant_id": "tenant-1",
  "code": "WAREHOUSE",
  "name": "Warehouse",
  "description": "Storage facility for inventory",
  "extra_fields": [
    {
      "code": "max_capacity",
      "name": "Maximum Capacity",
      "type": "number",
      "required": true,
      "validation": {
        "min": 0,
        "message": "Capacity must be positive"
      },
      "order": 0
    },
    {
      "code": "temperature_controlled",
      "name": "Temperature Controlled",
      "type": "boolean",
      "required": false,
      "default_value": false,
      "order": 1
    },
    {
      "code": "dock_count",
      "name": "Number of Loading Docks",
      "type": "number",
      "required": false,
      "validation": {
        "min": 0,
        "max": 50
      },
      "order": 2
    },
    {
      "code": "storage_type",
      "name": "Storage Type",
      "type": "select",
      "required": true,
      "options": ["Racking", "Bulk", "Mixed"],
      "order": 3
    }
  ],
  "is_system": false,
  "is_active": true,
  "version": 1,
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z"
}
```

### Example 2: Retail Store Location Type

```json
{
  "_id": "uuid-456",
  "tenant_id": "tenant-1",
  "code": "RETAIL_STORE",
  "name": "Retail Store",
  "description": "Customer-facing retail location",
  "extra_fields": [
    {
      "code": "store_size",
      "name": "Store Size (sqm)",
      "type": "number",
      "required": true,
      "validation": {
        "min": 10,
        "max": 10000
      },
      "order": 0
    },
    {
      "code": "parking_spaces",
      "name": "Parking Spaces",
      "type": "number",
      "required": false,
      "order": 1
    },
    {
      "code": "opening_hours",
      "name": "Opening Hours",
      "type": "text",
      "required": false,
      "default_value": "9:00 AM - 9:00 PM",
      "order": 2
    },
    {
      "code": "store_format",
      "name": "Store Format",
      "type": "select",
      "required": true,
      "options": ["Flagship", "Standard", "Express", "Kiosk"],
      "order": 3
    }
  ],
  "is_system": false,
  "is_active": true,
  "version": 1,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:30:00Z"
}
```

---

## 🧪 TESTING SCENARIOS

### Scenario 1: Create Location Type with Extra Fields

```typescript
// Create warehouse type
const warehouse = await locationTypesApi.create({
  tenant_id: "tenant-1",
  code: "WAREHOUSE",
  name: "Warehouse",
  description: "Storage facility",
  extra_fields: [
    {
      code: "max_capacity",
      name: "Maximum Capacity",
      type: "number",
      required: true,
      order: 0
    }
  ],
  is_active: true
});

// ✅ Expected: Created successfully
// ✅ Code auto-validated
// ✅ Version = 1
```

### Scenario 2: Update with Optimistic Locking

```typescript
// User A fetches location type (version = 1)
const typeA = await locationTypesApi.getById(id);

// User B also fetches (version = 1)
const typeB = await locationTypesApi.getById(id);

// User B updates first (version = 1 → 2)
await locationTypesApi.update(id, {
  name: "Updated by B",
  version: 1  // ✅ Success, version now 2
});

// User A tries to update (still has version = 1)
await locationTypesApi.update(id, {
  name: "Updated by A",
  version: 1  // ❌ Conflict! Version is now 2
});

// Error: "This location type was modified by another user"
```

### Scenario 3: Delete System Type (Should Fail)

```typescript
// Try to delete system type
const systemType = await locationTypesApi.create({
  tenant_id: "tenant-1",
  code: "SYSTEM_WAREHOUSE",
  name: "System Warehouse",
  is_system: true
});

await locationTypesApi.delete(systemType._id);
// ❌ Error: "Cannot delete system location type"
```

### Scenario 4: Code Format Validation

```typescript
// ❌ Invalid code - lowercase
await locationTypesApi.create({
  tenant_id: "tenant-1",
  code: "warehouse",  // Invalid!
  name: "Warehouse"
});
// Error: "Code must contain only uppercase letters, numbers, and underscores"

// ✅ Valid code - auto-formatted
const formatted = LocationTypeValidation.formatCode("warehouse-01");
// Result: "WAREHOUSE_01"
```

---

## 🔮 FUTURE ENHANCEMENTS

### Phase 1: Basic Improvements
- [ ] Code uniqueness validation on frontend (before submit)
- [ ] Bulk import/export location types
- [ ] Clone location type with fields
- [ ] Field templates library

### Phase 2: Advanced Features
- [ ] Field dependencies (e.g., if temperature_controlled = true, show min_temp)
- [ ] Conditional validation rules
- [ ] Field groups/sections
- [ ] Multi-language field labels

### Phase 3: Integration
- [ ] Use location types in Locations module
- [ ] Validate location data against type's extra fields
- [ ] Location type analytics
- [ ] API documentation generation from extra fields

---

## 📚 RELATED MODULES

- **Locations** (future): Will use location types for validation
- **System Categories**: Similar pattern for category management
- **Product Types**: Similar extra fields pattern
- **Tenants**: Tenant isolation for location types

---

## 🎯 KEY TAKEAWAYS

1. **Optimistic Locking**: Essential for preventing concurrent update conflicts
2. **Code Format**: Strict uppercase validation prevents data inconsistency
3. **Extra Fields**: Flexible JSONB allows custom schemas per type
4. **System Protection**: is_system flag prevents accidental deletion
5. **No Soft Delete**: Clean data model, hard delete only
6. **Minimal Audit**: No created_by/updated_by for simplicity

---

**Documentation Version**: 1.0  
**Last Updated**: 2026-01-15  
**Author**: AI Assistant
