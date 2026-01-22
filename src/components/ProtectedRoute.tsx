import { Navigate } from 'react-router';
import { useAuthContext } from '../providers/AuthProvider';
import { LoadingFallback } from './LoadingFallback';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route Component
 * 
 * Wrapper component that requires authentication.
 * Redirects to /login if user is not authenticated.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return <LoadingFallback message="Đang kiểm tra xác thực..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}