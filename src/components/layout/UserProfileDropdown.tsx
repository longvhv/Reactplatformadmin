import { memo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  User, Settings, HelpCircle, LogOut, ChevronRight, 
  Crown, Shield, Mail, Bell, Palette, Keyboard, Moon, Sun, Monitor, Database, FileCode
} from "lucide-react";
import { Button } from "../ui/button";
import { useLanguage } from "../../providers/LanguageProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuthContext } from "@/providers/AuthProvider";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

interface UserProfileDropdownProps {
  theme: "light" | "dark" | "system";
  onCycleTheme: () => void;
}

/**
 * User Profile Dropdown - Inspired by Vercel & GitHub
 * 
 * Features:
 * - User profile info
 * - Account settings
 * - Theme switcher integration
 * - Quick links
 * - Sign out
 * - Smooth animations
 * - Click outside to close
 */
export const UserProfileDropdown = memo(({ theme, onCycleTheme }: UserProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Get current user data
  const { displayName, initials, avatarUrl, user: currentUser, profile } = useCurrentUser();
  const { logout } = useAuthContext();

  // User role from profile or metadata
  const userRole = profile?.metadata?.role || currentUser?.user_metadata?.role || 'User';
  const userEmail = currentUser?.email || profile?.email || 'user@example.com';

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

  const menuItems = [
    {
      section: "Account",
      items: [
        { icon: Settings, label: t('navigation.settings'), shortcut: "⌘,", action: () => navigate("/system/settings") },
        { icon: Mail, label: "Tin nhắn", badge: "3", action: () => console.log("Messages") },
        { icon: Bell, label: "Thông báo", action: () => console.log("Notifications") },
      ],
    },
    {
      section: "Developer",
      items: [
        { icon: FileCode, label: t('navigation.devDocs'), action: () => navigate("/system/dev-docs") },
      ],
    },
    {
      section: "Preferences",
      items: [
        { icon: Palette, label: t('navigation.appearance'), action: () => navigate("/system/appearance") },
        { icon: Keyboard, label: "Phím tắt", shortcut: "⌘K", action: () => console.log("Shortcuts") },
      ],
    },
    {
      section: "Help",
      items: [
        { icon: HelpCircle, label: t('navigation.help'), action: () => navigate("/system/help") },
        { icon: Shield, label: "Chính sách bảo mật", action: () => console.log("Privacy") },
      ],
    },
  ];

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const ThemeIcon = themeIcons[theme];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Desktop Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="hover:scale-105 active:scale-95 transition-all duration-150 gap-2 hidden sm:flex group"
        aria-label="User menu"
      >
        <Avatar className="w-7 h-7 shadow-sm group-hover:shadow-md transition-shadow duration-200">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xs">
            {initials}
          </AvatarFallback>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-background" />
        </Avatar>
        <span className="text-sm font-medium hidden lg:inline-block">{displayName}</span>
      </Button>

      {/* Mobile Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="sm:hidden hover:scale-105 active:scale-95 transition-transform duration-150"
        aria-label="User menu"
      >
        <Avatar className="w-7 h-7 shadow-sm">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xs">
            {initials}
          </AvatarFallback>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-background" />
        </Avatar>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[300px] max-w-[calc(100vw-2rem)] bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden animate-in slide-in-from-top-2 fade-in-0 duration-200 z-50">
          {/* User Info Header */}
          <div className="px-4 py-4 border-b border-border/40 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 shadow-lg">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white">
                  {initials}
                </AvatarFallback>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-card" />
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">{displayName}</h4>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>
            <div className="mt-3 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2 w-fit">
              <Crown className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-primary">{userRole}</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((section, idx) => (
              <div key={section.section}>
                {idx > 0 && <div className="my-2 border-t border-border/40" />}
                <div className="px-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.action();
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/50 transition-all duration-150 group text-left"
                      >
                        <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-150" />
                        <span className="flex-1 text-sm">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                            {item.badge}
                          </span>
                        )}
                        {item.shortcut && (
                          <kbd className="px-2 py-0.5 text-xs rounded bg-muted border border-border/40 text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Theme Switcher */}
            <div className="mt-2 border-t border-border/40 pt-2">
              <div className="px-2">
                <button
                  onClick={onCycleTheme}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/50 transition-all duration-150 group text-left"
                >
                  <ThemeIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-150" />
                  <span className="flex-1 text-sm">Theme: <span className="capitalize">{theme}</span></span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform duration-150" />
                </button>
              </div>
            </div>

            {/* Sign Out */}
            <div className="mt-2 border-t border-border/40 pt-2">
              <div className="px-2">
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-destructive/10 text-destructive transition-all duration-150 group text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="flex-1 text-sm font-medium">Đăng xuất</span>
                  <kbd className="px-2 py-0.5 text-xs rounded bg-destructive/10 border border-destructive/20 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    ⌘Q
                  </kbd>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

UserProfileDropdown.displayName = "UserProfileDropdown";