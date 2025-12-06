import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import {
  Bell,
  User,
  TrendingUp,
  Plus,
  BarChart3,
  Calendar,
  X,
  LogOut,
  Trophy,
  MapPin,
  ClipboardList
} from "lucide-react-native";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { AprendizStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AprendizStackParamList, "Dashboard">;

export default function Dashboard({ navigation }: Props) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState("Atleta");
  const [lastResult, setLastResult] = useState<any>(null);
  const [nextTask, setNextTask] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // --- CARGA DE DATOS ---
  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      // 1. Usuario
      const { data: userData, error: userError } = await supabase
        .from('usuario')
        .select('no_documento, nombre_completo')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;
      setUserName(userData.nombre_completo || "Atleta");
      const docId = userData.no_documento;

      // 2. Historial (Resultados) -> Traemos los últimos 3
      const { data: results, error: resultError } = await supabase
        .from('resultado_prueba')
        .select(`
          id,
          fecha_realizacion,
          valor,
          prueba_asignada (
            prueba ( nombre, tipo_metrica )
          )
        `)
        .eq('atleta_no_documento', docId)
        .order('fecha_realizacion', { ascending: false }) // Del más reciente al más antiguo
        .limit(3); 
      if (resultError) throw resultError;

      // Procesar Historial
      if (results && results.length > 0) {
        // Datos para "Último Logro" (aunque esté comentado en UI, mantenemos la data por si acaso)
        /* setLastResult({
          name: results[0].prueba_asignada?.prueba?.nombre,
          value: results[0].valor,
          date: new Date(results[0].fecha_realizacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
          metric: results[0].prueba_asignada?.prueba?.tipo_metrica
        }); */

        const historyList = results.map((r: any) => ({
          id: r.id,
          name: r.prueba_asignada?.prueba?.nombre,
          value: r.valor,
          date: new Date(r.fecha_realizacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
          icon: r.prueba_asignada?.prueba?.tipo_metrica === 'TIME_MIN' ? '⏱️' : '🏋️'
        }));
        setHistory(historyList);
      } else {
        setLastResult(null);
        setHistory([]);
      }

      // 3. Siguiente Objetivo (La más cercana)
      const { data: assignments, error: assignError } = await supabase
        .from('prueba_asignada_has_atleta')
        .select(`
          prueba_asignada (
            id,
            fecha_limite,
            prueba ( id, nombre, descripcion )
          )
        `)
        .eq('atleta_no_documento', docId);

      if (assignError) throw assignError;

      // Filtramos completadas y ordenamos por fecha límite ascendente (la más cercana primero)
      const completedIds = results?.map((r: any) => r.prueba_asignada?.id) || [];
      
      const pending = assignments
        ?.map((a: any) => a.prueba_asignada)
        .filter((p: any) => !completedIds.includes(p.id)) 
        .sort((a: any, b: any) => new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime());

      if (pending && pending.length > 0) {
        setNextTask({
          assignmentId: pending[0].id,
          name: pending[0].prueba.nombre,
          description: pending[0].prueba.descripcion,
          deadline: new Date(pending[0].fecha_limite).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
        });
      } else {
        setNextTask(null);
      }

    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

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
          <View className="items-center mb-4">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </View>
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-2xl font-bold text-slate-900 tracking-tight">Tu Cuenta</Text>
            <Pressable onPress={() => setShowProfileModal(false)} className="p-2 bg-slate-100 rounded-full active:bg-slate-200">
              <X size={20} color="#64748b" />
            </Pressable>
          </View>
          <Pressable onPress={() => { setShowProfileModal(false); navigation.navigate("Profile"); }} className="flex-row items-center bg-slate-50 p-4 rounded-3xl mb-8 border border-slate-100 active:bg-slate-100">
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4 border-2 border-white">
              <User size={30} color="#2563EB" />
            </View>
            <View>
              <Text className="text-xl font-bold text-slate-900">{userName}</Text>
              <Text className="text-slate-500 font-medium mt-0.5">{user?.email}</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => { setShowProfileModal(false); logout(); }} className="w-full bg-red-50 py-4 rounded-2xl flex-row items-center justify-center space-x-2 active:bg-red-100">
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

        {/* --- HEADER --- */}
        <View className="px-6 pb-4 mt-3 flex-row items-center justify-between">
          <View>
            <Text className="text-slate-500 text-sm font-semibold mb-0.5">Bienvenido de nuevo,</Text>
            <Text className="text-slate-900 text-2xl font-extrabold tracking-tight">{userName}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => navigation.navigate('Notifications')} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100">
              <Bell size={22} color="#334155" />
              <View className="absolute top-3 right-3.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </Pressable>
            <Pressable onPress={() => setShowProfileModal(true)} className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center border border-blue-100">
              <User size={22} color="#2563EB" />
            </Pressable>
          </View>
        </View>

        {/* --- SCROLL CONTENT --- */}
        <ScrollView 
          className="flex-1 px-6" 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} />}
        >
          
          {/* ====================================================================
            1. HERO CARD (Último Logro) - COMENTADO POR SOLICITUD
            ====================================================================
          
          <View className="mt-2 mb-6">
            {lastResult ? (
              <View className="bg-blue-600 rounded-[32px] p-6 shadow-xl shadow-blue-500/30 overflow-hidden relative">
                <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                <View className="absolute bottom-0 left-10 w-24 h-24 bg-white/5 rounded-full" />
                <View className="flex-row items-start justify-between mb-6">
                  <View>
                    <View className="flex-row items-center space-x-1 mb-1">
                      <Trophy size={14} color="#bfdbfe" />
                      <Text className="text-blue-200 text-xs font-bold uppercase tracking-wider">Último Logro</Text>
                    </View>
                    <Text className="text-white text-2xl font-bold">{lastResult.name}</Text>
                    <Text className="text-blue-100 text-sm mt-1">{lastResult.date}</Text>
                  </View>
                  <View className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                    <TrendingUp size={24} color="white" />
                  </View>
                </View>
                <View className="bg-black/10 rounded-3xl p-4 flex-row items-center justify-between border border-white/10">
                  <View>
                    <Text className="text-blue-200 text-xs font-medium mb-1">Resultado</Text>
                    <View className="flex-row items-baseline space-x-1">
                      <Text className="text-white text-3xl font-extrabold tracking-tight">{lastResult.value}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View className="bg-blue-600 rounded-[32px] p-8 items-center shadow-xl shadow-blue-500/30">
                 <Trophy size={48} color="white" opacity={0.5} />
                 <Text className="text-white font-bold text-lg mt-4">¡Empieza a entrenar!</Text>
                 <Text className="text-blue-100 text-center mt-1">Registra tu primer resultado para verlo aquí.</Text>
              </View>
            )}
          </View>
          */}

          {/* 2. SIGUIENTE OBJETIVO (Tarjeta Blanca Destacada) */}
          {/* Le agregamos margen superior 'mt-4' ya que ocultamos el Hero Card */}
          <View className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 mb-6 mt-4">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Siguiente Objetivo</Text>
                <Text className="text-slate-900 text-xl font-bold">
                    {nextTask ? nextTask.name : "Sin pendientes"}
                </Text>
              </View>
              <View className="bg-blue-50 p-2.5 rounded-xl">
                <Calendar size={22} color="#2563EB" />
              </View>
            </View>
            
            {nextTask ? (
                <View className="flex-row items-center space-x-2 mb-6 bg-slate-50 p-3 rounded-xl">
                    <MapPin size={16} color="#64748b" />
                    <Text className="text-slate-600 text-sm font-medium">Vence: {nextTask.deadline}</Text>
                </View>
            ) : (
                <View className="mb-6">
                    <Text className="text-slate-400 text-sm">No tienes pruebas próximas asignadas.</Text>
                </View>
            )}

            {/* <Pressable 
                onPress={() => {
                    if (nextTask) {
                        navigation.navigate('LogResult', { 
                            assignmentId: nextTask.assignmentId, 
                            testName: nextTask.name 
                        });
                    } else {
                        navigation.navigate('MisPruebas');
                    }
                }} 
                className={`w-full rounded-2xl h-14 flex-row justify-center items-center shadow-lg active:opacity-90 active:scale-[0.98] ${
                    nextTask ? 'bg-blue-600 shadow-blue-600/20' : 'bg-slate-200 shadow-none'
                }`}
            >
              {nextTask ? (
                  <>
                    <Plus size={20} color="white" style={{ marginRight: 8 }} strokeWidth={3} />
                    <Text className="text-white font-bold text-base tracking-wide">Registrar Resultado</Text>
                  </>
              ) : (
                  <Text className="text-slate-500 font-bold text-base">Ver todas las pruebas</Text>
              )}
            </Pressable> */}
          </View>

          {/* 3. HISTORIAL RECIENTE (Máximo 3) */}
          <View>
            <Text className="text-slate-900 text-lg font-bold mb-4 px-1">Historial Reciente</Text>
            {history.length > 0 ? (
                <View className="bg-white rounded-[28px] p-2 shadow-sm border border-slate-100">
                {history.map((activity, index) => (
                    <View key={activity.id} className={`flex-row items-center justify-between p-4 ${index !== history.length - 1 ? 'border-b border-slate-50' : ''}`}>
                    <View className="flex-row items-center space-x-4">
                        <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                        <Text>{activity.icon}</Text>
                        </View>
                        <View>
                        <Text className="text-slate-900 font-bold text-base">{activity.name}</Text>
                        <Text className="text-sm text-slate-500 font-medium">{activity.value}</Text>
                        </View>
                    </View>
                    <Text className="text-xs text-slate-400 font-semibold bg-slate-50 px-2 py-1 rounded-lg">{activity.date}</Text>
                    </View>
                ))}
                </View>
            ) : (
                <Text className="text-slate-400 text-center mt-2 italic">Aún no hay actividad reciente.</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* --- BOTTOM NAVIGATION --- */}
      <View
        className="absolute bottom-0 w-full bg-white border-t border-slate-100 flex-row justify-around items-center"
      style={{ 
          paddingBottom: Math.max(insets.bottom, 20), 
          paddingTop: 12,
          flexDirection: 'row',
          justifyContent: 'space-around'
        }}
      >
        <Pressable className="items-center justify-center min-w-[64px]">
          <View className="bg-blue-50 px-5 py-1.5 rounded-full mb-1.5">
            <TrendingUp size={24} color="#2563EB" strokeWidth={2.5} />
          </View>
          <Text className="text-[10px] text-blue-600 font-bold">Inicio</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Stats')} className="items-center justify-center min-w-[64px] opacity-60 active:opacity-100">
          <View className="px-5 py-1.5 mb-1.5">
            <BarChart3 size={24} color="#64748b" strokeWidth={2.5} />
          </View>
          <Text className="text-[10px] text-slate-500 font-medium">Datos</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('MisPruebas')} className="items-center justify-center min-w-[64px] opacity-60 active:opacity-100">
          <View className="px-5 py-1.5 mb-1.5">
            <ClipboardList size={24} color="#64748b" strokeWidth={2.5} />
          </View>
          <Text className="text-[10px] text-slate-500 font-medium">Pruebas</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Profile')} className="items-center justify-center min-w-[64px] opacity-60 active:opacity-100">
          <View className="px-5 py-1.5 mb-1.5">
            <User size={24} color="#64748b" strokeWidth={2.5} />
          </View>
          <Text className="text-[10px] text-slate-500 font-medium">Perfil</Text>
        </Pressable>
      </View>

    </View>
  );
}