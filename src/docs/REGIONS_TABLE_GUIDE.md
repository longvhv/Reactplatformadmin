# Regions Table - Geographic Hierarchy Management

## Tổng quan

Bảng `regions` quản lý cấu trúc phân cấp địa lý 5 cấp với tính năng temporal validity (theo dõi thời gian hiệu lực) và lưu trữ lịch sử thay đổi.

## Cấu trúc Database

### Schema

```sql
CREATE TABLE regions (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('REGION', 'NATION', 'PROVINCE', 'DISTRICT', 'COMMUNE')),
  "parentId" UUID REFERENCES regions(id),
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "historyData" JSONB DEFAULT '[]'::jsonb,
  "order" INTEGER DEFAULT 0,
  status SMALLINT DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  "isSystem" BOOLEAN DEFAULT false,
  "isEditable" BOOLEAN DEFAULT true,
  -- Audit fields...
)
```

### Các trường chính

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `code` | VARCHAR(50) | Mã định danh duy nhất (VD: VN, VN-HN, VN-HN-BA) |
| `name` | VARCHAR(255) | Tên vị trí địa lý |
| `type` | VARCHAR(20) | Cấp độ: REGION/NATION/PROVINCE/DISTRICT/COMMUNE |
| `parentId` | UUID | ID của vị trí cha (NULL cho cấp cao nhất) |
| `startDate` | TIMESTAMP | Ngày bắt đầu hiệu lực |
| `endDate` | TIMESTAMP | Ngày kết thúc hiệu lực (NULL = còn hiệu lực) |
| `historyData` | JSONB | Mảng lịch sử thay đổi |
| `metadata` | JSONB | Dữ liệu bổ sung theo từng cấp |

## Cấu trúc 5 cấp địa lý

```
REGION (Vùng miền)
  └─ NATION (Quốc gia)
      └─ PROVINCE (Tỉnh/Thành phố)
          └─ DISTRICT (Quận/Huyện)
              └─ COMMUNE (Xã/Phường)
```

### 1. REGION - Vùng miền

**Metadata fields:**
- `area`: Diện tích (km²)
- `population`: Dân số
- `description`: Mô tả

**Ví dụ:**
```json
{
  "code": "VN_NORTH",
  "name": "Miền Bắc",
  "type": "REGION",
  "parentId": null,
  "metadata": {
    "description": "Vùng Đồng bằng sông Hồng và Trung du miền núi phía Bắc"
  }
}
```

### 2. NATION - Quốc gia

**Metadata fields:**
- `iso2Code`: Mã ISO 2 ký tự (required)
- `iso3Code`: Mã ISO 3 ký tự
- `phoneCode`: Mã điện thoại quốc tế (VD: +84)
- `currency`: Đơn vị tiền tệ (VD: VND)
- `capital`: Thủ đô
- `area`: Diện tích (km²)
- `population`: Dân số

**Ví dụ:**
```json
{
  "code": "VN",
  "name": "Việt Nam",
  "type": "NATION",
  "parentId": null,
  "startDate": "1945-09-02",
  "metadata": {
    "iso2Code": "VN",
    "iso3Code": "VNM",
    "phoneCode": "+84",
    "currency": "VND",
    "capital": "Hà Nội",
    "area": 331212,
    "population": 98000000
  }
}
```

### 3. PROVINCE - Tỉnh/Thành phố

**Metadata fields:**
- `provinceType`: Loại (province | city | centrally_city)
- `region`: Vùng miền
- `area`: Diện tích (km²)
- `population`: Dân số
- `zipCode`: Mã bưu điện

**Ví dụ:**
```json
{
  "code": "VN-HN",
  "name": "Hà Nội",
  "type": "PROVINCE",
  "parentId": "<vietnam_id>",
  "startDate": "1954-10-10",
  "metadata": {
    "provinceType": "centrally_city",
    "region": "Miền Bắc",
    "area": 3359,
    "population": 8000000,
    "zipCode": "100000"
  }
}
```

### 4. DISTRICT - Quận/Huyện

**Metadata fields:**
- `districtType`: Loại (district | urban_district | town | city)
- `area`: Diện tích (km²)
- `population`: Dân số

