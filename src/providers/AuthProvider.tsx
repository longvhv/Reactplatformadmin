import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { CurrentUser, getCurrentUser } from '@/lib/currentUser';

interface AuthContextType {
  isAuthenticated: boolean;
  user: CurrentUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // BYPASS MODE: Check localStorage first
        const bypassUserId = localStorage.getItem('bypass-auth-user-id');
        const bypassEmail = localStorage.getItem('bypass-auth-email');
        
        if (bypassUserId && bypassEmail) {
          console.log('🔓 BYPASS MODE: Restoring session from localStorage');
          setIsAuthenticated(true);
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          setLoading(false);
          return;
        }

        // Normal Supabase auth check
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setIsAuthenticated(true);
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          setIsAuthenticated(true);
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // BYPASS: Skip password check, just verify user exists in database
      console.log('🔓 BYPASS MODE: Checking if user exists with email:', email);
      
      // Check if user profile exists in database
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('_id, email, full_name, avatar_url')
        .eq('email', email)
        .single();

      if (profileError || !userProfile) {
        throw new Error('Tài khoản không tồn tại trong hệ thống. Email: ' + email);
      }

      console.log('✅ User found in database:', userProfile);

      // Create a mock session by setting authenticated state
      // We'll use localStorage to persist the "session"
      localStorage.setItem('bypass-auth-user-id', userProfile._id);
      localStorage.setItem('bypass-auth-email', email);
      
      setIsAuthenticated(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      console.log('✅ Login successful (bypass mode)');
    } catch (error: any) {
      console.error('Error in login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      
      // Clear bypass mode localStorage
      localStorage.removeItem('bypass-auth-user-id');
      localStorage.removeItem('bypass-auth-email');
      
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error in logout:', error);
      
      // Still clear local state and localStorage even if API call fails
      localStorage.removeItem('bypass-auth-user-id');
      localStorage.removeItem('bypass-auth-email');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}