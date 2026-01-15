# ĐỀ XUẤT DỌN DẸP TÀI LIỆU - 2026-01-15

## 🎯 MỤC TIÊU
Loại bỏ tài liệu không cần thiết, trùng lặp, lỗi thời để giữ project gọn gàng và dễ maintain.

## 📊 TỔNG QUAN

**Tình trạng hiện tại:**
- **110+ files .md** ở thư mục gốc (/)
- **50+ files .md** trong /docs/
- **35+ files .md** trong /docs/bugfix/
- Nhiều file trùng lặp, lỗi thời, session summaries cũ

**Nguyên tắc dọn dẹp:**
1. ✅ GIỮ: Documentation còn valid, reference cần thiết
2. ⚠️ ARCHIVE: Session summaries, bugfix logs (có thể gộp)
3. ❌ XÓA: Files lỗi thời, trùng lặp, không còn giá trị

---

## ❌ NHÓM 1: FILES CẦN XÓA Ở THƯ MỤC GỐC (/)

### 1.1. Session Summaries & Cleanup Reports (Đã lỗi thời)
```
/CLEANUP_FINAL_REPORT.md
/CLEANUP_SUMMARY.md
/CODE_CLEANUP_PHASE2_SUMMARY.md
/CODE_CLEANUP_SUMMARY.md
/MIGRATION_COMPLETE_SUMMARY.md
/NAVIGATION_COMPLETE_SUMMARY.md
/I18N_COMPLETE_SUMMARY.md
/DATABASE_SETUP_COMPLETE_SUMMARY.md
/UI_UX_STANDARDIZATION_COMPLETE.md
/UI_UX_STANDARDIZATION_SUMMARY.md
/SIDEBAR_IMPROVEMENTS_SUMMARY.md
/SNAKE_CASE_MIGRATION_SUMMARY.md
```
**Lý do:** Các báo cáo tổng kết cũ, đã hoàn thành, không còn giá trị tham khảo.

### 1.2. Navigation & Routing Fixes (Đã fix)
```
/NAVIGATION_DEBUG.md
/NAVIGATION_FIX_SUMMARY.md
/ROUTING_FIX_COMPLETE.md
/REACT_ROUTER_FIX.md
/FIGMA_MAKE_NAVIGATION_FIX.md
/FIGMA_MAKE_ROUTER_FIX.md
/FIX_COMPLETE_NAVIGATION_DATABASE.md
```
**Lý do:** Các vấn đề routing đã được fix, không còn cần thiết.

### 1.3. CORS Fixes (Đã fix)
```
/CORS_AND_ROUTING_FIXES.md
/CORS_FIX_COMPLETE.md
/CORS_FIX_FINAL.md
/CORS_FIX_SUMMARY.md
```
**Lý do:** CORS issues đã được giải quyết hoàn toàn.

### 1.4. Specific Module Fixes (Đã fix)
```
/NOTIFICATIONS_NAVIGATION_FIX.md
/ROLES_NAVIGATION_FIX.md
/SUBSCRIPTIONS_NAVIGATION_FIX.md
/USERS_NAVIGATION_FIX.md
/WEBHOOKS_NAVIGATION_FIX.md
/PRODUCTS_CLICK_NAVIGATION_FIX.md
/TENANTS_PAGE_STATS_FIX.md
/TENANT_USER_DETAIL_FIX.md
/SYSTEM_CATEGORIES_FIX.md
/ORDERS_DETAIL_PAGE_FIX.md
/I18N_TRANSLATIONS_FIX.md
```
**Lý do:** Các fix cụ thể đã hoàn thành, thông tin đã được ghi nhận trong bugfix logs.

### 1.5. Feature Complete Reports (Gộp vào docs/)
```
/APPLICATIONS_FEATURE_COMPLETE.md
/APPLICATIONS_FIX_SUMMARY.md
/CATEGORY_MANAGEMENT_COMPLETE.md
/LOCATIONS_FEATURE_COMPLETE.md
/PERMISSIONS_FEATURE_COMPLETE.md
/INVOICES_MODULE_COMPLETE.md
/USER_AUTH_METHODS_COMPLETE.md
```
**Lý do:** Đã có docs tổng hợp trong /docs/, không cần duplicate.

