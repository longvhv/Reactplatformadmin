# Development Guide - VHV Platform

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Basic React & TypeScript knowledge

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📖 Common Tasks

### 1. Creating a New Page

```typescript
// 1. Create page file
// /pages/MyNewPage.tsx

import { useState } from 'react';
import { Card } from '../components/ui/card';

export function MyNewPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-semibold">My New Page</h1>
      <Card className="p-6 mt-6">
        <p>Content here</p>
      </Card>
    </div>
  );
}
```

```typescript
// 2. Create module
// /modules/mynewpage/index.tsx

import { lazy } from 'react';
import { FileText } from 'lucide-react';
import type { Module } from '../../core/ModuleRegistry';

export const MyNewPageModule: Module = {
  id: 'mynewpage',
  name: 'My New Page',
  route: '/mynewpage',
  icon: FileText,
  component: lazy(() => import('../../pages/MyNewPage').then(m => ({ 
    default: m.MyNewPage 
  }))),
};
```

```typescript
// 3. Register in App.tsx
import { MyNewPageModule } from './modules/mynewpage';

registry.register(MyNewPageModule);
```

### 2. Creating a Component

```typescript
// /components/feature/MyComponent.tsx

import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

/**
 * MyComponent - Brief description
 * 
 * @param title - Component title
 * @param onAction - Action handler
 */
export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">{title}</h3>
      <Button onClick={onAction}>Click Me</Button>
    </Card>
  );
}
```

### 3. Creating a Custom Hook

```typescript
// /hooks/useMyFeature.ts

import { useState, useEffect } from 'react';

interface UseMyFeatureOptions {
  initialValue?: string;
}

/**
 * Custom hook for MyFeature
 */
export function useMyFeature(options: UseMyFeatureOptions = {}) {
  const [value, setValue] = useState(options.initialValue ?? '');
  const [loading, setLoading] = useState(false);

  const doSomething = async () => {
    setLoading(true);
    try {
      // Do something
      console.log('Action performed');
    } finally {
      setLoading(false);
    }
  };

  return {
    value,
    setValue,
    loading,
    doSomething,
  };
}
```

```typescript
// Export from /hooks/index.ts
export { useMyFeature } from './useMyFeature';
```

### 4. Creating a Service

```typescript
// /services/myfeature.service.ts

import { apiClient } from './api/client';
import { API_ENDPOINTS } from './api/endpoints';

interface MyData {
  id: string;
  name: string;
}

class MyFeatureService {
  /**
   * Get data
   */
  async getData(): Promise<MyData[]> {
    const response = await apiClient.get<MyData[]>('/api/mydata');
    return response.data;
  }

  /**
   * Create data
   */
  async createData(data: Omit<MyData, 'id'>): Promise<MyData> {
    const response = await apiClient.post<MyData>('/api/mydata', data);
    return response.data;
  }
}

export const myFeatureService = new MyFeatureService();
```

```typescript
// Add endpoints to /services/api/endpoints.ts
export const API_ENDPOINTS = {
  // ... existing endpoints
  myFeature: {
    list: '/myfeature',
    create: '/myfeature',
    get: (id: string) => `/myfeature/${id}`,
  },
} as const;
```

### 5. Adding Types

```typescript
// /types/myfeature.ts

export interface MyFeature {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

export interface MyFeatureFilters {
  search?: string;
  status?: 'active' | 'inactive';
}
```

```typescript
// Export from /types/index.ts
export * from './myfeature';
```

### 6. Adding Constants

```typescript
// /constants/myfeature.ts

export const MY_FEATURE_CONFIG = {
  maxItems: 100,
  pageSize: 20,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
} as const;

export const MY_FEATURE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
} as const;
```

### 7. Adding Utilities

```typescript
// /lib/myutils.ts

/**
 * Utility function description
 */
export function myUtilityFunction(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Another utility
 */
export function calculateSomething(a: number, b: number): number {
  return a + b;
}
```

```typescript
// Export from /lib/index.ts
export * from './myutils';
```

## 🎨 Styling Guidelines

### Using Tailwind Classes

```tsx
// ✅ Good - Semantic, readable
<div className="flex items-center gap-4 p-6 rounded-lg bg-muted">
  <Button variant="outline" size="sm">Action</Button>
</div>

// ❌ Bad - Too many classes, hard to read
<div className="flex flex-row items-center justify-start gap-4 p-6 rounded-lg bg-gray-100 dark:bg-gray-800">
  <button className="px-4 py-2 text-sm rounded border">Action</button>
</div>
```

### Using Components

```tsx
// ✅ Good - Use UI components
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

<Card className="p-6">
  <Button>Click</Button>
</Card>

// ❌ Bad - Reinventing the wheel
<div className="border rounded-lg p-6 bg-white shadow">
  <button className="px-4 py-2 bg-blue-500 text-white rounded">
    Click
  </button>
</div>
```

