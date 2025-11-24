import React from "react";
import { View, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AprendizStackParamList } from "./types";

// Importa tu Dashboard real
import Dashboard from "../views/aprendiz/Dashboard";

// --- PLACEHOLDERS ---
// (Componentes temporales para que no crashee la app al navegar)
const PlaceholderScreen = ({ route }: any) => (
  <View className="flex-1 justify-center items-center bg-white">
    <Text className="text-lg font-bold text-gray-500">Pantalla: {route.name}</Text>
    <Text className="text-gray-400">En construcción 🚧</Text>
  </View>
);

const Stack = createNativeStackNavigator<AprendizStackParamList>();

export default function AprendizStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* PANTALLA PRINCIPAL */}
      <Stack.Screen name="Dashboard" component={Dashboard} />

      {/* PANTALLAS SECUNDARIAS (Usa placeholders por ahora) */}
      <Stack.Screen name="Notifications" component={PlaceholderScreen} options={{ headerShown: true, title: 'Notificaciones' }} />
      <Stack.Screen name="Profile" component={PlaceholderScreen} options={{ headerShown: true, title: 'Mi Perfil' }} />
      <Stack.Screen name="LogResult" component={PlaceholderScreen} options={{ headerShown: true, title: 'Registrar Resultado' }} />
      <Stack.Screen name="Stats" component={PlaceholderScreen} options={{ headerShown: true, title: 'Estadísticas' }} />
      <Stack.Screen name="MisPruebas" component={PlaceholderScreen} options={{ headerShown: true, title: 'Mis Pruebas' }} />
      
    </Stack.Navigator>
  );
}