### 1.6. Errors Fixed Logs (Đã lỗi thời)
```
/ERRORS_FIXED.md
/FIXES-APPLIED.md
/FIXES_LOCATIONS_ERROR.md
/FIXES_SELECT_ERROR.md
/BUGFIXES_NAVIGATION_DISPLAY_2026_01_13.md
/URGENT_FIX_NEEDED.md
```
**Lý do:** Lỗi đã fix, logs cũ không còn giá trị.

### 1.7. Migration Guides (Đã migrate xong)
```
/NEXTJS_MIGRATION.md
/NEXTJS_README.md
/QUICK_START_NEXTJS.md
/FLUTTER_INTEGRATION.md
/FLUTTER_PROJECT_SUMMARY.md
/ANDROID_SETUP_SUMMARY.md
/FRONTEND_MIGRATION_TYPE_NAMES.md
/MIGRATION_GUIDE_SNAKE_CASE.md
/MIGRATION_INSTRUCTIONS.md
```
**Lý do:** App không dùng Next.js, Flutter docs nên để riêng trong /flutter/, migration đã xong.

### 1.8. Performance Docs (Trùng lặp)
```
/PERFORMANCE-ADVANCED.md
/PERFORMANCE-CHECKLIST.md
/PERFORMANCE-OPTIMIZATION.md
/QUICKSTART-PERFORMANCE.md
/CHANGELOG-PERFORMANCE.md
/BUGFIX-WEB-VITALS.md
```
**Lý do:** Gộp thành 1 file PERFORMANCE.md là đủ.

### 1.9. Unused Analysis & Summaries
```
/UNUSED_PAGES_ANALYSIS.md
/PROJECT_STATUS.md
/DETAIL_PAGES_COMPARISON.md
/TRANSLATION_UPDATE_STATUS.md
/API_EXPORT_FIXES.md
/FIELD_NAME_MAPPING.md
/CODE_STRUCTURE.md
```
**Lý do:** Phân tích cũ, status đã outdated.

### 1.10. SQL Files ở root (Nên chuyển vào migrations/)
```
/SUPABASE_AUTH_METHODS_TABLES.sql
/SUPABASE_LOCATIONS_TABLE.sql
/SUPABASE_SSO_CONFIGS_TABLE.sql
/SUPABASE_TABLES_SETUP.sql
/SUPABASE_TENANT_SPECIFIC_TABLES.sql
/database-migrations.sql
/user-sessions-migration.sql
```
**Lý do:** SQL files không nên ở root, đã có /supabase/migrations/.

### 1.11. Other Files
```
/TOM_TAT_VIET.md (Có thể xóa nếu không cần thiết)
/temp_header_fix.txt (Temporary file)
/test-translations.ts (Test file, nên vào /tests hoặc xóa)
```

**TỔNG CỘNG: ~80 files CẦN XÓA Ở ROOT**

---

## ⚠️ NHÓM 2: FILES TRONG /docs/ CẦN GỘP/ARCHIVE

### 2.1. Session Summaries (Có thể archive hoặc gộp)
```
/docs/SESSION_SUMMARY_2026_01_15.md
/docs/SESSION_SUMMARY_2026_01_15_CLEANUP_AND_ANALYSIS.md
/docs/SESSION_SUMMARY_2026_01_15_SUBSCRIPTION_ORDERS_FIX.md
```
**Đề xuất:** Gộp thành 1 file SESSION_HISTORY.md hoặc xóa (nếu không cần lịch sử).

### 2.2. Module Delivery Docs (Trùng lặp với *_README.md)
```
/docs/ORDERS_MODULE_FINAL_DELIVERY.md (trùng ORDERS_README.md)
/docs/PRODUCTS_MODULE_FINAL_DELIVERY.md (trùng PRODUCTS_README.md)
/docs/ROLES_MODULE_COMPLETE_DELIVERY.md
/docs/SUBSCRIPTIONS_COMPLETE_DELIVERY.md
/docs/SUBSCRIPTION_INVOICES_MODULE_FINAL_DELIVERY.md
/docs/SUBSCRIPTION_ORDERS_MODULE_FINAL_DELIVERY.md
/docs/SUBSCRIPTION_ORDERS_FEATURES_COMPLETE.md
/docs/USERS_MODULE_FINAL_DELIVERY.md
/docs/APPLICATIONS_COMPLETE_PACKAGE.md
/docs/ANNOUNCEMENTS_COMPLETE_PACKAGE.md
```
**Đề xuất:** Mỗi module CHỈ GIỮ 1 README. Xóa các file FINAL_DELIVERY/COMPLETE_PACKAGE.

