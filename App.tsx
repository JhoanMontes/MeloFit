// App.tsx
import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import './global.css';

// Stacks
import AuthStack from "./navigation/AuthStack";
import AprendizStack from "./navigation/AprendizStack";
import EntrenadorStack from "./navigation/EntrenadorStack";

// Contexto
import { AuthProvider, useAuth } from "./context/AuthContext";

// Componente que decide la navegación
const AppNavigator = () => {
  const { role } = useAuth();

  return (
    <NavigationContainer>
      {role === 'guest' && <AuthStack />}
      {/* {role === 'aprendiz' && <AprendizStack />}
      {role === 'entrenador' && <EntrenadorStack />} */}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}