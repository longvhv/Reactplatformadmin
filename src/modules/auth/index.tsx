import { ModuleConfig } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { LogIn, UserPlus, Lock, KeyRound, Shield } from "lucide-react";

/**
 * Lazy load Login page component
 */
const LoginPage = lazy(() => 
  import("./LoginPage").then(module => ({ default: module.LoginPage }))
);

/**
 * Auth Module
 * 
 * Module xác thực và đăng nhập
 * Metadata loaded immediately, component lazy loaded
 */
export const AuthModule: ModuleConfig = {
  id: "auth",
  name: "Authentication",
  icon: <Shield className="w-4 h-4" />,
  enabled: true,
  showInSidebar: true, // Show menu items in sidebar
  routes: [
    {
      path: "/login",
      element: (
        <Suspense fallback={<LoadingFallback message="Đang tải trang đăng nhập..." />}>
          <LoginPage />
        </Suspense>
      ),
      title: "Login",
    },
  ],
};