import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

// Contexto
import { AuthProvider, useAuth } from "./context/AuthContext";

// Stacks
import AuthStack from "./navigation/AuthStack";
import AprendizStack from "./navigation/AprendizStack";
import EntrenadorStack from "./navigation/EntrenadorStack";

import { formatDate } from './lib/formatDate'


const AppNavigator = () => {
  const { role } = useAuth(); 

  return (
    <NavigationContainer>
      {/* 1. Si no hay login, muestra AuthStack */}
      {role === 'guest' && <AuthStack />}
      
      {/* 2. Si es aprendiz, muestra AprendizStack */}
      {role === 'atleta' && <AprendizStack />}
      
      {/* 3. CORRECCIÓN: Quitamos los comentarios de aquí para que funcione el entrenador */}
      {role === 'entrenador' && <EntrenadorStack />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
   <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}