### 2.3. ERD Files (Trùng lặp)
```
/docs/ORDERS_ERD.md (duplicate với /docs/developer/subscription-orders-erd-diagram.md)
/docs/PACKAGES_ERD.md
/docs/PRODUCTS_ERD.md
/docs/DATABASE_ERD_COMPLETE.md
```
**Đề xuất:** Giữ trong /docs/database/ hoặc /docs/developer/, xóa ở /docs/.

### 2.4. Duplicate API Docs
```
/docs/API_DOCUMENTATION.md
/docs/API_REFERENCE_COMPLETE.md
```
**Đề xuất:** Gộp thành 1 file duy nhất.

### 2.5. Duplicate Schema Docs
```
/docs/DATABASE_SCHEMA_COMPLETE.md
/docs/DATABASE_README.md
/docs/INVOICES_SCHEMA.md (duplicate với /docs/developer/subscription-invoices-database-schema.md)
/docs/ORDERS_SCHEMA.md
/docs/PACKAGES_SCHEMA.md
/docs/PRODUCTS_SCHEMA.md
/docs/WEBHOOKS_SCHEMA.md
/docs/AUDIT_LOGS_SCHEMA.md
```
**Đề xuất:** GIỮ TRONG /docs/database/, xóa ở /docs/.

---

## ⚠️ NHÓM 3: FILES TRONG /docs/bugfix/ CẦN GỌN GẮN

### 3.1. Bugfix Summaries (Có thể gộp)
```
/docs/bugfix/BUGFIX_SUMMARY.md
/docs/bugfix/CRITICAL_ERRORS_FIXED_2026_01_15.md
/docs/bugfix/ERRORS_ALREADY_FIXED_20260115.md
/docs/bugfix/SUMMARY-2026-01-15-routing-and-forms.md
```
**Đề xuất:** Gộp thành 1 file BUGFIX_HISTORY.md.

### 3.2. Schema Migration Docs (Đã hoàn thành)
```
/docs/bugfix/SUBSCRIPTION_ORDERS_SCHEMA_MISMATCH_FIX.md
/docs/bugfix/SUBSCRIPTION_ORDERS_SCHEMA_MISMATCH_FIX_2.md
/docs/bugfix/SUBSCRIPTION_ORDERS_SCHEMA_MIGRATION_COMPLETE.md
/docs/bugfix/SUBSCRIPTION_ORDERS_COMPLETE_FIX.md
/docs/bugfix/SUBSCRIPTION_INVOICES_SCHEMA_MIGRATION_COMPLETE.md
/docs/bugfix/SUBSCRIPTION_INVOICES_SCHEMA_UPDATE.md
```
**Đề xuất:** GIỮ 1 file COMPLETE, xóa các file intermediate fixes.

### 3.3. UUID Route Conflict (Đã fix)
```
/docs/bugfix/UUID_ROUTE_CONFLICT_FIX_20260115.md
/docs/bugfix/UUID_ROUTE_CONFLICT_FIX_FINAL.md
```
**Đề xuất:** Giữ FINAL, xóa còn lại.

### 3.4. Individual Fixes (Đã ghi nhận)
Tất cả các FIX-*, FIXED-*, FIXING-* files đã hoàn thành.
**Đề xuất:** Có thể archive hoặc gộp vào BUGFIX_HISTORY.md.

---

## ✅ NHÓM 4: FILES NÊN GIỮ

### 4.1. Root Documentation (Cần thiết)
```
/README.md ✅ (Main project readme)
/ARCHITECTURE.md ✅
/CONTRIBUTING.md ✅
/DEVELOPMENT-GUIDE.md ✅
/DEVELOPMENT_RULES.md ✅
/QUICKSTART.md ✅
/QUICK_REFERENCE.md ✅
/I18N-GUIDE.md ✅
/PERFORMANCE.md ✅ (gộp các file performance khác vào)
/FEATURE_TEMPLATE.md ✅
/DATABASE_SCHEMA_STANDARD.md ✅
/DATABASE_TABLES_SETUP_GUIDE.md ✅
/TENANT_SPECIFIC_TABLES_GUIDE.md ✅
/TABLES_CLASSIFICATION.md ✅
/README-FRAMEWORK.md ✅
```

