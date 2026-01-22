/**
 * User Devices Module
 * Module definition for user device management
 * 
 * 🌐 Path: /platform/user-devices
 */

import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { Laptop } from "lucide-react";

// Lazy-loaded pages
const UserDevicesPage = lazy(() => import("../../app/(admin)/platform/user-devices/page"));
const CreateUserDevicePage = lazy(() => import("../../app/(admin)/platform/user-devices/create/page"));
const EditUserDevicePage = lazy(() => import("../../app/(admin)/platform/user-devices/edit/[id]/page"));

export const UserDevicesModule: ModuleDefinition = {
  id: "user-devices",
  name: "User Devices",
  description: "Manage registered user devices",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 16, // Security / Access Control group
  icon: <Laptop className="w-4 h-4" />,
  
  routes: [
    {
      path: "/platform/user-devices",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <UserDevicesPage />
        </Suspense>
      ),
      title: "User Devices",
    },
    {
      path: "/platform/user-devices/create",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <CreateUserDevicePage />
        </Suspense>
      ),
      title: "Register Device",
    },
    {
      path: "/platform/user-devices/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditUserDevicePage />
        </Suspense>
      ),
      title: "Edit Device",
    },
  ],
  
  menuItems: [
    {
      id: "user-devices",
      label: "User Devices",
      icon: <Laptop className="w-5 h-5" />,
      path: "/platform/user-devices",
      order: 1,
    },
  ],
};

export default UserDevicesModule;