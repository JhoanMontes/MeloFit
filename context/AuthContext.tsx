import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

type Role = "guest" | "aprendiz" | "entrenador";

interface AuthContextProps {
  user: any;
  role: Role;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<Role>("guest");
  const [loading, setLoading] = useState(true);

  // -------------------------
  // CHECK USER SESSION ON START
  // -------------------------
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user || null;

      setUser(sessionUser);

      if (sessionUser) {
        // get role from metadata
        const userRole = sessionUser.user_metadata?.role || "guest";
        setRole(userRole);
      }

      setLoading(false);
    };

    checkSession();
  }, []);

  // -------------------------
  // LOGIN
  // -------------------------
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    setUser(data.user);
    setRole(data.user.user_metadata?.role || "guest");
  };

  // -------------------------
  // REGISTER
  // -------------------------
  const register = async (email: string, password: string, role: Role) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role }, // metadata
      },
    });

    if (error) throw error;

    setUser(data.user);
    setRole(role);
  };

  // -------------------------
  // LOGOUT
  // -------------------------
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole("guest");
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
