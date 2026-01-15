# Tenant Detail Sidebar Structure - Grouped Collapsible Navigation

## 📊 Overview

Tenant Detail Sidebar được tổ chức thành **8 nhóm chính** với collapsible groups, visual separators, expand/collapse all functionality, và state persistence.

---

## 🗂️ Menu Hierarchy

### **CORE TENANT MANAGEMENT** (Primary groups - Default expanded)

#### **Group 1: Overview & Info** 📊
**Icon:** LayoutDashboard  
**Purpose:** High-level tenant information

- 📊 **Overview** - Dashboard overview
- 📄 **Details** - Detailed information
- 📈 **Activity** - Activity timeline

#### **Group 2: Configuration** ⚙️
**Icon:** Settings  
**Purpose:** Tenant configuration & customization

- ⚙️ **Settings** - General settings
- 🎚️ **Features** - Feature toggles
- 🎨 **Branding** - Branding & theming
- 🌐 **Domains** - Custom domains

#### **Group 3: Users & Access** 👥
**Icon:** Users  
**Purpose:** User management & access control

- 👤 **Members** - Tenant members (renamed from Users)
- 🛡️ **Roles** - Role assignments
- 👥 **User Groups** - User group management
- 👤 **Delegations** - Access delegations
- 🔑 **SSO Config** - Single Sign-On configuration

#### **Group 4: Organization** 🏢
**Icon:** Building2  
**Purpose:** Organizational structure

- 🏢 **Departments** - Department hierarchy
- 🌐 **Locations** - Physical locations

---

**[VISUAL DIVIDER]**

---

### **ADVANCED FEATURES** (Secondary groups - Default collapsed)

#### **Group 5: Platform Resources** 🎯
**Icon:** Target  
**Purpose:** Platform-level resources & routing

- 🎯 **Applications** - Tenant applications
- 🛤️ **App Routes** - Routing configuration
- ⏱️ **Rate Limits** - API rate limiting
- 💾 **Storage** - Storage management (Planned)

#### **Group 6: Billing & Commerce** 🛒
**Icon:** ShoppingCart  
**Purpose:** Subscription & financial management

- 🔄 **Subscription** - Subscription details
- 🛒 **Orders** - Order history
- 🧾 **Invoices** - Invoice management (Planned)
- 📊 **Usage & Billing** - Usage metrics (Planned)

#### **Group 7: Integrations & API** 🔌
**Icon:** Plug  
**Purpose:** External integrations

- 🪝 **Webhooks** - Webhook configuration
- 🔑 **API Keys** - API key management (Planned)
- 🔌 **Connected Apps** - Third-party apps (Planned)

#### **Group 8: Analytics & Monitoring** 📈
**Icon:** TrendingUp  
**Purpose:** Analytics & logging

- 📈 **Analytics** - Analytics dashboard (Planned)
- 🔍 **Audit Logs** - Security audit trail (Planned)
- 📡 **API Activity** - API usage logs (Planned)

---

## 🎨 Visual Design

### **Group Styling:**
- **Active Group Header:** Indigo-600 text, indigo-50 background
- **Inactive Group Header:** Gray-700 text, hover gray-100
- **Expanded Indicator:** ChevronDown icon
- **Collapsed Indicator:** ChevronRight icon
- **Clickable:** Full group header is clickable button

### **Tab Styling:**
- **Active Tab:** Indigo-50 background, indigo-600 text, font-medium
- **Inactive Tab:** Gray-600 text, hover to gray-50
- **Disabled Tab (Planned):** Gray-400 text, cursor-not-allowed
- **Border Indicator:** 2px indigo-100 left border for expanded groups

### **Separators:**
- **Primary Divider:** After tenant header with expand/collapse button
- **Secondary Divider:** Between Core and Advanced groups (before group 5)

---

## ⚙️ Features

### ✅ **Collapsible Groups**
- **Click to Toggle:** Click group header to expand/collapse
- **Visual Feedback:** Chevron icon changes direction
- **Smart Highlighting:** Active group highlighted when child tab is active
- **Smooth Animation:** CSS transitions for expand/collapse

### ✅ **Expand/Collapse All**
- **Location:** Small button next to primary divider
- **Icon:** ChevronsDown (expand) / ChevronsRight (collapse)
- **Behavior:** Toggle all groups at once
- **Accessibility:** Tooltip on hover (3.5px icon size)

