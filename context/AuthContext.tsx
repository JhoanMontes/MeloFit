import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "../lib/supabase";

type UserRole = "guest" | "aprendiz" | "entrenador"; // Normalicé 'aprendiz' vs 'atleta'

interface AuthContextType {
  role: UserRole;
  user: any | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Agregamos esto para que tus pantallas no den error
  signIn: (role: 'aprendiz' | 'entrenador') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("guest");
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // --- VERIFICAR SESIÓN AL INICIO ---
  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        const role = await fetchUserRole(sessionUser.id);
        setRole(role);
      }
      setLoading(false);
    };
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        const role = await fetchUserRole(newUser.id);
        setRole(role);
      } else {
        setRole("guest");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // --- OBTENER ROL ---
  const fetchUserRole = async (auth_id: string): Promise<UserRole> => {
    const { data, error } = await supabase
      .from("usuario")
      .select("rol")
      .eq("auth_id", auth_id)
      .single();
      
    // Mapeo por si la BD tiene 'atleta' pero la app usa 'aprendiz'
    if (data?.rol === 'atleta') return 'aprendiz'; 
    if (data?.rol) return data.rol as UserRole;
    return "guest";
  };

  // --- LOGIN REAL ---
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      
      // El listener de onAuthStateChange se encargará de actualizar el rol,
      // pero retornamos success para que la UI sepa.
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // --- LOGOUT ---
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole("guest");
  };

  // --- COMPATIBILIDAD: SIGN IN MANUAL ---
  // Esto permite que tu código de RegistrationStep2 funcione sin cambios drásticos
  const signIn = (newRole: 'aprendiz' | 'entrenador') => {
    console.log("Forzando rol local:", newRole);
    setRole(newRole);
  };

  return (
    <AuthContext.Provider
      value={{ role, user, loading, login, logout, signIn }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return ctx;
};