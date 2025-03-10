'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();

  // Format session user to our AuthUser type
  const formatUser = (sessionUser: any): AuthUser | null => {
    if (!sessionUser) return null;
    
    return {
      id: sessionUser.id || sessionUser.email,
      email: sessionUser.email || '',
      name: sessionUser.name || sessionUser.email?.split('@')[0] || 'User'
    };
  };

  // Update user state when session changes
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setUser(session?.user ? formatUser(session.user) : null);
      
      // Store user in session storage for other components to access
      if (session?.user && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('auth-session', JSON.stringify(session));
        } catch (err) {
          console.error('Failed to store session in sessionStorage:', err);
        }
      }
    }
  }, [session, status]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }
      
      // Success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      successMessage.textContent = 'Successfully logged in!';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);
      
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid login credentials');
      
      // Error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
      errorMessage.textContent = error.message || 'Login failed';
      document.body.appendChild(errorMessage);
      setTimeout(() => errorMessage.remove(), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut({ redirect: false });
      
      // Clear session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth-session');
      }
      
      setUser(null);
      
      // Success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      successMessage.textContent = 'Successfully logged out!';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message || 'Error signing out');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // NextAuth handles new user creation automatically during login
      // with CredentialsProvider, so we just need to call signIn
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }
      
      // Success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      successMessage.textContent = 'Account created successfully!';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 5000);
      
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Error creating account');
      
      // Error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
      errorMessage.textContent = error.message || 'Signup failed';
      document.body.appendChild(errorMessage);
      setTimeout(() => errorMessage.remove(), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    signup
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 