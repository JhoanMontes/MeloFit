// navigation/types.ts

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  RegistrationStep1: undefined;
  RegistrationStep2: undefined;
};

export type AprendizStackParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  Profile: undefined;
  LogResult: undefined;
  Stats: undefined;
  MisPruebas: undefined;
};

// --- RUTAS DEL ENTRENADOR (Actualizado) ---
export type EntrenadorStackParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  Profile: undefined;
  CoachReports: undefined;
  ManageTests: undefined;    
  AdminCreateTest: undefined; 
  SendFeedback: undefined;
  AssignTestStep1: undefined;
};