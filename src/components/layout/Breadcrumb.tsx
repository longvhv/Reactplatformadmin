import { useLocation, Link } from "react-router";
import { Home, ChevronRight } from "lucide-react";
import { useLanguage } from "../../providers/LanguageProvider";

/**
 * Breadcrumb Navigation - Inspired by GitHub
 * 
 * Features:
 * - Auto-generated from route
 * - Clickable path segments
 * - Home icon
 * - Smooth animations
 */
export const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(x => x);

  if (pathnames.length === 0) {
    return null;
  }

  const formatSegment = (segment: string) => {
    return segment
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const { t } = useLanguage();

  return (
    <nav className="flex items-center gap-2 text-sm animate-in slide-in-from-left-2 duration-300">
      <Link
        to="/"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-150 group"
      >
        <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-150" />
        <span className="hidden sm:inline">{t.navigation.dashboard}</span>
      </Link>

      {pathnames.map((segment, index) => {
        const isLast = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;

        return (
          <div key={to} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            {isLast ? (
              <span className="font-medium text-foreground">
                {formatSegment(segment)}
              </span>
            ) : (
              <Link
                to={to}
                className="text-muted-foreground hover:text-foreground transition-colors duration-150 hover:underline"
              >
                {formatSegment(segment)}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

Breadcrumb.displayName = "Breadcrumb";