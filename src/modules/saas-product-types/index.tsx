/**
 * SaaS Product Types Module
 * Module definition for product type management
 * 
 * 🌐 Path: /commerce/saas-product-types
 */

import { lazy, Suspense } from 'react';
import { Package } from 'lucide-react';
import { ModuleDefinition } from '../../core/types';
import { LoadingFallback } from '../../components/LoadingFallback';

const SaasProductTypesPage = lazy(() => 
  import('../../app/(admin)/platform/saas-product-types/page').then(m => ({ default: m.default }))
);
const AddSaasProductTypePage = lazy(() => 
  import('../../app/(admin)/platform/saas-product-types/create/page').then(m => ({ default: m.default }))
);
const EditSaasProductTypePage = lazy(() => 
  import('../../app/(admin)/platform/saas-product-types/edit/[id]/page').then(m => ({ default: m.default }))
);
const SaasProductTypeDetailPage = lazy(() => 
  import('../../app/(admin)/platform/saas-product-types/[id]/page').then(m => ({ default: m.default }))
);

export const SaasProductTypesModule: ModuleDefinition = {
  id: 'saas-product-types',
  name: 'SaaS Product Types',
  description: 'Manage SaaS product type categories',
  icon: <Package className="w-4 h-4" />,
  category: 'Product',
  order: 90,

  routes: [
    {
      path: '/commerce/saas-product-types',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SaasProductTypesPage />
        </Suspense>
      ),
      title: 'SaaS Product Types',
      description: 'Manage product type categories',
    },
    {
      path: '/commerce/saas-product-types/add',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddSaasProductTypePage />
        </Suspense>
      ),
      title: 'Add SaaS Product Type',
    },
    {
      path: '/commerce/saas-product-types/edit/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditSaasProductTypePage />
        </Suspense>
      ),
      title: 'Edit SaaS Product Type',
    },
    {
      path: '/commerce/saas-product-types/:id',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <SaasProductTypeDetailPage />
        </Suspense>
      ),
      title: 'SaaS Product Type Details',
    },
  ],

  menuItems: [
    {
      id: 'saas-product-types',
      label: 'saasProductTypes.menu',
      icon: <Package className="w-5 h-5" />,
      path: '/commerce/saas-product-types',
      category: 'Product',
      order: 90,
    },
  ],
};

export default SaasProductTypesModule;