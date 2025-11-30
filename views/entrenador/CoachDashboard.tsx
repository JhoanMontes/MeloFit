import React, { useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Modal, 
  StatusBar 
} from "react-native";
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
  // 1. USO DE LOGOUT CORRECTO
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Datos Mock
  const pendingResults = [
    { id: 1, athleteName: 'Alex Johnson', test: 'Test de Cooper', result: '2850m', time: '2h' },
    { id: 2, athleteName: 'Maria García', test: 'Sentadilla', result: '90 kg × 8', time: '5h' },
    { id: 3, athleteName: 'David Lee', test: 'Peso Muerto', result: '110 kg × 6', time: '1d' },
    { id: 4, athleteName: 'Sarah Miller', test: 'Carrera 5km', result: '24:30', time: '1d' },
  ];
  const recentResults = pendingResults.slice(0, 3);
  
  const groups = [
    { id: 1, name: 'Fuerza Avanzada', members: 12, color: 'bg-indigo-100', iconColor: '#4338ca' },
    { id: 2, name: 'Principiantes', members: 8, color: 'bg-emerald-100', iconColor: '#059669' },
    { id: 3, name: 'Resistencia', members: 6, color: 'bg-orange-100', iconColor: '#ea580c' }
  ];

  // Componente Modal
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
            <Pressable onPress={() => setShowProfileModal(false)} className="p-2 bg-slate-100 rounded-full active:bg-slate-200">
              <X size={20} color="#64748b" />
            </Pressable>
          </View>

          <Pressable 
            onPress={() => {
              setShowProfileModal(false);
              navigation.navigate("Profile");
            }}
            className="flex-row items-center bg-slate-50 p-4 rounded-3xl mb-6 border border-slate-100 active:bg-slate-100"
          >
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4 border-2 border-white">
              <User size={30} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-slate-900">Michael Torres</Text>
              <Text className="text-slate-500 font-medium">Head Coach</Text>
            </View>
            <ChevronRight size={20} color="#94a3b8" />
          </Pressable>

          {/* FIX ICONO: gap-2 en el padre, sin style en el icono */}
          <Pressable 
            onPress={() => { setShowProfileModal(false); logout(); }} 
            className="w-full bg-red-50 py-4 rounded-2xl flex-row items-center justify-center active:bg-red-100 gap-2"
          >
            <LogOut size={20} color="#DC2626" />
            <Text className="text-red-600 font-bold text-base">Cerrar Sesión</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ProfileModal />
      
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* HEADER */}
        <View className="px-6 pb-4 mt-3 flex-row items-center justify-between">
          <View>
            <Text className="text-slate-500 text-sm font-semibold mb-0.5">Panel del Entrenador</Text>
            <Text className="text-slate-900 text-2xl font-extrabold tracking-tight">Michael Torres</Text>
          </View>
          <View className="flex-row items-center gap-x-3">
            <Pressable 
              onPress={() => navigation.navigate('Notifications')} 
              className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100"
            >
              <Bell size={22} color="#334155" />
              <View className="absolute top-3 right-3.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </Pressable>
            <Pressable 
              onPress={() => setShowProfileModal(true)} 
              className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center border border-blue-100"
            >
              <User size={22} color="#2563EB" />
            </Pressable>
          </View>
        </View>

        <ScrollView 
          className="flex-1 px-6" 
          contentContainerStyle={{ paddingBottom: 140 }} 
          showsVerticalScrollIndicator={false}
        >

          {/* Quick Actions 
              2. FIX ANIMACIÓN: Quitamos scale-95 y transition-transform 
              Usamos active:opacity-60 para feedback visual seguro
          */}
          <View className="flex-row justify-between mb-6">
            <Pressable 
              onPress={() => navigation.navigate('CoachReports')} 
              className="bg-white rounded-[24px] p-5 w-[48%] shadow-sm border border-slate-100 active:opacity-60"
            >
              <View className="bg-indigo-50 p-3.5 rounded-2xl self-start mb-4">
                <FileText size={24} color="#4f46e5" />
              </View>
              <Text className="text-slate-900 font-bold text-lg">Reportes</Text>
              <Text className="text-slate-500 text-xs font-medium mt-1">Exportar CSV/PDF</Text>
            </Pressable>

            <Pressable 
              onPress={() => navigation.navigate('ManageTests')} 
              className="bg-white rounded-[24px] p-5 w-[48%] shadow-sm border border-slate-100 active:opacity-60"
            >
              <View className="bg-blue-100 p-3.5 rounded-2xl self-start mb-4">
                <Settings size={24} color="#2563EB" />
              </View>
              <Text className="text-slate-900 font-bold text-lg">Pruebas</Text>
              <Text className="text-slate-500 text-xs font-medium mt-1">Crear y editar</Text>
            </Pressable>
          </View>

          {/* Pending Feedback */}
          <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 mb-6">
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center gap-x-2">
                <View className="bg-orange-100 p-1.5 rounded-lg">
                  <ClipboardCheck size={18} color="#ea580c" />
                </View>
                <Text className="text-slate-900 text-lg font-bold">Por Revisar</Text>
              </View>
              
              <Pressable onPress={() => navigation.navigate('FeedbackResults')}>
                <Text className="text-blue-600 text-sm font-bold">Ver todo</Text>
              </Pressable>
            </View>
            
            <View className="space-y-4">
              {recentResults.map(r => (
                <View 
                  key={r.id} 
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-slate-900 font-bold text-base">{r.athleteName}</Text>
                      {/* FIX ICONO: gap-1 */}
                      <View className="flex-row items-center bg-white px-2 py-0.5 rounded-md border border-slate-100 gap-1">
                        <Clock size={10} color="#94a3b8" />
                        <Text className="text-[10px] text-slate-400 font-bold">{r.time}</Text>
                      </View>
                    </View>
                    <Text className="text-sm text-slate-600">
                      <Text className="font-semibold text-blue-600">{r.test}</Text> • {r.result}
                    </Text>
                  </View>
                  <Pressable 
                    onPress={() => navigation.navigate('SendFeedback', { result: r })} 
                    className="bg-white border border-blue-100 rounded-xl w-10 h-10 items-center justify-center shadow-sm active:bg-blue-50"
                  >
                    <ChevronRight size={20} color="#2563EB" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* Mis Grupos */}
          <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-slate-900 text-lg font-bold">Mis Grupos</Text>

              {/* FIX ICONO: gap-1 */}
              <Pressable
                onPress={() => navigation.navigate('CreateGroup')}
                className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 active:bg-blue-100 gap-1"
              >
                <Plus size={14} color="#2563EB" strokeWidth={3} />
                <Text className="text-blue-700 text-xs font-bold">Crear</Text>
              </Pressable>
            </View>

            <View className="space-y-3">
              {groups.map((group, index) => (
                <Pressable 
                  key={index}
                  onPress={() => navigation.navigate('GroupDetail', { group })}
                  className="flex-row items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 active:bg-slate-100"
                >
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

      {/* FAB - FIX ANIMACIÓN: Quitamos scale-95 */}
      <Pressable 
        onPress={() => navigation.navigate('AssignTestStep1')} 
        style={{ bottom: Math.max(insets.bottom, 24) }} 
        className="absolute right-6 bg-blue-600 px-6 h-14 rounded-full shadow-lg shadow-blue-600/40 flex-row items-center justify-center active:opacity-90 gap-1"
      >
        <Plus size={24} color="white" strokeWidth={3} />
        <Text className="text-white font-bold text-base tracking-wide">Asignar Prueba</Text>
      </Pressable>

    </View>
  );
}