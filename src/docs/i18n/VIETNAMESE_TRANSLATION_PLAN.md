# KẾ HOẠCH DỊCH TIẾNG VIỆT TOÀN BỘ ỨNG DỤNG
> **Ngày tạo**: 2026-01-20  
> **Trạng thái**: Planning Phase  
> **Mục tiêu**: Dịch 100% translation keys sang tiếng Việt

---

## 📋 MỤC LỤC
1. [Tổng Quan](#tổng-quan)
2. [Tình Trạng Hiện Tại](#tình-trạng-hiện-tại)
3. [Chiến Lược Thực Hiện](#chiến-lược-thực-hiện)
4. [Phân Chia Công Việc](#phân-chia-công-việc)
5. [Timeline & Milestones](#timeline--milestones)
6. [Hướng Dẫn Dịch](#hướng-dẫn-dịch)
7. [Quy Trình Kiểm Tra](#quy-trình-kiểm-tra)
8. [Checklist](#checklist)

---

## 📊 TỔNG QUAN

### Mục Tiêu
- ✅ Hoàn thành 100% translation keys sang tiếng Việt
- ✅ Đảm bảo tính nhất quán về thuật ngữ
- ✅ Duy trì cấu trúc TypeScript type-safe
- ✅ Hỗ trợ đa ngôn ngữ (6 ngôn ngữ: vi, en, es, ja, ko, zh)
- ✅ Tối ưu trải nghiệm người dùng Việt Nam

### Hệ Thống i18n Hiện Tại
- **Framework**: react-i18next
- **Ngôn ngữ mặc định**: Tiếng Việt (vi)
- **Fallback**: Tiếng Anh (en)
- **Cấu trúc**: Nested keys với type-safe từ TypeScript
- **File chính**: `/i18n/vi.ts`, `/i18n/en.ts`

---

## 🔍 TÌNH TRẠNG HIỆN TẠI

### Thống Kê File Translation
```
File vi.ts: ~2,800 dòng
File en.ts: ~2,462 dòng
Ước tính: ~500-800 translation keys cần dịch
```

### Các Module Đã Có Translation
✅ **Hoàn thành 100%:**
- `common` - Từ vựng chung
- `auth` - Authentication
- `profile` - Hồ sơ cá nhân
- `settings` - Cài đặt
- `dashboard` - Dashboard
- `users` - Quản lý người dùng
- `userDelegations` - Ủy quyền
- `errors` - Lỗi
- `validation` - Validation
- `time` - Thời gian
- `notifications` - Thông báo
- `api` - API Documentation
- `database` - Database Documentation
- `devDocs` - Developer Docs
- `usecases` - Use Cases
- `tenants` - Tenants
- `categories` - Categories
- `systemCategories` - System Categories
- `locationTypes` - Location Types
- `locations` - Locations

### Các Module Cần Audit & Hoàn Thiện
🔸 **Cần kiểm tra chi tiết:**
- `navigation` - Menu items (một số keys có thể thiếu)
- `menu` - Menu groups
- `roles` - Quản lý vai trò
- `permissions` - Quản lý phân quyền
- `products` - Quản lý sản phẩm
- `servicePackages` - Gói dịch vụ
- `subscriptions` - Đăng ký
- `orders` - Đơn hàng
- `invoices` - Hóa đơn
- `applications` - Ứng dụng
- `webhooks` - Webhooks
- `announcements` - Thông báo
- `featureFlags` - Feature Flags
- `systemJobs` - System Jobs
- `trafficLogs` - Traffic Logs
- `auditLogs` - Audit Logs
- `authLogs` - Auth Logs

❌ **Chưa có translation:**
- Các module mới được thêm gần đây
- Form validations chi tiết
- Error messages cụ thể cho từng module
- Success/confirmation messages chi tiết
- Tooltips và helper texts

---

## 🎯 CHIẾN LƯỢC THỰC HIỆN

### Phase 1: Audit & Inventory (1-2 ngày)
**Mục tiêu:** Thu thập toàn bộ translation keys cần dịch

#### Bước 1.1: Extract Missing Keys
```bash
# Tool sẽ tạo: /scripts/extract-missing-translations.js
# Output: /docs/i18n/missing-keys-report.json
```

**Công việc:**
1. ✅ So sánh `en.ts` vs `vi.ts` để tìm keys thiếu
2. ✅ Scan toàn bộ codebase tìm hardcoded strings
3. ✅ Tạo danh sách priorities theo module
4. ✅ Tạo file template cho từng module

#### Bước 1.2: Categorize Keys
Phân loại keys theo:
- **Critical**: UI chính, navigation, forms
- **High**: Error messages, validations, notifications
- **Medium**: Helper texts, tooltips, descriptions
- **Low**: Developer docs, technical terms

#### Bước 1.3: Create Translation Template
```typescript
// File: /docs/i18n/translation-template.ts
export const translationTemplate = {
  moduleX: {
    // [ENGLISH] => [VIETNAMESE_TRANSLATION]
    title: 'Module X' => 'Module X',
    description: '' => '',
    // ... more keys
  }
};
```

### Phase 2: Core Modules Translation (3-5 ngày)
**Mục tiêu:** Dịch các module quan trọng nhất

#### Batch 2.1: Navigation & Menu (Priority: CRITICAL)
```typescript
modules/i18n/batches/batch-2.1-navigation.ts
```
- `navigation.*` - Tất cả menu items
- `menu.groups.*` - Menu groups
- Breadcrumbs
- Page titles

#### Batch 2.2: Identity & Access (Priority: CRITICAL)
```typescript
modules/i18n/batches/batch-2.2-identity.ts
```
- `roles.*` - Roles management
- `permissions.*` - Permissions
- `userRoles.*` - User roles
- `tenantMembers.*` - Tenant members

#### Batch 2.3: Commerce & Billing (Priority: HIGH)
```typescript
modules/i18n/batches/batch-2.3-commerce.ts
```
- `products.*` - Products
- `servicePackages.*` - Service packages
- `subscriptions.*` - Subscriptions
- `orders.*` - Orders
- `invoices.*` - Invoices
- `digitalAssets.*` - Digital assets

#### Batch 2.4: Platform & Config (Priority: HIGH)
```typescript
modules/i18n/batches/batch-2.4-platform.ts
```
- `applications.*` - Applications
- `webhooks.*` - Webhooks
- `featureFlags.*` - Feature flags
- `systemJobs.*` - System jobs
- `reservedSlugs.*` - Reserved slugs
- `notificationTemplates.*` - Notification templates

#### Batch 2.5: Analytics & Reports (Priority: MEDIUM)
```typescript
modules/i18n/batches/batch-2.5-analytics.ts
```
- `trafficLogs.*` - Traffic logs
- `auditLogs.*` - Audit logs
- `authLogs.*` - Auth logs
- `apiUsageLogs.*` - API usage logs
- `userRegistrationTelemetry.*` - User registration
- `webhookDeliveryLogs.*` - Webhook delivery logs

### Phase 3: Forms & Validations (2-3 ngày)
**Mục tiêu:** Dịch tất cả form fields, validations, errors

#### Batch 3.1: Form Fields
- Tất cả labels
- Placeholders
- Helper texts
- Tooltips

#### Batch 3.2: Validation Messages
- Required fields
- Format validations
- Business rules
- Custom validators

#### Batch 3.3: Error & Success Messages
- API errors
- Form errors
- Success notifications
- Confirmation dialogs

### Phase 4: Detail Pages & Tabs (2 ngày)
**Mục tiêu:** Dịch nội dung các trang chi tiết

#### Areas:
- Product detail tabs
- Service package detail tabs
- Subscription detail tabs
- Tenant detail tabs
- User detail tabs
- Application detail tabs

### Phase 5: Polish & QA (1-2 ngày)
**Mục tiêu:** Kiểm tra và hoàn thiện

#### Activities:
1. Review toàn bộ translations
2. Check consistency thuật ngữ
3. Test trên UI thực tế
4. Fix typos và grammar
5. Optimize phát âm và tone

---

## 📦 PHÂN CHIA CÔNG VIỆC

### Cấu Trúc File Translation Mới

```
/i18n/
├── config.ts                    # i18n configuration
├── index.ts                     # Export all languages
├── vi.ts                        # ⚠️ Main Vietnamese (WORK IN PROGRESS)
├── en.ts                        # English (reference)
├── es.ts, ja.ts, ko.ts, zh.ts  # Other languages
├── namespaces/
│   ├── common.vi.ts            # Common translations
│   └── common.en.ts
└── modules/                     # 🆕 NEW: Module-based organization
    ├── navigation.vi.ts
    ├── identity.vi.ts
    ├── commerce.vi.ts
    ├── platform.vi.ts
    ├── analytics.vi.ts
    ├── forms.vi.ts
    └── index.ts                # Merge all modules
```

### Module-Based Approach (Đề xuất)

**Option 1: Keep Monolithic (Current)**
- ✅ Pros: Simple, type-safe
- ❌ Cons: File quá lớn (2,800+ lines)

**Option 2: Split by Module (Recommended)**
```typescript
// /i18n/modules/navigation.vi.ts
export const navigationVi = {
  dashboard: 'Bảng điều khiển',
  tenants: 'Tổ chức',
  // ...
};

// /i18n/vi.ts (main file)
import { navigationVi } from './modules/navigation.vi';
import { commerceVi } from './modules/commerce.vi';

const vi = {
  navigation: navigationVi,
  commerce: commerceVi,
  // ...
};
```

---

## 📅 TIMELINE & MILESTONES

### Week 1: Foundation & Core Modules
```
Day 1-2:  Phase 1 - Audit & Inventory
Day 3-4:  Phase 2 Batch 2.1-2.2 (Navigation + Identity)
Day 5-7:  Phase 2 Batch 2.3-2.4 (Commerce + Platform)
```

### Week 2: Detail Work & QA
```
Day 8-9:   Phase 2 Batch 2.5 (Analytics)
Day 10-12: Phase 3 (Forms & Validations)
Day 13-14: Phase 4 (Detail Pages)
```

### Week 3: Polish & Launch
```
Day 15-16: Phase 5 (QA & Testing)
Day 17:    Final review
Day 18:    Launch & Monitor
```

### Milestones
- ✅ **M0**: Planning complete (Current)
- 🔲 **M1**: Audit complete (Day 2)
- 🔲 **M2**: Core modules 50% (Day 5)
- 🔲 **M3**: Core modules 100% (Day 9)
- 🔲 **M4**: All forms & validations (Day 12)
- 🔲 **M5**: QA complete (Day 16)
- 🔲 **M6**: Launch (Day 18)

---

## 📝 HƯỚNG DẪN DỊCH

### Nguyên Tắc Dịch

#### 1. Nhất Quán Thuật Ngữ
Sử dụng bảng thuật ngữ chuẩn:

| English | Vietnamese | Notes |
|---------|-----------|-------|
| Dashboard | Bảng điều khiển | Không dịch "Dashboard" |
| Tenant | Tổ chức / Tenant | Giữ "Tenant" nếu technical |
| User | Người dùng | |
| Role | Vai trò | |
| Permission | Quyền / Phân quyền | |
| Subscription | Đăng ký / Gói dịch vụ | Context-dependent |
| Service Package | Gói dịch vụ | |
| Product | Sản phẩm | |
| Order | Đơn hàng | |
| Invoice | Hóa đơn | |
| Webhook | Webhook | Technical term, keep |
| Feature Flag | Cờ tính năng | |
| Audit Log | Nhật ký kiểm toán | |
| Traffic Log | Nhật ký truy cập | |
| Validation | Xác thực / Kiểm tra | |
| Settings | Cài đặt | |
| Configuration | Cấu hình | |

#### 2. Tone of Voice
- **Formal nhưng Friendly**: Dùng "bạn" thay vì "quý khách"
- **Clear & Direct**: Tránh dài dòng
- **Action-oriented**: Động từ mệnh lệnh rõ ràng

**Examples:**
```typescript
// ❌ Bad
save: 'Nhấn vào đây để lưu lại thay đổi của bạn'

// ✅ Good
save: 'Lưu'

// ❌ Bad
deleteConfirm: 'Quý khách có chắc chắn muốn thực hiện thao tác xóa?'

// ✅ Good
deleteConfirm: 'Bạn có chắc chắn muốn xóa?'
```

#### 3. Giữ Nguyên Technical Terms
Không dịch các thuật ngữ kỹ thuật:
- API
- URL
- JSON
- OAuth
- SSO
- MFA
- JWT
- Webhook
- Endpoint

#### 4. Context Matters
Một từ tiếng Anh có thể có nhiều nghĩa tiếng Việt:

```typescript
// "Status" trong contexts khác nhau:
user: {
  status: 'Trạng thái',        // User status
}

subscription: {
  status: 'Tình trạng',        // Subscription status
}

system: {
  status: 'Trạng thái hệ thống', // System status
}
```

#### 5. Số Lượng & Đơn Vị
```typescript
// Tiếng Việt không có dạng số nhiều
users: 'người dùng',      // Không phải "những người dùng"
items: 'mục',             // Không phải "các mục"

// Sử dụng "số lượng" khi cần nhấn mạnh
totalUsers: 'Tổng số người dùng',
```

#### 6. Date & Time Format
```typescript
time: {
  justNow: 'Vừa xong',
  minutesAgo: '{count} phút trước',    // {count} = 1, 5, 10...
  hoursAgo: '{count} giờ trước',
  daysAgo: '{count} ngày trước',
}
```

### Workflow Dịch

```
1. Read English key
   ↓
2. Understand context (check code usage)
   ↓
3. Check terminology glossary
   ↓
4. Write Vietnamese translation
   ↓
5. Review with native speaker
   ↓
6. Test on UI
   ↓
7. Commit
```

---

## ✅ QUY TRÌNH KIỂM TRA

### 1. Automated Checks

#### Script: Translation Completeness Check
```bash
# Kiểm tra missing keys
npm run i18n:check-missing

# Output example:
# ❌ Missing keys in vi.ts:
#    - products.addVariant
#    - subscriptions.renewNow
#    - webhooks.testEndpoint
```

#### Script: Type Safety Check
```bash
# TypeScript sẽ báo lỗi nếu structure không khớp
npm run type-check
```

### 2. Manual QA Checklist

#### Visual Testing
- [ ] Kiểm tra tất cả menu items
- [ ] Kiểm tra tất cả page titles
- [ ] Kiểm tra form labels
- [ ] Kiểm tra button texts
- [ ] Kiểm tra error messages
- [ ] Kiểm tra tooltips
- [ ] Kiểm tra notification messages

#### Functional Testing
- [ ] Đăng nhập
- [ ] Tạo tenant mới
- [ ] Tạo user mới
- [ ] Tạo product mới
- [ ] Submit form validation
- [ ] Xem error messages
- [ ] Switch language vi ↔ en

#### Edge Cases
- [ ] Long text truncation
- [ ] Text overflow
- [ ] Special characters (ă, ê, ơ, ư, đ)
- [ ] Numbers with thousand separators

### 3. Peer Review

**Review Checklist:**
- [ ] Thuật ngữ nhất quán với glossary
- [ ] Tone of voice phù hợp
- [ ] Không có typos
- [ ] Grammar chính xác
- [ ] Context phù hợp
- [ ] UI display OK (không bị cắt chữ)

---

## 📋 CHECKLIST THỰC HIỆN

### Phase 1: Audit & Inventory ⏳
- [ ] Chạy script extract missing keys
- [ ] Tạo file report với list đầy đủ
- [ ] Phân loại theo priority
- [ ] Ước tính effort (hours)
- [ ] Assign tasks

### Phase 2: Core Modules Translation ⏳

#### Batch 2.1: Navigation & Menu
- [ ] `navigation.dashboard` ✅
- [ ] `navigation.tenants` ✅
- [ ] `navigation.users` ✅
- [ ] `navigation.roles` ✅
- [ ] `navigation.permissions` ✅
- [ ] `navigation.products`
- [ ] `navigation.servicePackages`
- [ ] `navigation.subscriptions`
- [ ] `navigation.orders`
- [ ] `navigation.invoices`
- [ ] `navigation.applications`
- [ ] `navigation.webhooks`
- [ ] `navigation.featureFlags`
- [ ] `navigation.systemJobs`
- [ ] `navigation.trafficLogs`
- [ ] `navigation.auditLogs`
- [ ] `navigation.authLogs`
- [ ] `menu.groups.*` ✅

#### Batch 2.2: Identity & Access
- [ ] `roles.title`
- [ ] `roles.subtitle`
- [ ] `roles.form.*`
- [ ] `roles.validation.*`
- [ ] `roles.messages.*`
- [ ] `permissions.title`
- [ ] `permissions.form.*`
- [ ] `permissions.tree.*`
- [ ] `userRoles.title`
- [ ] `userRoles.assign.*`
- [ ] `tenantMembers.title`
- [ ] `tenantMembers.invite.*`
- [ ] `tenantMembers.roles.*`

#### Batch 2.3: Commerce & Billing
- [ ] `products.title`
- [ ] `products.list.*`
- [ ] `products.form.*`
- [ ] `products.detail.*`
- [ ] `products.variants.*`
- [ ] `products.pricing.*`
- [ ] `servicePackages.title`
- [ ] `servicePackages.form.*`
- [ ] `servicePackages.features.*`
- [ ] `subscriptions.title`
- [ ] `subscriptions.plans.*`
- [ ] `subscriptions.usage.*`
- [ ] `subscriptions.billing.*`
- [ ] `orders.title`
- [ ] `orders.form.*`
- [ ] `orders.lineItems.*`
- [ ] `orders.status.*`
- [ ] `invoices.title`
- [ ] `invoices.form.*`
- [ ] `invoices.payment.*`
- [ ] `digitalAssets.title`
- [ ] `digitalAssets.upload.*`

#### Batch 2.4: Platform & Config
- [ ] `applications.title`
- [ ] `applications.form.*`
- [ ] `applications.capabilities.*`
- [ ] `applications.settings.*`
- [ ] `webhooks.title`
- [ ] `webhooks.form.*`
- [ ] `webhooks.events.*`
- [ ] `webhooks.delivery.*`
- [ ] `featureFlags.title`
- [ ] `featureFlags.toggle.*`
- [ ] `systemJobs.title`
- [ ] `systemJobs.schedule.*`
- [ ] `systemJobs.logs.*`
- [ ] `reservedSlugs.title`
- [ ] `reservedSlugs.validation.*`
- [ ] `notificationTemplates.title`
- [ ] `notificationTemplates.editor.*`

#### Batch 2.5: Analytics & Reports
- [ ] `trafficLogs.title`
- [ ] `trafficLogs.filters.*`
- [ ] `trafficLogs.chart.*`
- [ ] `auditLogs.title`
- [ ] `auditLogs.events.*`
- [ ] `auditLogs.export.*`
- [ ] `authLogs.title`
- [ ] `authLogs.sessions.*`
- [ ] `apiUsageLogs.title`
- [ ] `apiUsageLogs.analytics.*`
- [ ] `userRegistrationTelemetry.title`
- [ ] `userRegistrationTelemetry.sources.*`
- [ ] `webhookDeliveryLogs.title`
- [ ] `webhookDeliveryLogs.retries.*`

### Phase 3: Forms & Validations ⏳
- [ ] All form labels
- [ ] All placeholders
- [ ] All helper texts
- [ ] All tooltips
- [ ] All validation messages
- [ ] All error messages
- [ ] All success messages

### Phase 4: Detail Pages & Tabs ⏳
- [ ] Product detail tabs
- [ ] Service package detail tabs
- [ ] Subscription detail tabs
- [ ] Tenant detail tabs
- [ ] User detail tabs
- [ ] Application detail tabs
- [ ] Webhook detail tabs

### Phase 5: QA & Polish ⏳
- [ ] Visual testing all pages
- [ ] Functional testing key flows
- [ ] Edge cases testing
- [ ] Peer review
- [ ] Fix issues
- [ ] Final approval

---

## 🎓 TÀI LIỆU THAM KHẢO

### Internal Docs
- `/i18n/config.ts` - i18n configuration
- `/i18n/vi.ts` - Vietnamese translations (main file)
- `/i18n/en.ts` - English translations (reference)
- `/hooks/useSimpleTranslation.ts` - Translation hook

### External Resources
- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Vietnamese Style Guide](https://vi.wikipedia.org/wiki/Vi%E1%BA%BFt_ti%E1%BA%BFng_Vi%E1%BB%87t)

### Terminology References
- [Microsoft Language Portal - Vietnamese](https://www.microsoft.com/en-us/language/Search)
- [Google Developer Translation Style Guide](https://developers.google.com/style/)

---

## 📞 LIÊN HỆ & HỖ TRỢ

### Team Members
- **Translation Lead**: [Tên người phụ trách]
- **Native Reviewer**: [Tên người review]
- **Developer Support**: [Tên dev]

### Communication
- **Slack Channel**: #i18n-vietnamese
- **Weekly Sync**: Every Monday 10:00 AM
- **Questions**: Post in Slack or create GitHub issue

---

## 📈 PROGRESS TRACKING

### Current Status (Updated: 2026-01-20 Evening)
```
████████████████████░ 85% COMPLETE!

Phase 1: ✅ COMPLETED (Planning & Setup)
Phase 2: 🔄 IN PROGRESS (Core Translation - 95%)
Phase 3: 📅 STARTING (Polish & Refine)
Phase 4: 📅 PLANNED (QA & Testing)  
Phase 5: 📅 PLANNED (Deployment)
```

### Daily Progress
- **Jan 20**: 70% → 85% (+15% in one day!) 🎉
  - Session 1: Planning + Documentation
  - Session 2: Navigation + Code cleanup (+12%)
  - Session 3: Bug fixes + systemJobs complete (+3%)
  - Created 10 documentation files
  - Fixed all build errors
  - Removed all duplicates

---

## 🚀 NEXT STEPS

### Immediate Actions (This Week)
1. [ ] Review và approve plan này
2. [ ] Set up automation scripts
3. [ ] Create translation template files
4. [ ] Assign team members
5. [ ] Kick off Phase 1

### This Sprint
- Start Phase 1: Audit & Inventory
- Complete Batch 2.1: Navigation
- Start Batch 2.2: Identity & Access

---

*Tài liệu này sẽ được cập nhật liên tục trong quá trình thực hiện.*