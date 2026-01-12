import { useState } from "react";
import {
  Settings,
  Bell,
  Lock,
  Globe,
  Zap,
  Mail,
  Shield,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

/**
 * Settings Page - Application settings
 * 
 * Features:
 * - General settings
 * - Notifications preferences
 * - Security settings
 * - Privacy controls
 */
export function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      desktop: false,
      sms: false,
    },
    privacy: {
      profileVisibility: "public",
      activityStatus: true,
      searchable: true,
    },
    security: {
      twoFactor: false,
      loginAlerts: true,
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const toggleSetting = (category: keyof typeof settings, key: string) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: !settings[category][key as keyof typeof settings[typeof category]],
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Cài đặt</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý tùy chọn và cấu hình ứng dụng
          </p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Check className="w-4 h-4" />
          Lưu thay đổi
        </Button>
      </div>

      {/* Save Success Message */}
      {savedMessage && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success flex items-center gap-2 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <Check className="w-5 h-5" />
          <span>Đã lưu thay đổi thành công!</span>
        </div>
      )}

      {/* General Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Cài đặt chung</h2>
            <p className="text-sm text-muted-foreground">Tùy chỉnh trải nghiệm cơ bản</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Ngôn ngữ</p>
                <p className="text-sm text-muted-foreground">Chọn ngôn ngữ hiển thị</p>
              </div>
            </div>
            <select className="px-4 py-2 rounded-lg bg-background border border-border">
              <option>Tiếng Việt</option>
              <option>English</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Chế độ tiết kiệm</p>
                <p className="text-sm text-muted-foreground">Giảm hiệu ứng và animations</p>
              </div>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors hover:bg-muted/70">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
            </button>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Thông báo</h2>
            <p className="text-sm text-muted-foreground">Quản lý cách bạn nhận thông báo</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { key: "email", icon: Mail, label: "Thông báo Email", desc: "Nhận thông báo qua email" },
            { key: "push", icon: Bell, label: "Thông báo Push", desc: "Nhận thông báo trên thiết bị" },
            { key: "desktop", icon: Zap, label: "Thông báo Desktop", desc: "Thông báo trên màn hình" },
            { key: "sms", icon: Mail, label: "Thông báo SMS", desc: "Nhận tin nhắn SMS" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting("notifications", item.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications[item.key as keyof typeof settings.notifications]
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications[item.key as keyof typeof settings.notifications]
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Bảo mật</h2>
            <p className="text-sm text-muted-foreground">Quản lý cài đặt bảo mật tài khoản</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Xác thực 2 bước</p>
                <p className="text-sm text-muted-foreground">Tăng cường bảo mật với 2FA</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting("security", "twoFactor")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.security.twoFactor ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.security.twoFactor ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Cảnh báo đăng nhập</p>
                <p className="text-sm text-muted-foreground">Thông báo khi có đăng nhập mới</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting("security", "loginAlerts")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.security.loginAlerts ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.security.loginAlerts ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Change Password */}
          <div className="p-4 rounded-xl bg-muted/50 space-y-4">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Đổi mật khẩu</p>
                <p className="text-sm text-muted-foreground">Cập nhật mật khẩu của bạn</p>
              </div>
            </div>
            <div className="space-y-3 pl-8">
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="Mật khẩu hiện tại" />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Input type="password" placeholder="Mật khẩu mới" />
              <Input type="password" placeholder="Xác nhận mật khẩu mới" />
              <Button variant="outline" className="w-full">
                Cập nhật mật khẩu
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Privacy */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Quyền riêng tư</h2>
            <p className="text-sm text-muted-foreground">Kiểm soát thông tin cá nhân</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Trạng thái hoạt động</p>
                <p className="text-sm text-muted-foreground">Hiện trạng thái online/offline</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting("privacy", "activityStatus")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.privacy.activityStatus ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.privacy.activityStatus ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Có thể tìm kiếm</p>
                <p className="text-sm text-muted-foreground">Cho phép người khác tìm thấy bạn</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting("privacy", "searchable")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.privacy.searchable ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.privacy.searchable ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
