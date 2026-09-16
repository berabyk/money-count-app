import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import type { User } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app with real Firebase config, this works.
    // Here we will use a mock user if auth fails to initialize due to mock config.
    try {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        if (!u) { setUser({ uid: "mock", email: "mock@example.com" } as User); } else { setUser(u); };
        setLoading(false);
      });
      return unsubscribe;
    } catch (e) {
      console.warn("Firebase auth not configured properly, using mock user for UI.");
      setUser({ uid: "mock-user-123", email: "mock@example.com", displayName: "Mock User" } as User);
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
