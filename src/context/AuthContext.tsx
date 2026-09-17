import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from 'firebase/auth';
import { auth, isMock } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setMockUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, setMockUser: () => {}, logout: async () => {} });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setMockUser = (mockUser: User | null) => {
    if (mockUser) {
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
    } else {
      localStorage.removeItem('mockUser');
    }
    setUser(mockUser);
  };

  const logout = async () => {
    if (isMock) {
      setMockUser(null);
    } else {
      await signOut(auth);
    }
  };

  useEffect(() => {
    if (isMock) {
      const storedMockUser = localStorage.getItem('mockUser');
      if (storedMockUser) {
        setUser(JSON.parse(storedMockUser) as User);
      } else {
        setUser(null); // Force them to login page
      }
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });
      return unsubscribe;
    } catch (e) {
      console.warn("Firebase auth not configured properly, checking local mock fallback");
      const storedMockUser = localStorage.getItem('mockUser');
      if (storedMockUser) {
        setUser(JSON.parse(storedMockUser) as User);
      } else {
        setUser(null);
      }
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setMockUser, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
