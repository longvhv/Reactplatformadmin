import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { FolderTree, Layers, MapPin } from "lucide-react";

/**
 * Lazy-load System Category Pages
 */
const SystemCategoriesPage = lazy(() => 
  import("../../pages/SystemCategoriesPage")
);

const AddSystemCategoryPage = lazy(() => 
  import("../../pages/AddSystemCategoryPage")
);

const EditSystemCategoryPage = lazy(() => 
  import("../../pages/EditSystemCategoryPage")
);

const RegionsPage = lazy(() => 
  import("../../pages/RegionsPage")
);

const AddRegionPage = lazy(() => 
  import("../../pages/AddRegionPage")
);

const EditRegionPage = lazy(() => 
  import("../../pages/EditRegionPage")
);

/**
 * System Categories Module
 */
export const SystemCategoryModule: ModuleDefinition = {
  id: "system-categories",
  name: "Danh mục hệ thống",
  description: "Quản lý danh mục và regions",
  icon: <FolderTree className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  routes: [
    {
      path: "/core/system-categories",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải danh mục..." />}>
          <SystemCategoriesPage />
        </Suspense>
      ),
      title: "System Categories",
    },
    {
      path: "/core/system-categories/add",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <AddSystemCategoryPage />
        </Suspense>
      ),
      title: "Add System Category",
    },
    {
      path: "/core/system-categories/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <EditSystemCategoryPage />
        </Suspense>
      ),
      title: "Edit System Category",
    },
    {
      path: "/core/regions",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải regions..." />}>
          <RegionsPage />
        </Suspense>
      ),
      title: "Regions",
    },
    {
      path: "/core/regions/add",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <AddRegionPage />
        </Suspense>
      ),
      title: "Add Region",
    },
    {
      path: "/core/regions/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <EditRegionPage />
        </Suspense>
      ),
      title: "Edit Region",
    },
  ],
  menuItems: [
    {
      id: "system-categories",
      label: "navigation.systemCategories",
      icon: <FolderTree className="w-5 h-5" />,
      path: "/core/system-categories",
    },
  ],
};