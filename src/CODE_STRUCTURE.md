# VHV Platform - Code Structure Guide

## 📁 Cấu trúc thư mục được chuẩn hóa

```
/
├── constants/          # Hằng số và cấu hình
│   ├── app.ts         # Cấu hình ứng dụng, layout, theme
│   └── navigation.ts  # Dữ liệu navigation, ngôn ngữ, shortcuts
│
├── types/             # TypeScript type definitions
│   └── index.ts       # Tất cả types tập trung
│
├── lib/               # Utilities và helper functions
│   ├── storage.ts     # LocalStorage utilities
│   └── navigation.ts  # Navigation helper functions
│
├── hooks/             # Custom React hooks
│   ├── useKeyboardShortcut.ts  # Keyboard shortcuts
│   ├── useClickOutside.ts      # Click outside detection
│   ├── usePinnedRoutes.ts      # Pinned routes management
│   ├── useRecentRoutes.ts      # Recent routes tracking
│   ├── useSidebarState.ts      # Sidebar state management
│   ├── useDebounce.ts          # Debounce values
│   ├── useFetch.ts             # Data fetching
│   └── useLocalStorage.ts      # LocalStorage hook
│
├── components/        # React components
│   ├── layout/       # Layout components (Header, Sidebar...)
│   ├── ui/           # UI components (Button, Input...)
│   └── dashboard/    # Feature-specific components
│
├── modules/          # Feature modules
│   ├── auth/
│   ├── dashboard/
│   └── settings/
│
├── core/             # Core framework logic
│   ├── ModuleRegistry.tsx
│   └── LazyModuleLoader.tsx
│
├── providers/        # React context providers
│   └── ThemeProvider.tsx
│
├── pages/            # Page components
│
├── utils/            # Low-level utilities
│   ├── cache.ts
│   ├── compression.ts
│   └── performance.ts
│
└── styles/           # Global styles
    └── globals.css
```

## 🎯 Best Practices

### 1. **Constants** (`/constants/`)
Tất cả các giá trị hard-coded nên được đưa vào constants:

```typescript
// ❌ Bad
<div className="w-64">...</div>
const maxResults = 5;

// ✅ Good
import { LAYOUT_CONFIG, LIMITS } from '@/constants/app';

<div className={LAYOUT_CONFIG.sidebar.width.expanded}>...</div>
const maxResults = LIMITS.recentSearches;
```

### 2. **Types** (`/types/`)
Tất cả TypeScript types/interfaces tập trung tại đây:

```typescript
// ❌ Bad - Define types in component file
interface HeaderProps {
  sidebarOpen: boolean;
  // ...
}

// ✅ Good - Import from centralized types
import type { HeaderProps } from '@/types';
```

### 3. **Hooks** (`/hooks/`)
Tách logic phức tạp thành custom hooks:

```typescript
// ❌ Bad - Logic in component
const [pinnedRoutes, setPinnedRoutes] = useState([]);
useEffect(() => {
  localStorage.setItem('pinned', JSON.stringify(pinnedRoutes));
}, [pinnedRoutes]);

// ✅ Good - Use custom hook
import { usePinnedRoutes } from '@/hooks/usePinnedRoutes';
const { pinnedRoutes, togglePin } = usePinnedRoutes();
```

### 4. **Lib** (`/lib/`)
Helper functions và utilities:

```typescript
// ❌ Bad - Duplicate logic
localStorage.setItem('key', JSON.stringify(value));
const item = JSON.parse(localStorage.getItem('key'));

// ✅ Good - Use utility
import { setStorageItem, getStorageItem } from '@/lib/storage';
setStorageItem('key', value);
const item = getStorageItem('key', defaultValue);
```

## 📦 Custom Hooks Available

### `useKeyboardShortcut`
```typescript
useKeyboardShortcut({
  key: 'k',
  modifiers: ['cmd', 'ctrl'],
  callback: () => setSearchOpen(true),
});
```

### `useClickOutside`
```typescript
const ref = useRef<HTMLDivElement>(null);
useClickOutside(ref, () => setOpen(false));
```

### `usePinnedRoutes`
```typescript
const { pinnedRoutes, isPinned, togglePin, clearPins } = usePinnedRoutes();
```

### `useRecentRoutes`
```typescript
const { recentRoutes, addRecent, clearRecent } = useRecentRoutes();
```

### `useSidebarState`
```typescript
const {
  sidebarOpen,
  sidebarCollapsed,
  toggleSidebar,
  toggleSidebarCollapse,
} = useSidebarState();
```

## 🔧 Utilities Available

