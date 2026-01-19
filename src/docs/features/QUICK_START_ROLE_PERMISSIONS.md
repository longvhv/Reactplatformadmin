# Quick Start: Role Permissions with Application Filter

**5 phút để setup và sử dụng tính năng mới! 🚀**

---

## ⚡ Bước 1: Chạy Migration (2 phút)

### Cách 1: Supabase Dashboard (Recommended)

1. Mở Supabase Dashboard
2. Chọn project của bạn
3. Menu bên trái → **SQL Editor**
4. Click **"New query"**
5. Copy toàn bộ nội dung file `/docs/features/migrations/2026-01-16-applications-permissions-tables.sql`
6. Paste vào SQL Editor
7. Click **"Run"** (hoặc Ctrl/Cmd + Enter)
8. Chờ ~5-10 giây
9. Kiểm tra output có dòng "✅ Migration completed successfully!"

### Cách 2: Supabase CLI (cho developers)

```bash
# Nếu đã có Supabase CLI installed
supabase db push

# Hoặc chạy trực tiếp SQL file
psql YOUR_DATABASE_URL < docs/features/migrations/2026-01-16-applications-permissions-tables.sql
```

### Verify Migration

```sql
-- Chạy query này để kiểm tra
SELECT 
  a.name as application,
  COUNT(p.id) as permissions
FROM applications a
LEFT JOIN permissions p ON a.id = p.application_id
GROUP BY a.name
ORDER BY a.name;
```

**Expected output:**
```
application           | permissions
----------------------|------------
Core System          | 14
CRM                  | 5
Finance              | 7
HR Management        | 7
Reports & Analytics  | 4
Support              | 4
```

---

## 🎯 Bước 2: Sử dụng Feature (3 phút)

### A. Mở Role Form

1. Vào menu **Tenants** hoặc **Roles**
2. Click vào một tenant (nếu ở trang Tenants)
3. Tab **"Roles"**
4. Click button **"+ Thêm vai trò"** hoặc **Edit** một role có sẵn

### B. Filter by Applications

**Tình huống:** Bạn chỉ muốn xem permissions của HR và Finance

1. Scroll xuống phần **"Lọc theo ứng dụng"**
2. Tick checkbox ☑ **HR Management**
3. Tick checkbox ☑ **Finance**
4. Permissions list tự động filter → chỉ hiện HR và Finance permissions
5. Counter hiển thị: **(2 đã chọn)**

**Tips:**
- Không tick gì = hiển thị tất cả permissions
- Tick nhiều apps = hiện permissions của tất cả apps đã chọn
- Scroll trong list nếu có nhiều applications

### C. Search Permissions

**Tình huống:** Bạn cần tìm permission về "export"

1. Tìm ô **"Tìm kiếm quyền hạn"**
2. Gõ: `export`
3. List tự động filter → chỉ hiện permissions có "export" trong code hoặc description
4. Click checkbox để chọn permission cần thiết

**Tips:**
- Search by code: `reports:export`, `users:read`
- Search by keyword: `export`, `read`, `write`, `delete`
- Clear search box = về danh sách đầy đủ

### D. Combine Filter + Search

**Tình huống:** Tìm tất cả permissions "read" trong HR

1. Tick checkbox **HR Management** (ở phần Lọc theo ứng dụng)
2. Gõ `read` vào search box
3. List hiển thị: `hr:employees:read`, `hr:attendance:read`, `hr:payroll:read`

### E. Select Permissions

**3 cách để chọn permissions:**

1. **Common Permissions** (phổ biến)
   - Scroll lên phần "Quyền hạn phổ biến"
   - Tick checkboxes: `users:read`, `users:write`, etc.

2. **Filtered Permissions** (theo app)
   - Sau khi filter/search
   - Tick checkboxes trong list

3. **Custom Permissions** (tùy chỉnh)
   - Scroll xuống phần "Thêm quyền tùy chỉnh"
   - Gõ permission code: `custom:action`
   - Click button **"+ Thêm"**

### F. Review & Save

1. Scroll xuống phần **"Quyền đã chọn (X)"**
2. Review tất cả permissions đã chọn
3. Xóa nếu cần (click icon 🗑️)
4. Click button **"Tạo mới"** hoặc **"Cập nhật"**

---

## 📊 Use Cases

### Use Case 1: HR Manager Role

**Mục tiêu:** Tạo role cho HR Manager với full access HR permissions

```
1. Tên vai trò: HR Manager
2. Lọc ứng dụng: ☑ HR Management
3. Chọn all HR permissions:
   ☑ hr:employees:read
   ☑ hr:employees:write
   ☑ hr:employees:delete
   ☑ hr:attendance:read
   ☑ hr:attendance:write
   ☑ hr:payroll:read
   ☑ hr:payroll:write
4. Thêm core permissions:
   ☑ users:read (from Common Permissions)
5. Save
```

### Use Case 2: Finance Viewer Role

**Mục tiêu:** Tạo role chỉ xem Finance data, không edit

