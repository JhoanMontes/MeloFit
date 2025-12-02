import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "../lib/supabase";

type UserRole = "guest" | "atleta" | "entrenador";

interface AuthContextType {
  role: UserRole;
  user: any | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("guest");
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  /** --------------------------------------------------------------
   *  VERIFICAR SESIÓN AL INICIAR LA APP
   * -------------------------------------------------------------- */
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

    // Monitorear cambios en sesión
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

  /** --------------------------------------------------------------
   *  OBTENER ROL desde la tabla "usuario"
   * -------------------------------------------------------------- */
  const fetchUserRole = async (auth_id: string): Promise<UserRole> => {
    const { data, error } = await supabase
      .from("usuario")
      .select("rol")
      .eq("auth_id", auth_id)
      .single();

    if (error || !data) return "guest";

    return data.rol as UserRole;
  };

  /** --------------------------------------------------------------
   *  LOGIN REAL CON SUPABASE
   * -------------------------------------------------------------- */
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { success: false, error: error.message };

      setUser(data.user);
      const role = await fetchUserRole(data.user.id);
      setRole(role);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  /** --------------------------------------------------------------
   *  LOGOUT
   * -------------------------------------------------------------- */
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole("guest");
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        user,
        loading,
        login,
        logout,
      }}
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
