import { createContext, useContext, useState } from 'react';

const AuthContext = createContext<{ user: string | null; login: (username: string, password: string) => boolean; logout: () => void }>({ user: null, login: () => false, logout: () => {} });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);

  const login = (username: string, password: string): boolean => {
    if (username === 'quiranno' && password === 'admin') {
      setUser(username);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};