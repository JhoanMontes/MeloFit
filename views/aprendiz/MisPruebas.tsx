import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  ScrollView, 
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { 
  ArrowLeft, 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  FileText, 
  Clock, 
  Trophy, 
  ChevronRight 
} from "lucide-react-native";
import { AprendizStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

type Props = NativeStackScreenProps<AprendizStackParamList, "MisPruebas">;

interface PendingTest {
  id: number;
  name: string;
  description: string;
  assignedDate: string;
  deadlineRaw: string;
  deadlineText: string;
  prueba_id: number;
}

interface CompletedTest {
  id: number;
  name: string;
  result: string;
  date: string;
  hasFeedback: boolean;
  improvement: string | null;
}

export default function MisPruebas({ navigation }: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pendientes' | 'realizadas'>('pendientes');
  
  const [pendingTests, setPendingTests] = useState<PendingTest[]>([]);
  const [completedTests, setCompletedTests] = useState<CompletedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- NUEVA FUNCIÓN MAESTRA PARA FECHAS ---
  // Esta función toma "2025-12-05" y crea una fecha local exacta a las 00:00:00 de ese día
  // Evita el problema de UTC restando horas
  const parseLocalDate = (dateString: string) => {
    if (!dateString) return new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // --- HELPER 1: Formatear fechas visualmente ---
  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // --- HELPER 2: Calcular texto de fecha límite (CORREGIDO) ---
  const getDeadlineText = (dateString: string) => {
    const deadline = parseLocalDate(dateString);
    
    // Obtenemos la fecha de "hoy" y le quitamos la hora para comparar solo días
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Diferencia en milisegundos
    const diffTime = deadline.getTime() - today.getTime();
    // Convertimos a días (redondeando hacia arriba para ser amigables)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Vencida";
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Mañana";
    if (diffDays <= 7) return `${diffDays} días`;
    
    // Si falta más de una semana, mostramos la fecha formateada
    return formatDate(dateString);
  };

  // --- CARGA DE DATOS ---
  const fetchData = async () => {
    if (!user) return;
    if (!refreshing) setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase
        .from('usuario')
        .select('no_documento')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;
      const docId = userData.no_documento;

      // Pendientes
      const { data: assignments, error: assignError } = await supabase
        .from('prueba_asignada_has_atleta')
        .select(`
          prueba_asignada (
            id,
            fecha_asignacion,
            fecha_limite,
            prueba ( id, nombre, descripcion )
          )
        `)
        .eq('atleta_no_documento', docId);

      if (assignError) throw assignError;

      // Resultados
      const { data: results, error: resultError } = await supabase
        .from('resultado_prueba')
        .select(`
          id,
          prueba_asignada_id,
          fecha_realizacion,
          valor,
          prueba_asignada (
            prueba ( nombre )
          )
        `)
        .eq('atleta_no_documento', docId);

      if (resultError) throw resultError;

      const completedAssignmentIds = results?.map(r => r.prueba_asignada_id) || [];

      // Procesar Pendientes
      const pending: PendingTest[] = [];
      assignments?.forEach((item: any) => {
        const asignacion = item.prueba_asignada;
        if (!completedAssignmentIds.includes(asignacion.id)) {
          pending.push({
            id: asignacion.id,
            name: asignacion.prueba.nombre,
            description: asignacion.prueba.descripcion,
            assignedDate: formatDate(asignacion.fecha_asignacion),
            deadlineRaw: asignacion.fecha_limite,
            deadlineText: getDeadlineText(asignacion.fecha_limite),
            prueba_id: asignacion.prueba.id
          });
        }
      });

      // Procesar Realizadas
      const completed: CompletedTest[] = results?.map((r: any) => ({
        id: r.id,
        name: r.prueba_asignada?.prueba?.nombre || "Prueba",
        result: r.valor || "Completada",
        date: formatDate(r.fecha_realizacion),
        hasFeedback: false, 
        improvement: null 
      })) || [];

      // Ordenar Pendientes: Primero las que vencen pronto
      pending.sort((a, b) => {
        const dateA = parseLocalDate(a.deadlineRaw);
        const dateB = parseLocalDate(b.deadlineRaw);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Ordenar Realizadas: Primero las más recientes (ID más alto suele ser más reciente)
      completed.sort((a, b) => b.id - a.id);

      setPendingTests(pending);
      setCompletedTests(completed);

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudieron cargar las pruebas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* HEADER */}
        <View className="px-6 pt-4 pb-2">
          <Pressable 
            onPress={() => navigation.goBack()} 
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-200 mb-6 active:bg-slate-50"
          >
            <ArrowLeft size={22} color="#334155" />
          </Pressable>
          <Text className="text-slate-900 text-3xl font-extrabold tracking-tight">Mis Pruebas</Text>
          <Text className="text-slate-500 text-base font-medium mt-1">Gestiona tus evaluaciones físicas</Text>
        </View>

        {/* TABS */}
        <View className="px-6 py-6">
          <View className="bg-white p-1.5 rounded-2xl flex-row shadow-sm border border-slate-100">
            <Pressable
              onPress={() => setActiveTab('pendientes')}
              className={`flex-1 py-3 rounded-xl items-center justify-center transition-all ${
                activeTab === 'pendientes' ? 'bg-blue-600 shadow-sm shadow-blue-200' : 'bg-transparent'
              }`}
            >
              <Text className={`font-bold text-sm ${activeTab === 'pendientes' ? 'text-white' : 'text-slate-500'}`}>Pendientes</Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('realizadas')}
              className={`flex-1 py-3 rounded-xl items-center justify-center transition-all ${
                activeTab === 'realizadas' ? 'bg-blue-600 shadow-sm shadow-blue-200' : 'bg-transparent'
              }`}
            >
              <Text className={`font-bold text-sm ${activeTab === 'realizadas' ? 'text-white' : 'text-slate-500'}`}>Historial</Text>
            </Pressable>
          </View>
        </View>

        {/* CONTENT */}
        {loading ? (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        ) : (
            <ScrollView 
                className="flex-1 px-6" 
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} />}
            >
            
            {/* TAB PENDIENTES */}
            {activeTab === 'pendientes' && (
                <View>
                {pendingTests.length === 0 ? (
                    <View className="bg-white rounded-[32px] p-8 items-center shadow-sm border border-slate-100 mt-4">
                        <View className="bg-blue-50 w-20 h-20 rounded-full items-center justify-center mb-4">
                            <CheckCircle2 size={40} color="#2563EB" />
                        </View>
                        <Text className="text-slate-900 text-xl font-bold mb-2">¡Todo al día!</Text>
                        <Text className="text-slate-500 text-center text-base leading-6">No tienes pruebas pendientes.</Text>
                    </View>
                ) : (
                    <View className="space-y-4"> 
                    {pendingTests.map((test) => (
                        <View key={test.id} className="bg-white rounded-[28px] shadow-sm border border-slate-100 p-6 mb-4">
                        
                        <View className="flex-row justify-between items-start mb-4">
                            <View className="flex-1 mr-4">
                                <View className="flex-row items-center mb-1">
                                    <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                                    <Text className="text-slate-900 text-xl font-bold">{test.name}</Text>
                                </View>
                                <Text className="text-sm text-slate-500 leading-5 font-medium" numberOfLines={2}>
                                    {test.description || "Sin descripción"}
                                </Text>
                            </View>
                            <View className={`px-3 py-1.5 rounded-lg flex-row items-center ${
                                test.deadlineText === 'Vencida' ? 'bg-red-50' : 'bg-orange-50'
                            }`}>
                                <Clock size={12} color={test.deadlineText === 'Vencida' ? '#DC2626' : '#ea580c'} style={{ marginRight: 4 }} />
                                <Text className={`text-xs font-bold ${
                                    test.deadlineText === 'Vencida' ? 'text-red-700' : 'text-orange-700'
                                }`}>
                                    {test.deadlineText}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row items-center justify-between pt-4 border-t border-slate-50">
                            <View className="flex-row items-center">
                                <Calendar size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                                <Text className="text-slate-400 text-xs font-bold">Asignada: {test.assignedDate}</Text>
                            </View>

                            {/* <Pressable
                                onPress={() => navigation.navigate('LogResult', { assignmentId: test.id, testName: test.name })}
                                className="bg-blue-600 px-5 py-2.5 rounded-xl shadow-sm shadow-blue-200 active:scale-95 flex-row items-center"
                            >
                                <Text className="text-white font-bold text-sm mr-1">Iniciar</Text>
                                <ChevronRight size={16} color="white" />
                            </Pressable> */}
                        </View>
                        </View>
                    ))}
                    </View>
                )}
                </View>
            )}

            {/* TAB REALIZADAS */}
            {activeTab === 'realizadas' && (
                <View>
                {completedTests.length === 0 ? (
                    <View className="bg-white rounded-[32px] p-8 items-center shadow-sm border border-slate-100 mt-4">
                        <View className="bg-slate-100 w-20 h-20 rounded-full items-center justify-center mb-4">
                            <FileText size={32} color="#94a3b8" />
                        </View>
                        <Text className="text-slate-900 text-xl font-bold mb-2">Sin Historial</Text>
                        <Text className="text-slate-500 text-center text-base">Tus resultados aparecerán aquí.</Text>
                    </View>
                ) : (
                    <View>
                        {completedTests.map((test) => (
                        <View key={test.id} className="bg-white rounded-[28px] shadow-sm border border-slate-100 p-5 mb-4">
                            <View className="flex-row justify-between items-start mb-4">
                                <View>
                                    <Text className="text-slate-900 text-lg font-bold mb-0.5">{test.name}</Text>
                                    <Text className="text-xs text-slate-400 font-medium uppercase">{test.date}</Text>
                                </View>
                                {test.improvement && (
                                    <View className="bg-emerald-50 px-2.5 py-1 rounded-lg flex-row items-center border border-emerald-100">
                                        <Trophy size={12} color="#059669" style={{ marginRight: 4 }} />
                                        <Text className="text-emerald-700 text-xs font-bold">{test.improvement}</Text>
                                    </View>
                                )}
                            </View>
                            <View className="bg-slate-50 rounded-2xl p-4 flex-row items-center justify-between border border-slate-100 mb-4">
                                <View>
                                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Resultado Final</Text>
                                    <Text className="text-2xl text-slate-900 font-extrabold tracking-tight">{test.result}</Text>
                                </View>
                                <View className="bg-white p-2 rounded-xl shadow-sm">
                                    <CheckCircle2 size={20} color="#2563EB" />
                                </View>
                            </View>
                        </View>
                        ))}
                    </View>
                )}
                </View>
            )}

            </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}