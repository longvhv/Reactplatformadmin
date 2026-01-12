import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

/**
 * Modern Breadcrumb Component
 * 
 * Elegant breadcrumb navigation với smooth transitions
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs từ path nếu không có items
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm mb-6">
      <Link
        to="/"
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-200 group"
      >
        <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
      </Link>
      
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        
        return (
          <div key={index} className="flex items-center space-x-1">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 hover:underline underline-offset-4"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground font-medium" : "text-muted-foreground"}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/" || pathname === "") {
    return [];
  }

  const paths = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [];
  
  let currentPath = "";
  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    const label = path
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    
    items.push({
      label,
      href: index < paths.length - 1 ? currentPath : undefined,
    });
  });

  return items;
}
