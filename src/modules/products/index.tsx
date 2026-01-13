/**
 * Products Module
 * SaaS Products Management
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { Package } from 'lucide-react';
import { useTranslation } from '../../providers/LanguageProvider';

// Lazy-loaded pages
const ProductsPage = lazy(() => import('../../pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('../../pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const AddProductPage = lazy(() => import('../../pages/AddProductPage').then(m => ({ default: m.AddProductPage })));
const EditProductPage = lazy(() => import('../../pages/EditProductPage').then(m => ({ default: m.EditProductPage })));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

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
      path: "/core/products/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ProductDetailPage />
        </Suspense>
      ),
      title: "products.viewDetails", // Translation key
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