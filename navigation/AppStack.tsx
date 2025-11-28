import { useAuth } from "../context/AuthContext";
import AprendizStack from "./AprendizStack";
import EntrenadorStack from "./EntrenadorStack";

export default function AppStack() {
  const { role } = useAuth();

  if (role === "aprendiz") return <AprendizStack />;
  if (role === "entrenador") return <EntrenadorStack />;

  return <AprendizStack />; 
}