### Storage Utilities (`/lib/storage.ts`)
```typescript
import { getStorageItem, setStorageItem, removeStorageItem } from '@/lib/storage';

// Type-safe with error handling
const theme = getStorageItem<ThemeMode>('theme', 'light');
setStorageItem('theme', 'dark');
```

### Navigation Utilities (`/lib/navigation.ts`)
```typescript
import { filterRoutes, findRouteByPath, flattenMenuItems } from '@/lib/navigation';

const filtered = filterRoutes(routes, searchQuery);
const route = findRouteByPath(routes, '/dashboard');
```

## 🎨 Constants Available

### App Configuration (`/constants/app.ts`)
```typescript
import { APP_CONFIG, LAYOUT_CONFIG, ANIMATION_CONFIG, LIMITS } from '@/constants/app';

// App info
APP_CONFIG.name;         // "VHV Platform"
APP_CONFIG.version;      // "2.0.0"

// Layout
LAYOUT_CONFIG.sidebar.width.expanded;  // "w-64"
LAYOUT_CONFIG.sidebar.animation.duration;  // 300

// Limits
LIMITS.recentSearches;   // 5
LIMITS.pinnedRoutes;     // 10
```

### Navigation Data (`/constants/navigation.ts`)
```typescript
import { MOCK_RECENT_SEARCHES, LANGUAGES, KEYBOARD_SHORTCUTS } from '@/constants/navigation';

// Languages
LANGUAGES;  // [{ code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }, ...]

// Mock data
MOCK_RECENT_SEARCHES;  // Recent search items
```

## 📝 Naming Conventions

### Files
- Components: `PascalCase.tsx` (e.g., `Header.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useKeyboardShortcut.ts`)
- Utils: `camelCase.ts` (e.g., `storage.ts`)
- Constants: `camelCase.ts` (e.g., `app.ts`)

### Variables & Functions
- Constants: `UPPER_SNAKE_CASE` (e.g., `APP_CONFIG`)
- Functions: `camelCase` (e.g., `toggleSidebar`)
- Components: `PascalCase` (e.g., `Header`)
- Types/Interfaces: `PascalCase` (e.g., `HeaderProps`)

### Exports
```typescript
// ✅ Named exports cho utilities và hooks
export function useKeyboardShortcut() {}
export const APP_CONFIG = {};

// ✅ Default export cho components
export default function Header() {}
// or
export const Header = memo(() => {});
```

## 🚀 Migration Guide

Khi refactor code hiện có:

1. **Tìm hard-coded values** → Di chuyển vào `/constants/`
2. **Tìm duplicate logic** → Tạo custom hook trong `/hooks/`
3. **Tìm utility functions** → Di chuyển vào `/lib/`
4. **Tìm type definitions** → Di chuyển vào `/types/`
5. **Update imports** → Sử dụng path aliases (`@/` nếu có)

## 💡 Examples

### Before Refactoring
```typescript
// Header.tsx - Before
const [pinnedRoutes, setPinnedRoutes] = useState<string[]>([]);

useEffect(() => {
  const stored = localStorage.getItem('pinned-routes');
  if (stored) setPinnedRoutes(JSON.parse(stored));
}, []);

useEffect(() => {
  localStorage.setItem('pinned-routes', JSON.stringify(pinnedRoutes));
}, [pinnedRoutes]);

const togglePin = (path: string) => {
  setPinnedRoutes(prev => 
    prev.includes(path) 
      ? prev.filter(p => p !== path)
      : [...prev, path]
  );
};
```

### After Refactoring
```typescript
// Header.tsx - After
import { usePinnedRoutes } from '@/hooks/usePinnedRoutes';

const { pinnedRoutes, togglePin } = usePinnedRoutes();
```

## 🔍 Quick Reference

### Import Paths
```typescript
// Types
import type { HeaderProps, ThemeMode } from '@/types';

// Constants
import { APP_CONFIG, LIMITS } from '@/constants/app';
import { LANGUAGES } from '@/constants/navigation';

// Hooks
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { usePinnedRoutes } from '@/hooks/usePinnedRoutes';

// Utils
import { getStorageItem } from '@/lib/storage';
import { filterRoutes } from '@/lib/navigation';
```

## 📚 Next Steps

1. **Add more utilities** as needed in `/lib/`
2. **Create feature-specific hooks** in `/hooks/`
3. **Centralize all magic numbers/strings** in `/constants/`
4. **Document complex logic** with JSDoc comments
5. **Add unit tests** for utilities and hooks

---

**Maintained by:** VHV Platform Team  
**Last Updated:** 2025-12-27
