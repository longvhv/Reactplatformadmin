import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Package } from "lucide-react";

/**
 * Lazy load Product Types pages
 * ✅ CREATED 2026-01-15: Module definition for Product Types
 */
const ProductTypesPage = lazy(() => import("../../app/(admin)/product-types/page"));
const ProductTypeDetailPage = lazy(() => 
  import("../../app/(admin)/platform/product-types/[id]/page")
);
const AddProductTypePage = lazy(() => 
  import("../../app/(admin)/platform/product-types/create/page")
);
const EditProductTypePage = lazy(() => 
  import("../../app/(admin)/platform/product-types/edit/[id]/page")
);

/**
 * Product Types Module - Quản lý các loại sản phẩm
 * 🌐 Path: /platform/product-types
 */
export const ProductTypesModule: ModuleDefinition = {
  id: "product-types",
  name: "Product Types",
  description: "Quản lý các loại sản phẩm",
  icon: <Package className="w-4 h-4" />,
  enabled: true,
  showInSidebar: false,
  order: 8,
  routes: [
    {
      path: "/commerce/product-types",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải Loại sản phẩm..." />}>
          <ProductTypesPage />
        </Suspense>
      ),
      title: "Product Types",
    },
    {
      path: "/commerce/product-types/create",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <AddProductTypePage />
        </Suspense>
      ),
      title: "Add Product Type",
    },
    {
      path: "/commerce/product-types/:id",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải chi tiết..." />}>
          <ProductTypeDetailPage />
        </Suspense>
      ),
      title: "Product Type Detail",
    },
    {
      path: "/commerce/product-types/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải..." />}>
          <EditProductTypePage />
        </Suspense>
      ),
      title: "Edit Product Type",
    },
  ],
};

export default ProductTypesModule;