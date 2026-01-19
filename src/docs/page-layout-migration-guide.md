# Page Layout Migration Guide

## Chuẩn thiết kế mới (từ Dashboard)

### 1. Structure

```tsx
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/card';
import { IconName } from 'lucide-react';

export default function SomePage() {
  return (
    <PageLayout
      icon={IconName}
      title="Page Title"
      description="Page description"
      actions={
        <Button>Action</Button>
      }
    >
      {/* Content goes here */}
      <Card className="p-6">
        Content
      </Card>
    </PageLayout>
  );
}
```

### 2. Key Changes

**OLD:**
```tsx
<div className="min-h-screen bg-background">
  <PageHeader ... />
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    Content
  </div>
</div>
```

**NEW:**
```tsx
<PageLayout icon={Icon} title="Title" description="Description">
  <Card className="p-6">Content</Card>
</PageLayout>
```

### 3. Spacing

- **Container**: `space-y-6` between sections
- **Page Header**: Auto-included in PageLayout
- **Cards**: `p-6` for padding
- **Grids**: `gap-4` for grid items

### 4. Stats Cards

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {stats.map((stat) => (
    <Card key={stat.label} className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {stat.label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stat.value}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-{color}-100 dark:bg-{color}-900/20 text-{color}-600">
          <stat.icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  ))}
</div>
```

### 5. Pages to Update

✅ UsersPage - Done
⬜ TenantsPage
⬜ ProductsPage
⬜ ApplicationsPage
⬜ RolesPage
⬜ AuditLogsPage
⬜ TrafficLogsPage
⬜ All other list pages
