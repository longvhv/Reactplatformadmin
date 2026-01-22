# Audit Report: Clickable Rows trong List Pages

## Mục tiêu
Đảm bảo tất cả các trang danh sách có trang chi tiết tương ứng phải có khả năng click vào row/cột để chuyển đến trang chi tiết.

## Status Tracking

### ✅ Đã hoàn thành (Confirmed Clickable)
1. **Tenants** (`/app/(admin)/admin/tenants/page.tsx`)
   - Component: `TenantList`, `TenantGrid`
   - Status: ✅ Có clickable row (`onClick={() => navigate(/admin/tenants/${tenant._id})`)
   - File: `/components/tenants/TenantList.tsx` (line 69)

2. **Products** (`/app/(admin)/commerce/products/page.tsx`)
   - Component: `ProductTable`
   - Status: ✅ Có clickable name button
   - File: `/components/products/ProductTable.tsx` (line 123-128)

3. **Applications (old)** (`/components/applications/ApplicationsList.tsx`)
   - Status: ✅ Có Link ở code column (line 181-186)

### 🔍 Cần kiểm tra chi tiết

#### Admin Section
4. **Audit Logs** (`/app/(admin)/admin/audit-logs/page.tsx`)
   - Detail page: `/app/(admin)/admin/audit-logs/[id]/page.tsx` ✅
   - Component: `AuditLogTable` (`/components/audit-logs/AuditLogTable.tsx`)
   - Current: ❌ Chỉ có button "View" ở cuối (line 207-220)
   - **Action needed**: Thêm onClick vào row hoặc clickable column

5. **Auth Logs** (`/app/(admin)/admin/auth-logs/page.tsx`)
   - Detail page: ❓ Không thấy [id] page
   - **Action**: Skip (no detail page)

6. **System Logs** (`/app/(admin)/admin/system-logs/page.tsx`)
   - Detail page: `/app/(admin)/admin/system-logs/[id]/page.tsx` ✅
   - **Action needed**: Kiểm tra component

#### Platform Section
7. **Applications** (`/app/(admin)/platform/applications/page.tsx`)
   - Detail page: `/app/(admin)/platform/applications/[id]/page.tsx` ✅
   - Table: Inline trong page (line 176-254)
   - Current: ❌ Không có clickable row
   - **Action needed**: Thêm onClick vào row hoặc name column

8. **Feature Flags** (`/app/(admin)/platform/feature-flags/page.tsx`)
   - Detail page: `/app/(admin)/platform/feature-flags/[id]/page.tsx` ✅
   - Table: Inline trong page
   - **Action needed**: Kiểm tra và thêm clickable

9. **System Jobs** (`/app/(admin)/platform/system-jobs/page.tsx`)
   - Detail page: `/app/(admin)/platform/system-jobs/[id]/page.tsx` ✅
   - Component: `SystemJobsTable` (`/components/system-jobs/SystemJobsTable.tsx`)
   - **Action needed**: Kiểm tra component

10. **Traffic Logs** (`/app/(admin)/platform/traffic-logs/page.tsx`)
    - Detail page: `/app/(admin)/platform/traffic-logs/[id]/page.tsx` ✅
    - Component: `TrafficLogsTable` (`/components/traffic-logs/TrafficLogsTable.tsx`)
    - **Action needed**: Kiểm tra component

11. **User Registrations** (`/app/(admin)/platform/user-registrations/page.tsx`)
    - Detail page: `/app/(admin)/platform/user-registrations/[id]/page.tsx` ✅
    - Component: `UserRegistrationTable` (`/components/user-registration/UserRegistrationTable.tsx`)
    - **Action needed**: Kiểm tra component

12. **Users** (`/app/(admin)/platform/users/page.tsx`)
    - Detail page: `/app/(admin)/admin/users/[id]/page.tsx` ✅
    - Component: `UserTable` hoặc `UserGrid`
    - **Action needed**: Kiểm tra component

13. **Service Packages** (`/app/(admin)/platform/service-packages/page.tsx`)
    - Detail page: `/app/(admin)/platform/service-packages/[id]/page.tsx` ✅
    - **Action needed**: Kiểm tra component

