import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Code2, FileText, Database } from "lucide-react";

/**
 * Lazy load Dev Docs pages
 */
const DevDocsPage = lazy(() => 
  import("../../pages/DevDocsPage").then(module => ({ default: module.DevDocsPage }))
);

const ApiDocsPage = lazy(() => 
  import("../../pages/ApiDocsPage").then(module => ({ default: module.ApiDocsPage }))
);

const DatabaseDocsPage = lazy(() => 
  import("../../pages/DatabaseDocsPage").then(module => ({ default: module.DatabaseDocsPage }))
);

/**
 * Developer Docs Module
 */
export const DevDocsModule: ModuleDefinition = {
  id: "dev-docs",
  name: "Developer Docs",
  description: "Tài liệu kỹ thuật và API documentation",
  icon: <Code2 className="w-4 h-4" />,
  enabled: true,
  showInSidebar: false, // Hidden from sidebar
  routes: [
    {
      path: "/dev-docs",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải tài liệu..." />}>
          <DevDocsPage />
        </Suspense>
      ),
      title: "Developer Docs",
    },
    {
      path: "/api-docs",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải API docs..." />}>
          <ApiDocsPage />
        </Suspense>
      ),
      title: "API Documentation",
    },
    {
      path: "/database-docs",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải database docs..." />}>
          <DatabaseDocsPage />
        </Suspense>
      ),
      title: "Database Documentation",
    },
  ],
  menuItems: [
    {
      id: "dev-docs",
      label: "navigation.devDocs",
      icon: <Code2 className="w-5 h-5" />,
      children: [
        {
          id: "dev-overview",
          label: "Overview",
          icon: <FileText className="w-4 h-4" />,
          path: "/dev-docs",
        },
        {
          id: "api-docs",
          label: "API Docs",
          icon: <Code2 className="w-4 h-4" />,
          path: "/api-docs",
        },
        {
          id: "database-docs",
          label: "Database",
          icon: <Database className="w-4 h-4" />,
          path: "/database-docs",
        },
      ],
    },
  ],
};