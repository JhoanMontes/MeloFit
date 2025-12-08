import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { EntrenadorStackParamList } from "./types";

// Vistas Principales
import CoachDashboard from "../views/entrenador/CoachDashboard";
import MyGroups from "../views/entrenador/MyGroups";
import ManageTests from "../views/entrenador/ManageTests";
import CoachReports from "../views/entrenador/CoachReports";

// Vistas de Gestión y Creación
import AdminCreateTest from "../views/entrenador/AdminCreateTest";
import CreateGroup from "../views/entrenador/CreateGroup";

// Vistas de Detalles
import GroupDetail from "../views/entrenador/GroupDetail";
import TestDetail from "../views/entrenador/TestDetail";
import AthleteDetail from "../views/entrenador/AthleteDetail";
// IMPORTANTE: Importar la nueva vista
import TestAssignmentDetail from "../views/entrenador/TestAssignmentDetail"; 

// Vistas de Asignación y Feedback
import AssignTestStep1 from "../views/entrenador/AssignTestStep1";
import AssignTestStep2 from "../views/entrenador/AssignTestStep2";
import AssignmentsOverview from "../views/entrenador/AssignmentsOverview";
import SendFeedback from "../views/entrenador/SendFeedback";

// Vistas Compartidas / Perfil
import Notifications from "../views/aprendiz/Notifications";
import MyProfile from "../views/aprendiz/MyProfile";

const Stack = createNativeStackNavigator<EntrenadorStackParamList>();

export default function EntrenadorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* Dashboard Principal */}
      <Stack.Screen name="Dashboard" component={CoachDashboard} />
      
      {/* Gestión de Grupos */}
      <Stack.Screen name="MyGroups" component={MyGroups} />
      <Stack.Screen name="CreateGroup" component={CreateGroup} />
      <Stack.Screen name="GroupDetail" component={GroupDetail} />
      
      {/* Gestión de Pruebas */}
      <Stack.Screen name="ManageTests" component={ManageTests} />
      <Stack.Screen name="AdminCreateTest" component={AdminCreateTest} />
      <Stack.Screen name="TestDetail" component={TestDetail} />
      
      {/* Detalles de Atleta */}
      <Stack.Screen name="AthleteDetail" component={AthleteDetail} />

      {/* AQUÍ ESTABA EL ERROR: Faltaba registrar esta pantalla */}
      <Stack.Screen name="TestAssignmentDetail" component={TestAssignmentDetail} />

      {/* Flujos de Asignación */}
      <Stack.Screen name="AssignTestStep1" component={AssignTestStep1} />
      <Stack.Screen name="AssignTestStep2" component={AssignTestStep2} />

      {/* Reportes y Feedback */}
      <Stack.Screen name="CoachReports" component={CoachReports} />
      <Stack.Screen name="AssignmentsOverview" component={AssignmentsOverview} />
      <Stack.Screen name="SendFeedback" component={SendFeedback} />

      {/* Perfil y Notificaciones */}
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="Profile" component={MyProfile} />

    </Stack.Navigator>
  );
}