import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "./types";

// Importa tus pantallas reales
import WelcomeScreen from "../views/auth/WelcomeScreen";
import LoginScreen from "../views/auth/LoginScreen";
import RegistrationStep1 from "../views/auth/RegistrationStep1";
import RegistrationStep2 from "../views/auth/RegistrationStep2";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegistrationStep1" component={RegistrationStep1} />
      <Stack.Screen name="RegistrationStep2" component={RegistrationStep2} />
    </Stack.Navigator>
  );
}