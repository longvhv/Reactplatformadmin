# Quick Start - Next.js Web App

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
# Copy environment file
cp .env.example .env.local

# Edit if needed (optional)
nano .env.local
```

### 3. Run Development Server

```bash
npm run dev
```

Open **http://localhost:3000** 🎉

---

## 📋 Available Pages

| Page | URL | Description |
|------|-----|-------------|
| **Login** | `/login` | Login page |
| **Dashboard** | `/dashboard` | Dashboard with stats |
| **Settings** | `/settings` | App settings |
| **Profile** | `/profile` | User profile |

---

## 🎯 Common Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm start                # Run production server

# Code Quality
npm run lint             # Lint code
npm run type-check       # Check types
npm run format           # Format code

# Analysis
npm run analyze          # Analyze bundle
```

---

## 🌍 Language Switching

App supports **6 languages**:
- 🇻🇳 Vietnamese (default)
- 🇺🇸 English
- 🇪🇸 Spanish  
- 🇨🇳 Chinese
- 🇯🇵 Japanese
- 🇰🇷 Korean

Switch via Settings page or header dropdown.

---

## 🎨 Theme Switching

3 theme modes:
- ☀️ Light
- 🌙 Dark
- 💻 System (follows OS)

Switch via Settings page or header dropdown.

---

## 📁 Project Structure

```
├── app/              # Pages (Next.js App Router)
├── components/       # React components
├── providers/        # Context providers
├── i18n/            # Translations (6 languages)
├── lib/             # Utilities
├── hooks/           # Custom hooks
├── types/           # TypeScript types
└── styles/          # Global styles
```

---

## 🐛 Troubleshooting

### Port 3000 is busy

```bash
# Kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Module not found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build errors

```bash
# Clean and rebuild
rm -rf .next
npm run build
```

---

## 🔗 Integration with Backend

### Golang Backend

Backend runs on **http://localhost:8080**

See [golang-backend/README.md](golang-backend/README.md)

```bash
# In separate terminal
cd golang-backend
go run cmd/api/main.go
```

### Flutter Mobile

See [flutter/README.md](flutter/README.md)

```bash
# In separate terminal
cd flutter
flutter run
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [NEXTJS_README.md](NEXTJS_README.md) | Full Next.js documentation |
| [NEXTJS_MIGRATION.md](NEXTJS_MIGRATION.md) | Vite → Next.js migration |
| [I18N-GUIDE.md](I18N-GUIDE.md) | i18n usage guide |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Project status |
| [DEVELOPMENT_RULES.md](DEVELOPMENT_RULES.md) | Development rules |

---

## ✨ Features

- ✅ Next.js 14 with App Router
- ✅ TypeScript
- ✅ TailwindCSS v4.0
- ✅ 6 languages (i18n)
- ✅ Dark mode
- ✅ Responsive design
- ✅ Modern UI (shadcn/ui)
- ✅ SSR ready

---

## 🎯 Next Steps

1. **Explore** the app at http://localhost:3000
2. **Check** Settings page to change language/theme
3. **Read** full docs in NEXTJS_README.md
4. **Integrate** with Golang backend API
5. **Build** new features!

---

**Happy Coding! 🚀**
