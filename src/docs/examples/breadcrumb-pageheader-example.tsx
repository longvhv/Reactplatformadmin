/**
 * Example: Using Breadcrumb & PageHeader
 * 
 * Demonstrates proper usage of breadcrumb navigation
 * and PageHeader component in pages
 */

import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Plus, Download, Filter } from 'lucide-react';

// ============================================
// Example 1: Simple List Page
// ============================================

export function UsersListPage() {
  return (
    <>
      {/* ✅ Breadcrumb auto-generated from route */}
      {/* Route: /core/users */}
      {/* Breadcrumb: Dashboard > Users */}
      
      <PageHeader
        title="Users"
        description="Manage all users in the system"
        actions={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        }
      />
      
      {/* Page content with consistent spacing */}
      <div className="space-y-4">
        {/* Filters, Table, etc. */}
      </div>
    </>
  );
}

// ============================================
// Example 2: Detail Page with Actions
// ============================================

export function UserDetailPage() {
  return (
    <>
      {/* ✅ Breadcrumb auto-generated */}
      {/* Route: /core/users/123e4567-e89b-12d3-a456-426614174000 */}
      {/* Breadcrumb: Dashboard > Users > User #123e4567 */}
      
      <PageHeader
        title="John Doe"
        description="User details and activity"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button>
              Edit User
            </Button>
          </div>
        }
      />
      
      {/* Tabs or content sections */}
      <div className="space-y-6">
        {/* Content */}
      </div>
    </>
  );
}

// ============================================
// Example 3: Form Page (Add/Edit)
// ============================================

export function UserFormPage({ mode }: { mode: 'add' | 'edit' }) {
  return (
    <>
      {/* ✅ Breadcrumb shows action */}
      {/* Route: /core/users/add or /core/users/:id/edit */}
      {/* Breadcrumb: Dashboard > Users > Add (or Edit) */}
      
      <PageHeader
        title={mode === 'add' ? 'Add New User' : 'Edit User'}
        description={mode === 'add' 
          ? 'Create a new user account' 
          : 'Update user information'
        }
      />
      
      {/* Form content */}
      <div className="max-w-2xl">
        <form className="space-y-6">
          {/* Form fields */}
        </form>
      </div>
    </>
  );
}

// ============================================
// Example 4: Dashboard (No Breadcrumb)
// ============================================

export function DashboardPage() {
  return (
    <>
      {/* ✅ No breadcrumb on dashboard */}
      {/* Route: /core/dashboard */}
      {/* Breadcrumb: Hidden automatically */}
      
      <PageHeader
        title="Dashboard"
        description="Overview of your platform"
        actions={
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        }
      />
      
      {/* Dashboard content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stats cards */}
      </div>
    </>
  );
}

// ============================================
// Example 5: Nested Pages
// ============================================

export function TenantApplicationsPage({ tenantId }: { tenantId: string }) {
  return (
    <>
      {/* ✅ Deep nesting handled automatically */}
      {/* Route: /core/tenants/:tenantId/applications */}
      {/* Breadcrumb: Dashboard > Tenants > Tenant #xxx > Applications */}
      
      <PageHeader
        title="Applications"
        description="Applications for this tenant"
        actions={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Application
          </Button>
        }
      />
      
      {/* Content */}
      <div className="space-y-4">
        {/* Applications list */}
      </div>
    </>
  );
}

// ============================================
// Layout Standards Summary
// ============================================

/**
 * LAYOUT STANDARDS:
 * 
 * 1. Content Area Padding: 16px (p-4)
 *    ├─ Applied in AppLayout: <main className="p-4">
 *    └─ Consistent across all pages
 * 
 * 2. Breadcrumb:
 *    ├─ Auto-generated from route
 *    ├─ Margin bottom: 16px (mb-4)
 *    ├─ Hidden on dashboard
 *    └─ Supports i18n
 * 
 * 3. PageHeader:
 *    ├─ Title: 24px (text-2xl)
 *    ├─ Margin bottom: 24px (mb-6)
 *    ├─ Optional description & actions
 *    └─ Consistent spacing
 * 
 * 4. Page Content:
 *    ├─ Use space-y-4 for vertical spacing
 *    ├─ Use gap-4 for grid/flex layouts
 *    └─ Max-width for forms: max-w-2xl
 */

// ============================================
// Typography Standards
// ============================================

/**
 * TYPOGRAPHY HIERARCHY:
 * 
 * - Page Title (h1):     text-2xl  (24px)
 * - Section Title (h2):  text-xl   (20px)
 * - Subsection (h3):     text-lg   (18px)
 * - Body Text:           text-base (16px)
 * - Small Text:          text-sm   (14px)
 * - Captions:            text-xs   (12px)
 */

// ============================================
// Spacing Standards
// ============================================

/**
 * SPACING SCALE:
 * 
 * - Content padding:     p-4  (16px)
 * - Section spacing:     space-y-6  (24px)
 * - Component spacing:   space-y-4  (16px)
 * - Inline spacing:      gap-2 (8px), gap-4 (16px)
 * - Card padding:        p-4 (16px) or p-6 (24px)
 */

// ============================================
// Best Practices
// ============================================

/**
 * DO:
 * ✅ Use PageHeader for all page titles
 * ✅ Let breadcrumb auto-generate
 * ✅ Use consistent spacing (p-4, space-y-4)
 * ✅ Use semantic HTML (h1, h2, h3)
 * ✅ Support i18n with translation keys
 * 
 * DON'T:
 * ❌ Manually set font-size for titles
 * ❌ Create custom breadcrumb markup
 * ❌ Use inconsistent padding
 * ❌ Skip PageHeader component
 * ❌ Hard-code breadcrumb paths
 */
