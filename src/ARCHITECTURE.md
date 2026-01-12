# VHV Platform - Architecture Documentation

## 📁 Project Structure

```
/
├── components/           # React components
│   ├── ui/              # Shadcn/ui components (buttons, cards, etc.)
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   ├── profile/         # Profile-specific components
│   └── dashboard/       # Dashboard-specific components
│
├── pages/               # Page components
│   ├── ProfilePage.tsx
│   ├── SettingsPage.tsx
│   └── ...
│
├── modules/             # Feature modules
│   ├── auth/           # Authentication module
│   ├── dashboard/      # Dashboard module
│   ├── settings/       # Settings module
│   └── user/           # User module
│
├── services/            # API & business logic
│   ├── api/            # API client & endpoints
│   ├── profile.service.ts
│   └── index.ts
│
├── hooks/               # Custom React hooks
│   ├── useProfile.ts
│   ├── useForm.ts
│   ├── useAsync.ts
│   └── ...
│
├── lib/                 # Utility functions
│   ├── validation.ts   # Validation helpers
│   ├── format.ts       # Formatting helpers
│   ├── navigation.ts   # Navigation utilities
│   └── storage.ts      # LocalStorage utilities
│
├── types/               # TypeScript type definitions
│   ├── index.ts
│   └── profile.ts
│
├── constants/           # Application constants
│   ├── app.ts          # App config
│   ├── navigation.ts   # Navigation items
│   └── profile.ts      # Profile constants
│
├── providers/           # React context providers
│   └── ThemeProvider.tsx
│
├── core/                # Core framework files
│   ├── ModuleRegistry.tsx
│   └── LazyModuleLoader.tsx
│
├── styles/              # Global styles
│   └── globals.css
│
└── utils/               # Performance utilities
    ├── cache.ts
    ├── preload.ts
    └── ...
```

## 🏛️ Architecture Layers

### 1. **Presentation Layer** (Components)
- **UI Components** (`/components/ui`): Reusable UI primitives
- **Feature Components** (`/components/profile`, `/components/dashboard`): Feature-specific components
- **Layout Components** (`/components/layout`): App structure components
- **Pages** (`/pages`): Top-level route components

### 2. **Business Logic Layer** (Services)
- **API Client** (`/services/api/client.ts`): HTTP communication
- **Service Classes** (`/services/*.service.ts`): Business logic
- **Endpoints** (`/services/api/endpoints.ts`): API endpoint definitions

### 3. **State Management Layer** (Hooks)
- **Custom Hooks** (`/hooks`): Reusable state logic
- **Context Providers** (`/providers`): Global state management

### 4. **Utility Layer** (Lib)
- **Validation** (`/lib/validation.ts`): Input validation
- **Formatting** (`/lib/format.ts`): Data formatting
- **Storage** (`/lib/storage.ts`): LocalStorage wrapper
- **Navigation** (`/lib/navigation.ts`): Routing utilities

## 🔄 Data Flow

```
User Action
    ↓
Component
    ↓
Hook (useProfile, useForm, etc.)
    ↓
Service (profileService)
    ↓
API Client (apiClient)
    ↓
Backend API
    ↓
Response flows back up
```

## 🎯 Design Principles

### 1. **Separation of Concerns**
- UI logic separated from business logic
- Components focus on presentation
- Services handle API communication
- Hooks manage state

### 2. **Single Responsibility**
- Each file has one clear purpose
- Components are small and focused
- Functions do one thing well

### 3. **DRY (Don't Repeat Yourself)**
- Reusable components
- Shared utilities
- Centralized constants

### 4. **Type Safety**
- TypeScript everywhere
- Strict type definitions
- Interface-driven development

### 5. **Modularity**
- Feature-based modules
- Easy to add/remove features
- Independent testing

## 📦 Module System

### Module Structure
```typescript
/modules/feature/
├── index.tsx           # Module registration
├── FeaturePage.tsx     # Main page component
├── components/         # Feature-specific components
├── hooks/              # Feature-specific hooks
└── types.ts            # Feature-specific types
```

### Module Registration
```typescript
// modules/feature/index.tsx
export const FeatureModule: Module = {
  id: 'feature',
  name: 'Feature Name',
  route: '/feature',
  icon: FeatureIcon,
  component: lazy(() => import('./FeaturePage')),
};
```

