import React from "react";
import { View, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { EntrenadorStackParamList } from "./types";

// Importamos las vistas reales
import CoachDashboard from "../views/entrenador/CoachDashboard";
import AdminCreateTest from "../views/entrenador/AdminCreateTest";
import ManageTests from "../views/entrenador/ManageTests"; 
import CreateGroup from "../views/entrenador/CreateGroup";

// Placeholder
const PlaceholderScreen = ({ route }: any) => (
  <View className="flex-1 justify-center items-center bg-white p-4">
    <Text className="text-xl font-bold text-gray-800 mb-2">Pantalla: {route.name}</Text>
    <Text className="text-gray-500 text-center">En construcción 🚧</Text>
  </View>
);

const Stack = createNativeStackNavigator<EntrenadorStackParamList>();

export default function EntrenadorStack() {
  return (
    <Stack.Navigator 
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Dashboard" component={CoachDashboard} />
      
      {/* Nueva pantalla de lista */}
      <Stack.Screen name="ManageTests" component={ManageTests} />

      {/* Pantalla de formulario (AdminCreateTest) */}
      <Stack.Screen name="AdminCreateTest" component={AdminCreateTest} />
      

       <Stack.Screen name="CreateGroup" component={CreateGroup} />

      <Stack.Screen name="CoachReports" component={PlaceholderScreen} options={{ headerShown: true, title: 'Reportes' }} />
      <Stack.Screen name="SendFeedback" component={PlaceholderScreen} options={{ headerShown: true, title: 'Enviar Feedback' }} />
      <Stack.Screen name="AssignTestStep1" component={PlaceholderScreen} options={{ headerShown: true, title: 'Asignar Prueba' }} />
      <Stack.Screen name="Notifications" component={PlaceholderScreen} options={{ headerShown: true, title: 'Notificaciones' }} />
      <Stack.Screen name="Profile" component={PlaceholderScreen} options={{ headerShown: true, title: 'Perfil' }} />
    </Stack.Navigator>
  );
}