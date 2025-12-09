import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AprendizStackParamList } from "./types";

// Vistas
import Dashboard from "../views/aprendiz/Dashboard";
import MyProfile from "../views/aprendiz/MyProfile";
import Notifications from "../views/aprendiz/Notifications";
import MisPruebas from "../views/aprendiz/MisPruebas";
import StatsScreen from "../views/aprendiz/StatsScreen";
import LogResultScreen from "../views/aprendiz/LogResultScreen";
import GroupDetail from "../views/aprendiz/GroupDetail"; // Asegúrate de crear este archivo

const Stack = createNativeStackNavigator<AprendizStackParamList>();

export default function AprendizStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* Pantalla Principal */}
      <Stack.Screen name="Dashboard" component={Dashboard} />

      {/* Navegación del Footer */}
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="MisPruebas" component={MisPruebas} />
      <Stack.Screen name="Profile" component={MyProfile} />

      {/* Pantallas de Detalle (Drill-down) */}
      <Stack.Screen name="GroupDetail" component={GroupDetail} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="LogResult" component={LogResultScreen} />

    </Stack.Navigator>
  );
}