// navigation/types.ts

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  RegistrationStep1: undefined;
  RegistrationStep2: undefined;
};

// Actualizamos las rutas del Aprendiz con lo que pide tu diseño
export type AprendizStackParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  Profile: undefined;
  LogResult: undefined;
  Stats: undefined;
  MisPruebas: undefined;
};

export type EntrenadorStackParamList = {
  Dashboard: undefined;
  ManageAthletes: undefined;
  CoachReports: undefined;
};