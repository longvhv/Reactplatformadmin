import { useState } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Breadcrumb } from "../../components/Breadcrumb";
import { useTheme } from "../../providers/ThemeProvider";
import { Save, User, Bell, Shield, Palette, Check } from "lucide-react";

/**
 * Modern Settings Page
 * 
 * Elegant settings với smooth animations và glassmorphism
 */
export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState("Nguyễn Văn A");
  const [email, setEmail] = useState("user@example.com");
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });

  const handleSave = () => {
    console.log("Lưu cài đặt:", { name, email, notifications, theme });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    {
      id: "profile",
      title: "Thông tin cá nhân",
      description: "Quản lý thông tin tài khoản của bạn",
      icon: User,
      color: "from-blue-500 to-blue-600",
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Họ và tên</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+84 xxx xxx xxx"
              className="focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
          <div className="pt-4 border-t border-border/40">
            <Button variant="outline" className="w-full hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150">
              Đổi ảnh đại diện
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "notifications",
      title: "Thông báo",
      description: "Quản lý cách bạn nhận thông báo",
      icon: Bell,
      color: "from-purple-500 to-purple-600",
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200 group">
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors duration-200">
                Thông báo qua Email
              </p>
              <p className="text-sm text-muted-foreground">
                Nhận thông báo quan trọng qua email
              </p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, email: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200 group">
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors duration-200">
                Push notifications
              </p>
              <p className="text-sm text-muted-foreground">
                Nhận thông báo trực tiếp trên trình duyệt
              </p>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, push: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200 group">
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors duration-200">
                SMS notifications
              </p>
              <p className="text-sm text-muted-foreground">
                Nhận thông báo khẩn cấp qua tin nhắn
              </p>
            </div>
            <Switch
              checked={notifications.sms}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, sms: checked })
              }
            />
          </div>
        </div>
      ),
    },
    {
      id: "security",
      title: "Bảo mật",
      description: "Bảo vệ tài khoản của bạn",
      icon: Shield,
      color: "from-emerald-500 to-emerald-600",
      content: (
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 hover:bg-muted/50"
          >
            Đổi mật khẩu
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 hover:bg-muted/50"
          >
            Kích hoạt xác thực 2 bước
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 hover:bg-muted/50"
          >
            Quản lý thiết bị đã đăng nhập
          </Button>
          <div className="pt-4 border-t border-border/40">
            <Button
              variant="destructive"
              className="w-full hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
            >
              Đăng xuất tất cả thiết bị
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "appearance",
      title: "Giao diện",
      description: "Tùy chỉnh giao diện ứng dụng",
      icon: Palette,
      color: "from-amber-500 to-amber-600",
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base">Chế độ hiển thị</Label>
            <p className="text-sm text-muted-foreground">
              Chọn giao diện sáng, tối hoặc theo hệ thống
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {(["light", "dark", "system"] as const).map((t) => {
              const isActive = theme === t;
              const labels = {
                light: "Sáng",
                dark: "Tối",
                system: "Hệ thống",
              };
              
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`
                    relative p-6 rounded-xl border-2 transition-all duration-200
                    hover:scale-[1.02] active:scale-[0.98]
                    ${
                      isActive
                        ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/20"
                        : "border-border/40 hover:border-border hover:bg-muted/30"
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center shadow-lg shadow-primary/30 animate-in zoom-in-0 duration-300">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className={`w-full h-16 rounded-lg border-2 ${
                      t === "light"
                        ? "bg-white border-gray-200"
                        : t === "dark"
                        ? "bg-gray-900 border-gray-700"
                        : "bg-gradient-to-br from-white to-gray-900 border-gray-400"
                    }`} />
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      isActive ? "text-primary" : "text-foreground"
                    }`}>
                      {labels[t]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <Breadcrumb />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">
              Cài đặt
            </h1>
            <p className="text-muted-foreground">
              Quản lý tài khoản và tùy chọn ứng dụng của bạn
            </p>
          </div>
          <Button
            onClick={handleSave}
            className={`
              bg-gradient-to-r from-primary to-primary/90 
              hover:from-primary/90 hover:to-primary/80 
              shadow-lg hover:shadow-xl 
              transition-all duration-300 
              hover:scale-[1.02] active:scale-[0.98]
              ${saved ? 'shadow-success/20' : 'shadow-primary/20'}
            `}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Đã lưu
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.id}
              className="overflow-hidden border-border/40 hover:shadow-xl transition-all duration-300 group"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="p-6 space-y-6">
                {/* Section Header */}
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold tracking-tight mb-1">
                      {section.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Section Content */}
                <div className="pl-16">
                  {section.content}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
