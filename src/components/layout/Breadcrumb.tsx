import { useLocation, Link } from "react-router";
import { Home, ChevronRight } from "lucide-react";
import { useLanguage } from "../../providers/LanguageProvider";
import { generateBreadcrumbs } from "../../lib/breadcrumb-simple";

/**
 * Breadcrumb Navigation - Simple 2-level structure
 * 
 * Features:
 * - Home > Current Page
 * - Clean, simple navigation
 * - i18n support
 * - Always visible
 */
export const Breadcrumb = () => {
  const location = useLocation();
  const { t } = useLanguage();

  // Generate breadcrumbs from current path
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isFirst = index === 0;

        return (
          <div key={item.path} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
            )}
            
            {isLast ? (
              <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                {isFirst && <Home className="w-4 h-4" />}
                {item.translationKey ? t(item.translationKey) : item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5 hover:underline"
              >
                {isFirst && <Home className="w-4 h-4" />}
                {item.translationKey ? t(item.translationKey) : item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

Breadcrumb.displayName = "Breadcrumb";