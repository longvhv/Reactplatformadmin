'use client';

import { useRouter } from './shim/next-navigation';
import { useEffect } from 'react';
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
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return <LoadingFallback message="Đang kiểm tra xác thực..." />;
  }

  if (!isAuthenticated) {
    return null; // Don't render children while redirecting
  }

  return <>{children}</>;
}
