import { Prueba } from "../views/entrenador/AssignTestStep1"; // Ajusta la ruta si es necesario

// --- AUTH STACK ---
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  RegistrationStep1: undefined;
  RegistrationStep2: {
    nombre_completo: string;
    email: string;
    no_documento: string;
  };
};

// --- APRENDIZ (ATLETA) STACK ---
export type AprendizStackParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  Profile: undefined;
  Stats: undefined;
  MisPruebas: undefined;
  
  // Vistas de Detalle
  LogResult: {
    assignmentId: number;
    testName: string;
  };
  GroupDetail: { 
    grupoCodigo: string; 
    nombreGrupo: string 
  };
  TestDetail: { 
    resultId: number 
  };
};

// --- ENTRENADOR STACK ---
export type EntrenadorStackParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  Profile: undefined;
  CoachReports: undefined;
  ManageTests: undefined;
  AdminCreateTest: undefined;
  CreateGroup: undefined;
  MyGroups: undefined;

  AssignTestStep1: {
    targetGroup?: { codigo: string; nombre: string };
  };

  AssignTestStep2: {
    test: Prueba;
    targetGroup?: { codigo: string; nombre: string };
  };

  AssignmentsOverview: undefined;
  SendFeedback: { result: any } | undefined;

  GroupDetail: { group: any };

  TestAssignmentDetail: {
    assignmentId: number;
    testName: string;
    groupName: string;
    initialTab?: 'pending' | 'completed';
  };

  TestDetail: { test: any };

  AthleteDetail: { athlete: any };
};