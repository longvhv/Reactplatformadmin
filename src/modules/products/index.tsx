/**
 * Products Module
 * SaaS Products Management
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Package } from 'lucide-react';

// Lazy-loaded pages
const ProductsPage = lazy(() => import('../../pages/ProductsPage'));
const AddProductPage = lazy(() => import('../../pages/AddProductPage'));
const EditProductPage = lazy(() => import('../../pages/EditProductPage'));

// Note: ProductDetailPage is full-screen (defined in App.tsx)

/**
 * Products Module Definition
 * Note: menuItems label and routes title use translation keys that will be resolved at runtime
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
      path: "/core/products",
      icon: <Package className="w-5 h-5" />,
      order: 40,
    },
  ],

  routes: [
    {
      path: "/core/products",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ProductsPage />
        </Suspense>
      ),
      title: "products.title", // Translation key
    },
    {
      path: "/core/products/add",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddProductPage />
        </Suspense>
      ),
      title: "products.addProduct", // Translation key
    },
    {
      path: "/core/products/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditProductPage />
        </Suspense>
      ),
      title: "products.edit", // Translation key
    },
  ],

  initialize: async () => {
    console.log('✅ Products module initialized');
  },

  cleanup: async () => {
    console.log('🧹 Products module cleaned up');
  },
};