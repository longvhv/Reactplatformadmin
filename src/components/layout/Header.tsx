import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Menu, X, Search, Bell, User, Settings, LogOut, BookOpen, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/providers/LanguageProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  toggleSidebar?: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex-1" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Hamburger Menu */}
        {toggleSidebar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-9 w-9 px-0 mr-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Logo & Brand */}
        <div className="flex items-center gap-3 mr-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-white font-bold text-base">VH</span>
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-bold text-base text-foreground">VHV Platform</span>
            <span className="text-xs text-muted-foreground">Enterprise Admin</span>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 flex items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('common.search')}
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 px-0">
                <span className="text-xl">
                  {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                ☀️ Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                🌙 Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                💻 System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 px-0 relative">
                <Bell className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                <DropdownMenuItem>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">New user registered</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">System update available</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">New message received</p>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    JD
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block text-sm">John Doe</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('profile.title')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/platform/dev-docs')}>
                <FileCode className="mr-2 h-4 w-4" />
                {t('navigation.devDocs')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                {t('navigation.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => {
                console.log('Logging out...');
                // Add logout logic here
              }}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('navigation.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}