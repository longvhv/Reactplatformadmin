import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Code2, FileText, Database, BookOpen } from "lucide-react";

/**
 * Lazy-load Dev Docs Pages
 */
const DevDocsPage = lazy(() => import("../../app/(admin)/docs/dev/page").then(m => ({ default: m.default })));

const ApiDocsPage = lazy(() => import("../../app/(admin)/docs/api/page").then(m => ({ default: m.default })));

const DatabaseDocsPage = lazy(() => import("../../app/(admin)/docs/database/page").then(m => ({ default: m.default })));

/**
 * Developer Docs Module
 * 
 * 🌐 Path: /system/dev-docs
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
      path: "/system/dev-docs",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải tài liệu..." />}>
          <DevDocsPage />
        </Suspense>
      ),
      title: "Developer Docs",
    },
    {
      path: "/system/dev-docs/api",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải API docs..." />}>
          <ApiDocsPage />
        </Suspense>
      ),
      title: "API Documentation",
    },
    {
      path: "/system/dev-docs/database",
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
      icon: <BookOpen className="w-5 h-5" />,
      path: "/system/dev-docs",
      children: [
        {
          id: "dev-overview",
          label: "navigation.overview",
          icon: <FileText className="w-4 h-4" />,
          path: "/system/dev-docs",
        },
        {
          id: "api-docs",
          label: "api.title",
          icon: <Code2 className="w-4 h-4" />,
          path: "/system/dev-docs/api",
        },
        {
          id: "database-docs",
          label: "database.title",
          icon: <Database className="w-4 h-4" />,
          path: "/system/dev-docs/database",
        },
      ],
    },
  ],
};

export default DevDocsModule;