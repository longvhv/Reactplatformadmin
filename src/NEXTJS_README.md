# BasicSoftTemplate - Next.js Web Application

A modern, professional web application built with **Next.js 14**, **React 18**, and **TailwindCSS v4.0**.

## ✨ Features

- ✅ **Next.js 14** with App Router
- ✅ **TypeScript** for type safety
- ✅ **TailwindCSS v4.0** for styling
- ✅ **6 Languages** (Vietnamese, English, Spanish, Chinese, Japanese, Korean)
- ✅ **Dark Mode** support (light/dark/system)
- ✅ **Responsive Design** (mobile-first)
- ✅ **Modern UI** with shadcn/ui components
- ✅ **Indigo Theme** (#6366F1)
- ✅ **SSR Ready** for better SEO

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd basicsofttemplate

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   ├── (auth)/                # Auth routes (no layout)
│   │   └── login/page.tsx     # Login page
│   └── (dashboard)/           # Dashboard routes (with layout)
│       ├── layout.tsx         # Dashboard layout
│       ├── dashboard/page.tsx # Dashboard
│       ├── settings/page.tsx  # Settings
│       └── profile/page.tsx   # Profile
│
├── components/                # React components
│   ├── ui/                    # UI components (shadcn/ui)
│   ├── layout/                # Layout components
│   └── common/                # Common components
│
├── providers/                 # Context providers
│   ├── LanguageProvider.tsx  # i18n provider
│   └── ThemeProvider.tsx      # Theme provider
│
├── i18n/                      # Translations
│   ├── vi.ts                  # Vietnamese
│   ├── en.ts                  # English
│   ├── es.ts                  # Spanish
│   ├── zh.ts                  # Chinese
│   ├── ja.ts                  # Japanese
│   └── ko.ts                  # Korean
│
├── lib/                       # Utility functions
├── hooks/                     # Custom React hooks
├── types/                     # TypeScript types
├── constants/                 # Constants
└── styles/                    # Global styles
```

## 🎨 Design System

### Colors

```css
Primary: #6366F1 (Indigo)
Background: #FAFAFA (Light), #0A0A0A (Dark)
```

### Typography

- **Font**: Inter (9 weights: 100-900)
- **Variants**: Thin, Extra Light, Light, Regular, Medium, Semi Bold, Bold, Extra Bold, Black

### Components

- Built with **shadcn/ui**
- **50+ UI components**
- Fully customizable
- Accessible (WCAG AA)

## 🌍 Internationalization (i18n)

### Supported Languages

| Language | Code | Status |
|----------|------|--------|
| Vietnamese | `vi` | ✅ Default |
| English | `en` | ✅ Complete |
| Spanish | `es` | ✅ Complete |
| Chinese | `zh` | ✅ Complete |
| Japanese | `ja` | ✅ Complete |
| Korean | `ko` | ✅ Complete |

### Usage

```tsx
'use client';

import { useLanguage } from '@/providers/LanguageProvider';

export default function Component() {
  const { t, currentLanguage, changeLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      <button onClick={() => changeLanguage('en')}>
        Switch to English
      </button>
    </div>
  );
}
```

### Adding New Translations

1. Add to translation files (`i18n/*.ts`)
2. Update TypeScript types if needed
3. Use in components with `t('key')`

## 🎯 Available Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)

# Production
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Analysis
npm run analyze          # Analyze bundle size
```

## 📱 Pages

### Public Pages

- **`/login`** - Login page

### Protected Pages (Dashboard)

- **`/dashboard`** - Dashboard with stats and charts
- **`/settings`** - Settings (appearance, language, notifications)
- **`/profile`** - User profile management

### Future Pages

- `/users` - User management
- `/analytics` - Analytics & reports
- `/help` - Help & documentation

## 🔧 Configuration

### next.config.mjs

```javascript
{
  i18n: {
    defaultLocale: 'vi',
    locales: ['vi', 'en', 'es', 'zh', 'ja', 'ko'],
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  compiler: {
    removeConsole: true, // Production only
  },
}
```

### Environment Variables

Create `.env.local`:

```bash
API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎨 Theming

### Using Theme

```tsx
'use client';

import { useTheme } from 'next-themes';

export default function Component() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme('dark')}>
      Dark Mode
    </button>
  );
}
```

### Available Themes

- `light` - Light mode
- `dark` - Dark mode
- `system` - Follow system preference

## 📦 Dependencies

### Core

- **next**: ^14.2.0
- **react**: ^18.3.0
- **react-dom**: ^18.3.0

### UI

- **@radix-ui/react-***: UI primitives
- **lucide-react**: Icons
- **tailwindcss**: ^4.0.0
- **clsx**: Class name utility
- **tailwind-merge**: Merge Tailwind classes

### Utilities

- **next-themes**: Theme switching
- **sonner**: Toast notifications
- **date-fns**: Date formatting
- **zod**: Schema validation
- **react-hook-form**: Form handling

### State Management

- **zustand**: ^4.5.2
- **@tanstack/react-query**: ^5.28.0

## 🏗️ Build & Deploy

### Build for Production

```bash
# Build
npm run build

# Test production build locally
npm start
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Other Platforms

- **Netlify**: Connect GitHub repo
- **AWS Amplify**: Connect repo
- **Docker**: Use provided Dockerfile (TBD)

## 📊 Performance

### Lighthouse Scores (Target)

- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

### Optimizations

- ✅ Automatic code splitting
- ✅ Image optimization
- ✅ Font optimization
- ✅ Route prefetching
- ✅ SWC compiler
- ✅ Tree shaking

## 🔒 Security

### Headers

```javascript
{
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
}
```

### Best Practices

- ✅ No inline scripts
- ✅ CSP headers (TBD)
- ✅ HTTPS only in production
- ✅ Environment variables for secrets

## 🐛 Troubleshooting

### Hydration Mismatch

**Problem**: Server/client content differs

**Solution**: Use `mounted` state
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

### 'use client' Required

**Problem**: Using hooks without directive

**Solution**: Add `'use client'` at top of file

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

## 📚 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🆘 Support

- Documentation: [/docs](/docs)
- Issues: [GitHub Issues](https://github.com/...)
- Email: support@basicsofttemplate.com

---

**Built with ❤️ by VHV Platform**

Last Updated: 2026-01-03
