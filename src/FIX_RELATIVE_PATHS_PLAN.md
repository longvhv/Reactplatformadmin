# KẾ HOẠCH FIX TOÀN BỘ RELATIVE PATHS

## VẤN ĐỀ
Tất cả files đang sử dụng số levels KHÔNG KHỚP với filesystem structure thực tế.

## QUY TẮC TÍNH LEVELS ĐÚNG

Từ một file muốn import `/components/`, `/api/`, `/lib/`, `/hooks/`, `/providers/`:
- Đếm số thư mục từ file về root `/`
- Mỗi thư mục = 1 dấu `../`

### CÔNG THỨC
```
File path: /app/(admin)/admin/roles/create/page.tsx
Breakdown: / → app → (admin) → admin → roles → create → page.tsx

Đếm từ page.tsx về root:
- create/ (1)
- roles/ (2)
- admin/ (3)
- (admin)/ (4)
- app/ (5)
- / (root)

=> Cần 5 dấu ../ để về root
=> Path: ../../../../../components
```

## NHÓM FILES THEO DEPTH LEVEL

### Level 1: /app/page.tsx
- Cần: 1 dấu `../`
- Pattern: `../components`, `../api`, `../lib`, `../hooks`, `../providers`

### Level 2: /app/(admin)/page.tsx
- Cần: 2 dấu `../`
- Pattern: `../../components`, `../../api`, ...

### Level 4: /app/(admin)/admin/*/page.tsx
- Cần: 4 dấu `../`
- Pattern: `../../../../components`, ...
- Files:
  - /app/(admin)/admin/roles/page.tsx
  - /app/(admin)/admin/tenants/page.tsx
  - /app/(admin)/admin/audit-logs/page.tsx
  - /app/(admin)/admin/audit-trail/page.tsx
  - /app/(admin)/admin/auth-logs/page.tsx
  - /app/(admin)/admin/backup-restore/page.tsx
  - /app/(admin)/admin/cache-management/page.tsx
  - /app/(admin)/admin/dashboard/page.tsx
  - /app/(admin)/admin/database-management/page.tsx
  - /app/(admin)/admin/permissions/page.tsx
  - /app/(admin)/admin/system-logs/page.tsx
  - /app/(admin)/admin/tenant-members/page.tsx
  - Tất cả hiện đang dùng: 3 dấu `../` (THIẾU 1!)

### Level 4: /app/(admin)/commerce/*/page.tsx, /app/(admin)/platform/*/page.tsx
- Cần: 4 dấ `../`
- Tất cả hiện đang dùng: 3 dấu `../` (THIẾU 1!)

### Level 5: /app/(admin)/admin/*/[id]/page.tsx
- Cần: 5 dấu `../`
- Files:
  - /app/(admin)/admin/roles/[id]/page.tsx
  - /app/(admin)/admin/tenants/[id]/page.tsx
  - /app/(admin)/admin/audit-logs/[id]/page.tsx
  - /app/(admin)/admin/audit-trail/[id]/page.tsx
  - /app/(admin)/admin/system-logs/[id]/page.tsx
  - Tất cả hiện đang dùng: 4 dấu `../` (THIẾU 1!)

### Level 5: /app/(admin)/*/create/page.tsx (commerce, platform)
- Cần: 5 dấu `../`
- Hiện đang dùng: 6 dấu `../` (THỪA 1!)

### Level 6: /app/(admin)/admin/*/create/page.tsx
- Cần: 6 dấu `../`
- Files:
  - /app/(admin)/admin/roles/create/page.tsx
  - /app/(admin)/admin/tenants/create/page.tsx
  - /app/(admin)/admin/tenants/app-routes/create/page.tsx
  - Hiện đang dùng: 6 dấu `../` (ĐÚNG!)

### Level 6: /app/(admin)/*/edit/[id]/page.tsx (commerce, platform)
- Cần: 6 dấu `../`
- Hiện đang dùng: 7 dấu `../` (THỪA 1!)

### Level 7: /app/(admin)/admin/*/edit/[id]/page.tsx
- Cần: 7 dấu `../`
- Files:
  - /app/(admin)/admin/roles/edit/[id]/page.tsx
  - /app/(admin)/admin/tenants/edit/[id]/page.tsx
  - Hiện đang dùng: 7 dấu `../` (ĐÚNG!) - Wait, cần verify!

## PHÁT HIỆN LỖI CỤ THỂ

