import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { CurrentUser, getCurrentUser } from '@/lib/currentUser';
import { getDataClient } from '@/lib/data-client';
import { DataClientFactory } from '@/lib/data-client/DataClientFactory';

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

  // Initialize DataClient configuration
  useEffect(() => {
    try {
      // Ensure factory is configured from environment if not already
      if (!DataClientFactory.getConfig()) {
        // @ts-ignore - Accessing private static method via any or we can expose it. 
        // Actually, DataClientFactory doesn't expose getDefaultConfig publicly in the interface I read.
        // But we can check process.env here or rely on the Factory's internals if we modified it.
        // Let's assume we need to configure it.
        const type = process.env.NEXT_PUBLIC_DATA_SOURCE === 'golang-api' ? 'golang-api' : 'supabase';
        if (type === 'golang-api') {
             DataClientFactory.configure({
                type: 'golang-api',
                golangApi: {
                    baseUrl: process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:8080/api/v1',
                    apiKey: process.env.NEXT_PUBLIC_GOLANG_API_KEY || 'demo-key'
                }
             });
        } else {
             DataClientFactory.configure({
                type: 'supabase',
                supabase: {
                    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
                }
             });
        }
      }
    } catch (e) {
      console.warn("DataClient auto-configuration failed", e);
    }
  }, []);

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
          // Try to get extended profile if possible
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          setLoading(false);
          return;
        }

        // Check if we are using Golang API
        const config = DataClientFactory.getConfig();
        if (config?.type === 'golang-api') {
           const token = localStorage.getItem('vhv-auth-token');
           if (token) {
             const client = getDataClient();
             try {
               // Verify token and get user profile
               // Assuming GET /auth/me returns the user profile
               const userProfile = await client.execute<any>('auth/me');
               setIsAuthenticated(true);
               
               // Map Golang User to CurrentUser interface
               setUser({
                 id: userProfile.id || userProfile._id,
                 email: userProfile.email,
                 aud: 'authenticated',
                 role: userProfile.role || 'user',
                 created_at: userProfile.created_at,
                 updated_at: userProfile.updated_at,
                 app_metadata: {},
                 user_metadata: userProfile.metadata || {},
                 display_name: userProfile.full_name,
                 full_name: userProfile.full_name,
                 avatar_url: userProfile.avatar_url
               } as CurrentUser);
             } catch (err) {
               console.error('Session expired or invalid', err);
               localStorage.removeItem('vhv-auth-token');
               setIsAuthenticated(false);
               setUser(null);
             }
           }
        } else {
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

    // Subscribe to auth changes (Supabase only)
    // For Golang, we rely on state updates in login/logout methods
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const config = DataClientFactory.getConfig();
        if (config?.type === 'golang-api') return; // Ignore Supabase events if in Golang mode

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
      // Check for Golang API config
      const config = DataClientFactory.getConfig();
      if (config?.type === 'golang-api') {
          const client = getDataClient();
          // Execute login
          const response = await client.execute<{ token: string; user: any }>('auth/login', {
             method: 'POST',
             body: { email, password }
          });

          if (response?.token) {
              localStorage.setItem('vhv-auth-token', response.token);
              setIsAuthenticated(true);
              
              // Map user
              const userProfile = response.user;
              setUser({
                 id: userProfile.id || userProfile._id,
                 email: userProfile.email,
                 aud: 'authenticated',
                 role: userProfile.role || 'user',
                 created_at: userProfile.created_at,
                 updated_at: userProfile.updated_at,
                 app_metadata: {},
                 user_metadata: userProfile.metadata || {},
                 display_name: userProfile.full_name,
                 full_name: userProfile.full_name,
                 avatar_url: userProfile.avatar_url
               } as CurrentUser);
               return;
          }
      }

      // Existing Supabase Logic / Bypass Mode
      
      // BYPASS: Skip password check if configured or fallback
      console.log('🔓 Authentication Attempt:', email);
      
      // Check if user profile exists in database
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('_id, email, full_name, avatar_url')
        .eq('email', email)
        .single();

      if (profileError || !userProfile) {
        // If not found in DB, try Supabase Auth Sign In (Real Auth)
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        if (data.user) return; // Supabase auth listener will handle state update
        
        throw new Error('Tài khoản không tồn tại hoặc mật khẩu sai.');
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
      const config = DataClientFactory.getConfig();
      
      if (config?.type === 'golang-api') {
          // Golang Logout
          localStorage.removeItem('vhv-auth-token');
          setIsAuthenticated(false);
          setUser(null);
          return;
      }

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
      localStorage.removeItem('vhv-auth-token');
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