### ✅ **State Persistence**
- **Storage:** localStorage (`tenant_sidebar_expanded_groups`)
- **Behavior:** Remembers user's expand/collapse preferences per tenant
- **Default State:** 
  - Groups 1-4: Expanded (Core features)
  - Groups 5-8: Collapsed (Advanced features)

### ✅ **Status Badges**
- **Beta:** Purple badge for beta features (e.g., SSO Config)
- **Soon:** Gray badge for planned features
- **Badge Count:** Optional notification counter
- **Color Coordination:** Badge colors match active/inactive states

### ✅ **Tenant Header**
- **Tenant Name:** Display with truncation for long names
- **Tenant ID:** Monospace font for easy copying
- **Status Badge:** Visual indicator (Active/Inactive/Suspended)
- **Color-coded:** Green (active), Gray (inactive), Red (suspended)
- **Icons:** CheckCircle, XCircle, AlertCircle

### ✅ **Back Navigation**
- **Back Button:** Always visible at top
- **Link:** Returns to `/core/tenants` list
- **Hover Effect:** Text darkens on hover
- **Icon:** ArrowLeft for clear direction

### ✅ **Footer Actions**
- **Quick Access:** Prominent "Tenant Settings" button
- **Styling:** Indigo-600 text on indigo-50 background
- **Always Visible:** Sticky footer at bottom
- **Icon:** Settings gear icon

---

## 📈 Grouping Logic

### **Primary Groups (Default Expanded):**
**Rationale:** Most frequently accessed tenant management features
1. **Overview & Info** - Quick tenant overview
2. **Configuration** - Essential tenant settings
3. **Users & Access** - Most common operations
4. **Organization** - Structural management

### **Secondary Groups (Default Collapsed):**
**Rationale:** Advanced/less frequent features
5. **Platform Resources** - Technical configuration
6. **Billing & Commerce** - Financial operations
7. **Integrations & API** - Developer features
8. **Analytics & Monitoring** - Periodic review

---

## 🔄 User Experience Flow

### **New User Experience:**
1. ✅ Sees tenant header with status
2. ✅ Core groups expanded by default
3. ✅ Can discover advanced features via collapse button
4. ✅ Visual divider separates primary/secondary features

### **Power User Experience:**
1. ✅ Preferences saved per tenant (localStorage)
2. ✅ Quick expand/collapse all
3. ✅ Fast navigation via groups
4. ✅ Visual feedback on active routes

### **Mobile Experience:**
1. ✅ Responsive width (w-72 = 288px)
2. ✅ Scrollable navigation area
3. ✅ Touch-friendly tap targets
4. ✅ Fixed back button and footer

---

## 🎯 Design Decisions

### **Why 8 Groups?**
- ✅ **Logical Categorization:** Each group has clear tenant-specific purpose
- ✅ **Scalability:** Easy to add tabs within groups
- ✅ **Visual Balance:** 4 primary + 4 secondary groups
- ✅ **Collapsible:** Reduces cognitive load when collapsed

### **Why Separate Organization Group?**
- ✅ **Distinct Purpose:** Departments & Locations are organizational structure
- ✅ **Not User Management:** Different from Users & Access group
- ✅ **Tenant-specific:** These are unique per tenant
- ✅ **Future-proof:** Can add more organizational features

### **Why Visual Divider at Group 5?**
- ✅ **Clear Separation:** Core vs Advanced features
- ✅ **Reduced Cognitive Load:** Easier to scan
- ✅ **Professional Look:** Enterprise-grade UI pattern
- ✅ **Logical Break:** Matches default expanded/collapsed state

### **Why Collapsible Groups?**
- ✅ **Space Efficient:** Show only what's needed
- ✅ **User Control:** Power users can customize view
- ✅ **Reduced Clutter:** Cleaner interface
- ✅ **Progressive Disclosure:** Reveal complexity gradually

---

## 📊 Menu Statistics

- **Total Groups:** 8
- **Total Tabs:** 26
- **Default Expanded:** 4 groups (14 tabs visible)
- **Default Collapsed:** 4 groups (12 tabs hidden)
- **Beta Features:** 1 (SSO Config)
- **Planned Features:** 7
- **Active Features:** 18
- **Sidebar Width:** 288px (18rem / w-72)
- **Max Nesting Level:** 2 (Group → Tab)

