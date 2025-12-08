import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Modal, 
  StatusBar,
  ActivityIndicator
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native"; 
// TUS ICONOS ORIGINALES (LUCIDE)
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
  ArrowRight
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "Dashboard">;

const CARD_COLORS = [
  { bg: 'bg-indigo-100', iconColor: '#4338ca' }, 
  { bg: 'bg-emerald-100', iconColor: '#059669' }, 
  { bg: 'bg-orange-100', iconColor: '#ea580c' },  
  { bg: 'bg-blue-100', iconColor: '#2563EB' },    
  { bg: 'bg-purple-100', iconColor: '#9333EA' },  
];

// Mock de Progreso de Asignaciones (Horizontal y Moderno)
const activeAssignments = [
  { id: 1, groupName: 'Fuerza Avanzada', test: 'Sentadilla Max', progress: 80, completed: 8, total: 10, deadline: 'Hoy' },
  { id: 2, groupName: 'Principiantes', test: 'Test de Cooper', progress: 20, completed: 3, total: 15, deadline: 'Mañana' },
  { id: 3, groupName: 'Velocidad', test: '100m Planos', progress: 100, completed: 8, total: 8, deadline: 'Ayer' },
];

export default function CoachDashboard({ navigation }: Props) {
  const { logout, user } = useAuth();
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [nombre, setNombre] = useState<String>("Entrenador");
  
  const [recentGroups, setRecentGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Cargar Nombre
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('usuario')       
          .select('nombre_completo')
          .eq('auth_id', user.id)  
          .single();

        if (data) {
          const primerNombre = data.nombre_completo.trim().split(" ")[0];
          setNombre(primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1).toLowerCase()); 
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUserData();
  }, [user]);

  // Cargar Grupos
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchRecentGroups = async () => {
        if (!user) return;
        try {
          const { data: trainerData } = await supabase.from('usuario').select('no_documento').eq('auth_id', user.id).single();
          if (!trainerData) return;

          const { data, error } = await supabase
            .from('grupo')
            .select('*, atleta_has_grupo(count)') 
            .eq('entrenador_no_documento', trainerData.no_documento)
            .order('fecha_creacion', { ascending: false })
            .limit(5);

          if (error) throw error;

          if (isActive && data) {
            const formattedGroups = data.map(g => ({
              ...g,
              members: g.atleta_has_grupo?.[0]?.count || 0 
            }));
            setRecentGroups(formattedGroups);
          }
        } catch (error) {
          console.error("Error fetching dashboard groups:", error);
        } finally {
          if (isActive) setLoadingGroups(false);
        }
      };
      fetchRecentGroups();
      return () => { isActive = false; };
    }, [user])
  );

  const ProfileModal = () => (
    <Modal animationType="fade" transparent={true} visible={showProfileModal} onRequestClose={() => setShowProfileModal(false)}>
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
          <Pressable onPress={() => { setShowProfileModal(false); navigation.navigate("Profile"); }} className="flex-row items-center bg-slate-50 p-4 rounded-3xl mb-6 border border-slate-100 active:bg-slate-100">
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4 border-2 border-white">
                <User size={30} color="#2563EB" />
            </View>
            <View className="flex-1"><Text className="text-xl font-bold text-slate-900">{nombre}</Text><Text className="text-slate-500 font-medium">Head Coach</Text></View>
            <ChevronRight size={20} color="#94a3b8" />
          </Pressable>
          <Pressable onPress={() => { setShowProfileModal(false); logout(); }} className="w-full bg-red-50 py-4 rounded-2xl flex-row items-center justify-center active:bg-red-100 gap-2">
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
            <Pressable onPress={() => navigation.navigate('Notifications')} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100 active:bg-slate-50">
              <Bell size={22} color="#334155" />
              <View className="absolute top-3 right-3.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </Pressable>
            <Pressable onPress={() => setShowProfileModal(true)} className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center border border-blue-100 active:bg-blue-100">
              <User size={22} color="#2563EB" />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 140, paddingTop: 10 }} showsVerticalScrollIndicator={false}>

          {/* Quick Actions (ICONOS LUCIDE) */}
          <View className="px-6 flex-row justify-between mb-8">
            <Pressable onPress={() => navigation.navigate('CoachReports')} className="bg-white rounded-[24px] p-4 flex-1 mr-3 shadow-sm border border-slate-100 active:opacity-60 flex-row items-center">
              <View className="bg-indigo-50 p-3 rounded-2xl mr-3">
                  <FileText size={20} color="#4f46e5" />
              </View>
              <View><Text className="text-slate-900 font-bold text-base">Reportes</Text><Text className="text-slate-400 text-[10px] font-medium">Exportar datos</Text></View>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('ManageTests')} className="bg-white rounded-[24px] p-4 flex-1 ml-3 shadow-sm border border-slate-100 active:opacity-60 flex-row items-center">
              <View className="bg-blue-50 p-3 rounded-2xl mr-3">
                  <Settings size={20} color="#2563EB" />
              </View>
              <View><Text className="text-slate-900 font-bold text-base">Pruebas</Text><Text className="text-slate-400 text-[10px] font-medium">Gestionar</Text></View>
            </Pressable>
          </View>

          {/* SEGUIMIENTO DE ASIGNACIONES (Horizontal y Moderno) */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between px-6 mb-4">
                <Text className="text-slate-900 text-lg font-bold">Estado de Asignaciones</Text>
                <Pressable onPress={() => navigation.navigate('FeedbackResults')}>
                    <Text className="text-blue-600 text-sm font-bold">Ver todos</Text>
                </Pressable>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                {activeAssignments.map((item) => (
                    <Pressable 
                        key={item.id}
                        onPress={() => navigation.navigate('TestAssignmentDetail', { 
                            assignmentId: item.id, 
                            testName: item.test, 
                            groupName: item.groupName 
                        })}
                        className="bg-white p-4 rounded-[24px] mr-4 w-72 shadow-sm border border-slate-100 active:bg-slate-50"
                    >
                        <View className="flex-row justify-between items-start mb-3">
                            <View className="flex-1 mr-2">
                                <Text className="text-slate-900 font-bold text-base" numberOfLines={1}>{item.groupName}</Text>
                                <Text className="text-slate-500 text-xs">{item.test}</Text>
                            </View>
                            <View className={`px-2 py-1 rounded-lg ${item.progress === 100 ? 'bg-green-100' : 'bg-slate-100'}`}>
                                <Text className={`text-[10px] font-bold ${item.progress === 100 ? 'text-green-700' : 'text-slate-600'}`}>
                                    {item.deadline}
                                </Text>
                            </View>
                        </View>
                        
                        <View>
                            <View className="flex-row justify-between mb-1.5">
                                <Text className="text-xs text-slate-400 font-medium">Progreso</Text>
                                <Text className="text-xs text-blue-600 font-bold">{item.completed}/{item.total} completados</Text>
                            </View>
                            <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <View 
                                    className={`h-full rounded-full ${item.progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                                    style={{ width: `${item.progress}%` }} 
                                />
                            </View>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
          </View>

          {/* MIS GRUPOS (ORIGINAL CON LUCIDE) */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between px-6 mb-4">
              <Text className="text-slate-900 text-lg font-bold">Mis Grupos</Text>
              <Pressable onPress={() => navigation.navigate('MyGroups')}>
                <Text className="text-blue-600 text-sm font-bold">Ver todos</Text>
              </Pressable>
            </View>

            {loadingGroups ? (
               <View className="pl-6"><ActivityIndicator size="small" color="#2563EB" /></View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                
                {/* Botón Crear Nuevo */}
                <Pressable onPress={() => navigation.navigate('CreateGroup')} className="p-5 rounded-[28px] mr-3 w-40 h-40 justify-center items-center border-2 border-dashed border-slate-300 active:bg-slate-50">
                  <Plus size={32} color="#cbd5e1" /><Text className="text-slate-400 text-xs font-bold mt-2">Crear Nuevo</Text>
                </Pressable>

                {recentGroups.length > 0 ? (
                  recentGroups.map((group, index) => {
                    const colorTheme = CARD_COLORS[index % CARD_COLORS.length];
                    return (
                      <Pressable 
                        key={group.codigo}
                        onPress={() => navigation.navigate('GroupDetail', { group })}
                        className={`p-5 rounded-[28px] mr-3 w-40 h-40 justify-between active:opacity-80 ${colorTheme.bg}`}
                      >
                        <View className="bg-white/60 w-10 h-10 rounded-full items-center justify-center self-start">
                          <Users size={20} color={colorTheme.iconColor} />
                        </View>
                        <View>
                          <Text className="text-slate-900 font-bold text-base leading-5 mb-1" numberOfLines={2}>{group.nombre}</Text>
                          <Text className="text-slate-600 text-xs font-medium">{group.members || 0} atletas</Text>
                        </View>
                      </Pressable>
                    );
                  })
                ) : (
                  <View className="mr-4 justify-center h-40"><Text className="text-slate-400 text-xs italic">No hay grupos activos</Text></View>
                )}
                
              </ScrollView>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}