/**
 * Security Section Component
 * Password, 2FA, and session management
 */

import { Lock } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function SecuritySection() {
  const sessions = [
    {
      device: "Windows - Chrome",
      location: "Ho Chi Minh City, Vietnam",
      time: "Hiện tại",
      isActive: true,
    },
    {
      device: "iPhone - Safari",
      location: "Ho Chi Minh City, Vietnam",
      time: "2 giờ trước",
      isActive: false,
    },
  ];

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">Bảo mật</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý mật khẩu và cài đặt bảo mật
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <h3 className="font-semibold mb-6">Thay đổi mật khẩu</h3>
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Mật khẩu hiện tại</label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Mật khẩu mới</label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Xác nhận mật khẩu mới</label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full sm:w-auto">Cập nhật mật khẩu</Button>
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <h3 className="font-semibold mb-4">Xác thực hai yếu tố (2FA)</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Tăng cường bảo mật tài khoản bằng xác thực hai yếu tố
        </p>
        <Button variant="outline">
          <Lock className="w-4 h-4 mr-2" />
          Kích hoạt 2FA
        </Button>
      </Card>

      <Card className="p-6 sm:p-8">
        <h3 className="font-semibold mb-4">Phiên đăng nhập</h3>
        <div className="space-y-3">
          {sessions.map((session, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-sm">{session.device}</p>
                <p className="text-sm text-muted-foreground">
                  {session.location} • {session.time}
                </p>
              </div>
              {session.isActive ? (
                <span className="text-xs text-green-600 font-medium">Hoạt động</span>
              ) : (
                <Button variant="ghost" size="sm">
                  Đăng xuất
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
