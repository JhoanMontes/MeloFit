// navigation/types.ts

import { Prueba } from "views/entrenador/AssignTestStep1";

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

export type AprendizStackParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  Profile: undefined;
  LogResult: { 
    assignmentId: number; 
    testName: string; 
  };
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
  CreateGroup: undefined;
MyGroups: undefined; 

  AssignTestStep1: { 
    targetGroup?: { codigo: string; nombre: string }; 
  };
  
  AssignTestStep2: { 
    test: Prueba; 
    targetGroup?: { codigo: string; nombre: string }; 
  };

  FeedbackResults: undefined;
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