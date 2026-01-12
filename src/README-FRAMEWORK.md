# VHV Platform React Framework

Khung ứng dụng React modular được xây dựng dựa trên [vhvplatform/react-framework](https://github.com/vhvplatform/react-framework).

## 🎯 Tính năng

### Kiến trúc Modular
- **Module Registry**: Hệ thống đăng ký module tự động
- **Routing động**: Routes được tự động tạo từ các module
- **Hot Module Replacement**: Hỗ trợ HMR sẵn sàng
- **Tách biệt module**: Mỗi module độc lập, dễ bảo trì

### UI & Theme
- **Dark/Light Mode**: Chuyển đổi theme liền mạch
- **System Preference**: Tự động theo theme hệ thống
- **Responsive Design**: Tối ưu cho mobile và desktop
- **Tailwind CSS**: UI components hiện đại

### Components
- **Layout**: AppLayout với sidebar và navigation
- **UI Components**: Button, Card, Input, Switch, Label
- **Theme Provider**: Quản lý theme toàn cục

## 📦 Cấu trúc thư mục

```
/
├── App.tsx                      # Entry point
├── core/
│   └── ModuleRegistry.tsx       # Hệ thống đăng ký module
├── providers/
│   └── ThemeProvider.tsx        # Theme provider
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx        # Layout chính
│   └── ui/                      # UI components
├── modules/
│   ├── dashboard/               # Module Dashboard
│   │   ├── index.tsx
│   │   └── DashboardPage.tsx
│   ├── auth/                    # Module Auth
│   │   ├── index.tsx
│   │   └── LoginPage.tsx
│   └── settings/                # Module Settings
│       ├── index.tsx
│       └── SettingsPage.tsx
└── styles/
    └── globals.css              # Global styles
```

## 🚀 Sử dụng

### Tạo Module mới

1. **Tạo thư mục module**:
```bash
mkdir -p modules/my-module
```

2. **Tạo file định nghĩa module** (`modules/my-module/index.tsx`):
```tsx
import { ModuleDefinition } from "../../core/ModuleRegistry";
import { MyPage } from "./MyPage";
import { Package } from "lucide-react";

export const MyModule: ModuleDefinition = {
  id: "my-module",
  name: "My Module",
  description: "Mô tả module",
  icon: <Package className="w-5 h-5" />,
  routes: [
    {
      path: "/my-module",
      element: <MyPage />,
      title: "My Module",
    },
  ],
  enabled: true,
};
```

3. **Tạo component page** (`modules/my-module/MyPage.tsx`):
```tsx
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export function MyPage() {
  return (
    <div className="space-y-6">
      <h1>My Module Page</h1>
      <Card className="p-6">
        <p>Nội dung của module...</p>
      </Card>
    </div>
  );
}
```

4. **Đăng ký module** trong `App.tsx`:
```tsx
import { MyModule } from "./modules/my-module";

// Trong useEffect:
registry.register(MyModule);
```

### Sử dụng Theme

```tsx
import { useTheme } from "./providers/ThemeProvider";

function MyComponent() {
  const { theme, setTheme, actualTheme } = useTheme();
  
  return (
    <div>
      <p>Theme hiện tại: {theme}</p>
      <p>Theme đang áp dụng: {actualTheme}</p>
      <button onClick={() => setTheme("dark")}>Dark Mode</button>
      <button onClick={() => setTheme("light")}>Light Mode</button>
      <button onClick={() => setTheme("system")}>System</button>
    </div>
  );
}
```

### Sử dụng Module Registry

```tsx
import { ModuleRegistry } from "./core/ModuleRegistry";

const registry = ModuleRegistry.getInstance();

// Đăng ký module
registry.register(MyModule);

// Lấy tất cả modules
const allModules = registry.getAllModules();

// Lấy modules đã kích hoạt
const enabledModules = registry.getEnabledModules();

// Lấy tất cả routes
const routes = registry.getAllRoutes();

// Bật/tắt module
registry.setModuleEnabled("module-id", false);

// Lấy một module cụ thể
const module = registry.getModule("module-id");
```

## 🎨 Tùy chỉnh Theme

Theme được định nghĩa trong `/styles/globals.css` sử dụng CSS variables:

```css
:root {
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
  --primary: #030213;
  /* ... */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... */
}
```

## 📱 Responsive Design

AppLayout tự động responsive:
- **Mobile**: Sidebar ẩn, có nút toggle
- **Desktop**: Sidebar luôn hiển thị
- Breakpoint: `lg` (1024px)

## 🔐 Protected Routes

Để tạo route yêu cầu xác thực:

```tsx
routes: [
  {
    path: "/admin",
    element: <AdminPage />,
    title: "Admin",
    requiresAuth: true, // Đánh dấu cần auth
  },
]
```

## 🧩 Module Definition

Interface cho module:

```tsx
interface ModuleDefinition {
  id: string;              // ID duy nhất
  name: string;            // Tên hiển thị
  description?: string;    // Mô tả
  icon?: ReactNode;        // Icon (lucide-react)
  routes: RouteDefinition[]; // Danh sách routes
  reducer?: any;           // Redux reducer (nếu có)
  enabled?: boolean;       // Bật/tắt (mặc định true)
}

interface RouteDefinition {
  path: string;            // URL path
  element: ReactNode;      // Component
  title?: string;          // Tiêu đề
  requiresAuth?: boolean;  // Yêu cầu auth
}
```

## 🎯 Best Practices

### 1. Tổ chức Module
- Mỗi module nên độc lập
- Đặt tên rõ ràng, dễ hiểu
- Tách logic ra hooks riêng
- Tái sử dụng components

### 2. Styling
- Sử dụng Tailwind utilities
- Tránh inline styles
- Sử dụng dark mode variants: `dark:bg-gray-900`
- Responsive: `md:flex-row`, `lg:grid-cols-3`

### 3. Performance
- Lazy load modules khi cần
- Sử dụng React.memo cho components lớn
- Tránh re-render không cần thiết

### 4. Code Quality
- TypeScript strict mode
- Định nghĩa interfaces rõ ràng
- Comment cho các phần phức tạp
- Xử lý lỗi đầy đủ

## 📚 Tham khảo

- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [VHV Platform Framework](https://github.com/vhvplatform/react-framework)

## 🤝 Đóng góp

1. Tạo module mới theo cấu trúc
2. Test kỹ trước khi merge
3. Viết documentation
4. Follow coding standards

## 📄 License

MIT License
