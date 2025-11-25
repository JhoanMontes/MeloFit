import React from "react";
import { View, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AprendizStackParamList } from "./types";
import Dashboard from "../views/aprendiz/Dashboard";

// Placeholder simple
const PlaceholderScreen = ({ route }: any) => (
  <View className="flex-1 justify-center items-center bg-white">
    <Text className="text-gray-500">En construcción: {route.name}</Text>
  </View>
);

const Stack = createNativeStackNavigator<AprendizStackParamList>();

export default function AprendizStack() {
  // CORRECCIÓN: El return NO debe estar comentado
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={Dashboard} />
      
      <Stack.Screen name="Notifications" component={PlaceholderScreen} options={{ headerShown: true }} />
      <Stack.Screen name="Profile" component={PlaceholderScreen} options={{ headerShown: true }} />
      <Stack.Screen name="LogResult" component={PlaceholderScreen} options={{ headerShown: true }} />
      <Stack.Screen name="Stats" component={PlaceholderScreen} options={{ headerShown: true }} />
      <Stack.Screen name="MisPruebas" component={PlaceholderScreen} options={{ headerShown: true }} />
    </Stack.Navigator>
  );
}