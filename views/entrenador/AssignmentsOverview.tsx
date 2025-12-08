import React, { useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StatusBar, 
  Dimensions 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
  ArrowLeft, 
  Filter, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  MoreHorizontal,
  Users,
  BarChart3
} from "lucide-react-native";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "AssignmentsOverview">;

// --- MOCK DATA: GRUPOS Y SUS ESTADÍSTICAS ---
const groupPerformance = [
  { 
    id: 1, 
    name: "Fuerza Avanzada", 
    members: 12, 
    avgScore: 85,
    trend: 'up', // up | down
    stats: [
       { label: 'Fuerza', val: 90 },
       { label: 'Téc.', val: 70 },
       { label: 'Resis.', val: 50 }
    ]
  },
  { 
    id: 2, 
    name: "Principiantes A", 
    members: 24, 
    avgScore: 62,
    trend: 'down',
    stats: [
       { label: 'Fuerza', val: 40 },
       { label: 'Téc.', val: 55 },
       { label: 'Resis.', val: 65 }
    ]
  },
  { 
    id: 3, 
    name: "Velocidad Elite", 
    members: 8, 
    avgScore: 92,
    trend: 'up',
    stats: [
       { label: 'Veloc.', val: 95 },
       { label: 'Pot.', val: 88 },
       { label: 'Flex.', val: 75 }
    ]
  },
];

// --- MOCK DATA: ASIGNACIONES ---
const allAssignments = [
  { 
    id: 1, 
    group: "Fuerza Avanzada", 
    test: "Sentadilla Max (1RM)", 
    deadline: "Hoy, 23:59", 
    completed: 8, 
    total: 10, 
    status: "pending", 
    avgScore: "120 kg" 
  },
  { 
    id: 2, 
    group: "Principiantes A", 
    test: "Test de Cooper", 
    deadline: "Mañana", 
    completed: 3, 
    total: 15, 
    status: "pending",
    avgScore: "-" 
  },
  { 
    id: 3, 
    group: "Velocidad Elite", 
    test: "100m Planos", 
    deadline: "Ayer", 
    completed: 8, 
    total: 8, 
    status: "completed",
    avgScore: "11.2 s" 
  },
  { 
    id: 4, 
    group: "Fuerza Avanzada", 
    test: "Press Banca", 
    deadline: "Hace 2 días", 
    completed: 10, 
    total: 10, 
    status: "completed",
    avgScore: "95 kg" 
  },
];

