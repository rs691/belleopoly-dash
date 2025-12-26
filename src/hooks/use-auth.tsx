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
import { onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword } from 'firebase/auth';

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
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch(e) {
      setLoading(false);
      throw e;
    }
  };

  const signOut = async () => {
    setLoading(true);
    await firebaseSignOut(auth);
    setUser(null);
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
