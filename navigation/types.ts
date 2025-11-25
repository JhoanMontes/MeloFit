// navigation/types.ts

// --- RUTAS DE AUTENTICACIÓN ---
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  RegistrationStep1: undefined;
  RegistrationStep2: undefined;
};

// --- RUTAS DEL ATLETA (APRENDIZ) ---
export type AprendizStackParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  Profile: undefined;
  LogResult: undefined;
  Stats: undefined;
  MisPruebas: undefined;
};

// --- RUTAS DEL ENTRENADOR ---
export type EntrenadorStackParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  Profile: undefined;      // Perfil del entrenador
  CoachReports: undefined; // Generar reportes
  AdminCreateTest: undefined; // Gestionar pruebas
  SendFeedback: undefined; // Dar feedback a un atleta
  AssignTestStep1: undefined; // Asignar prueba (Paso 1)
};