**Ví dụ:**
```json
{
  "code": "VN-HN-BA",
  "name": "Ba Đình",
  "type": "DISTRICT",
  "parentId": "<hanoi_id>",
  "metadata": {
    "districtType": "urban_district",
    "area": 9.22,
    "population": 250000
  }
}
```

### 5. COMMUNE - Xã/Phường/Thị trấn

**Metadata fields:**
- `communeType`: Loại (commune | ward | town)
- `area`: Diện tích (km²)
- `population`: Dân số

**Ví dụ:**
```json
{
  "code": "VN-HN-BA-PH",
  "name": "Phường Phúc Xá",
  "type": "COMMUNE",
  "parentId": "<ba_dinh_id>",
  "metadata": {
    "communeType": "ward",
    "area": 0.5,
    "population": 12000
  }
}
```

## Temporal Validity (Hiệu lực theo thời gian)

### Khái niệm

Mỗi vị trí địa lý có thời gian hiệu lực được xác định bởi `startDate` và `endDate`:

- `startDate`: Ngày bắt đầu hiệu lực
- `endDate`: Ngày kết thúc hiệu lực (NULL = còn hiệu lực)

### Use Cases

**1. Vị trí còn hiệu lực:**
```sql
WHERE "endDate" IS NULL OR "endDate" > CURRENT_TIMESTAMP
```

**2. Vị trí tại một thời điểm:**
```sql
WHERE "startDate" <= '2020-01-01' 
  AND ("endDate" IS NULL OR "endDate" > '2020-01-01')
```

**3. Lịch sử thay đổi:**
- Sài Gòn → TP. Hồ Chí Minh (1976-07-02)
- Tỉnh Hà Tây → sáp nhập vào Hà Nội (2008-08-01)

## History Data (Lịch sử thay đổi)

### Schema

```typescript
interface RegionHistoryEntry {
  changedAt: string;      // Thời gian thay đổi
  changedBy: string;      // Người thay đổi (userId)
  field: string;          // Trường bị thay đổi
  oldValue: any;          // Giá trị cũ
  newValue: any;          // Giá trị mới
  reason?: string;        // Lý do thay đổi
}
```

### Ví dụ

```json
[
  {
    "changedAt": "2023-05-15T10:30:00Z",
    "changedBy": "user-123",
    "field": "name",
    "oldValue": "Quận 1",
    "newValue": "Quận Bến Nghé",
    "reason": "Đổi tên theo Nghị quyết 1234/NQ-HĐND"
  },
  {
    "changedAt": "2023-06-01T14:00:00Z",
    "changedBy": "user-456",
    "field": "metadata.population",
    "oldValue": 250000,
    "newValue": 260000,
    "reason": "Cập nhật dữ liệu điều tra dân số 2023"
  }
]
```

## Naming Convention (Quy ước đặt tên mã)

### Pattern

```
{COUNTRY_CODE}[-{PROVINCE_CODE}][-{DISTRICT_CODE}][-{COMMUNE_CODE}]
```

### Ví dụ

| Level | Code | Name | Pattern |
|-------|------|------|---------|
| NATION | VN | Việt Nam | {COUNTRY} |
| PROVINCE | VN-HN | Hà Nội | {COUNTRY}-{PROVINCE} |
| DISTRICT | VN-HN-BA | Ba Đình | {COUNTRY}-{PROVINCE}-{DISTRICT} |
| COMMUNE | VN-HN-BA-PH | Phường Phúc Xá | {COUNTRY}-{PROVINCE}-{DISTRICT}-{COMMUNE} |

## Integration với System Categories

### 5 loại danh mục địa lý trong `system_categories`

```sql
-- Tất cả thuộc nhóm GRP_LOCATION, lưu trong bảng 'regions'
TYPE_REGION      - Vùng miền
TYPE_NATION      - Quốc gia
TYPE_PROVINCE    - Tỉnh/Thành phố
TYPE_DISTRICT    - Quận/Huyện
TYPE_COMMUNE     - Xã/Phường/Thị trấn
```

### Mục đích

- `system_categories`: Định nghĩa **metadata schema** cho từng cấp địa lý
- `regions`: Lưu trữ **dữ liệu thực tế** của các vị trí địa lý

