/**
 * Reserved Slugs Module
 * Manage system-wide reserved slugs/keywords
 * 
 * 🌐 Path: /platform/reserved-slugs
 */

import { lazy, Suspense } from 'react';
import { ModuleDefinition } from '../../core/ModuleRegistry';
import { LoadingFallback } from '../../components/LoadingFallback';
import { Shield } from 'lucide-react';

const ReservedSlugsPage = lazy(() => 
  import('../../app/(admin)/platform/reserved-slugs/page').then(m => ({ default: m.default }))
);
const AddReservedSlugPage = lazy(() => 
  import('../../app/(admin)/platform/reserved-slugs/create/page').then(m => ({ default: m.default }))
);
const EditReservedSlugPage = lazy(() => 
  import('../../app/(admin)/platform/reserved-slugs/edit/[id]/page').then(m => ({ default: m.default }))
);
const ReservedSlugDetailPage = lazy(() => 
  import('../../app/(admin)/platform/reserved-slugs/[id]/page').then(m => ({ default: m.default }))
);

export const ReservedSlugsModule: ModuleDefinition = {
  id: "reserved-slugs",
  name: "Reserved Slugs",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 48,
  
  menuItems: [
    {
      id: "reserved-slugs",
      label: "navigation.reservedSlugs",
      path: "/platform/reserved-slugs",
      icon: <Shield className="w-5 h-5" />,
      order: 48,
    },
  ],

  routes: [
    {
      path: "/platform/reserved-slugs",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ReservedSlugsPage />
        </Suspense>
      ),
      title: "Reserved Slugs",
    },
    {
      path: "/platform/reserved-slugs/create",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <AddReservedSlugPage />
        </Suspense>
      ),
      title: "Add Reserved Slug",
    },
    {
      path: "/platform/reserved-slugs/:id/edit",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditReservedSlugPage />
        </Suspense>
      ),
      title: "Edit Reserved Slug",
    },
    {
      path: "/platform/reserved-slugs/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <ReservedSlugDetailPage />
        </Suspense>
      ),
      title: "Reserved Slug Detail",
    },
  ],
};

export default ReservedSlugsModule;