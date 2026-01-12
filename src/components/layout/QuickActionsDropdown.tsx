import { memo, useState, useRef, useEffect } from "react";
import { Plus, FileText, Users, Settings, Folder, Image, Calendar, Mail, Zap } from "lucide-react";
import { Button } from "../ui/button";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  shortcut?: string;
  action: () => void;
}

/**
 * Quick Actions Dropdown - Inspired by Notion
 * 
 * Features:
 * - Common quick actions
 * - Keyboard shortcuts
 * - Category grouping
 * - Smooth animations
 * - Click outside to close
 */
export const QuickActionsDropdown = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = [
    {
      id: "new-page",
      title: "Tạo trang mới",
      description: "Tạo một trang nội dung mới",
      icon: FileText,
      shortcut: "⌘N",
      action: () => console.log("New page"),
    },
    {
      id: "new-user",
      title: "Thêm người dùng",
      description: "Mời người dùng mới vào hệ thống",
      icon: Users,
      shortcut: "⌘U",
      action: () => console.log("New user"),
    },
    {
      id: "new-project",
      title: "Tạo dự án",
      description: "Khởi tạo dự án mới",
      icon: Folder,
      shortcut: "⌘P",
      action: () => console.log("New project"),
    },
    {
      id: "upload",
      title: "Upload file",
      description: "Tải lên hình ảnh hoặc tài liệu",
      icon: Image,
      action: () => console.log("Upload"),
    },
    {
      id: "calendar",
      title: "Tạo sự kiện",
      description: "Thêm sự kiện vào lịch",
      icon: Calendar,
      action: () => console.log("New event"),
    },
    {
      id: "email",
      title: "Gửi email",
      description: "Soạn email mới",
      icon: Mail,
      shortcut: "⌘E",
      action: () => console.log("New email"),
    },
  ];

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

  const handleAction = (action: QuickAction) => {
    action.action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="hover:scale-105 active:scale-95 transition-all duration-150 gap-2 group bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
        aria-label="Quick actions"
      >
        <Zap className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
        <span className="hidden xl:inline text-sm font-medium">Hành động</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-2rem)] bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden animate-in slide-in-from-top-2 fade-in-0 duration-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/40 bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold">Hành động nhanh</h3>
            </div>
          </div>

          {/* Actions Grid */}
          <div className="p-2 grid gap-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-all duration-150 group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors duration-150">
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-150" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {action.description}
                    </div>
                  </div>
                  {action.shortcut && (
                    <kbd className="px-2 py-1 text-xs rounded bg-muted border border-border/40 text-muted-foreground font-mono">
                      {action.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border/40 bg-muted/20">
            <button className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-primary transition-colors duration-150">
              <Settings className="w-3 h-3" />
              Tùy chỉnh hành động nhanh
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

QuickActionsDropdown.displayName = "QuickActionsDropdown";
