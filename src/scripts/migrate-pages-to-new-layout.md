# Migration Script - Page Layout Standardization

## Pages cần cập nhật (Priority Order)

### ✅ Completed
1. UsersPage - Done

### 🔥 High Priority - List Pages (Management)
2. TenantsPage
3. ProductsPage  
4. ApplicationsPage
5. RolesPage
6. FeatureFlagsPage
7. AuditLogsPage
8. TrafficLogsPage
9. LocationTypesPage
10. DigitalAssetsPage

### 🔸 Medium Priority - Other List Pages
11. NotificationsPage
12. NotificationTemplatesPage
13. WebhooksPage
14. ReservedSlugsPage
15. ProductTypesPage
16. ServicePackagesPage
17. ServiceDeliveriesPage
18. SystemJobsPage
19. SubscriptionOrdersPage
20. SubscriptionInvoicesPage

### 🔹 Low Priority - Detail/Form Pages  
21. All detail pages (keep current design for now)
22. All form pages (keep current design for now)

## Standard Migration Pattern

### Before:
```tsx
import { PageHeader } from '../components/layout/PageHeader';

return (
  <div className="min-h-screen bg-background">
    <PageHeader
      title="Title"
      description="Description"
      actions={<Button>Action</Button>}
    />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Card>Content</Card>
    </div>
  </div>
);
```

### After:
```tsx
import { PageLayout } from '../components/layout/PageLayout';
import { IconName } from 'lucide-react';

return (
  <PageLayout
    icon={IconName}
    title="Title"
    description="Description"
    actions={<Button>Action</Button>}
  >
    <Card className="p-6">Content</Card>
  </PageLayout>
);
```

## Auto-replace checklist
1. Replace import: `PageHeader` → `PageLayout`
2. Add icon import from lucide-react
3. Remove wrapping div `<div className="min-h-screen bg-background">`
4. Remove container div `<div className="max-w-7xl mx-auto px-4...">`
5. Replace `<PageHeader>` with `<PageLayout>` and add `icon` prop
6. Move children content directly under `<PageLayout>`
7. Update toast calls to use `showToast`
