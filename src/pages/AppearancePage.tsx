import { useState } from "react";
import { Palette, Sun, Moon, Monitor, Zap, Eye, Layout, Type } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useTheme } from "../providers/ThemeProvider";

/**
 * Appearance Page - Theme and visual customization
 * 
 * Features:
 * - Theme selection (Light/Dark/System)
 * - Color scheme customization
 * - Font size adjustment
 * - Layout preferences
 */
export function AppearancePage() {
  const { theme, setTheme, actualTheme } = useTheme();
  const [fontSize, setFontSize] = useState("medium");
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);

  const themes = [
    {
      id: "light",
      name: "Sáng",
      icon: Sun,
      description: "Giao diện sáng, dễ nhìn ban ngày",
      preview: "from-gray-50 to-gray-100",
    },
    {
      id: "dark",
      name: "Tối",
      icon: Moon,
      description: "Giao diện tối, dễ chịu cho mắt",
      preview: "from-gray-800 to-gray-900",
    },
    {
      id: "system",
      name: "Hệ thống",
      icon: Monitor,
      description: "Theo cài đặt của hệ điều hành",
      preview: "from-blue-500 to-purple-600",
    },
  ];

  const colorSchemes = [
    { name: "Indigo", color: "bg-indigo-500", active: true },
    { name: "Blue", color: "bg-blue-500", active: false },
    { name: "Purple", color: "bg-purple-500", active: false },
    { name: "Green", color: "bg-green-500", active: false },
    { name: "Orange", color: "bg-orange-500", active: false },
    { name: "Red", color: "bg-red-500", active: false },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Giao diện</h1>
        <p className="text-muted-foreground mt-1">
          Tùy chỉnh giao diện và trải nghiệm hiển thị
        </p>
      </div>

      {/* Theme Selection */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Chế độ hiển thị</h2>
            <p className="text-sm text-muted-foreground">Chọn theme phù hợp với bạn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isActive = theme === themeOption.id;

            return (
              <button
                key={themeOption.id}
                onClick={() => setTheme(themeOption.id as "light" | "dark" | "system")}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-border/60 hover:bg-muted/50"
                }`}
              >
                {/* Preview */}
                <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${themeOption.preview} mb-4 flex items-center justify-center relative overflow-hidden`}>
                  <Icon className="w-8 h-8 text-white/90 z-10" />
                  {isActive && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <h3 className="font-semibold mb-1">{themeOption.name}</h3>
                <p className="text-sm text-muted-foreground">{themeOption.description}</p>
              </button>
            );
          })}
        </div>

        {/* Current Theme Info */}
        <div className="mt-4 p-4 rounded-xl bg-muted/50 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <p className="text-sm">
            <span className="text-muted-foreground">Theme hiện tại: </span>
            <span className="font-medium capitalize">{theme}</span>
            {theme === "system" && (
              <span className="text-muted-foreground"> (đang dùng {actualTheme})</span>
            )}
          </p>
        </div>
      </Card>

      {/* Color Scheme */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Màu chủ đạo</h2>
            <p className="text-sm text-muted-foreground">Chọn bảng màu cho ứng dụng</p>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {colorSchemes.map((scheme) => (
            <button
              key={scheme.name}
              className={`group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                scheme.active
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-border/60 hover:bg-muted/50"
              }`}
            >
              <div className={`w-12 h-12 rounded-full ${scheme.color} shadow-lg group-hover:scale-110 transition-transform duration-200 ${scheme.active ? 'ring-2 ring-primary ring-offset-2' : ''}`} />
              <span className="text-xs font-medium">{scheme.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Display Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Cài đặt hiển thị</h2>
            <p className="text-sm text-muted-foreground">Tùy chỉnh kích thước và hiệu ứng</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Font Size */}
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3 mb-4">
              <Type className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Kích thước chữ</p>
                <p className="text-sm text-muted-foreground">Điều chỉnh kích thước văn bản</p>
              </div>
            </div>
            <div className="flex gap-2">
              {["small", "medium", "large"].map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all duration-200 ${
                    fontSize === size
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:border-border/60 hover:bg-background"
                  }`}
                >
                  <span className={size === "small" ? "text-sm" : size === "large" ? "text-lg" : ""}>
                    {size === "small" ? "Nhỏ" : size === "medium" ? "Vừa" : "Lớn"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <Layout className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Chế độ thu gọn</p>
                <p className="text-sm text-muted-foreground">Giảm khoảng cách và padding</p>
              </div>
            </div>
            <button
              onClick={() => setCompactMode(!compactMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                compactMode ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  compactMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Hiệu ứng chuyển động</p>
                <p className="text-sm text-muted-foreground">Bật/tắt animations và transitions</p>
              </div>
            </div>
            <button
              onClick={() => setAnimations(!animations)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                animations ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  animations ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Xem trước</h2>
            <p className="text-sm text-muted-foreground">Xem giao diện với cài đặt hiện tại</p>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-muted/50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Ví dụ Card Component</h3>
              <p className="text-sm text-muted-foreground">Đây là mẫu component với theme hiện tại</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button>Primary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
