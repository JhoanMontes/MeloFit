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
  ClipboardList,
  CheckCircle2,
  AlertCircle, // Icono para vencidas
  Clock // Icono para pendientes
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
  const [lastResult, setLastResult] = useState<any>(null); // Se mantiene para lógica interna
  const [nextTask, setNextTask] = useState<any>(null);
  const [mixedHistory, setMixedHistory] = useState<any[]>([]); // Historial mixto

  // --- HELPERS DE FECHA ---
  const parseLocalDate = (dateString: string) => {
    if (!dateString) return new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // --- CARGA DE DATOS ---
  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      // 1. Usuario
      const { data: userData, error: userError } = await supabase
        .from('usuario').select('no_documento, nombre_completo').eq('auth_id', user.id).single();
      if (userError) throw userError;
      
      setUserName(userData.nombre_completo || "Atleta");
      const docId = userData.no_documento;

      // 2. Traer Resultados (Realizadas)
      const { data: results, error: resultError } = await supabase
        .from('resultado_prueba')
        .select(`
          id, fecha_realizacion, valor,
          prueba_asignada ( id, prueba ( nombre, tipo_metrica ) )
        `)
        .eq('atleta_no_documento', docId);
      if (resultError) throw resultError;

      // 3. Traer Asignaciones (Pendientes o Vencidas)
      const { data: assignments, error: assignError } = await supabase
        .from('prueba_asignada_has_atleta')
        .select(`
          prueba_asignada (
            id, fecha_limite,
            prueba ( id, nombre, descripcion, tipo_metrica )
          )
        `)
        .eq('atleta_no_documento', docId);
      if (assignError) throw assignError;

      // --- PROCESAMIENTO ---
      const completedIds = results?.map((r: any) => r.prueba_asignada?.id) || [];
      const today = new Date();
      today.setHours(0,0,0,0);

      const allEvents: any[] = [];

      // A. Procesar REALIZADAS
      results?.forEach((r: any) => {
        allEvents.push({
          id: r.id, // ID único para key
          type: 'completed',
          name: r.prueba_asignada?.prueba?.nombre,
          value: r.valor,
          dateRaw: r.fecha_realizacion,
          dateLabel: formatDate(r.fecha_realizacion),
          icon: <CheckCircle2 size={18} color="#22C55E" />, // Verde
          statusColor: "text-green-600",
          bgColor: "bg-green-50"
        });
      });

      // B. Procesar ASIGNACIONES (Pendientes o Vencidas)
      const pendingList: any[] = []; // Para calcular el "Siguiente Objetivo"

      assignments?.forEach((item: any) => {
        const a = item.prueba_asignada;
        // Si no está completada...
        if (!completedIds.includes(a.id)) {
          const deadline = parseLocalDate(a.fecha_limite);
          
          if (deadline < today) {
            // VENCIDA
            allEvents.push({
              id: `exp-${a.id}`,
              type: 'expired',
              name: a.prueba.nombre,
              value: "No realizada",
              dateRaw: a.fecha_limite,
              dateLabel: `Venció: ${formatDate(a.fecha_limite)}`,
              icon: <X size={18} color="#EF4444" />, // Rojo
              statusColor: "text-red-600",
              bgColor: "bg-red-50"
            });
          } else {
            // ASIGNADA (Pendiente)
            allEvents.push({
              id: `pen-${a.id}`,
              type: 'pending',
              name: a.prueba.nombre,
              value: "Pendiente",
              dateRaw: a.fecha_limite,
              dateLabel: `Vence: ${formatDate(a.fecha_limite)}`,
              icon: <Clock size={18} color="#F59E0B" />, // Amarillo/Naranja
              statusColor: "text-amber-600",
              bgColor: "bg-amber-50"
            });

            // Guardamos para calcular "Siguiente Objetivo"
            pendingList.push({
              ...a,
              deadlineDate: deadline
            });
          }
        }
      });

      // 4. Ordenar Historial Mixto (Por fecha descendente: Lo más reciente arriba)
      // Nota: Para pendientes usamos fecha limite, para realizadas fecha realizacion
      allEvents.sort((a, b) => {
        const dateA = parseLocalDate(a.dateRaw);
        const dateB = parseLocalDate(b.dateRaw);
        return dateB.getTime() - dateA.getTime();
      });

      // Tomamos los últimos 3 eventos para mostrar
      setMixedHistory(allEvents.slice(0, 3));

      // 5. Calcular Siguiente Objetivo (La pendiente más cercana)
      pendingList.sort((a, b) => a.deadlineDate.getTime() - b.deadlineDate.getTime());
      
      if (pendingList.length > 0) {
        setNextTask({
          assignmentId: pendingList[0].id,
          name: pendingList[0].prueba.nombre,
          description: pendingList[0].prueba.descripcion,
          deadline: formatDate(pendingList[0].fecha_limite)
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
    useCallback(() => { fetchDashboardData(); }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // --- RENDER MODAL PERFIL ---
  const ProfileModal = () => (
    <Modal animationType="fade" transparent={true} visible={showProfileModal} onRequestClose={() => setShowProfileModal(false)}>
      <View className="flex-1 bg-slate-900/60 justify-end">
        <Pressable className="flex-1" onPress={() => setShowProfileModal(false)} />
        <View className="bg-white rounded-t-[40px] p-6 pb-10 shadow-2xl">
          <View className="items-center mb-4"><View className="w-12 h-1.5 bg-slate-200 rounded-full" /></View>
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-2xl font-bold text-slate-900 tracking-tight">Tu Cuenta</Text>
            <Pressable onPress={() => setShowProfileModal(false)} className="p-2 bg-slate-100 rounded-full active:bg-slate-200"><X size={20} color="#64748b" /></Pressable>
          </View>
          <Pressable onPress={() => { setShowProfileModal(false); navigation.navigate("Profile"); }} className="flex-row items-center bg-slate-50 p-4 rounded-3xl mb-8 border border-slate-100 active:bg-slate-100">
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4 border-2 border-white"><User size={30} color="#2563EB" /></View>
            <View>
              <Text className="text-xl font-bold text-slate-900">{userName}</Text>
              <Text className="text-slate-500 font-medium mt-0.5">{user?.email}</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => { setShowProfileModal(false); logout(); }} className="w-full bg-red-50 py-4 rounded-2xl flex-row items-center justify-center space-x-2 active:bg-red-100">
            <LogOut size={20} color="#DC2626" /><Text className="text-red-600 font-bold text-base">Cerrar Sesión</Text>
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

        {/* SCROLL CONTENT */}
        <ScrollView 
          className="flex-1 px-6" 
          contentContainerStyle={{ paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} />}
        >
          
          {/* 1. HERO CARD (COMENTADO) */}
          {/* ... (código comentado) ... */}

          {/* 2. SIGUIENTE OBJETIVO */}
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

            <Pressable 
                onPress={() => {
                    if (nextTask) {
                        navigation.navigate('LogResult', { assignmentId: nextTask.assignmentId, testName: nextTask.name });
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
            </Pressable>
          </View>

          {/* 3. HISTORIAL RECIENTE (MEZCLADO) */}
          <View>
            <Text className="text-slate-900 text-lg font-bold mb-4 px-1">Actividad Reciente</Text>
            {mixedHistory.length > 0 ? (
                <View className="bg-white rounded-[28px] p-2 shadow-sm border border-slate-100">
                {mixedHistory.map((activity, index) => (
                    <View key={activity.id} className={`flex-row items-center justify-between p-4 ${index !== mixedHistory.length - 1 ? 'border-b border-slate-50' : ''}`}>
                        
                        {/* IZQUIERDA: ICONO + NOMBRE + VALOR */}
                        <View className="flex-row items-center space-x-4 flex-1 mr-4">
                            <View className={`w-10 h-10 rounded-full items-center justify-center ${activity.bgColor}`}>
                                {activity.icon}
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 font-bold text-base" numberOfLines={1}>{activity.name}</Text>
                                {/* Valor condicional según estado */}
                                <Text className={`text-sm font-medium ${
                                    activity.type === 'expired' ? 'text-red-500' : 
                                    activity.type === 'pending' ? 'text-amber-500' : 'text-slate-500'
                                }`}>
                                    {activity.value}
                                </Text>
                            </View>
                        </View>

                        {/* DERECHA: FECHA */}
                        <Text className="text-xs text-slate-400 font-semibold bg-slate-50 px-2 py-1 rounded-lg">
                            {activity.dateLabel}
                        </Text>
                    </View>
                ))}
                </View>
            ) : (
                <Text className="text-slate-400 text-center mt-2 italic">Aún no hay actividad reciente.</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* FOOTER NAV (Igual que antes) */}
      <View className="absolute bottom-0 w-full bg-white border-t border-slate-100 flex-row justify-around items-center" style={{ paddingBottom: Math.max(insets.bottom, 20), paddingTop: 12 }}>
        <Pressable className="items-center justify-center min-w-[64px]">
          <View className="bg-blue-50 px-5 py-1.5 rounded-full mb-1.5"><TrendingUp size={24} color="#2563EB" strokeWidth={2.5} /></View>
          <Text className="text-[10px] text-blue-600 font-bold">Inicio</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Stats')} className="items-center justify-center min-w-[64px] opacity-60 active:opacity-100">
          <View className="px-5 py-1.5 mb-1.5"><BarChart3 size={24} color="#64748b" strokeWidth={2.5} /></View>
          <Text className="text-[10px] text-slate-500 font-medium">Datos</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('MisPruebas')} className="items-center justify-center min-w-[64px] opacity-60 active:opacity-100">
          <View className="px-5 py-1.5 mb-1.5"><ClipboardList size={24} color="#64748b" strokeWidth={2.5} /></View>
          <Text className="text-[10px] text-slate-500 font-medium">Pruebas</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Profile')} className="items-center justify-center min-w-[64px] opacity-60 active:opacity-100">
          <View className="px-5 py-1.5 mb-1.5"><User size={24} color="#64748b" strokeWidth={2.5} /></View>
          <Text className="text-[10px] text-slate-500 font-medium">Perfil</Text>
        </Pressable>
      </View>

    </View>
  );
}