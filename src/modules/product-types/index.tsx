import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Package } from "lucide-react";

/**
 * Lazy load Product Types pages
 * ✅ CREATED 2026-01-15: Module definition for Product Types
 */
const ProductTypesPage = lazy(() => import("../../pages/ProductTypesPage"));
const ProductTypeDetailPage = lazy(() => import("../../pages/ProductTypeDetailPage"));
const AddProductTypePage = lazy(() => import("../../pages/AddProductTypePage"));
const EditProductTypePage = lazy(() => import("../../pages/EditProductTypePage"));

/**
 * Product Types Module
 * 
 * 🌐 Path: /commerce/product-types
 */
export const ProductTypesModule: ModuleDefinition = {
  id: "product-types",
  name: "Product Types",
  description: "Quản lý loại sản phẩm",
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