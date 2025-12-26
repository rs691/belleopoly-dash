'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

// Define a user type for the app
export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

// Define the context state
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for development without full Firebase setup
const mockUser: User = {
  uid: 'mock-user-123',
  email: 'admin@monopoly.com',
  displayName: 'Admin User',
  photoURL: 'https://picsum.photos/seed/avatar/100/100',
};

// AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would use onAuthStateChanged
    // For this mock, we'll just set a user after a delay to simulate loading
    const timer = setTimeout(() => {
      // To test the real Firebase flow, you can uncomment the below
      /*
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const formattedUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };
          setUser(formattedUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
      */

      // For mock purposes:
      const storedUser = sessionStorage.getItem('mock-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const signIn = async () => {
    // In a real app, this would be signInWithEmailAndPassword, etc.
    setLoading(true);
    // Mock sign-in
    await new Promise((resolve) => setTimeout(resolve, 500));
    setUser(mockUser);
    sessionStorage.setItem('mock-user', JSON.stringify(mockUser));
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    // Real sign out: await firebaseSignOut(auth);
    // Mock sign-out
    await new Promise((resolve) => setTimeout(resolve, 500));
    setUser(null);
    sessionStorage.removeItem('mock-user');
    setLoading(false);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signOut,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
