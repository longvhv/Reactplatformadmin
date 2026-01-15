/**
 * Reserved Slugs Module Routes
 * Manage system-wide reserved slugs/keywords
 */

import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const ReservedSlugsPage = lazy(() => import('../../pages/ReservedSlugsPage'));
const AddReservedSlugPage = lazy(() => import('../../pages/AddReservedSlugPage'));
const EditReservedSlugPage = lazy(() => import('../../pages/EditReservedSlugPage'));
const ReservedSlugDetailPage = lazy(() => import('../../pages/ReservedSlugDetailPage'));

export const reservedSlugsRoutes: RouteObject[] = [
  {
    path: 'reserved-slugs',
    children: [
      {
        index: true,
        element: <ReservedSlugsPage />,
      },
      {
        path: 'add',
        element: <AddReservedSlugPage />,
      },
      {
        path: 'edit/:id',
        element: <EditReservedSlugPage />,
      },
      {
        path: ':id',
        element: <ReservedSlugDetailPage />,
      },
    ],
  },
];

export default reservedSlugsRoutes;
