/**
 * User Consents Module
 * Module definition for user consent management
 * 
 * 🌐 Path: /platform/user-consents
 */

import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { FileCheck } from "lucide-react";

// Lazy-loaded pages
const UserConsentsPage = lazy(() => import("../../app/(admin)/platform/user-consents/page").then(m => ({ default: m.default })));
const CreateUserConsentPage = lazy(() => import("../../app/(admin)/platform/user-consents/create/page").then(m => ({ default: m.default })));
const EditUserConsentPage = lazy(() => import("../../app/(admin)/platform/user-consents/edit/[id]/page").then(m => ({ default: m.default })));

export const UserConsentsModule: ModuleDefinition = {
  id: "user-consents",
  name: "User Consents",
  description: "Track user agreements to legal documents",
  version: "1.0.0",
  enabled: true,
  showInSidebar: true,
  order: 91, // Placed near Legal Documents
  icon: <FileCheck className="w-4 h-4" />,
  
  routes: [
    {
      path: "/platform/user-consents",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <UserConsentsPage />
        </Suspense>
      ),
      title: "User Consents",
    },
    {
      path: "/platform/user-consents/create",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <CreateUserConsentPage />
        </Suspense>
      ),
      title: "Create Consent Record",
    },
    {
      path: "/platform/user-consents/edit/:id",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <EditUserConsentPage />
        </Suspense>
      ),
      title: "Edit Consent Record",
    },
  ],
  
  menuItems: [
    {
      id: "user-consents",
      label: "User Consents",
      icon: <FileCheck className="w-5 h-5" />,
      path: "/platform/user-consents",
      order: 1,
    },
  ],
};

export default UserConsentsModule;