## 🎨 Styling Strategy

### Tailwind CSS + CSS Variables
- Tailwind for utility classes
- CSS variables for theming (in `/styles/globals.css`)
- Shadcn/ui for component library
- Dark/light mode support

### Design Tokens
```css
/* Primary colors */
--primary: #6366f1;
--primary-foreground: #ffffff;

/* Background */
--background: #fafafa;
--foreground: #09090b;

/* Muted */
--muted: #f4f4f5;
--muted-foreground: #71717a;
```

## 🔌 API Integration

### Service Layer Pattern
```typescript
// services/feature.service.ts
class FeatureService {
  async getData() {
    const response = await apiClient.get('/api/feature');
    return response.data;
  }
}

export const featureService = new FeatureService();
```

### Hook Integration
```typescript
// hooks/useFeature.ts
export function useFeature() {
  const { execute, data, isPending } = useAsync(
    featureService.getData
  );
  
  return { data, isPending, refetch: execute };
}
```

## 🧪 Testing Strategy

### Unit Tests
- Test utilities in `/lib`
- Test hooks in isolation
- Test services with mocked API

### Integration Tests
- Test component + hook combinations
- Test user flows

### E2E Tests
- Test critical user journeys
- Test module integrations

## 🚀 Performance Optimization

### Code Splitting
- Lazy-loaded modules
- Dynamic imports
- Route-based splitting

### Caching
- LocalStorage for user preferences
- Query caching (when using React Query)
- Image optimization

### Bundle Size
- Tree shaking enabled
- Dead code elimination
- Component lazy loading

## 📚 Best Practices

### Component Creation
1. Create in appropriate folder
2. Use TypeScript interfaces
3. Extract business logic to hooks
4. Keep components pure and focused
5. Document with JSDoc comments

### Service Creation
1. Create service class
2. Define clear method names
3. Add TypeScript types
4. Handle errors properly
5. Export singleton instance

### Hook Creation
1. Prefix with "use"
2. Keep hooks composable
3. Document parameters
4. Return clear interface
5. Handle cleanup

## 🔐 Security Considerations

### Input Validation
- Always validate user input
- Use validation utilities from `/lib/validation.ts`
- Sanitize data before display

### Authentication
- Token-based auth (when implemented)
- Secure token storage
- Auto-refresh tokens

### Authorization
- Role-based access control
- Route guards
- Component-level permissions

## 🌐 Internationalization (i18n)

### Future Implementation
- Language files in `/locales`
- Translation hook `useTranslation()`
- Date/number formatting with locale

## 📱 Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Strategy
- Mobile-first approach
- Tailwind responsive utilities
- Flexible layouts

## 🔄 State Management

### Local State
- `useState` for component state
- `useReducer` for complex state

### Global State
- Context API for theme
- Custom hooks for shared state
- Future: Consider Zustand/Jotai

## 📝 Documentation

### Code Comments
- JSDoc for functions/components
- Inline comments for complex logic
- README for modules

### Type Definitions
- Interfaces over types (when possible)
- Export from `/types`
- Document complex types

## 🛠️ Development Workflow

### Adding a New Feature
1. Create module folder in `/modules`
2. Define types in `/types`
3. Create service in `/services`
4. Create hooks in `/hooks`
5. Create components
6. Register module
7. Test thoroughly

### Adding a New Page
1. Create page in `/pages`
2. Create necessary components
3. Define routes
4. Add to navigation

### Adding a Utility
1. Add to `/lib`
2. Export from `/lib/index.ts`
3. Add tests
4. Document usage

## 🔮 Future Enhancements

- [ ] Add React Query for data fetching
- [ ] Implement form library (React Hook Form)
- [ ] Add state management (Zustand)
- [ ] Implement real-time features (WebSockets)
- [ ] Add analytics tracking
- [ ] Implement error tracking (Sentry)
- [ ] Add performance monitoring
- [ ] Implement PWA features
- [ ] Add automated testing
- [ ] CI/CD pipeline

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Code style
- Commit messages
- Pull request process
- Testing requirements

## 📞 Support

For questions or issues:
1. Check documentation
2. Review code examples
3. Create GitHub issue
4. Contact team lead
