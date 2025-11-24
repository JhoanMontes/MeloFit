import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import "./global.css";

// 1. Importamos el Contexto (El "Cerebro" que guarda el estado)
import { AuthProvider, useAuth } from "./context/AuthContext";

// 2. Importamos los 3 Stacks (Los grupos de pantallas)
import AuthStack from "./navigation/AuthStack";
import AprendizStack from "./navigation/AprendizStack";
import EntrenadorStack from "./navigation/EntrenadorStack";

// 3. Componente Navegador que "escucha" los cambios
const AppNavigator = () => {
  const { role } = useAuth(); // Hook que nos dice: 'guest', 'aprendiz' o 'entrenador'

  return (
    <NavigationContainer>
      {/* 4. RENDERIZADO CONDICIONAL */}
      {/* Si es invitado, muestra Login/Registro */}
      {role === 'guest' && <AuthStack />}
      
      {/* Si es aprendiz, muestra SOLO el Dashboard de Atleta */}
      {role === 'aprendiz' && <AprendizStack />}
      
      {/* Si es entrenador, muestra SOLO el Dashboard de Entrenador */}
      {/* {role === 'entrenador' && <EntrenadorStack />} */}
    </NavigationContainer>
  );
};

// 5. App Principal envuelta en el Proveedor
export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}