## Queries thông dụng

### 1. Lấy tất cả tỉnh/thành phố của Việt Nam

```sql
SELECT r.*
FROM regions r
JOIN regions vn ON vn.code = 'VN'
WHERE r.type = 'PROVINCE'
  AND r."parentId" = vn.id
  AND r.status = 1
  AND (r."endDate" IS NULL OR r."endDate" > CURRENT_TIMESTAMP)
ORDER BY r."order", r.name;
```

### 2. Lấy cây phân cấp từ Quốc gia đến Phường

```sql
WITH RECURSIVE region_tree AS (
  -- Anchor: Quốc gia
  SELECT 
    r.*,
    0 as level,
    ARRAY[r.id] as path
  FROM regions r
  WHERE r.code = 'VN'
  
  UNION ALL
  
  -- Recursive: Children
  SELECT 
    r.*,
    rt.level + 1,
    rt.path || r.id
  FROM regions r
  JOIN region_tree rt ON r."parentId" = rt.id
  WHERE r.status = 1
    AND (r."endDate" IS NULL OR r."endDate" > CURRENT_TIMESTAMP)
)
SELECT * FROM region_tree
ORDER BY path;
```

### 3. Lấy đường dẫn từ Phường lên Quốc gia

```sql
WITH RECURSIVE path_to_root AS (
  -- Anchor: Phường Phúc Xá
  SELECT 
    r.*,
    0 as level
  FROM regions r
  WHERE r.code = 'VN-HN-BA-PH'
  
  UNION ALL
  
  -- Recursive: Parents
  SELECT 
    r.*,
    ptr.level + 1
  FROM regions r
  JOIN path_to_root ptr ON r.id = ptr."parentId"
)
SELECT * FROM path_to_root
ORDER BY level DESC;

-- Result: VN → VN-HN → VN-HN-BA → VN-HN-BA-PH
```

### 4. Tìm kiếm theo tên

```sql
SELECT *
FROM regions
WHERE name ILIKE '%hà nội%'
  AND status = 1
  AND (r."endDate" IS NULL OR r."endDate" > CURRENT_TIMESTAMP)
ORDER BY type, name;
```

### 5. Lấy lịch sử thay đổi

```sql
SELECT 
  code,
  name,
  jsonb_array_elements("historyData") as history_entry
FROM regions
WHERE code = 'VN-HN'
ORDER BY (history_entry->>'changedAt') DESC;
```

## API TypeScript

### Import

```typescript
import { 
  Region, 
  RegionType, 
  RegionTypeHelper,
  getRegions,
  getRegionTree,
  createRegion,
  updateRegion
} from '../api/regionApi';
```

### Examples

```typescript
// Get all provinces
const provinces = await getRegions({ 
  type: 'PROVINCE',
  isValid: true 
});

// Get hierarchical tree
const tree = await getRegionTree({ 
  rootType: 'NATION',
  maxDepth: 3 
});

// Create new district
await createRegion({
  code: 'VN-HN-TX',
  name: 'Thanh Xuân',
  type: 'DISTRICT',
  parentId: hanoiId,
  metadata: {
    districtType: 'urban_district',
    area: 9.09,
    population: 300000
  }
});

// Update with history tracking
await updateRegion(districtId, {
  name: 'Quận Thanh Xuân',
  metadata: { population: 320000 }
}, 'Cập nhật theo điều tra dân số 2024');
```

## Best Practices

1. **Code Naming**: Luôn sử dụng pattern phân cấp {COUNTRY}-{PROVINCE}-{DISTRICT}-{COMMUNE}
2. **Temporal Validity**: Không xóa dữ liệu cũ, set `endDate` thay vì DELETE
3. **History Tracking**: Luôn ghi lý do khi thay đổi thông tin quan trọng
4. **Indexing**: Đã có index sẵn cho type, parentId, status, dates
5. **Metadata**: Validate metadata theo schema trong `system_categories.extraFields`

## Migration

Chạy migration để tạo bảng:

```bash
# Migration 004 tạo bảng regions và insert sample data
psql -f /supabase/migrations/004_create_regions_table.sql
```
