/**
 * Products Module
 * SaaS Products Management
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Package } from 'lucide-react';

// Lazy load pages
// ✅ MIGRATED: Import from /app/(admin)/ for single source of truth
const ProductsPage = lazy(() => 
  import('../../app/(admin)/commerce/products/page').then(m => ({ default: m.default }))
);

const AddProductPage = lazy(() => 
  import('../../app/(admin)/commerce/products/create/page').then(m => ({ default: m.default }))
);

const EditProductPage = lazy(() => 
  import('../../app/(admin)/commerce/products/edit/[id]/page').then(m => ({ default: m.default }))
);

const ProductDetailPage = lazy(() =>
  import('../../app/(admin)/commerce/products/[id]/page').then(m => ({ default: m.default }))
);

/**
 * Products Module Definition
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
 * 
 * 🌐 Path: /commerce/products
 */
export const ProductsModule: ModuleDefinition = {
  id: "products",
  name: "Products",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 40,
  
  menuItems: [
    {
      id: "products",
      label: "products.title", // Translation key
      path: "/commerce/products",
      icon: <Package className="w-5 h-5" />,
      order: 40,
    },
  ],

  routes: [
    {
      path: "/commerce/products",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ProductsPage />
        </Suspense>
      ),
      title: "products.title", // Translation key
    },
    {
      path: "/commerce/products/create",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddProductPage />
        </Suspense>
      ),
      title: "products.addProduct", // Translation key
    },
    {
      path: "/commerce/products/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditProductPage />
        </Suspense>
      ),
      title: "products.editProduct", // Translation key
    },
    {
      path: "/commerce/products/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ProductDetailPage />
        </Suspense>
      ),
      title: "products.productDetail", // Translation key
    },
  ],
};

export default ProductsModule;