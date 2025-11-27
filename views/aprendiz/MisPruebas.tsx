import React, { useState } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  ScrollView, 
  StatusBar 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
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

type Props = NativeStackScreenProps<AprendizStackParamList, "MisPruebas">;

const pendingTests = [
  {
    id: 1,
    name: 'Test de Cooper',
    description: 'Prueba de resistencia cardiovascular de 12 minutos.',
    assignedDate: '8 Oct',
    deadline: 'Mañana'
  },
  {
    id: 2,
    name: 'Carrera 5km',
    description: 'Carrera de resistencia en pista a ritmo constante.',
    assignedDate: '7 Oct',
    deadline: '3 días'
  },
  {
    id: 3,
    name: 'Press de Banca',
    description: 'Prueba de fuerza máxima del tren superior.',
    assignedDate: '6 Oct',
    deadline: 'Semana'
  }
];

const completedTests = [
  {
    id: 1,
    name: 'Sentadilla',
    result: '100 kg × 8',
    date: '7 Oct',
    hasFeedback: true,
    improvement: '+5kg'
  },
  {
    id: 2,
    name: 'Dominadas',
    result: '15 reps',
    date: '6 Oct',
    hasFeedback: false,
    improvement: null
  },
  {
    id: 3,
    name: 'Peso Muerto',
    result: '120 kg × 6',
    date: '5 Oct',
    hasFeedback: true,
    improvement: '+10kg'
  },
  {
    id: 4,
    name: 'Test de Cooper',
    result: '2700 m',
    date: '3 Oct',
    hasFeedback: false,
    improvement: null
  }
];

