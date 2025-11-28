import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
// import { supabase } from "../lib/supabase"; // COMENTADO: Backend real

// Definimos los roles que espera tu App.tsx
type UserRole = 'guest' | 'aprendiz' | 'entrenador';

interface AuthContextType {
  role: UserRole;
  // user: any; // COMENTADO: Datos reales de usuario
  // loading: boolean; // COMENTADO
  
  // --- FUNCIONES MOCK (Para Diseño) ---
  signIn: (role: 'aprendiz' | 'entrenador') => void;
  signOut: () => void;

  // --- FUNCIONES SUPABASE (COMENTADAS) ---
  // login: (email: string, password: string) => Promise<void>;
  // register: (email: string, password: string, role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('guest');
  // const [user, setUser] = useState<any>(null);
  // const [loading, setLoading] = useState(true);

  // --- MODO DISEÑO: Funciones Simples ---
  const signIn = (newRole: 'aprendiz' | 'entrenador') => {
    console.log("Simulando login como:", newRole);
    setRole(newRole); // ¡Esto dispara la navegación en App.tsx!
  };

  const signOut = () => {
    setRole('guest');
  };

  /* ------------------------------------------------------------
     --- CÓDIGO SUPABASE (GUARDADO PARA LUEGO) ---
     ------------------------------------------------------------
  
  // Verificar sesión al inicio
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user || null;
      setUser(sessionUser);
      
      if (sessionUser) {
        // Obtenemos el rol desde los metadatos del usuario
        const userRole = sessionUser.user_metadata?.role || "guest";
        setRole(userRole);
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser(data.user);
    // Actualizamos el rol basado en la BD
    setRole(data.user.user_metadata?.role || "guest");
  };

  const register = async (email: string, password: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });
    if (error) throw error;
    setUser(data.user);
    setRole(role);
  };
  ------------------------------------------------------------ */

  return (
    // Pasamos solo lo que usamos ahora. Cuando actives Supabase, descomenta user, login, register.
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