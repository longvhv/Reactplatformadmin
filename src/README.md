# VHV Platform - React Framework

Modern, scalable React application framework with modular architecture, TypeScript, and Tailwind CSS.

## 🎯 Features

- ✅ **Modular Architecture** - Feature-based modules with lazy loading
- ✅ **TypeScript** - Full type safety throughout the application
- ✅ **Tailwind CSS** - Utility-first styling with dark mode support
- ✅ **Shadcn/ui** - Beautiful, accessible component library
- ✅ **Service Layer** - Centralized API communication
- ✅ **Custom Hooks** - Reusable state management logic
- ✅ **Performance Optimized** - Code splitting, lazy loading, caching
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **Theme Support** - Light/Dark mode with system preference
- ✅ **Developer Experience** - Hot reload, TypeScript, ESLint, Prettier

## 📁 Project Structure

```
/
├── components/          # React components
│   ├── ui/             # Shadcn/ui components
│   ├── layout/         # Layout components
│   ├── common/         # Reusable common components
│   └── profile/        # Feature-specific components
├── pages/              # Page components
├── modules/            # Feature modules
├── services/           # API & business logic
│   └── api/           # API client & endpoints
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── types/              # TypeScript definitions
├── constants/          # Application constants
├── providers/          # React context providers
├── core/               # Core framework files
└── styles/             # Global styles
```

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Creating Your First Feature

1. **Create a new page:**

```typescript
// pages/MyPage.tsx
export function MyPage() {
  return <div>My Page Content</div>;
}
```

2. **Create a module:**

```typescript
// modules/mypage/index.tsx
import { lazy } from 'react';
import { FileText } from 'lucide-react';

export const MyPageModule = {
  id: 'mypage',
  name: 'My Page',
  route: '/mypage',
  icon: FileText,
  component: lazy(() => import('../../pages/MyPage').then(m => ({ 
    default: m.MyPage 
  }))),
};
```

3. **Register the module:**

```typescript
// App.tsx
import { MyPageModule } from './modules/mypage';

registry.register(MyPageModule);
```

## 📚 Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** - System architecture and design patterns
- **[Development Guide](./DEVELOPMENT-GUIDE.md)** - Step-by-step development instructions
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to the project
- **[Code Structure](./CODE_STRUCTURE.md)** - Detailed code organization

## 🏗️ Architecture Highlights

### Service Layer
Centralized API communication with type-safe endpoints:

```typescript
// Use services for API calls
import { profileService } from './services';

const profile = await profileService.getProfile();
```

### Custom Hooks
Reusable state management:

```typescript
// Use hooks for state logic
import { useProfile, useForm, useAsync } from './hooks';

function MyComponent() {
  const { profile, isEditing } = useProfile();
  return <div>{profile.name}</div>;
}
```

### Validation & Formatting
Built-in utilities:

```typescript
import { isValidEmail, formatDate } from './lib';

const valid = isValidEmail('test@example.com');
const date = formatDate(new Date(), 'relative'); // "2 giờ trước"
```

### Common Components
Reusable UI components:

```typescript
import { EmptyState, LoadingSpinner, DataTable } from './components/common';

<EmptyState
  icon={FileText}
  title="No data"
  description="Get started by creating something"
/>
```

## 🎨 Styling

### Design System
- **Primary Color**: Indigo (#6366f1)
- **Background**: #fafafa
- **Font**: Inter
- **Style**: Modern, Professional, Clean

### Tailwind Configuration
- Custom color palette in `/styles/globals.css`
- Dark mode support via CSS variables
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

## 🔧 Development Tools

### VS Code Extensions (Recommended)
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

### Code Quality
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking

## 📦 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **Lucide React** - Icons
- **React Router** - Routing
- **Sonner** - Toast notifications

## 🧪 Testing (Coming Soon)

- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright

## 🚀 Deployment

### Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=https://api.example.com
VITE_APP_NAME=VHV Platform
```

## 📖 Key Concepts

### Modules
Self-contained features with their own components, hooks, and logic:

```typescript
const MyModule: Module = {
  id: 'unique-id',
  name: 'Display Name',
  route: '/path',
  icon: IconComponent,
  component: LazyComponent,
};
```

### Services
Business logic separated from UI:

```typescript
class MyService {
  async getData() {
    return apiClient.get('/endpoint');
  }
}
```

### Hooks
Reusable state logic:

```typescript
function useMyFeature() {
  const [state, setState] = useState();
  // Logic here
  return { state, setState };
}
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

VHV Platform Team

## 📞 Support

- Documentation: Check `/docs` directory
- Issues: Create a GitHub issue
- Email: support@vhvplatform.com

## 🗺️ Roadmap

- [ ] Unit & E2E testing
- [ ] State management (Zustand/Jotai)
- [ ] Form library integration (React Hook Form)
- [ ] Data fetching (React Query)
- [ ] i18n support
- [ ] PWA features
- [ ] Analytics integration
- [ ] Error tracking (Sentry)
- [ ] CI/CD pipeline
- [ ] Storybook for components

## 📊 Performance

- **Code Splitting**: Lazy-loaded modules
- **Caching**: LocalStorage for preferences
- **Optimization**: Tree shaking, minification
- **Bundle Size**: < 200KB initial load (gzipped)

## 🎯 Best Practices

1. **Component-First**: Small, reusable components
2. **Type Safety**: TypeScript everywhere
3. **Separation of Concerns**: UI, logic, and data separated
4. **Performance**: Lazy loading, memoization
5. **Accessibility**: ARIA labels, keyboard navigation
6. **Responsive**: Mobile-first design
7. **Testing**: Comprehensive test coverage (coming soon)

## 🌟 Highlights

- **Fast Development**: Modular structure for quick feature development
- **Scalable**: Easy to add new features and modules
- **Maintainable**: Clear code organization and documentation
- **Modern**: Latest React patterns and best practices
- **Production-Ready**: Optimized for performance and SEO

---

**Built with ❤️ by VHV Platform Team**
