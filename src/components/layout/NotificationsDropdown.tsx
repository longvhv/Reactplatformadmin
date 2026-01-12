import { memo, useState, useRef, useEffect } from "react";
import { Bell, Check, X, AlertCircle, Info, CheckCircle, Clock, Trash2 } from "lucide-react";
import { Button } from "../ui/button";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationsDropdownProps {
  unreadCount?: number;
}

/**
 * Notifications Dropdown - Inspired by Linear
 * 
 * Features:
 * - Real-time notifications
 * - Mark as read/unread
 * - Delete notifications
 * - Different notification types
 * - Smooth animations
 * - Click outside to close
 */
export const NotificationsDropdown = memo(({ unreadCount = 3 }: NotificationsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "success",
      title: "Triển khai thành công",
      message: "Phiên bản mới đã được deploy lên production",
      timestamp: "5 phút trước",
      read: false,
    },
    {
      id: "2",
      type: "info",
      title: "Cập nhật hệ thống",
      message: "Hệ thống sẽ bảo trì vào 2:00 AM ngày mai",
      timestamp: "1 giờ trước",
      read: false,
    },
    {
      id: "3",
      type: "warning",
      title: "Cảnh báo hiệu năng",
      message: "CPU usage đang cao hơn bình thường",
      timestamp: "2 giờ trước",
      read: false,
    },
    {
      id: "4",
      type: "info",
      title: "Người dùng mới",
      message: "3 người dùng mới đã đăng ký",
      timestamp: "1 ngày trước",
      read: true,
    },
  ]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="hover:scale-105 active:scale-95 transition-transform duration-150 relative group"
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 ${isOpen ? 'animate-shake' : 'group-hover:animate-shake'}`} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-full bg-red-500 text-white border-2 border-background animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden animate-in slide-in-from-top-2 fade-in-0 duration-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Thông báo</h3>
              {unread > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                  {unread} mới
                </span>
              )}
            </div>
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs hover:text-primary"
              >
                <Check className="w-3 h-3 mr-1" />
                Đánh dấu đã đọc
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors duration-150 group ${
                    !notif.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`text-sm font-medium ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {notif.timestamp}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          {!notif.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notif.id)}
                              className="h-6 px-2 text-xs hover:text-primary"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notif.id)}
                            className="h-6 px-2 text-xs hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Không có thông báo</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-border/40 bg-muted/20">
              <Button
                variant="ghost"
                className="w-full text-xs text-primary hover:text-primary/80"
              >
                Xem tất cả thông báo
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

NotificationsDropdown.displayName = "NotificationsDropdown";
