import { ModuleConfig } from "../../core/ModuleRegistry";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "../../components/LoadingFallback";
import { LogIn, UserPlus, Lock, KeyRound, Shield } from "lucide-react";

/**
 * Lazy-load Login Page
 */
const LoginPage = lazy(() => import("./LoginPage").then(m => ({ default: m.default })));

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
  showInSidebar: false, // Hidden from sidebar - auth pages don't need menu
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

export default AuthModule;