```
1. Tên vai trò: Finance Viewer
2. Lọc ứng dụng: ☑ Finance
3. Search: "read"
4. Chọn read-only permissions:
   ☑ finance:invoices:read
   ☑ finance:payments:read
   ☑ finance:accounting:read
5. Save
```

### Use Case 3: Report Analyst Role

**Mục tiêu:** Tạo role cho analyst với quyền view + export reports

```
1. Tên vai trò: Report Analyst
2. Lọc ứng dụng: ☑ Reports & Analytics
3. Chọn permissions:
   ☑ reports:view
   ☑ reports:export
4. Thêm read permissions từ các app khác để phân tích data:
   ☑ hr:employees:read
   ☑ finance:invoices:read
   ☑ crm:contacts:read
5. Save
```

### Use Case 4: Support Staff Role

**Mục tiêu:** Tạo role cho support staff

```
1. Tên vai trò: Support Staff
2. Lọc ứng dụng: ☑ Support, ☑ CRM
3. Chọn permissions:
   ☑ support:tickets:read
   ☑ support:tickets:write
   ☑ support:tickets:assign
   ☑ crm:contacts:read
   ☑ crm:contacts:write
4. Save
```

---

## 💡 Pro Tips

### Tip 1: Organize by Application
- Group permissions by application để dễ quản lý
- Example: All "read" permissions → Viewer role
- Example: All "write" permissions → Editor role

### Tip 2: Use Search for Bulk Selection
- Search "read" → select all read permissions at once
- Search "write" → select all write permissions at once
- Clear search → review all selected

### Tip 3: Common Permission Patterns
```
Viewer:    *:read
Editor:    *:read, *:write
Admin:     *:read, *:write, *:delete
Manager:   Full permissions for specific app
```

### Tip 4: Custom Permissions
- Format: `app:resource:action`
- Examples: 
  - `core:api:access`
  - `reports:dashboard:customize`
  - `finance:budget:approve`

### Tip 5: Test Before Assigning
1. Create test role with specific permissions
2. Assign to test user
3. Login as test user
4. Verify access works correctly
5. Adjust permissions if needed

---

## 🐛 Troubleshooting

### Problem: Không thấy applications

**Symptoms:**
- Dropdown "Lọc theo ứng dụng" trống
- Không có checkboxes applications

**Solutions:**
1. Check migration đã chạy thành công chưa
2. Verify table `applications` có data:
   ```sql
   SELECT * FROM applications WHERE is_active = true;
   ```
3. Check browser console for errors
4. Refresh page

### Problem: Không thấy permissions

**Symptoms:**
- Section "Quyền hạn theo ứng dụng" trống
- Chỉ thấy "Quyền hạn phổ biến"

**Solutions:**
1. Verify table `permissions` có data:
   ```sql
   SELECT COUNT(*) FROM permissions WHERE is_active = true;
   ```
2. Check Supabase connection
3. Open browser DevTools → Network tab → check API calls
4. Look for error toasts

### Problem: Filter không hoạt động

**Symptoms:**
- Tick checkbox applications nhưng permissions không đổi
- Counter không update

**Solutions:**
1. Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
2. Clear browser cache
3. Check browser console for JavaScript errors
4. Verify permissions có đúng `application_id`

### Problem: Search không hoạt động

**Symptoms:**
- Gõ vào search box nhưng không filter

**Solutions:**
1. Check permissions có field `description`
2. Try search by exact code: `users:read`
3. Clear search and try again
4. Check browser console

---

## 📚 Additional Resources

### Documentation
- 📄 Full Feature Docs: `/docs/features/2026-01-16-role-form-enhanced-application-filter.md`
- 🗄️ Migration Guide: `/docs/features/migrations/README.md`
- 🔧 API Services:
  - `/services/applicationsService.ts`
  - `/services/permissionsService.ts`

### Sample Data

**Add more applications:**
```sql
INSERT INTO applications (name, code, description) VALUES
  ('Marketing', 'marketing', 'Marketing and campaigns management'),
  ('Inventory', 'inventory', 'Inventory and warehouse management');
```

**Add more permissions:**
```sql
INSERT INTO permissions (code, name, application_id, resource, action) VALUES
  ('marketing:campaigns:read', 'Read Campaigns', 
   (SELECT id FROM applications WHERE code = 'marketing'), 
   'campaigns', 'read');
```

---

## ✅ Checklist

Sau khi setup xong, verify:

- [ ] Migration chạy thành công
- [ ] Có 6 applications trong database
- [ ] Có 40+ permissions trong database
- [ ] Role form mở được
- [ ] Applications list hiển thị đúng
- [ ] Filter by application hoạt động
- [ ] Search hoạt động
- [ ] Có thể chọn permissions
- [ ] Có thể save role
- [ ] Permissions hiển thị trong role detail

---

## 🎉 You're Ready!

Setup xong! Giờ bạn có thể:
- ✅ Tạo roles với permissions dynamic từ database
- ✅ Filter permissions theo applications
- ✅ Search để tìm permissions nhanh
- ✅ Quản lý permissions dễ dàng hơn

**Happy coding! 🚀**

---

**Last Updated:** 2026-01-16  
**Estimated Setup Time:** 5 minutes  
**Difficulty:** Easy ⭐
