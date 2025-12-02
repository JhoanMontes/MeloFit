import React, { useState, useEffect } from "react";
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
  Clock,
  ArrowRight
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "Dashboard">;

export default function CoachDashboard({ navigation }: Props) {
  const { logout, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [nombre, setNombre] = useState<String>("Entrenador");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('usuario')       
          .select('nombre_completo')
          .eq('auth_id', user.id)  
          .single();

        if (error) console.log('Error buscando usuario:', error.message);

        if (data) {
          const primerNombre = data.nombre_completo.trim().split(" ")[0];
          setNombre(primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1).toLowerCase()); 
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const pendingResults = [
    { id: 1, athleteName: 'Alex Johnson', test: 'Test de Cooper', result: '2850m', time: '2h' },
    { id: 2, athleteName: 'Maria García', test: 'Sentadilla', result: '90 kg × 8', time: '5h' },
    { id: 3, athleteName: 'David Lee', test: 'Peso Muerto', result: '110 kg × 6', time: '1d' },
    { id: 4, athleteName: 'Sarah Miller', test: 'Carrera 5km', result: '24:30', time: '1d' },
    { id: 5, athleteName: 'Carlos Ruiz', test: 'Flexiones', result: '45 reps', time: '2d' },
  ];
  const recentResults = pendingResults; 
  
  const groups = [
    { name: 'Fuerza Avanzada', members: 12, color: 'bg-indigo-100', iconColor: '#4338ca' },
    { name: 'Principiantes', members: 8, color: 'bg-emerald-100', iconColor: '#059669' },
    { name: 'Resistencia', members: 6, color: 'bg-orange-100', iconColor: '#ea580c' },
    { name: 'Velocidad', members: 10, color: 'bg-blue-100', iconColor: '#2563EB' },
    { name: 'Hipertrofia', members: 15, color: 'bg-purple-100', iconColor: '#9333EA' },
  ];

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
          <View className="items-center mb-6"><View className="w-12 h-1.5 bg-slate-200 rounded-full" /></View>
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-slate-900 tracking-tight">Tu Cuenta</Text>
            <Pressable onPress={() => setShowProfileModal(false)} className="p-2 bg-slate-100 rounded-full active:bg-slate-200">
              <X size={20} color="#64748b" />
            </Pressable>
          </View>
          <Pressable 
            onPress={() => { setShowProfileModal(false); navigation.navigate("Profile"); }}
            className="flex-row items-center bg-slate-50 p-4 rounded-3xl mb-6 border border-slate-100 active:bg-slate-100"
          >
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4 border-2 border-white">
              <User size={30} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-slate-900">{nombre}</Text>
              <Text className="text-slate-500 font-medium">Head Coach</Text>
            </View>
            <ChevronRight size={20} color="#94a3b8" />
          </Pressable>
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
    <View className="flex-1 bg-[#F5F5F7]">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ProfileModal />
      
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* HEADER */}
        <View className="px-6 pb-4 mt-3 flex-row items-center justify-between">
          <View>
            <Text className="text-slate-500 text-sm font-semibold mb-0.5">Panel del Entrenador</Text>
            <Text className="text-slate-900 text-2xl font-extrabold tracking-tight">Hola, {nombre}</Text>
          </View>
          <View className="flex-row items-center gap-x-3">
            <Pressable 
              onPress={() => navigation.navigate('Notifications')} 
              className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100 active:bg-slate-50"
            >
              <Bell size={22} color="#334155" />
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

        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ paddingBottom: 140, paddingTop: 10 }} 
          showsVerticalScrollIndicator={false}
        >

          {/* Quick Actions */}
          <View className="px-6 flex-row justify-between mb-8">
            <Pressable 
              onPress={() => navigation.navigate('CoachReports')} 
              className="bg-white rounded-[24px] p-4 flex-1 mr-3 shadow-sm border border-slate-100 active:opacity-60 flex-row items-center"
            >
              <View className="bg-indigo-50 p-3 rounded-2xl mr-3">
                <FileText size={20} color="#4f46e5" />
              </View>
              <View>
                <Text className="text-slate-900 font-bold text-base">Reportes</Text>
                <Text className="text-slate-400 text-[10px] font-medium">Exportar datos</Text>
              </View>
            </Pressable>

            <Pressable 
              onPress={() => navigation.navigate('ManageTests')} 
              className="bg-white rounded-[24px] p-4 flex-1 ml-3 shadow-sm border border-slate-100 active:opacity-60 flex-row items-center"
            >
              <View className="bg-blue-50 p-3 rounded-2xl mr-3">
                <Settings size={20} color="#2563EB" />
              </View>
              <View>
                <Text className="text-slate-900 font-bold text-base">Pruebas</Text>
                <Text className="text-slate-400 text-[10px] font-medium">Gestionar</Text>
              </View>
            </Pressable>
          </View>

          {/* POR REVISAR */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between px-6 mb-4">
              <View className="flex-row items-center gap-x-2">
                <Text className="text-slate-900 text-lg font-bold">Por Revisar</Text>
                <View className="bg-orange-100 px-2 py-0.5 rounded-full">
                  <Text className="text-orange-700 text-xs font-bold">{pendingResults.length}</Text>
                </View>
              </View>
              <Pressable onPress={() => navigation.navigate('FeedbackResults')}>
                <Text className="text-blue-600 text-sm font-bold">Ver todo</Text>
              </Pressable>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {recentResults.map((r, index) => (
                <Pressable 
                  key={index} 
                  onPress={() => navigation.navigate('SendFeedback', { result: r })} 
                  className="bg-white p-4 rounded-[24px] mr-3 w-64 shadow-sm border border-slate-100 active:opacity-80"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="bg-blue-50 p-2 rounded-xl">
                      <ClipboardCheck size={18} color="#2563EB" />
                    </View>
                    <Text className="text-xs text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg">
                      {r.time}
                    </Text>
                  </View>
                  <Text className="text-slate-900 font-bold text-base mb-1" numberOfLines={1}>
                    {r.athleteName}
                  </Text>
                  <Text className="text-slate-500 text-xs mb-3" numberOfLines={1}>
                    completó <Text className="font-semibold text-blue-600">{r.test}</Text>
                  </Text>
                  <View className="flex-row items-center justify-between pt-3 border-t border-slate-50">
                    <Text className="text-slate-900 font-bold text-sm">{r.result}</Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-blue-600 text-xs font-bold">Revisar</Text>
                      <ArrowRight size={12} color="#2563EB" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* MIS GRUPOS */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between px-6 mb-4">
              <Text className="text-slate-900 text-lg font-bold">Mis Grupos</Text>
              
              {/* Enlace a la página completa de grupos */}
              <Pressable onPress={() => navigation.navigate('MyGroups')}>
                <Text className="text-blue-600 text-sm font-bold">Ver todos</Text>
              </Pressable>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {/* SOLO MOSTRAMOS LOS PRIMEROS 3 GRUPOS PARA RESUMIR */}
              {groups.slice(0, 3).map((group, index) => (
                <Pressable 
                  key={index}
                  onPress={() => navigation.navigate('GroupDetail', { group })}
                  className={`p-5 rounded-[28px] mr-3 w-40 h-40 justify-between active:opacity-80 ${group.color}`}
                >
                  <View className="bg-white/60 w-10 h-10 rounded-full items-center justify-center self-start">
                    <Users size={20} color={group.iconColor} />
                  </View>
                  <View>
                    <Text className="text-slate-900 font-bold text-base leading-5 mb-1" numberOfLines={2}>
                      {group.name}
                    </Text>
                    <Text className="text-slate-600 text-xs font-medium">
                      {group.members} atletas
                    </Text>
                  </View>
                </Pressable>
              ))}
              
              {/* Tarjeta para crear nuevo (Siempre visible al final del resumen) */}
              <Pressable 
                onPress={() => navigation.navigate('CreateGroup')}
                className="p-5 rounded-[28px] mr-3 w-40 h-40 justify-center items-center border-2 border-dashed border-slate-300 active:bg-slate-50"
              >
                <Plus size={32} color="#cbd5e1" />
                <Text className="text-slate-400 text-xs font-bold mt-2">Crear Nuevo</Text>
              </Pressable>
            </ScrollView>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* FAB FLOTANTE */}
      <Pressable 
        onPress={() => navigation.navigate('AssignTestStep1')} 
        style={{ bottom: Math.max(insets.bottom, 24) }} 
        className="absolute right-6 bg-slate-900 px-5 h-14 rounded-full shadow-xl shadow-slate-900/40 flex-row items-center justify-center active:opacity-90 gap-2"
      >
        <Plus size={24} color="white" strokeWidth={2.5} />
        <Text className="text-white font-bold text-base tracking-wide">Asignar</Text>
      </Pressable>

    </View>
  );
}