/**
 * User Sessions Module
 * Module definition for user sessions management
 * 
 * 🌐 Path: /platform/user-sessions
 */

import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Monitor } from "lucide-react";

// Lazy-loaded pages
const UserSessionsPage = lazy(() => import("../../app/(admin)/platform/user-sessions/page"));
const CreateUserSessionPage = lazy(() => import("../../app/(admin)/platform/user-sessions/create/page"));
const EditUserSessionPage = lazy(() => import("../../app/(admin)/platform/user-sessions/edit/[id]/page"));

export const UserSessionsModule: ModuleDefinition = {
  id: "user-sessions",
  name: "User Sessions",
  description: "Monitor and manage active user sessions",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 15, // Security / Access Control group
  icon: <Monitor className="w-4 h-4" />,
  
  routes: [
    {
      path: "/platform/user-sessions",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <UserSessionsPage />
        </Suspense>
      ),
      title: "User Sessions",
    },
    {
      path: "/platform/user-sessions/create",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <CreateUserSessionPage />
        </Suspense>
      ),
      title: "Create User Session",
    },
    {
      path: "/platform/user-sessions/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditUserSessionPage />
        </Suspense>
      ),
      title: "Edit User Session",
    },
  ],
  
  menuItems: [
    {
      id: "user-sessions",
      label: "User Sessions",
      icon: <Monitor className="w-5 h-5" />,
      path: "/platform/user-sessions",
      order: 1,
    },
  ],
};

export default UserSessionsModule;