export default function AssignmentsOverview({ navigation }: Props) {
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');

  const filteredList = allAssignments.filter(item => item.status === filter);

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        
        {/* --- HEADER (Consistente con CreateGroup) --- */}
        <View className="px-6 pt-4 pb-4 bg-slate-50 z-10">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Pressable 
                    onPress={() => navigation.goBack()} 
                    className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-200 mr-4 active:bg-slate-50"
                >
                    <ArrowLeft size={22} color="#334155" />
                </Pressable>
                <View>
                    <Text className="text-slate-900 text-2xl font-extrabold tracking-tight">Asignaciones</Text>
                    <Text className="text-slate-500 text-sm font-medium">Gestión y métricas</Text>
                </View>
              </View>
              {/* Botón Filtro Extra */}
              <Pressable className="w-10 h-10 bg-white rounded-xl items-center justify-center border border-slate-100 active:bg-slate-50">
                  <Filter size={20} color="#64748b" />
              </Pressable>
            </View>
        </View>

        <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ paddingBottom: 100 }} 
            showsVerticalScrollIndicator={false}
        >
          
          {/* --- 1. CARRUSEL DE RENDIMIENTO POR GRUPO --- */}
          <View className="mb-8">
            <View className="px-6 mb-4 flex-row items-center justify-between">
                <Text className="text-slate-900 font-bold text-lg">Métricas por Grupo</Text>
                <Pressable><Text className="text-blue-600 text-sm font-bold">Ver reporte</Text></Pressable>
            </View>

            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingHorizontal: 24 }}
            >
                {groupPerformance.map((group) => (
                    <View 
                        key={group.id} 
                        className="bg-white p-5 rounded-[28px] mr-4 w-72 shadow-sm border border-slate-100"
                    >
                        {/* Header Card */}
                        <View className="flex-row justify-between items-start mb-4">
                            <View className="flex-row items-center gap-2">
                                <View className="bg-blue-50 p-2 rounded-full">
                                    <Users size={16} color="#2563EB" />
                                </View>
                                <View>
                                    <Text className="font-bold text-slate-900 text-base">{group.name}</Text>
                                    <Text className="text-xs text-slate-400 font-medium">{group.members} atletas</Text>
                                </View>
                            </View>
                            <View className={`px-2 py-1 rounded-lg ${group.avgScore >= 80 ? 'bg-green-100' : group.avgScore >= 60 ? 'bg-orange-100' : 'bg-red-100'}`}>
                                <Text className={`font-bold text-xs ${group.avgScore >= 80 ? 'text-green-700' : group.avgScore >= 60 ? 'text-orange-700' : 'text-red-700'}`}>
                                    Avg: {group.avgScore}
                                </Text>
                            </View>
                        </View>

                        {/* Mini Gráfica de Barras dentro de la Card */}
                        <View className="flex-row justify-between items-end h-24 pb-2 border-b border-slate-50">
                            {group.stats.map((stat, idx) => (
                                <View key={idx} className="items-center flex-1">
                                    <Text className="text-[10px] font-bold text-slate-400 mb-1">{stat.val}</Text>
                                    <View className="w-full px-2 h-full justify-end">
                                        <View 
                                            className="w-full bg-blue-500 rounded-t-sm opacity-90"
                                            style={{ height: `${stat.val}%`, borderRadius: 4 }} 
                                        />
                                    </View>
                                    <Text className="text-[10px] text-slate-500 font-semibold mt-1">{stat.label}</Text>
                                </View>
                            ))}
                        </View>
                        
                        <Pressable className="mt-3 flex-row items-center justify-center">
                            <Text className="text-slate-400 text-xs font-medium mr-1">Ver historial del grupo</Text>
                            <ChevronRight size={12} color="#94a3b8" />
                        </Pressable>
                    </View>
                ))}
            </ScrollView>
          </View>


          {/* --- 2. LISTA DE ASIGNACIONES --- */}
          <View className="px-6">
            
            {/* Tabs de Filtro */}
            <View className="flex-row mb-6 bg-slate-200/50 p-1.5 rounded-2xl">
                <Pressable 
                    onPress={() => setFilter('pending')}
                    className={`flex-1 py-3 rounded-xl items-center transition-all ${filter === 'pending' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`text-sm font-bold ${filter === 'pending' ? 'text-slate-900' : 'text-slate-500'}`}>En Progreso</Text>
                </Pressable>
                <Pressable 
                    onPress={() => setFilter('completed')}
                    className={`flex-1 py-3 rounded-xl items-center transition-all ${filter === 'completed' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`text-sm font-bold ${filter === 'completed' ? 'text-slate-900' : 'text-slate-500'}`}>Completadas</Text>
                </Pressable>
            </View>

            {/* Lista Vertical */}
            <View className="space-y-4">
                {filteredList.map((item) => {
                    const progress = (item.completed / item.total) * 100;
                    const isCompleted = progress === 100;

                    return (
                        <Pressable 
                            key={item.id}
                            onPress={() => navigation.navigate('TestAssignmentDetail', { 
                                assignmentId: item.id, 
                                testName: item.test, 
                                groupName: item.group 
                            })}
                            className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 active:bg-slate-50 transition-all active:scale-[0.99]"
                        >
                            {/* Card Header con Badge de Grupo */}
                            <View className="flex-row justify-between items-start mb-3">
                                <View className="flex-1 mr-2">
                                    <View className="flex-row items-center mb-1">
                                        <Users size={12} color="#2563EB" style={{ marginRight: 4 }} />
                                        <Text className="text-xs text-blue-600 font-bold uppercase tracking-wider">{item.group}</Text>
                                    </View>
                                    <Text className="text-lg font-bold text-slate-900 leading-6">{item.test}</Text>
                                </View>
                                
                                <View className={`px-2.5 py-1 rounded-lg flex-row items-center gap-1 ${isCompleted ? 'bg-green-100' : 'bg-orange-50'}`}>
                                    {isCompleted ? <CheckCircle2 size={12} color="#15803d" /> : <Clock size={12} color="#c2410c" />}
                                    <Text className={`text-[10px] font-bold ${isCompleted ? 'text-green-700' : 'text-orange-700'}`}>
                                        {item.deadline}
                                    </Text>
                                </View>
                            </View>

                            {/* Barra de Progreso */}
                            <View className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-xs text-slate-500 font-medium">Evaluados</Text>
                                    <Text className="text-xs text-slate-900 font-bold">{item.completed}/{item.total} <Text className="text-slate-400">({Math.round(progress)}%)</Text></Text>
                                </View>
                                <View className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <View 
                                        className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-600'}`} 
                                        style={{ width: `${progress}%` }} 
                                    />
                                </View>
                            </View>

                            {/* Footer de la Card */}
                            <View className="flex-row justify-between items-center">
                                <View>
                                    <Text className="text-[10px] text-slate-400 uppercase font-bold">Promedio Grupo</Text>
                                    <Text className="text-sm font-bold text-slate-700">{item.avgScore}</Text>
                                </View>
                                <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                                    <ChevronRight size={16} color="#475569" />
                                </View>
                            </View>
                        </Pressable>
                    );
                })}

                {filteredList.length === 0 && (
                    <View className="items-center justify-center py-12 opacity-50">
                        <BarChart3 size={48} color="#9CA3AF" />
                        <Text className="text-slate-400 font-medium mt-4 text-center">
                            No hay asignaciones {filter === 'pending' ? 'pendientes' : 'completadas'}.
                        </Text>
                    </View>
                )}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}