---

## 🗺️ Tab Path Mapping

### **Group 1: Overview & Info**
- `/core/tenants/:id/overview`
- `/core/tenants/:id/details`
- `/core/tenants/:id/activity`

### **Group 2: Configuration**
- `/core/tenants/:id/settings`
- `/core/tenants/:id/features`
- `/core/tenants/:id/branding`
- `/core/tenants/:id/domains`

### **Group 3: Users & Access**
- `/core/tenants/:id/members` (previously 'users')
- `/core/tenants/:id/roles`
- `/core/tenants/:id/user-groups`
- `/core/tenants/:id/delegations`
- `/core/tenants/:id/sso`

### **Group 4: Organization**
- `/core/tenants/:id/departments`
- `/core/tenants/:id/locations`

### **Group 5: Platform Resources**
- `/core/tenants/:id/applications`
- `/core/tenants/:id/routes`
- `/core/tenants/:id/rate-limits`
- `/core/tenants/:id/storage` (planned)

### **Group 6: Billing & Commerce**
- `/core/tenants/:id/subscription`
- `/core/tenants/:id/orders`
- `/core/tenants/:id/invoices` (planned)
- `/core/tenants/:id/usage` (planned)

### **Group 7: Integrations & API**
- `/core/tenants/:id/webhooks`
- `/core/tenants/:id/api-keys` (planned)
- `/core/tenants/:id/integrations` (planned)

### **Group 8: Analytics & Monitoring**
- `/core/tenants/:id/analytics` (planned)
- `/core/tenants/:id/audit-logs` (planned)
- `/core/tenants/:id/api-logs` (planned)

---

## 🔮 Future Enhancements

### **Planned Tabs (7):**
1. **Storage** - File/blob storage management
2. **Invoices** - Invoice generation & viewing
3. **Usage & Billing** - Resource usage metrics
4. **API Keys** - API authentication keys
5. **Connected Apps** - Third-party integrations
6. **Analytics** - Business intelligence dashboard
7. **Audit Logs** - Complete audit trail
8. **API Activity** - Real-time API monitoring

### **Considered Features:**
1. **Search/Filter** - Quick tab search
2. **Keyboard Shortcuts** - Navigate with keys
3. **Favorites/Pinning** - Pin frequently used tabs
4. **Tab Reordering** - Drag & drop groups (admin only)
5. **Multi-select Actions** - Batch operations
6. **Notification Badges** - Real-time counts on tabs

---

## 🛠️ Technical Implementation

### **Component Structure:**
```tsx
TenantDetailSidebar
├── Back Button
├── Tenant Header
│   ├── Name & ID
│   └── Status Badge
├── Navigation
│   ├── Expand/Collapse All Button
│   └── Tab Groups (map)
│       ├── Group Header (collapsible button)
│       ├── Divider (conditional)
│       └── Group Tabs (conditional render)
│           └── Tab Links
└── Footer Actions
    └── Settings Button
```

### **State Management:**
```typescript
expandedGroups: Record<string, boolean>  // Group ID → expanded state
allExpanded: boolean                      // Computed: all groups expanded?
allCollapsed: boolean                     // Computed: all groups collapsed?
```

### **Key Functions:**
- `toggleGroup(groupId)` - Toggle single group
- `expandAll()` - Expand all groups
- `collapseAll()` - Collapse all groups
- `isActiveTab(path)` - Check if tab is active
- `getStatusIcon(status)` - Get status icon
- `getStatusColor(status)` - Get status color classes

### **localStorage Keys:**
- `tenant_sidebar_expanded_groups` - Expanded state per tenant sidebar

---

## 📖 Usage Guidelines

### **Adding New Tab:**
```typescript
{
  label: 'New Feature',
  path: 'new-feature',
  icon: <Icon className="w-4 h-4" />,
  badge: 5, // Optional: notification count
  status: 'beta', // Optional: 'beta' | 'planned'
}
```

### **Adding New Group:**
```typescript
{
  id: 'new_group',
  label: 'New Group',
  icon: <Icon className="w-4 h-4" />,
  defaultExpanded: false,
  tabs: [ /* tabs */ ],
}
```

