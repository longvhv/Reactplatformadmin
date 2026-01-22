/**
 * User Delegations Module
 * Module definition for user delegation management
 * 
 * 🌐 Path: /platform/user-delegations
 */

import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { UserCog } from "lucide-react";

// Lazy-loaded pages
const UserDelegationsPage = lazy(() => import("../../app/(admin)/platform/user-delegations/page").then(m => ({ default: m.default })));
const CreateUserDelegationPage = lazy(() => import("../../app/(admin)/platform/user-delegations/create/page").then(m => ({ default: m.default })));
const EditUserDelegationPage = lazy(() => import("../../app/(admin)/platform/user-delegations/edit/[id]/page").then(m => ({ default: m.default })));

export const UserDelegationsModule: ModuleDefinition = {
  id: "user-delegations",
  name: "User Delegations",
  description: "Manage authority delegation between users",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 65, // Security / Access Control group
  icon: <UserCog className="w-4 h-4" />,
  
  routes: [
    {
      path: "/platform/user-delegations",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <UserDelegationsPage />
        </Suspense>
      ),
      title: "User Delegations",
    },
    {
      path: "/platform/user-delegations/create",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <CreateUserDelegationPage />
        </Suspense>
      ),
      title: "Create Delegation",
    },
    {
      path: "/platform/user-delegations/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditUserDelegationPage />
        </Suspense>
      ),
      title: "Edit Delegation",
    },
  ],
  
  menuItems: [
    {
      id: "user-delegations",
      label: "User Delegations",
      icon: <UserCog className="w-5 h-5" />,
      path: "/platform/user-delegations",
      order: 1,
    },
  ],
};

export default UserDelegationsModule;