### 4.2. /docs/ Structure (Sau khi dọn dẹp)
```
/docs/
├── README.md (Index của tất cả docs)
├── DESIGN_SYSTEM.md ✅
├── DEVELOPER_GUIDE_TENANTS.md ✅
├── GOLANG_ENDPOINTS.md ✅
├── GOLANG_MIGRATION_READY.md ✅
├── MIGRATION_TO_GO_FRAMEWORK_STANDARD.md ✅
├── SIDEBAR_MENU_GROUPED_STRUCTURE.md ✅
├── RESERVED_SLUGS_COMPLETE.md ✅
├── TENANT_RATE_LIMITS_COMPLETE.md ✅
├── api/ (API references)
├── architecture/ (Architecture docs)
├── database/ (Schema docs - CONSOLIDATED)
├── developer/ (Developer docs cho từng module)
├── golang-models/ (Golang models)
├── testing/ (Testing guides)
├── usecases/ (Use cases)
└── bugfix/
    ├── README.md (Index)
    ├── CHECK-2026-01-15-invoices-crud-complete.md ✅
    ├── CHECK-2026-01-15-orders-crud-complete.md ✅
    └── BUGFIX_HISTORY.md (gộp tất cả các fix logs)
```

### 4.3. Module-specific Docs (Trong /docs/developer/)
Giữ các file API reference, database schema, ERD, use cases cho từng module:
- Products ✅
- Service Packages ✅
- Subscription Orders ✅
- Subscription Invoices ✅
- Subscriptions ✅
- Webhooks ✅

---

## 📋 HÀNH ĐỘNG ĐỀ XUẤT

### BƯỚC 1: XÓA FILES Ở ROOT (80 files)
```bash
# Session summaries
rm /CLEANUP_*.md /CODE_CLEANUP_*.md /MIGRATION_COMPLETE_*.md
rm /NAVIGATION_COMPLETE_*.md /I18N_COMPLETE_*.md
rm /DATABASE_SETUP_COMPLETE_*.md /UI_UX_*.md
rm /SIDEBAR_IMPROVEMENTS_*.md /SNAKE_CASE_*.md

# Navigation fixes
rm /NAVIGATION_*.md /ROUTING_*.md /REACT_ROUTER_*.md
rm /FIGMA_MAKE_*.md /FIX_COMPLETE_*.md

# CORS fixes
rm /CORS_*.md

# Module navigation fixes
rm /*_NAVIGATION_FIX.md /*_CLICK_NAVIGATION_FIX.md
rm /TENANTS_PAGE_STATS_FIX.md /TENANT_USER_DETAIL_FIX.md
rm /SYSTEM_CATEGORIES_FIX.md /ORDERS_DETAIL_PAGE_FIX.md
rm /I18N_TRANSLATIONS_FIX.md

# Feature complete reports
rm /APPLICATIONS_FEATURE_*.md /APPLICATIONS_FIX_*.md
rm /CATEGORY_MANAGEMENT_*.md /LOCATIONS_FEATURE_*.md
rm /PERMISSIONS_FEATURE_*.md /INVOICES_MODULE_*.md
rm /USER_AUTH_METHODS_*.md

# Error logs
rm /ERRORS_FIXED.md /FIXES-*.md /BUGFIXES_*.md /URGENT_*.md

# Migration guides
rm /NEXTJS_*.md /QUICK_START_NEXTJS.md
rm /FLUTTER_INTEGRATION.md /FLUTTER_PROJECT_SUMMARY.md
rm /ANDROID_SETUP_SUMMARY.md /FRONTEND_MIGRATION_*.md
rm /MIGRATION_GUIDE_*.md /MIGRATION_INSTRUCTIONS.md

# Performance docs (keep only PERFORMANCE.md)
rm /PERFORMANCE-*.md /QUICKSTART-PERFORMANCE.md
rm /CHANGELOG-PERFORMANCE.md /BUGFIX-WEB-VITALS.md

# Unused analysis
rm /UNUSED_PAGES_*.md /PROJECT_STATUS.md
rm /DETAIL_PAGES_*.md /TRANSLATION_UPDATE_*.md
rm /API_EXPORT_*.md /FIELD_NAME_*.md /CODE_STRUCTURE.md

# SQL files (move to /supabase/migrations/ if needed, then delete)
rm /SUPABASE_*.sql /database-migrations.sql /user-sessions-migration.sql

# Other
rm /TOM_TAT_VIET.md /temp_header_fix.txt /test-translations.ts
```

