/**
 * Profile Sidebar Component
 * Navigation menu for profile sections
 */

import { Card } from "../ui/card";
import { cn } from "../ui/utils";
import { PROFILE_MENU_ITEMS } from "../../constants/profile";

interface ProfileSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function ProfileSidebar({ activeSection, onSectionChange }: ProfileSidebarProps) {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <Card className="p-2">
        <nav className="space-y-1">
          {PROFILE_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", isActive ? "text-primary-foreground" : "")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", isActive ? "text-primary-foreground" : "")}>
                    {item.label}
                  </p>
                  <p className={cn(
                    "text-xs mt-0.5",
                    isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </Card>
    </aside>
  );
}
