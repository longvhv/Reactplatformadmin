/**
 * Root Page - Redirects to login or admin based on auth
 */
'use client';
import { useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { supabase } from '@/utils/supabase/client';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.push('/admin');
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/login');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}