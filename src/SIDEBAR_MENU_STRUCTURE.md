# Sidebar Menu Structure - Grouped Navigation

## 📊 Overview

Sidebar navigation được tổ chức thành **5 nhóm chính** với phân cấp rõ ràng, visual separators, và expand/collapse functionality.

---

## 🗂️ Menu Hierarchy

### **Level 1: Dashboard** (Top-level, always visible)
```
📊 Dashboard (/core/dashboard)
```

---

### **CORE OPERATIONS** (Primary groups - Default expanded)

#### **Group 1: Identity & Access** 🛡️
**Icon:** Shield  
**Purpose:** User management & authentication

- 🏢 **Tenants** - Multi-tenant management
- 👥 **Users** - User management
- 🛡️ **Roles** - Role & permissions

#### **Group 2: Commerce & Billing** 🛒
**Icon:** ShoppingCart  
**Purpose:** Products, packages & transactions

- 📦 **Products** - Product catalog
- 🎁 **Service Packages** - Package definitions
- 🔄 **Subscriptions** - Subscription management
- 🛒 **Orders** - Order history

#### **Group 3: Platform & Configuration** ⚙️
**Icon:** Settings  
**Purpose:** System configuration & management

- 🎯 **Applications** - Technical app definitions
- 📁 **System Categories** - Classification & taxonomy
- 🛤️ **App Routes** - Tenant routing config
- ⏱️ **Rate Limits** - API rate limiting
- 📢 **Announcements** - System notifications

---

**[VISUAL DIVIDER]**

---

### **ADVANCED FEATURES** (Secondary groups - Default collapsed)

#### **Group 4: Integrations & API** 🔌
**Icon:** Plug  
**Purpose:** External integrations & API management

- 🪝 **Webhooks** - Webhook management
- 🔑 **API Keys** - API authentication

#### **Group 5: Analytics & Monitoring** 📊
**Icon:** BarChart3  
**Purpose:** Reporting & security monitoring

- 📄 **Reports** - Business reports
- 📋 **Audit Logs** - Security audit trail

---

### **FOOTER** (System utilities)
```
⚙️ Settings (/core/settings)
👤 Profile (/core/profile)
```

---

## 🎨 Visual Design

### **Group Styling:**
- **Active Group Header:** Indigo background with bold text
- **Inactive Group Header:** Gray text, hover effect
- **Expanded Indicator:** ChevronDown icon
- **Collapsed Indicator:** ChevronRight icon

### **Item Styling:**
- **Active Item:** Indigo-50 background, indigo-600 text, font-medium
- **Inactive Item:** Gray-600 text, hover to gray-50
- **Border Indicator:** 2px indigo-100 left border for expanded groups

### **Separators:**
- **Primary Divider:** After Dashboard, before menu groups
- **Secondary Divider:** Between Core Operations and Advanced Features (before group 4)

---

## ⚙️ Features

### ✅ **Expand/Collapse All**
- **Location:** Small button next to primary divider
- **Icon:** ChevronsDown (expand) / ChevronsRight (collapse)
- **Behavior:** Toggle all groups at once
- **Accessibility:** Tooltip on hover

### ✅ **State Persistence**
- **Storage:** localStorage (`sidebar_expanded_groups`)
- **Behavior:** Remembers user's expand/collapse preferences
- **Default State:** 
  - Groups 1-3: Expanded
  - Groups 4-5: Collapsed

### ✅ **Active Route Highlighting**
- **Group Level:** Highlights group if any child is active
- **Item Level:** Full highlighting with indigo background
- **Smart Detection:** Matches exact path + sub-paths

### ✅ **Mobile Responsive**
- **Overlay:** Dark backdrop when sidebar is open
- **Hamburger Menu:** Fixed button to toggle sidebar
- **Auto-close:** Closes on navigation
- **Transition:** Smooth slide animation

### ✅ **Tooltips & Descriptions**
- Each menu item has description on hover
- Helps users understand purpose before clicking

---

## 📈 Grouping Logic

### **Primary Groups (Default Expanded):**
**Rationale:** Most frequently accessed features
- Identity & Access - Core user/tenant management
- Commerce & Billing - Revenue-generating features
- Platform & Configuration - Essential system setup

### **Secondary Groups (Default Collapsed):**
**Rationale:** Advanced/less frequent features
- Integrations & API - Technical/developer features
- Analytics & Monitoring - Periodic review features

---

## 🔄 User Experience Flow

### **New User Experience:**
1. ✅ Sees Dashboard first
2. ✅ Core groups expanded by default
3. ✅ Can discover advanced features via collapse button
4. ✅ Visual divider separates primary/secondary features

