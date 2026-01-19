# Page Layout Standard - Design System

## 📐 Layout Structure

All pages should follow this standardized structure for consistency:

```tsx
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';

export function MyPage() {
  return (
    <PageContainer>
      {/* Page Header - Always first */}
      <PageHeader
        title="Page Title"
        description="Page description"
        icon={<IconComponent className="h-6 w-6 text-primary" />}
        actions={<Button>Action</Button>}
      >
        {/* Optional: Stats Cards */}
        <StatisticsCards stats={[...]} />
      </PageHeader>

      {/* Content Cards */}
      <Card className="p-6">
        {/* Your content */}
      </Card>

      {/* More sections */}
      <Card className="p-6">
        {/* More content */}
      </Card>
    </PageContainer>
  );
}
```

---

## ❌ DON'T - Avoid These Patterns

```tsx
// ❌ DON'T use min-h-screen wrapper
<div className="min-h-screen bg-background">
  <PageHeader />
</div>

// ❌ DON'T use background in page (inherited from AppLayout)
<div className="bg-gray-50">
  <PageHeader />
</div>

// ❌ DON'T use custom padding/max-width (handled by AppLayout)
<div className="max-w-7xl mx-auto px-4 py-8">
  <PageHeader />
</div>
```

---

## ✅ DO - Follow These Patterns

```tsx
// ✅ DO use PageContainer
<PageContainer>
  <PageHeader />
  <Card>Content</Card>
</PageContainer>

// ✅ DO let content have natural height
// No min-h-screen needed

// ✅ DO use space-y-6 for consistent spacing
// PageContainer provides this automatically
```

---

## 🎨 Design Specifications

### AppLayout (Already Done)
- Background: `bg-gray-50 dark:bg-gray-950`
- Max-width: `max-w-[1600px]`
- Padding: `px-6 py-6` (24px)
- Content area handles scrolling

### PageContainer
- No background (transparent)
- Spacing: `space-y-6` between children
- No min-height constraints

### PageHeader
- Background: `bg-white dark:bg-gray-900`
- Border: `border border-gray-200`
- Radius: `rounded-xl` (12px)
- Shadow: `shadow-sm`
- Icon: Circle `w-14 h-14 rounded-full bg-primary-50`
- Padding: `px-6 py-6`

### Content Cards
- Background: `bg-white dark:bg-gray-900`
- Border: `border border-gray-200`
- Radius: `rounded-xl`
- Shadow: `shadow-sm`
- Padding: `p-4` or `p-6`

---

## 📋 Migration Checklist

When updating a page:

- [ ] Remove outer `<div className="min-h-screen ...">` wrapper
- [ ] Remove `bg-background` or `bg-gray-50` from page root
- [ ] Remove custom `max-w-*` and padding from page root
- [ ] Wrap with `<PageContainer>`
- [ ] Use `<PageHeader>` for page title/actions
- [ ] Wrap content sections in `<Card>` components
- [ ] Update icon colors to `text-primary`
- [ ] Use `rounded-xl` for all cards
- [ ] Update spacing to `gap-6` or `space-y-6`

---

## 🔄 Loading States

```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
```

**Note:** Use `py-12` instead of `min-h-screen` for loading states.

---

## 📊 Example: Complete Page

```tsx
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';

export function UsersPage() {
  const { users, loading } = useUsers();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description="Manage user accounts"
        icon={<Users className="h-6 w-6 text-primary" />}
        actions={
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        }
      >
        <StatisticsCards stats={stats} />
      </PageHeader>

      {/* Search & Filters */}
      <Card className="p-4">
        <Input placeholder="Search..." />
      </Card>

      {/* Users Table */}
      <Card className="p-6">
        <UsersTable data={users} />
      </Card>
    </PageContainer>
  );
}
```

---

## ✨ Benefits

- ✅ **Consistent spacing** - All pages use gap-6
- ✅ **Clean design** - Gray background with white cards
- ✅ **Natural height** - Content drives page height
- ✅ **Responsive** - Works on all screen sizes
- ✅ **Maintainable** - Standard components
- ✅ **Accessible** - Proper semantic structure

---

**Last Updated:** 2026-01-18
**Version:** 1.0