export default function MisPruebas({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<'pendientes' | 'realizadas'>('pendientes');

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView className="flex-1" edges={['top']}>
        
        {/* --- HEADER --- */}
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

        {/* --- TABS NAVIGATION (Estilo Segmented Control) --- */}
        <View className="px-6 py-6">
          <View className="bg-white p-1.5 rounded-2xl flex-row shadow-sm border border-slate-100">
            <Pressable
              onPress={() => setActiveTab('pendientes')}
              className={`flex-1 py-3 rounded-xl items-center justify-center transition-all ${
                activeTab === 'pendientes' 
                  ? 'bg-blue-600 shadow-sm shadow-blue-200' 
                  : 'bg-transparent'
              }`}
            >
              <Text className={`font-bold text-sm ${activeTab === 'pendientes' ? 'text-white' : 'text-slate-500'}`}>
                Pendientes
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('realizadas')}
              className={`flex-1 py-3 rounded-xl items-center justify-center transition-all ${
                activeTab === 'realizadas' 
                  ? 'bg-blue-600 shadow-sm shadow-blue-200' 
                  : 'bg-transparent'
              }`}
            >
              <Text className={`font-bold text-sm ${activeTab === 'realizadas' ? 'text-white' : 'text-slate-500'}`}>
                Historial
              </Text>
            </Pressable>
          </View>
        </View>

        {/* --- CONTENT SCROLL --- */}
        <ScrollView 
          className="flex-1 px-6" 
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          
          {/* --- TAB: PENDIENTES --- */}
          {activeTab === 'pendientes' && (
            <View>
              {pendingTests.length === 0 ? (
                <View className="bg-white rounded-[32px] p-8 items-center shadow-sm border border-slate-100 mt-4">
                  <View className="bg-blue-50 w-20 h-20 rounded-full items-center justify-center mb-4">
                    <CheckCircle2 size={40} color="#2563EB" />
                  </View>
                  <Text className="text-slate-900 text-xl font-bold mb-2">¡Todo al día!</Text>
                  <Text className="text-slate-500 text-center text-base leading-6">
                    No tienes pruebas pendientes por realizar. Descansa o revisa tu historial.
                  </Text>
                </View>
              ) : (
                <View className="space-y-4"> 
                {/* space-y-4 maneja el margen vertical entre items */}
                  {pendingTests.map((test) => (
                    <View key={test.id} className="bg-white rounded-[28px] shadow-sm border border-slate-100 p-6 mb-4">
                      
                      {/* Header Card */}
                      <View className="flex-row justify-between items-start mb-4">
                        <View className="flex-1 mr-4">
                          <View className="flex-row items-center mb-1">
                            <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                            <Text className="text-slate-900 text-xl font-bold">{test.name}</Text>
                          </View>
                          <Text className="text-sm text-slate-500 leading-5 font-medium">{test.description}</Text>
                        </View>
                        <View className="bg-orange-50 px-3 py-1.5 rounded-lg flex-row items-center">
                          <Clock size={12} color="#ea580c" style={{ marginRight: 4 }} />
                          <Text className="text-orange-700 text-xs font-bold">{test.deadline}</Text>
                        </View>
                      </View>

                      {/* Footer Card */}
                      <View className="flex-row items-center justify-between pt-4 border-t border-slate-50">
                        <View className="flex-row items-center">
                          <Calendar size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                          <Text className="text-slate-400 text-xs font-bold">Asignada: {test.assignedDate}</Text>
                        </View>

                        <Pressable
                          onPress={() => navigation.navigate('LogResult')}
                          className="bg-blue-600 px-5 py-2.5 rounded-xl shadow-sm shadow-blue-200 active:scale-95 flex-row items-center"
                        >
                          <Text className="text-white font-bold text-sm mr-1">Iniciar</Text>
                          <ChevronRight size={16} color="white" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* --- TAB: REALIZADAS --- */}
          {activeTab === 'realizadas' && (
            <View>
              {completedTests.length === 0 ? (
                <View className="bg-white rounded-[32px] p-8 items-center shadow-sm border border-slate-100 mt-4">
                  <View className="bg-slate-100 w-20 h-20 rounded-full items-center justify-center mb-4">
                    <FileText size={32} color="#94a3b8" />
                  </View>
                  <Text className="text-slate-900 text-xl font-bold mb-2">Sin Historial</Text>
                  <Text className="text-slate-500 text-center text-base">
                    Tus resultados completados aparecerán aquí.
                  </Text>
                </View>
              ) : (
                <View>
                    {/* Lista sin gap, usando margen inferior en cada item */}
                    {completedTests.map((test) => (
                    <View key={test.id} className="bg-white rounded-[28px] shadow-sm border border-slate-100 p-5 mb-4">
                        
                        {/* Fila Principal */}
                        <View className="flex-row justify-between items-start mb-4">
                            <View>
                                <Text className="text-slate-900 text-lg font-bold mb-0.5">{test.name}</Text>
                                <Text className="text-xs text-slate-400 font-medium uppercase">{test.date}</Text>
                            </View>
                            
                            {/* Chip de Mejora (si existe) */}
                            {test.improvement && (
                                <View className="bg-emerald-50 px-2.5 py-1 rounded-lg flex-row items-center border border-emerald-100">
                                    <Trophy size={12} color="#059669" style={{ marginRight: 4 }} />
                                    <Text className="text-emerald-700 text-xs font-bold">{test.improvement}</Text>
                                </View>
                            )}
                        </View>

                        {/* Bloque de Resultado */}
                        <View className="bg-slate-50 rounded-2xl p-4 flex-row items-center justify-between border border-slate-100 mb-4">
                            <View>
                                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Resultado Final</Text>
                                <Text className="text-2xl text-slate-900 font-extrabold tracking-tight">{test.result}</Text>
                            </View>
                            {/* Icono decorativo */}
                            <View className="bg-white p-2 rounded-xl shadow-sm">
                                <CheckCircle2 size={20} color="#2563EB" />
                            </View>
                        </View>

                        {/* Botón Feedback (Condicional) */}
                        {test.hasFeedback && (
                        <Pressable className="w-full bg-purple-50 py-3.5 rounded-xl flex-row items-center justify-center active:bg-purple-100 border border-purple-100">
                            <MessageSquare size={16} color="#9333EA" style={{ marginRight: 8 }} />
                            <Text className="text-purple-700 font-bold text-sm">Ver Feedback Entrenador</Text>
                        </Pressable>
                        )}
                    </View>
                    ))}
                </View>
              )}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}