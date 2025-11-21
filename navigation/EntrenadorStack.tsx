import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { EntrenadorStackParamList } from "./types";

// Importa aquí tus pantallas de entrenador
// Ajusta las rutas según donde muevas los archivos finalmente
// import CoachDashboard from "../views/entrenador/CoachDashboard"; 
// import CoachReports from "../views/entrenador/CoachReports";
// import AdminCreateTest from "../views/entrenador/AdminCreateTest"; 

const Stack = createNativeStackNavigator<EntrenadorStackParamList>();

export default function EntrenadorStack() {
//   return (
//     <Stack.Navigator 
//       initialRouteName="Dashboard"
//       screenOptions={{
//         headerShown: true, // Generalmente en dashboard sí queremos header
//         headerStyle: { backgroundColor: '#F5F5F7' },
//         headerShadowVisible: false,
//         headerTitleStyle: { fontWeight: 'bold' }
//       }}
//     >
//       <Stack.Screen 
//         name="Dashboard" 
//         component={CoachDashboard} 
//         options={{ title: 'Panel de Entrenador' }} 
//       />
      
//       <Stack.Screen 
//         name="CoachReports" 
//         component={CoachReports} 
//         options={{ title: 'Reportes de Atletas' }} 
//       />

//       {/* Agrega aquí las otras pantallas como AdminCreateTest */}
//       {/* <Stack.Screen 
//         name="AdminCreateTest" 
//         component={AdminCreateTest} 
//         options={{ title: 'Crear Nueva Prueba' }} 
//       /> 
//       */}

//     </Stack.Navigator>
//   );
}