# DEBUG: Missing Menu Items - Digital Assets & Services

**Date:** 2026-01-15  
**Status:** 🔍 DEBUGGING  
**Issue:** Không thấy menu "Tài Sản Số" và "Dịch Vụ" trong sidebar

---

## 🎯 Checklist đã hoàn thành

### ✅ Module Configuration
- [x] Digital Assets module có `showInSidebar: true` (line 22)
- [x] Digital Assets module có `enabled: true` (line 21)
- [x] Digital Assets có menuItems với order: 45 (line 31)
- [x] Service Deliveries module có `showInSidebar: true` (line 22)
- [x] Service Deliveries module có `enabled: true` (line 21)
- [x] Service Deliveries có menuItems với order: 46 (line 31)

### ✅ Module Registration
- [x] DigitalAssetsModule được import trong `/core/moduleRegistration.tsx` (line 27)
- [x] ServiceDeliveriesModule được import trong `/core/moduleRegistration.tsx` (line 28)
- [x] DigitalAssetsModule được register (line 59)
- [x] ServiceDeliveriesModule được register (line 60)

### ✅ Sidebar Grouping Logic
- [x] Order 45 & 46 nằm trong range 30-49 = "commerce" group ✅
- [x] Sidebar có group "commerce" với label "THƯƠNG MẠI & THANH TOÁN" ✅
- [x] ModuleRegistry.getAllMenuItems() có logic đúng ✅

---

## 🔍 Debug Steps để tìm vấn đề

### Bước 1: Mở Browser Console

1. Mở ứng dụng trong browser
2. **Hard refresh**: Nhấn `Ctrl + Shift + R` (Windows) hoặc `Cmd + Shift + R` (Mac)
3. Mở Console: Nhấn `F12` hoặc `Ctrl + Shift + J`

### Bước 2: Kiểm tra Debug Logs

Tìm các log sau trong console:

#### A. Module Registration Logs
```
✓ Module đã đăng ký: Digital Assets (digital-assets)
✓ Module đã đăng ký: Service Deliveries (service-deliveries)
✅ All modules registered successfully
```

**Nếu KHÔNG thấy** → Module không được register
**Nếu CÓ thấy** → Module đã được register ✅

#### B. getAllMenuItems Debug Logs
```
🔍 DEBUG getAllMenuItems: Enabled modules: [
  { id: 'digital-assets', showInSidebar: true, menuItemsCount: 1 },
  { id: 'service-deliveries', showInSidebar: true, menuItemsCount: 1 },
  ...
]
```

**Kiểm tra:**
- Có thấy `digital-assets` trong list không?
- Có thấy `service-deliveries` trong list không?
- `showInSidebar` có phải `true` không?
- `menuItemsCount` có phải `1` không?

#### C. Menu Items Detail Logs
```
🔍 DEBUG: Module "digital-assets" - showInSidebar: true, menuItems: [
  {
    id: "digital-assets",
    label: "Tài Sản Số",
    path: "/core/digital-assets",
    icon: {...},
    order: 45
  }
]

🔍 DEBUG: Module "service-deliveries" - showInSidebar: true, menuItems: [
  {
    id: "service-deliveries",
    label: "Dịch Vụ",
    path: "/core/service-deliveries",
    icon: {...},
    order: 46
  }
]
```

**Kiểm tra:**
- Có thấy 2 logs này không?
- `label` có đúng "Tài Sản Số" và "Dịch Vụ" không?
- `order` có phải 45 và 46 không?

#### D. Final Menu Items Log
```
🔍 DEBUG getAllMenuItems: Final menu items: [
  { label: "Dashboard", order: 0, ... },
  { label: "Tenants", order: 10, ... },
  ...
  { label: "Tài Sản Số", order: 45, ... },
  { label: "Dịch Vụ", order: 46, ... },
  ...
]
```

**Kiểm tra:**
- Có thấy "Tài Sản Số" trong array không?
- Có thấy "Dịch Vụ" trong array không?

