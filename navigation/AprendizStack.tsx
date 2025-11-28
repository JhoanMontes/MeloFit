import React from "react";
import { View, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AprendizStackParamList } from "./types";

// Vistas
import Dashboard from "../views/aprendiz/Dashboard";
import MyProfile from "../views/aprendiz/MyProfile";
import Notifications from "../views/aprendiz/Notifications";
import MisPruebas from "../views/aprendiz/MisPruebas";
import StatsScreen from "../views/aprendiz/StatsScreen";
import LogResultScreen from "../views/aprendiz/LogResultScreen";

// Placeholder
const PlaceholderScreen = ({ route }: any) => (
  <View className="flex-1 justify-center items-center bg-white">
    <Text className="text-gray-500">En construcción: {route.name}</Text>
  </View>
);

const Stack = createNativeStackNavigator<AprendizStackParamList>();

export default function AprendizStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen name="Dashboard" component={Dashboard} />

      {/* Conectamos la pantalla de Perfil */}
      <Stack.Screen
        name="Profile"
        component={MyProfile}
        options={{ headerShown: false }}
      />

      {/* Otras pantallas */}
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="LogResult" component={LogResultScreen} />

      <Stack.Screen name="Stats" component={StatsScreen} />

      <Stack.Screen name="MisPruebas" component={MisPruebas} />

    </Stack.Navigator>
  );
}