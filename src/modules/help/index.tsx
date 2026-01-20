import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { HelpCircle } from "lucide-react";

/**
 * Lazy-load Help Page
 */
const HelpPage = lazy(() => import("../../app/(admin)/help/page"));

/**
 * Help Module
 * 
 * 🌐 Path: /system/help
 */
export const HelpModule: ModuleDefinition = {
  id: "help",
  name: "Trợ giúp",
  description: "Trung tâm trợ giúp và hỗ trợ",
  icon: <HelpCircle className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  order: 120,
  routes: [
    {
      path: "/system/help",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải trợ giúp..." />}>
          <HelpPage />
        </Suspense>
      ),
      title: "Help",
    },
  ],
  menuItems: [
    {
      id: "help",
      label: "navigation.help",
      icon: <HelpCircle className="w-5 h-5" />,
      path: "/system/help",
    },
  ],
};