# Contributing Guide

## 🎯 Quy tắc phát triển

### 1. Trước khi code
- [ ] Đọc `/CODE_STRUCTURE.md` để hiểu cấu trúc
- [ ] Kiểm tra xem đã có utility/hook tương tự chưa
- [ ] Plan trước khi implement

### 2. Khi thêm tính năng mới

#### Thêm Constants
```typescript
// /constants/app.ts hoặc /constants/navigation.ts
export const NEW_FEATURE_CONFIG = {
  enabled: true,
  maxItems: 10,
} as const;
```

#### Thêm Types
```typescript
// /types/index.ts
export interface NewFeature {
  id: string;
  name: string;
}
```

#### Thêm Custom Hook
```typescript
// /hooks/useNewFeature.ts
/**
 * useNewFeature Hook
 * Description of what this hook does
 * 
 * @example
 * const { data, loading } = useNewFeature();
 */
export function useNewFeature() {
  // Implementation
  return { data, loading };
}
```

#### Thêm Utility
```typescript
// /lib/newFeature.ts
/**
 * Helper function for new feature
 * @param input - Description
 * @returns Description
 */
export function helperFunction(input: string): string {
  // Implementation
  return output;
}
```

### 3. Code Style

#### Component Structure
```typescript
import { memo } from 'react';
import type { ComponentProps } from '@/types';
import { CONSTANTS } from '@/constants';
import { useCustomHook } from '@/hooks';

/**
 * Component Description
 * 
 * @features
 * - Feature 1
 * - Feature 2
 */
export const Component = memo(({ prop1, prop2 }: ComponentProps) => {
  // 1. Hooks
  const { state, actions } = useCustomHook();
  
  // 2. Handlers
  const handleClick = () => {
    // Implementation
  };
  
  // 3. Render
  return (
    <div>
      {/* Content */}
    </div>
  );
});

Component.displayName = 'Component';
```

#### Hook Structure
```typescript
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook description
 * 
 * @param config - Configuration object
 * @returns Hook return value
 */
export function useCustomHook(config?: Config) {
  // 1. State
  const [state, setState] = useState(initialState);
  
  // 2. Effects
  useEffect(() => {
    // Side effect
  }, [dependency]);
  
  // 3. Callbacks
  const action = useCallback(() => {
    // Implementation
  }, [dependency]);
  
  // 4. Return
  return { state, action };
}
```

### 4. Documentation

#### JSDoc Comments
```typescript
/**
 * Function description
 * 
 * @param param1 - Description of param1
 * @param param2 - Description of param2
 * @returns Description of return value
 * 
 * @example
 * const result = functionName('value1', 'value2');
 */
```

#### Component Comments
```typescript
/**
 * Component Name
 * 
 * Brief description of what the component does
 * 
 * @features
 * - Feature 1
 * - Feature 2
 * 
 * @example
 * <ComponentName prop1="value" prop2={value} />
 */
```

### 5. Testing

#### Before commit
```bash
# Run linter
npm run lint

# Run type check
npm run type-check

# Run tests (if available)
npm run test
```

### 6. Naming Conventions

#### Files
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`
- Constants: `camelCase.ts`
- Types: `camelCase.ts` or `index.ts`

#### Variables
- Constants: `UPPER_SNAKE_CASE`
- Functions: `camelCase`
- Components: `PascalCase`
- Types: `PascalCase`
- Boolean: `is`, `has`, `should` prefix

#### Examples
```typescript
// ✅ Good
const MAX_RETRY_COUNT = 3;
const isLoading = true;
const hasPermission = false;
function handleSubmit() {}
interface UserProfile {}
type ThemeMode = 'light' | 'dark';

// ❌ Bad
const max_retry = 3;
const loading = true;
const permission = false;
function SubmitHandler() {}
interface userprofile {}
type themeMode = 'light' | 'dark';
```

### 7. Import Order

```typescript
// 1. External libraries
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// 2. Internal: Types
import type { HeaderProps } from '@/types';

// 3. Internal: Constants
import { APP_CONFIG } from '@/constants';

// 4. Internal: Hooks
import { useKeyboardShortcut } from '@/hooks';

// 5. Internal: Utils
import { getStorageItem } from '@/lib';

// 6. Internal: Components
import { Button } from '@/components/ui/button';

// 7. Styles (if any)
import './styles.css';
```

### 8. Don't Repeat Yourself (DRY)

#### ❌ Bad - Duplicate logic
```typescript
// Component A
const data = JSON.parse(localStorage.getItem('key') || '[]');

// Component B
const data = JSON.parse(localStorage.getItem('key') || '[]');
```

#### ✅ Good - Shared utility
```typescript
// /lib/storage.ts
export function getStorageItem<T>(key: string, defaultValue: T): T {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
}

// Component A & B
import { getStorageItem } from '@/lib';
const data = getStorageItem('key', []);
```

### 9. Type Safety

#### Always use TypeScript properly
```typescript
// ❌ Bad
const data: any = fetchData();
function handleClick(e: any) {}

// ✅ Good
import type { UserData } from '@/types';
const data: UserData = fetchData();
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {}
```

### 10. Performance

#### Use memo for expensive computations
```typescript
import { useMemo, useCallback } from 'react';

// ✅ Good
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

const handleClick = useCallback(() => {
  doSomething();
}, [dependency]);
```

#### Lazy load heavy components
```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 11. Git Commit Messages

Format: `<type>(<scope>): <subject>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation
- `style`: Code style (formatting)
- `test`: Tests
- `chore`: Build/tooling

Examples:
```bash
git commit -m "feat(header): add search with recent items"
git commit -m "fix(sidebar): resolve collapse animation issue"
git commit -m "refactor(hooks): extract usePinnedRoutes"
git commit -m "docs(readme): update code structure guide"
```

### 12. Pull Request Checklist

- [ ] Code follows style guide
- [ ] Types are properly defined
- [ ] No hardcoded values (use constants)
- [ ] Reusable logic extracted to hooks/utils
- [ ] JSDoc comments added
- [ ] No console.logs (except errors/warnings)
- [ ] No unused imports/variables
- [ ] Component is responsive
- [ ] Tested on different browsers
- [ ] Git commit messages are clear

### 13. Code Review Checklist

When reviewing code:
- [ ] Is the code readable and maintainable?
- [ ] Are types properly used?
- [ ] Are constants used instead of magic numbers?
- [ ] Is there duplicate code that could be extracted?
- [ ] Are error cases handled?
- [ ] Is performance considered?
- [ ] Are components properly memoized?
- [ ] Are there any security concerns?

### 14. Common Patterns

#### Loading States
```typescript
const { data, loading, error } = useFetch('/api/data');

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <DataDisplay data={data} />;
```

#### Error Boundaries
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

#### Conditional Rendering
```typescript
// ✅ Good
{isVisible && <Component />}
{count > 0 ? <Items items={items} /> : <EmptyState />}

// ❌ Bad
{isVisible === true && <Component />}
```

### 15. Resources

- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- Project structure: `/CODE_STRUCTURE.md`

---

**Questions?** Contact the team lead or check existing code examples.