14. **Reserved Slugs** (`/app/(admin)/platform/reserved-slugs/page.tsx`)
    - Detail page: `/app/(admin)/platform/reserved-slugs/[id]/page.tsx` ✅
    - **Action needed**: Kiểm tra component

15. **SaaS Product Types** (`/app/(admin)/platform/saas-product-types/page.tsx`)
    - Detail page: `/app/(admin)/platform/saas-product-types/[id]/page.tsx` ✅
    - **Action needed**: Kiểm tra component

16. **Product Types** (`/app/(admin)/platform/product-types/page.tsx`)
    - Detail page: `/app/(admin)/platform/product-types/[id]/page.tsx` ✅
    - **Action needed**: Kiểm tra component

17. **Service Deliveries** (`/app/(admin)/platform/service-deliveries/page.tsx`)
    - Detail page: `/app/(admin)/platform/service-deliveries/[id]/page.tsx` ✅
    - **Action needed**: Kiểm tra component

18. **Legal Documents** (`/app/(admin)/platform/legal-documents/page.tsx`)
    - Detail page: `/app/(admin)/platform/legal-documents/[id]/page.tsx` ✅
    - **Action needed**: Kiểm tra component

19. **API Usage Logs** (`/app/(admin)/platform/api-usage-logs/page.tsx`)
    - Detail page: `/app/(admin)/platform/api-usage-logs/[id]/page.tsx` ✅
    - Component: `ApiUsageLogsList` (`/components/api-usage-logs/ApiUsageLogsList.tsx`)
    - **Action needed**: Kiểm tra component

#### Commerce Section
20. **Invoices** (`/app/(admin)/commerce/invoices/page.tsx`)
    - Detail page: `/app/(admin)/commerce/invoices/[id]/page.tsx` ✅
    - **Action needed**: Kiểm tra component

21. **Digital Assets** (`/app/(admin)/commerce/digital-assets/page.tsx`)
    - Detail page: `/app/(admin)/commerce/digital-assets/[id]/page.tsx` ✅
    - **Action needed**: Kiểm tra component

22. **Subscription Orders** (`/app/(admin)/commerce/subscription-orders/page.tsx`)
    - Detail page: `/app/(admin)/commerce/subscription-orders/[id]/page.tsx` ✅
    - **Action needed**: Kiểm tra component

23. **Subscriptions** (`/app/(admin)/commerce/subscriptions/[id]/page.tsx`)
    - List page: ❓ Cần tìm list page
    - **Action needed**: Tìm list page

#### Integrations Section
24. **Webhooks** (`/app/(admin)/integrations/webhooks/page.tsx`)
    - Detail page: `/app/(admin)/integrations/webhooks/[id]/page.tsx` ✅
    - **Action needed**: Kiểm tra component

## Recommended Pattern

### Pattern 1: Clickable Row (Preferred)
```tsx
<tr 
  key={item._id}
  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
  onClick={() => router.push(`/path/${item._id}`)}
>
  {/* Row content */}
</tr>
```

### Pattern 2: Clickable Primary Column
```tsx
<td className="px-4 py-4">
  <button
    onClick={() => router.push(`/path/${item._id}`)}
    className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
  >
    {item.name}
  </button>
</td>
```

### Pattern 3: Link in Column
```tsx
<td className="px-4 py-4">
  <Link
    to={`/path/${item._id}`}
    className="text-indigo-600 hover:text-indigo-900 font-medium"
  >
    {item.code}
  </Link>
</td>
```

## Implementation Priority
1. ⚡ High Priority (frequently accessed pages):
   - Applications
   - System Jobs  
   - Traffic Logs
   - Webhooks
   - Invoices
   - Subscription Orders

2. 🎯 Medium Priority:
   - Audit Logs
   - Feature Flags
   - User Registrations
   - Service Packages
   - Digital Assets

3. 📝 Low Priority:
   - Reserved Slugs
   - Product Types
   - SaaS Product Types
   - Service Deliveries
   - Legal Documents
   - API Usage Logs

## Next Steps
1. Kiểm tra từng component trong danh sách "Cần kiểm tra chi tiết"
2. Cập nhật các component chưa có clickable rows
3. Đảm bảo consistent UX across all list pages
4. Test navigation trên tất cả các trang đã cập nhật
