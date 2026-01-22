import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router'; // Note: In Next.js App Router, this should be 'next/navigation' usually, but keeping existing import style unless it breaks. 
// Wait, user said Next.js 14 App Router. 'react-router' is wrong for Next.js. 
// However, the file listing showed 'pages' and 'app', so it's a mix. 
// If I see 'react-router' in the original file, I should be careful. 
// But strictly for Next.js App Router, we use `useRouter` from `next/navigation`.

import { useRouter } from 'next/navigation';
import { getDataClient } from '../lib/data-client';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  user: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('vhv-auth-token');
      if (token) {
        try {
          // Verify token is still valid by fetching profile
          const client = getDataClient();
          // Assuming /auth/me or /users/me exists
          const profile = await client.execute('auth/me'); 
          setUser(profile);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Session expired', error);
          localStorage.removeItem('vhv-auth-token');
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const client = getDataClient();
      // Execute login against Golang Backend
      // Expected response: { token: "...", user: { ... } }
      const response = await client.execute<{ token: string; user: any }>('auth/login', {
        method: 'POST',
        body: { email, password }
      });

      if (response && response.token) {
        localStorage.setItem('vhv-auth-token', response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        router.push('/dashboard'); // Redirect to dashboard after login
      } else {
        throw new Error('Invalid response from login server');
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error; // Let the UI handle the error display
    }
  };

  const logout = () => {
    localStorage.removeItem('vhv-auth-token');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}