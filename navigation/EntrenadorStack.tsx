import React from "react";
import { View, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { EntrenadorStackParamList } from "./types";

// Vistas
import CoachDashboard from "../views/entrenador/CoachDashboard";
import AdminCreateTest from "../views/entrenador/AdminCreateTest";
import ManageTests from "../views/entrenador/ManageTests";
import CreateGroup from "../views/entrenador/CreateGroup";
import AssignTestStep1 from "../views/entrenador/AssignTestStep1";
import AssignTestStep2 from "../views/entrenador/AssignTestStep2";
import CoachReports from "../views/entrenador/CoachReports";
import FeedbackResults from "../views/entrenador/FeedbackResults";
import MyGroups from "../views/entrenador/MyGroups";

import Notifications from "../views/aprendiz/Notifications";
import MyProfile from "../views/aprendiz/MyProfile";


import GroupDetail from "../views/entrenador/GroupDetail";

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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      <Stack.Screen name="Dashboard" component={CoachDashboard} />
      <Stack.Screen name="ManageTests" component={ManageTests} />
      <Stack.Screen name="AdminCreateTest" component={AdminCreateTest} />
      <Stack.Screen name="CreateGroup" component={CreateGroup} />
      
      <Stack.Screen name="AssignTestStep1" component={AssignTestStep1} />
      <Stack.Screen name="AssignTestStep2" component={AssignTestStep2} />

      <Stack.Screen name="CoachReports" component={CoachReports} />
        <Stack.Screen name="MyGroups" component={MyGroups} />
 
      <Stack.Screen name="FeedbackResults" component={FeedbackResults} />

      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="Profile" component={MyProfile} options={{ headerShown: false }} />

      <Stack.Screen name="SendFeedback" component={PlaceholderScreen} options={{ headerShown: true, title: 'Enviar Feedback' }} />

       <Stack.Screen name="GroupDetail" component={GroupDetail} />

    </Stack.Navigator>
  );
}