#### E. Sidebar Grouping Logs
```
🔍 DEBUG: Item "Tài Sản Số" - order: 45, group: commerce
🔍 DEBUG: Item "Dịch Vụ" - order: 46, group: commerce

🔍 DEBUG: Grouped items: {
  main: [...],
  identity: [...],
  commerce: [
    { label: "Products", order: 35, ... },
    { label: "Service Packages", order: 36, ... },
    ...
    { label: "Tài Sản Số", order: 45, ... },
    { label: "Dịch Vụ", order: 46, ... },
  ],
  ...
}

🔍 DEBUG: Final groups: [
  { id: "main", label: "CHÍNH", items: [...] },
  { id: "identity", label: "QUẢN TRỊ & TRUY CẬP", items: [...] },
  { id: "commerce", label: "THƯƠNG MẠI & THANH TOÁN", items: [
      ...,
      { label: "Tài Sản Số", order: 45, ... },
      { label: "Dịch Vụ", order: 46, ... },
    ]
  },
  ...
]
```

**Kiểm tra:**
- Group có phải "commerce" không?
- Có xuất hiện trong "Grouped items" không?
- Có xuất hiện trong "Final groups" không?

---

## 🐛 Possible Issues & Solutions

### Issue 1: Modules không được register
**Triệu chứng:** Không thấy log "✓ Module đã đăng ký: Digital Assets"

**Solutions:**
- Check file `/core/moduleRegistration.tsx` có import đúng không
- Check có gọi `registerAllModules()` không (line 78)
- Check App.tsx có import `./core/moduleRegistration` không (line 28)

### Issue 2: `showInSidebar: false` hoặc `enabled: false`
**Triệu chứng:** Module được register nhưng không xuất hiện trong enabled modules

**Solutions:**
- Check file module `/modules/digital-assets/index.tsx` line 22
- Check file module `/modules/service-deliveries/index.tsx` line 22
- Đảm bảo `showInSidebar: true` và `enabled: true`

### Issue 3: menuItems empty hoặc undefined
**Triệu chứng:** `menuItemsCount: 0` hoặc `undefined` trong debug log

**Solutions:**
- Check module definition có `menuItems: [...]` không
- Check menuItems có ít nhất 1 item không

### Issue 4: Order number sai
**Triệu chứng:** Item bị group vào nhóm sai (không phải "commerce")

**Solutions:**
- Digital Assets order phải là 45 (30-49 = commerce)
- Service Deliveries order phải là 46 (30-49 = commerce)

### Issue 5: Sidebar không re-render
**Triệu chứng:** Console logs đúng nhưng UI không hiển thị

**Solutions:**
- Hard refresh browser: `Ctrl + Shift + R`
- Clear cache và reload
- Check React DevTools xem Sidebar component có render không

### Issue 6: useMemo dependency issue
**Triệu chứng:** Menu items chỉ load lần đầu

**Solutions:**
- Check `useMemo(() => { ... }, [])` có dependency array rỗng
- Nếu cần dynamic update, thêm dependencies

---

## 📋 Thông tin để report

Nếu vấn đề vẫn chưa được giải quyết, hãy cung cấp:

1. **Console logs** (screenshot hoặc copy toàn bộ)
2. **Enabled modules list** từ log "🔍 DEBUG getAllMenuItems: Enabled modules"
3. **Final menu items** từ log "🔍 DEBUG getAllMenuItems: Final menu items"
4. **Final groups** từ log "🔍 DEBUG: Final groups"
5. **React version** và **Browser version**

---

## 🔧 Quick Fix Commands

Nếu cần force rebuild:

```bash
# Clear node_modules và reinstall
rm -rf node_modules
npm install

# Clear build cache
rm -rf .vite
rm -rf dist

# Restart dev server
npm run dev
```

---

## 📝 Expected Behavior

Sau khi fix, sidebar phải có cấu trúc:

```
CHÍNH
  └─ Dashboard

QUẢN TRỊ & TRUY CẬP
  └─ Tenants
  └─ Tenant Members
  └─ Users
  └─ User Roles
  └─ Roles

THƯƠNG MẠI & THANH TOÁN
  └─ Products
  └─ Service Packages
  └─ ...
  └─ Tài Sản Số          ← PHẢI CÓ
  └─ Dịch Vụ             ← PHẢI CÓ

NỀN TẢNG & CẤU HÌNH
  └─ Applications
  └─ System Categories

CẤU HÌNH HỆ THỐNG
  └─ System Announcements
  └─ Notification Templates
  └─ Cài Đặt

PHÂN TÍCH & BÁO CÁO
  └─ Help
  └─ Dev Docs
```

---

**Next Step:** Refresh browser, mở Console (F12), và gửi screenshot các debug logs.