### BƯỚC 2: DỌN DẸP /docs/
```bash
# Session summaries (archive hoặc xóa)
rm /docs/SESSION_SUMMARY_*.md

# Module delivery docs (trùng README)
rm /docs/*_MODULE_FINAL_DELIVERY.md
rm /docs/*_COMPLETE_PACKAGE.md
rm /docs/*_FEATURES_COMPLETE.md
rm /docs/*_COMPLETE_DELIVERY.md

# ERD files (keep in /docs/database/)
rm /docs/ORDERS_ERD.md /docs/PACKAGES_ERD.md /docs/PRODUCTS_ERD.md

# Duplicate API docs
# Gộp API_DOCUMENTATION.md và API_REFERENCE_COMPLETE.md thành 1 file

# Schema docs (keep in /docs/database/)
rm /docs/INVOICES_SCHEMA.md /docs/ORDERS_SCHEMA.md
rm /docs/PACKAGES_SCHEMA.md /docs/PRODUCTS_SCHEMA.md
rm /docs/WEBHOOKS_SCHEMA.md /docs/AUDIT_LOGS_SCHEMA.md
```

### BƯỚC 3: DỌN DẸP /docs/bugfix/
```bash
# Gộp các bugfix summaries
cat /docs/bugfix/BUGFIX_SUMMARY.md \
    /docs/bugfix/CRITICAL_ERRORS_*.md \
    /docs/bugfix/ERRORS_ALREADY_*.md \
    /docs/bugfix/SUMMARY-*.md \
    > /docs/bugfix/BUGFIX_HISTORY.md

# Giữ schema migration COMPLETE, xóa intermediate
rm /docs/bugfix/SUBSCRIPTION_ORDERS_SCHEMA_MISMATCH_FIX.md
rm /docs/bugfix/SUBSCRIPTION_ORDERS_SCHEMA_MISMATCH_FIX_2.md
rm /docs/bugfix/SUBSCRIPTION_INVOICES_SCHEMA_UPDATE.md
# Giữ: *_COMPLETE_FIX.md, *_MIGRATION_COMPLETE.md

# UUID conflict - giữ FINAL
rm /docs/bugfix/UUID_ROUTE_CONFLICT_FIX_20260115.md

# Individual fixes - có thể archive nếu không cần
# Hoặc giữ lại để tham khảo
```

### BƯỚC 4: TẠO INDEX FILES
```bash
# Tạo /docs/README.md - Index của tất cả documentation
# Tạo /docs/bugfix/README.md - Index của bugfix logs
```

---

## 📊 KẾT QUẢ SAU DỌN DẸP

**Trước:**
- ~110 files .md ở root
- ~50 files .md trong /docs/
- ~35 files .md trong /docs/bugfix/

**Sau:**
- ~15-20 files .md ở root (chỉ essential docs)
- ~20-25 files .md trong /docs/ (organized)
- ~15-20 files .md trong /docs/bugfix/ (consolidated)

**Giảm: ~140 files → ~60 files (-57%)**

---

## ✅ LỢI ÍCH

1. **Gọn gàng:** Project structure rõ ràng hơn
2. **Dễ tìm:** Documentation được organize tốt
3. **Maintainable:** Ít files trùng lặp, ít outdated docs
4. **Professional:** Project trông chuyên nghiệp hơn
5. **Git history:** Nhẹ hơn, ít noise

---

## ⚠️ LƯU Ý

1. **Backup trước khi xóa:** Git commit hoặc create branch backup
2. **Review kỹ:** Đảm bảo không xóa nhầm docs còn cần thiết
3. **Update links:** Sau khi xóa/move, update links trong code/docs
4. **Communicate:** Inform team về việc cleanup

---

**Bạn có muốn tôi thực hiện cleanup này không?**
