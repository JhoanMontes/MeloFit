// context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'guest' | 'aprendiz' | 'entrenador';

interface AuthContextType {
  role: UserRole;
  signIn: (role: 'aprendiz' | 'entrenador') => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('guest');

  const signIn = (newRole: 'aprendiz' | 'entrenador') => {
    // AQUÍ: Más adelante guardarías el token en AsyncStorage
    setRole(newRole);
  };

  const signOut = () => {
    // AQUÍ: Borrarías el token
    setRole('guest');
  };

  return (
    <AuthContext.Provider value={{ role, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
}