// navigation/types.ts

// Rutas para views/auth
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  RegistrationStep1: undefined;
  RegistrationStep2: undefined;
};

// Rutas para views/aprendiz
export type AprendizStackParamList = {
  Dashboard: undefined;
  Profile: undefined;
};

// Rutas para views/entrenador
export type EntrenadorStackParamList = {
  Dashboard: undefined;
  ManageAthletes: undefined;
};