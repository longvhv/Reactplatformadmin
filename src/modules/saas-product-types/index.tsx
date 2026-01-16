/**
 * SaaS Product Types Module
 * Module definition for product type management
 */

import { lazy, Suspense } from 'react';
import { Package } from 'lucide-react';
import { ModuleDefinition } from '../../core/types';
import { LoadingFallback } from '../../components/LoadingFallback';

const SaasProductTypesPage = lazy(() => import('../../pages/SaasProductTypesPage'));

export const SaasProductTypesModule: ModuleDefinition = {
  id: 'saas-product-types',
  name: 'SaaS Product Types',
  description: 'Manage SaaS product type categories',
  icon: Package,
  category: 'Product',
  order: 90,

  routes: [
    {
      path: '/core/saas-product-types',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SaasProductTypesPage />
        </Suspense>
      ),
      title: 'SaaS Product Types',
      description: 'Manage product type categories',
    },
  ],

  menuItems: [
    {
      id: 'saas-product-types',
      label: 'saasProductTypes.menu',
      icon: Package,
      path: '/core/saas-product-types',
      category: 'Product',
      order: 90,
    },
  ],
};

export default SaasProductTypesModule;
