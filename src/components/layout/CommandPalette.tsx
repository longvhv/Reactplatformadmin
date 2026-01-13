import React, { useState, useEffect } from "react";
import { Search, X, Command } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useLanguage } from "../../providers/LanguageProvider";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  category: string;
  action: () => void;
  keywords: string[];
}

/**
 * Command Palette Component
 * Quick navigation and search across the application
 */
export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { t } = useLanguage();

  // Mock commands - In production, this would be dynamic
  const allCommands: Command[] = [
    {
      id: "dashboard",
      title: t.navigation.dashboard,
      subtitle: t.dashboard.overview,
      icon: Command,
      category: "Navigation",
      action: () => window.location.href = "/",
      keywords: ["home", "dashboard", "overview"],
    },
    {
      id: "settings",
      title: t.navigation.settings,
      subtitle: t.settings.general,
      icon: Command,
      category: "Navigation",
      action: () => window.location.href = "/settings",
      keywords: ["settings", "preferences", "config"],
    },
  ];

  const recentCommands = allCommands.slice(0, 2);

  const filteredCommands = query
    ? allCommands.filter(cmd =>
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.keywords.some(kw => kw.includes(query.toLowerCase()))
      )
    : recentCommands;

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] animate-in fade-in-0 duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="relative max-w-2xl mx-auto mt-[15vh] px-4">
        <div className="bg-card rounded-2xl shadow-2xl border border-border/40 overflow-hidden animate-in slide-in-from-top-4 duration-300">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border/40">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm hoặc nhập lệnh..."
              className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-muted/50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto">
            {filteredCommands.length > 0 ? (
              <div className="p-2">
                {!query && (
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Gần đây
                  </div>
                )}
                {filteredCommands.map((cmd, index) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                        index === selectedIndex
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        index === selectedIndex
                          ? "bg-primary/20"
                          : "bg-muted/50"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{cmd.title}</div>
                        {cmd.subtitle && (
                          <div className="text-xs text-muted-foreground">{cmd.subtitle}</div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Không tìm thấy kết quả</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 rounded bg-background border border-border/40">↑↓</kbd>
                Di chuyển
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 rounded bg-background border border-border/40">↵</kbd>
                Chọn
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 rounded bg-background border border-border/40">Esc</kbd>
              Đóng
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};