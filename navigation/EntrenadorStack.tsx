import React from "react";
import { View, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { EntrenadorStackParamList } from "./types";

// Importamos el Dashboard real
import CoachDashboard from "../views/entrenador/CoachDashboard";

// Placeholder para pantallas en construcción (Evita errores al navegar)
const PlaceholderScreen = ({ route }: any) => (
  <View className="flex-1 justify-center items-center bg-white p-4">
    <Text className="text-xl font-bold text-gray-800 mb-2">Pantalla: {route.name}</Text>
    <Text className="text-gray-500 text-center">
      Esta funcionalidad ({route.name}) está en desarrollo 🚧
    </Text>
  </View>
);

const Stack = createNativeStackNavigator<EntrenadorStackParamList>();

export default function EntrenadorStack() {
  return (
    <Stack.Navigator 
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false }}
    >
      
      {/* Dashboard Principal */}
      <Stack.Screen name="Dashboard" component={CoachDashboard} />

      {/* Pantallas Secundarias con Header visible para poder volver */}
      <Stack.Screen 
        name="CoachReports" 
        component={PlaceholderScreen} 
        options={{ headerShown: true, title: 'Generar Reportes' }} 
      />
      
      <Stack.Screen 
        name="AdminCreateTest" 
        component={PlaceholderScreen} 
        options={{ headerShown: true, title: 'Gestionar Pruebas' }} 
      />
      
      <Stack.Screen 
        name="SendFeedback" 
        component={PlaceholderScreen} 
        options={{ headerShown: true, title: 'Enviar Feedback' }} 
      />
      
      <Stack.Screen 
        name="AssignTestStep1" 
        component={PlaceholderScreen} 
        options={{ headerShown: true, title: 'Asignar Prueba' }} 
      />
      
      <Stack.Screen 
        name="Notifications" 
        component={PlaceholderScreen} 
        options={{ headerShown: true, title: 'Notificaciones' }} 
      />

    </Stack.Navigator>
  );
}