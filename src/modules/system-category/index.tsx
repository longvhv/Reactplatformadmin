import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { FolderTree, Layers, MapPin } from "lucide-react";

/**
 * Lazy load System Category pages
 */
const SystemCategoriesPage = lazy(() => 
  import("../../pages/SystemCategoriesPage")
);

const AddSystemCategoryPage = lazy(() => 
  import("../../pages/AddSystemCategoryPage").then(module => ({ default: module.AddSystemCategoryPage }))
);

const EditSystemCategoryPage = lazy(() => 
  import("../../pages/EditSystemCategoryPage").then(module => ({ default: module.EditSystemCategoryPage }))
);

const AppComponentsPage = lazy(() => 
  import("../../pages/AppComponentsPage").then(module => ({ default: module.AppComponentsPage }))
);

const AddAppComponentPage = lazy(() => 
  import("../../pages/AddAppComponentPage").then(module => ({ default: module.AddAppComponentPage }))
);

const EditAppComponentPage = lazy(() => 
  import("../../pages/EditAppComponentPage").then(module => ({ default: module.EditAppComponentPage }))
);

const RegionsPage = lazy(() => 
  import("../../pages/RegionsPage").then(module => ({ default: module.RegionsPage }))
);

const AddRegionPage = lazy(() => 
  import("../../pages/AddRegionPage").then(module => ({ default: module.AddRegionPage }))
);

const EditRegionPage = lazy(() => 
  import("../../pages/EditRegionPage").then(module => ({ default: module.EditRegionPage }))
);

/**
 * System Categories Module
 */
export const SystemCategoryModule: ModuleDefinition = {
  id: "system-categories",
  name: "Danh mục hệ thống",
  description: "Quản lý danh mục, components và regions",
  icon: <FolderTree className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  routes: [
    {
      path: "/system-categories",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải danh mục..." />}>
          <SystemCategoriesPage />
        </Suspense>
      ),
      title: "System Categories",
    },
    {
      path: "/system-categories/add",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <AddSystemCategoryPage />
        </Suspense>
      ),
      title: "Add System Category",
    },
    {
      path: "/system-categories/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <EditSystemCategoryPage />
        </Suspense>
      ),
      title: "Edit System Category",
    },
    {
      path: "/app-components",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải components..." />}>
          <AppComponentsPage />
        </Suspense>
      ),
      title: "App Components",
    },
    {
      path: "/app-components/add",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <AddAppComponentPage />
        </Suspense>
      ),
      title: "Add App Component",
    },
    {
      path: "/app-components/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <EditAppComponentPage />
        </Suspense>
      ),
      title: "Edit App Component",
    },
    {
      path: "/regions",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải regions..." />}>
          <RegionsPage />
        </Suspense>
      ),
      title: "Regions",
    },
    {
      path: "/regions/add",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <AddRegionPage />
        </Suspense>
      ),
      title: "Add Region",
    },
    {
      path: "/regions/edit/:id",
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
      path: "/system-categories",
    },
  ],
};