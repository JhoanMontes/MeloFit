import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AprendizStackParamList } from "./types";
// import Dashboard from "../views/aprendiz/Dashboard"; // Crea este archivo si no existe

const Stack = createNativeStackNavigator<AprendizStackParamList>();

export default function AprendizStack() {
//   return (
//     // <Stack.Navigator>
//     //   <Stack.Screen name="Dashboard" component={Dashboard} options={{ title: 'Hola Atleta' }} />
//     // </Stack.Navigator>
//   );
}