### Responsive Design

```tsx
// Mobile-first approach
<div className="
  flex flex-col gap-4           // Mobile: stack vertically
  sm:flex-row sm:gap-6          // Small screens: row
  lg:gap-8                      // Large screens: bigger gap
">
  <div className="w-full sm:w-1/2 lg:w-1/3">Content</div>
</div>
```

## 🔧 Best Practices

### 1. Component Structure

```tsx
import { useState } from 'react';
import { Button } from '../components/ui/button';

// 1. Define interfaces
interface MyComponentProps {
  title: string;
  onSave: (data: any) => void;
}

// 2. Component with JSDoc
/**
 * MyComponent - Description
 */
export function MyComponent({ title, onSave }: MyComponentProps) {
  // 3. State
  const [data, setData] = useState({});

  // 4. Handlers
  const handleSave = () => {
    onSave(data);
  };

  // 5. Render
  return (
    <div>
      <h2>{title}</h2>
      <Button onClick={handleSave}>Save</Button>
    </div>
  );
}
```

### 2. Hook Usage

```tsx
// ✅ Good - Custom hooks for reusable logic
function MyPage() {
  const { data, loading } = useMyData();
  const { handleSubmit } = useMyForm();
  
  if (loading) return <div>Loading...</div>;
  
  return <div>{/* ... */}</div>;
}

// ❌ Bad - All logic in component
function MyPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  
  // ... tons of logic
}
```

### 3. Error Handling

```typescript
// ✅ Good - Proper error handling
async function fetchData() {
  try {
    const response = await apiClient.get('/data');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}

// ❌ Bad - Silent failures
async function fetchData() {
  const response = await apiClient.get('/data');
  return response.data; // What if it fails?
}
```

### 4. Type Safety

```typescript
// ✅ Good - Explicit types
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  return apiClient.get<User>(`/users/${id}`);
}

// ❌ Bad - Any types
function getUser(id: any): Promise<any> {
  return apiClient.get(`/users/${id}`);
}
```

## 🧪 Testing

### Component Tests
```typescript
// MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title="Test" onSave={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Hook Tests
```typescript
// useMyHook.test.ts
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('updates value', () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.setValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });
});
```

## 🐛 Debugging Tips

### 1. React DevTools
- Install React DevTools browser extension
- Inspect component tree
- Check props and state

### 2. Console Logging
```typescript
// Use console.log strategically
console.log('User data:', userData);
console.table(arrayData);
console.error('Error occurred:', error);
```

### 3. TypeScript Errors
```typescript
// Hover over errors in VS Code
// Read error messages carefully
// Check type definitions
```

## 📦 Dependencies

### Adding a New Package
```bash
# Install package
npm install package-name

# Install types (if needed)
npm install -D @types/package-name
```

### Common Packages
- **UI**: `lucide-react` for icons
- **Forms**: Consider `react-hook-form@7.55.0`
- **Validation**: Built-in `/lib/validation.ts`
- **Notifications**: `sonner@2.0.3`

## 🔍 Code Review Checklist

- [ ] TypeScript types defined
- [ ] Components are small and focused
- [ ] Business logic in hooks/services
- [ ] Error handling implemented
- [ ] Responsive design considered
- [ ] Accessibility (aria labels, etc.)
- [ ] Performance optimized
- [ ] Code commented where needed
- [ ] No console.logs in production
- [ ] Follows project structure

## 🎯 Performance Tips

### 1. Lazy Loading
```typescript
// ✅ Good - Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Use with Suspense
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### 2. Memoization
```typescript
// ✅ Good - Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// ✅ Good - Memoize callbacks
const handleClick = useCallback(() => {
  doSomething();
}, []);
```

### 3. List Rendering
```typescript
// ✅ Good - Use keys
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}

// ❌ Bad - No keys or index as key
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}
```

## 📚 Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)

## 🆘 Getting Help

1. Check this guide
2. Review ARCHITECTURE.md
3. Search existing code for examples
4. Ask team members
5. Create GitHub issue

## 📝 Commit Guidelines

```bash
# Format: type(scope): message

# Examples:
git commit -m "feat(profile): add avatar upload"
git commit -m "fix(auth): resolve login redirect"
git commit -m "docs(readme): update installation steps"
git commit -m "refactor(hooks): simplify useForm logic"
git commit -m "style(ui): improve button spacing"
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, styling
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

## 🎓 Learning Path

1. **Week 1**: Understand project structure
2. **Week 2**: Create simple components
3. **Week 3**: Build custom hooks
4. **Week 4**: Implement services
5. **Week 5**: Create full features

Happy coding! 🚀