### **Adjusting Divider Position:**
Update `needsDivider` logic in render:
```typescript
const needsDivider = index === 4; // Before group at index 4
```

### **Renaming Tab:**
Example: "Users" → "Members" in Users & Access group
```typescript
{
  label: 'Members',  // Changed from 'Users'
  path: 'members',
  icon: <UserCircle className="w-4 h-4" />,
}
```

---

## ✅ Accessibility

- ✅ **Keyboard Navigation:** Tab, Enter to navigate
- ✅ **Screen Readers:** Proper heading hierarchy
- ✅ **Focus Indicators:** Visible focus states
- ✅ **Button Labels:** Clear action labels
- ✅ **Color Contrast:** WCAG AA compliant
- ✅ **Touch Targets:** ≥44px for mobile
- ✅ **Tooltips:** Expand/collapse hints

---

## 🎨 Color Palette

### **Active States:**
- Background: `bg-indigo-50`
- Text: `text-indigo-600`
- Border: `border-indigo-100`

### **Inactive States:**
- Text: `text-gray-700` / `text-gray-600`
- Hover: `bg-gray-100` / `bg-gray-50`

### **Status Colors:**
- **Active:** `text-green-600 bg-green-50`
- **Inactive:** `text-gray-600 bg-gray-50`
- **Suspended:** `text-red-600 bg-red-50`

### **Badge Colors:**
- **Beta:** `text-purple-600 bg-purple-100`
- **Soon:** `text-gray-500 bg-gray-100`
- **Count:** `bg-indigo-100 text-indigo-700` (active) / `bg-gray-100 text-gray-700` (inactive)

### **Dividers:**
- Color: `bg-gray-200`
- Opacity: 100%

---

## 🆚 Comparison with Main Sidebar

| Feature | Main Sidebar | Tenant Detail Sidebar |
|---------|-------------|----------------------|
| **Groups** | 5 | 8 |
| **Total Items** | 15 | 26 |
| **Default Expanded** | 3 groups | 4 groups |
| **Collapsible** | ✅ Yes | ✅ Yes |
| **Expand/Collapse All** | ✅ Yes | ✅ Yes |
| **Visual Divider** | ✅ Yes (1) | ✅ Yes (1) |
| **localStorage Key** | `sidebar_expanded_groups` | `tenant_sidebar_expanded_groups` |
| **Context** | Global platform | Tenant-specific |
| **Top Item** | Dashboard | Tenant Header |
| **Footer** | Settings + Profile | Tenant Settings |
| **Badge Support** | ✅ Yes | ✅ Yes |
| **Status Support** | ❌ No | ✅ Yes (Beta/Planned) |

---

## 📝 Key Differences from Original

### **Before:**
- ❌ Non-collapsible groups
- ❌ No expand/collapse all
- ❌ No state persistence
- ❌ Static group labels
- ❌ No visual dividers
- ✅ Had status badges

### **After:**
- ✅ Fully collapsible groups
- ✅ Expand/collapse all button
- ✅ localStorage persistence
- ✅ Clickable group headers
- ✅ Visual divider between sections
- ✅ Enhanced status badges
- ✅ Better visual hierarchy
- ✅ "Members" instead of "Users" in group 3
- ✅ Added Organization group
- ✅ Better icon consistency

---

## 🚀 Implementation Highlights

### **Renamed Tabs:**
- **"Users"** → **"Members"** (Group 3, tab 1)
  - Reason: Avoid confusion with global Users management
  - Context: These are tenant-specific members
  - Icon: Changed to UserCircle for distinction

### **New Group:**
- **"Organization"** (Group 4)
  - Purpose: Departments & Locations
  - Separated from Users & Access
  - Tenant-specific organizational structure

### **Improved UX:**
- Collapsible groups reduce visual clutter
- State persistence improves productivity
- Visual separators improve scannability
- Status badges show feature maturity
- Expand/collapse all for power users

---

**Last Updated:** January 14, 2026  
**Component:** `/components/tenants/TenantDetailSidebar.tsx`  
**Total Lines:** ~480  
**Total Groups:** 8  
**Total Tabs:** 26  
**Status:** ✅ Production Ready  
**Design System:** Tailwind CSS v4 + Indigo (#6366f1)

---

**END OF DOCUMENTATION**
