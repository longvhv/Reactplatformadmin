import { ModuleDefinition } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { FileText } from "lucide-react";

/**
 * Lazy-load Legal Documents Page
 */
const LegalDocumentsPage = lazy(() => 
  import("../../pages/LegalDocumentsPage")
);

/**
 * Legal Documents Module
 * 
 * 🌐 Path: /platform/legal-documents
 */
export const LegalDocumentsModule: ModuleDefinition = {
  id: "legal-documents",
  name: "Legal Documents",
  description: "Quản lý điều khoản sử dụng và chính sách pháp lý",
  icon: <FileText className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true,
  routes: [
    {
      path: "/platform/legal-documents",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải Điều khoản sử dụng..." />}>
          <LegalDocumentsPage />
        </Suspense>
      ),
      title: "Legal Documents",
    },
  ],
  menuItems: [
    {
      id: "legal-documents",
      label: "navigation.legalDocuments",
      icon: <FileText className="w-5 h-5" />,
      path: "/platform/legal-documents",
    },
  ],
};