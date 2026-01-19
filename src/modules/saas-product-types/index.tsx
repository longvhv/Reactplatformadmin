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

const SaasProductTypesPage = lazy(() => import('../../pages/SaasProductTypesPage'));
const AddSaasProductTypePage = lazy(() => import('../../pages/AddSaasProductTypePage'));
const EditSaasProductTypePage = lazy(() => import('../../pages/EditSaasProductTypePage'));
const SaasProductTypeDetailPage = lazy(() => import('../../pages/SaasProductTypeDetailPage'));

export const SaasProductTypesModule: ModuleDefinition = {
  id: 'saas-product-types',
  name: 'SaaS Product Types',
  description: 'Manage SaaS product type categories',
  icon: Package,
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
      icon: Package,
      path: '/commerce/saas-product-types',
      category: 'Product',
      order: 90,
    },
  ],
};

export default SaasProductTypesModule;