### SAI: Files `/app/(admin)/admin/*/page.tsx` đang dùng 3 levels thay vì 4
- /app/(admin)/admin/audit-logs/page.tsx → đang `../../../` cần `../../../../`
- /app/(admin)/admin/audit-trail/page.tsx → đang `../../../` cần `../../../../`
- /app/(admin)/admin/auth-logs/page.tsx → đang `../../../` cần `../../../../`
- /app/(admin)/admin/tenants/page.tsx → đang `../../../` cần `../../../../`
- ... và tất cả files tương tự

### SAI: Files `/app/(admin)/*/create/page.tsx` đang dùng 6 levels thay vì 5
- /app/(admin)/commerce/invoices/create/page.tsx → đang `../../../../../` cần `../../../../../`
- /app/(admin)/platform/applications/create/page.tsx → đang `../../../../../` cần `../../../../../`
- ... (cần verify kỹ lại)

### SAI: Files `/app/(admin)/*/edit/[id]/page.tsx` đang dùng 7 levels thay vì 6
- Tất cả files trong commerce/*/edit/[id]/ và platform/*/edit/[id]/

## CHIẾN LƯỢC FIX

### Giai đoạn 1: Verify chính xác
1. Đọc 1 file mẫu từ mỗi level
2. Đếm chính xác số `../` hiện tại
3. Xác định số `../` cần thiết
4. Tạo danh sách diff

### Giai đoạn 2: Fix theo batch
1. Level 4 files: Thêm 1 level (3→4)
2. Level 5 files: Điều chỉnh
3. Level 6 files: Giảm 1 level (7→6)
4. Level 7 files: Giảm 1 level (8→7) nếu có

### Giai đoạn 3: Verify sau fix
1. Search tất cả import statements
2. Confirm không còn patterns sai
3. Test một số files key

## DANH SÁCH FILES CẦN FIX

### Nhóm 1: /app/(admin)/admin/*/page.tsx (4 levels)
- Tất cả files đang dùng 3 levels → cần thêm 1 level

### Nhóm 2: /app/(admin)/admin/*/[id]/page.tsx (5 levels)
- Tất cả files đang dùng 4 levels → cần thêm 1 level

### Nhóm 3: /app/(admin)/commerce/*/page.tsx và platform/*/page.tsx (4 levels)
- Đang dùng 3 levels → cần thêm 1 level

### Nhóm 4: /app/(admin)/commerce/*/create/page.tsx và platform/*/create/page.tsx (5 levels)
- Đang dùng 6 levels → cần giảm 1 level

### Nhóm 5: /app/(admin)/commerce/*/edit/[id]/page.tsx và platform/*/edit/[id]/page.tsx (6 levels)
- Đang dùng 7 levels → cần giảm 1 level

### Nhóm 6: /app/(admin)/admin/*/edit/[id]/page.tsx (7 levels)
- Đang dùng 6 levels? → cần verify và fix

## CẢNH BÁO ĐẶC BIỆT

- Files `/app/(admin)/admin/roles/create/page.tsx` vừa fix thành 6 levels - ĐÚNG
- Files `/app/(admin)/admin/tenants/create/page.tsx` đang dùng 6 levels - ĐÚNG
- Files `/app/(admin)/admin/tenants/app-routes/create/page.tsx` - 7 levels (special case)

## ACTION ITEMS

1. ✅ Verify `/app/(admin)/page.tsx` - 2 levels
2. ⚠️ Fix all `/app/(admin)/admin/*/page.tsx` - 3→4 levels
3. ⚠️ Fix all `/app/(admin)/admin/*/[id]/page.tsx` - 4→5 levels
4. ⚠️ Fix all `/app/(admin)/commerce|platform/*/create/page.tsx` - 6→5 levels
5. ⚠️ Fix all `/app/(admin)/commerce|platform/*/edit/[id]/page.tsx` - 7→6 levels
6. ✅ Verify `/app/(admin)/admin/*/create/page.tsx` - should be 6 levels
7. ⚠️ Verify và fix `/app/(admin)/admin/*/edit/[id]/page.tsx`

## ESTIMATED FILES TO FIX

- ~30 files in /admin/*/ (level 4)
- ~10 files in /admin/*/[id]/ (level 5)
- ~30 files in /commerce|platform/*/create/ (level 5)
- ~30 files in /commerce|platform/*/edit/[id]/ (level 6)
- **Total: ~100 files cần fix**
