import React, { useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Modal, 
  StatusBar 
} from "react-native";
// Importamos librerías profesionales para manejo de pantalla
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
  Bell, 
  User, 
  Users, 
  Plus, 
  FileText, 
  Settings, 
  X, 
  LogOut, 
  ChevronRight,
  ClipboardCheck,
  Clock
} from "lucide-react-native";

import { useAuth } from "../../context/AuthContext";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "Dashboard">;

export default function CoachDashboard({ navigation }: Props) {
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets(); // Para posicionar el FAB correctamente
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Datos de ejemplo
  const pendingResults = [
    { id: 1, athleteName: 'Alex Johnson', test: 'Test de Cooper', result: '2850m', time: '2h' },
    { id: 2, athleteName: 'Maria García', test: 'Sentadilla', result: '90 kg × 8', time: '5h' },
    { id: 3, athleteName: 'David Lee', test: 'Peso Muerto', result: '110 kg × 6', time: '1d' },
    { id: 4, athleteName: 'Sarah Miller', test: 'Carrera 5km', result: '24:30', time: '1d' },
  ];
  const recentResults = pendingResults.slice(0, 3);

  const groups = [
    { name: 'Fuerza Avanzada', members: 12, color: 'bg-indigo-100', iconColor: '#4338ca' },
    { name: 'Principiantes', members: 8, color: 'bg-emerald-100', iconColor: '#059669' },
    { name: 'Resistencia', members: 6, color: 'bg-orange-100', iconColor: '#ea580c' }
  ];

  // --- MODAL DE PERFIL ---
  const ProfileModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showProfileModal}
      onRequestClose={() => setShowProfileModal(false)}
    >
      <View className="flex-1 bg-slate-900/60 justify-end">
        <Pressable className="flex-1" onPress={() => setShowProfileModal(false)} />
        
        <View className="bg-white rounded-t-[40px] p-6 pb-10 shadow-2xl">
          <View className="items-center mb-6">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </View>

          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-slate-900 tracking-tight">Tu Cuenta</Text>
            <Pressable onPress={() => setShowProfileModal(false)} className="p-2 bg-slate-100 rounded-full">
              <X size={20} color="#64748b" />
            </Pressable>
          </View>

          {/* User Info Card */}
          <View className="flex-row items-center bg-slate-50 p-4 rounded-3xl mb-6 border border-slate-100">
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4 border-2 border-white">
              <User size={30} color="#2563EB" />
            </View>
            <View>
              <Text className="text-xl font-bold text-slate-900">Michael Torres</Text>
              <Text className="text-slate-500 font-medium">Head Coach</Text>
            </View>
          </View>

          <View className="space-y-3">
            <Pressable 
                onPress={() => { setShowProfileModal(false); signOut(); }}
                className="w-full bg-red-50 py-4 rounded-2xl flex-row items-center justify-center space-x-2 active:bg-red-100"
            >
                <LogOut size={20} color="#DC2626" />
                <Text className="text-red-600 font-bold text-base">Cerrar Sesión</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ProfileModal />
      
      <SafeAreaView edges={['top']} className="flex-1">
        
        {/* --- HEADER --- */}
        <View className="px-6 pb-4 pt-2">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-0.5">Panel del Entrenador</Text>
              <Text className="text-slate-900 text-2xl font-extrabold tracking-tight">Michael Torres</Text>
            </View>
            <View className="flex-row items-center space-x-3">
              <Pressable 
                onPress={() => navigation.navigate('Notifications')}
                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100 active:bg-slate-50"
              >
                <Bell size={22} color="#334155" />
                {/* Badge de notificación */}
                <View className="absolute top-3 right-3.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              </Pressable>
              
              <Pressable 
                onPress={() => setShowProfileModal(true)}
                className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center border border-blue-100 active:bg-blue-100"
              >
                <User size={22} color="#2563EB" />
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView 
            className="flex-1 px-6" 
            contentContainerStyle={{ paddingBottom: 120 }} // Espacio para el FAB
            showsVerticalScrollIndicator={false}
        >
          
          {/* --- QUICK ACTIONS GRID --- */}
          <View className="flex-row justify-between mb-6">
            {/* Botón Reportes */}
            <Pressable
              onPress={() => navigation.navigate('CoachReports')}
              className="bg-white rounded-[24px] p-5 w-[48%] shadow-sm border border-slate-100 active:scale-95 transition-transform"
            >
              <View className="bg-indigo-50 p-3.5 rounded-2xl self-start mb-4">
                <FileText size={24} color="#4f46e5" />
              </View>
              <Text className="text-slate-900 font-bold text-lg">Reportes</Text>
              <Text className="text-slate-500 text-xs font-medium mt-1">Exportar CSV/PDF</Text>
            </Pressable>

            {/* Botón Gestionar Pruebas */}
           <Pressable
              onPress={() => navigation.navigate('ManageTests')} // <--- CAMBIO AQUÍ
              className="bg-white rounded-2xl p-5 w-[48%] shadow-sm active:bg-gray-50"
            >
              <View className="bg-blue-100 p-3 rounded-xl self-start mb-3">
                <Settings size={22} color="#2563EB" />
              </View>
              <Text className="text-gray-900 font-bold text-base">Pruebas</Text>
              <Text className="text-xs text-gray-500 mt-1">Crear y editar</Text>
            </Pressable>
          </View>

          {/* --- PENDING FEEDBACK --- */}
          <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 mb-6">
            <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center space-x-2">
                    <View className="bg-orange-100 p-1.5 rounded-lg">
                        <ClipboardCheck size={18} color="#ea580c" />
                    </View>
                    <Text className="text-slate-900 text-lg font-bold">Por Revisar</Text>
                </View>
                <Pressable>
                    <Text className="text-blue-600 text-sm font-bold">Ver todo</Text>
                </Pressable>
            </View>

            <View className="space-y-4">
              {recentResults.map((result) => (
                <View key={result.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex-row items-center justify-between">
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-slate-900 font-bold text-base">{result.athleteName}</Text>
                        <View className="flex-row items-center bg-white px-2 py-0.5 rounded-md border border-slate-100">
                            <Clock size={10} color="#94a3b8" />
                            <Text className="text-[10px] text-slate-400 font-bold ml-1">{result.time}</Text>
                        </View>
                    </View>
                    <Text className="text-sm text-slate-600">
                      <Text className="font-semibold text-blue-600">{result.test}</Text> • {result.result}
                    </Text>
                  </View>
                  
                  <Pressable
                    onPress={() => navigation.navigate('SendFeedback')}
                    className="bg-white border border-blue-100 rounded-xl w-10 h-10 items-center justify-center shadow-sm active:bg-blue-50"
                  >
                    <ChevronRight size={20} color="#2563EB" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* --- GROUPS LIST --- */}
          <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-slate-900 text-lg font-bold">Mis Grupos</Text>
              <Pressable>
                 <Plus size={20} color="#64748b" />
              </Pressable>
            </View>
            
            <View className="space-y-3">
              {groups.map((group, index) => (
                <Pressable key={index} className="flex-row items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 active:bg-slate-100">
                  <View className={`${group.color} p-3 rounded-xl mr-4`}>
                    <Users size={20} color={group.iconColor} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 font-bold text-base">{group.name}</Text>
                    <Text className="text-sm text-slate-500 font-medium">{group.members} atletas</Text>
                  </View>
                  <ChevronRight size={18} color="#cbd5e1" />
                </Pressable>
              ))}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* --- FAB (BOTÓN FLOTANTE MEJORADO) --- */}
      {/* Usamos el inset.bottom para subirlo si hay barra de inicio */}
      <Pressable
        onPress={() => navigation.navigate('AssignTestStep1')}
        style={{ bottom: Math.max(insets.bottom, 24) }}
        className="absolute right-6 bg-blue-600 px-6 h-14 rounded-full shadow-lg shadow-blue-600/40 flex-row items-center justify-center space-x-2 active:scale-95"
      >
        <Plus size={24} color="white" strokeWidth={3} />
        <Text className="text-white font-bold text-base ml-1 tracking-wide">Asignar Prueba</Text>
      </Pressable>

    </View>
  );
}