### **Power User Experience:**
1. ✅ Preferences saved (localStorage)
2. ✅ Quick expand/collapse all
3. ✅ Fast navigation via keyboard
4. ✅ Visual feedback on active routes

---

## 🎯 Design Decisions

### **Why 5 Groups?**
- ✅ **Optimal Cognitive Load:** 5±2 items is ideal for human memory
- ✅ **Logical Categorization:** Each group has clear purpose
- ✅ **Scalability:** Easy to add items within groups
- ✅ **Visual Balance:** Not too cluttered, not too empty

### **Why Visual Divider?**
- ✅ **Clear Separation:** Primary vs Secondary features
- ✅ **Reduced Cognitive Load:** Easier to scan
- ✅ **Professional Look:** Enterprise-grade UI pattern

### **Why Expand/Collapse All?**
- ✅ **User Control:** Power users can customize view
- ✅ **Quick Navigation:** Find items faster
- ✅ **Accessibility:** Single-click to see all options

---

## 📊 Menu Statistics

- **Total Groups:** 5
- **Total Menu Items:** 15
- **Default Expanded:** 3 groups (11 items visible)
- **Default Collapsed:** 2 groups (4 items hidden)
- **Sidebar Width:** 288px (18rem / w-72)
- **Max Nesting Level:** 2 (Group → Item)

---

## 🔮 Future Enhancements

### **Planned:**
1. **Search/Filter** - Quick menu search
2. **Keyboard Shortcuts** - Navigate with arrow keys
3. **Drag & Drop** - Reorder groups (admin only)
4. **Badges** - Notification counters
5. **Recently Accessed** - Quick access to recent pages

### **Considered:**
1. **Third-level nesting** - Sub-items under items
2. **Favorites/Pinning** - Pin frequently used items
3. **Customizable Groups** - User-defined groups
4. **Multi-language** - i18n for menu labels

---

## 🛠️ Technical Implementation

### **Component Structure:**
```tsx
Sidebar
├── Header (Logo + Title)
├── Navigation
│   ├── Dashboard (Top-level)
│   ├── Divider (with expand/collapse)
│   └── Menu Groups (map)
│       ├── Group Header (clickable)
│       ├── Group Items (conditional)
│       │   └── Item Links
│       └── Visual Divider (conditional)
└── Footer (Settings + Profile)
```

### **State Management:**
```typescript
expandedGroups: Record<string, boolean>  // Group ID → expanded state
isMobileOpen: boolean                     // Mobile sidebar toggle
allExpanded: boolean                      // Computed: all groups expanded?
allCollapsed: boolean                     // Computed: all groups collapsed?
```

### **Key Functions:**
- `toggleGroup(groupId)` - Toggle single group
- `expandAll()` - Expand all groups
- `collapseAll()` - Collapse all groups
- `isActiveRoute(path)` - Check if route is active

---

## 📖 Usage Guidelines

### **Adding New Menu Item:**
```typescript
{
  label: 'New Feature',
  path: '/core/new-feature',
  icon: <Icon className="w-4 h-4" />,
  description: 'Brief description for tooltip',
  badge: 5, // Optional: notification count
}
```

### **Adding New Group:**
```typescript
{
  id: 'new_group',
  label: 'New Group',
  icon: <Icon className="w-5 h-5" />,
  defaultExpanded: false,
  items: [ /* menu items */ ],
}
```

### **Adjusting Divider Position:**
Update `needsDivider` logic in map function:
```typescript
const needsDivider = index === 3; // Before group at index 3
```

---

## ✅ Accessibility

- ✅ **Keyboard Navigation:** Tab, Enter, Arrow keys
- ✅ **Screen Readers:** Proper ARIA labels
- ✅ **Focus Indicators:** Visible focus states
- ✅ **Tooltips:** Descriptive titles for all items
- ✅ **Color Contrast:** WCAG AA compliant
- ✅ **Mobile-friendly:** Touch targets ≥44px

---

## 🎨 Color Palette

### **Active States:**
- Background: `bg-indigo-50`
- Text: `text-indigo-600`
- Border: `border-indigo-100`

### **Inactive States:**
- Text: `text-gray-700` / `text-gray-600`
- Hover: `bg-gray-100` / `bg-gray-50`

### **Dividers:**
- Color: `bg-gray-200`
- Opacity: 100%

---

**Last Updated:** January 14, 2026  
**Component:** `/components/layout/Sidebar.tsx`  
**Total Lines:** ~380  
**Status:** ✅ Production Ready  
**Design System:** Tailwind CSS v4 + Indigo (#6366f1)

---

**END OF DOCUMENTATION**
