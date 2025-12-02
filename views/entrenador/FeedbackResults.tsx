import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
// USAMOS IONICONS (Seguro anti-crash)
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "FeedbackResults">;

// DATOS MOCK
const pendingResults = [
  { id: 1, athleteName: 'Alex Johnson', test: 'Test de Cooper', result: '2850m', time: 'Hace 2h', performance: 'Excelente', improvement: '+150m' },
  { id: 2, athleteName: 'Maria García', test: 'Sentadilla', result: '90kg × 8', time: 'Hace 5h', performance: 'Bueno', improvement: '+5kg' },
  { id: 3, athleteName: 'David Lee', test: 'Peso Muerto', result: '110kg × 6', time: 'Hace 1d', performance: 'Mejorable', improvement: '-2reps' },
  { id: 4, athleteName: 'Sarah Miller', test: 'Carrera 5km', result: '24:30', time: 'Hace 1d', performance: 'Excelente', improvement: '-1:15' },
];

const completedResults = [
  { id: 11, athleteName: 'Ana Martínez', test: 'Test de Cooper', result: '2700m', feedbackDate: 'Hace 3 días', feedbackSummary: 'Excelente progreso, mantén el ritmo...', performance: 'Excelente', rating: 5 },
  { id: 12, athleteName: 'Luis Fernández', test: 'Sentadilla', result: '95kg × 10', feedbackDate: 'Hace 4 días', feedbackSummary: 'Buena técnica, considera aumentar...', performance: 'Bueno', rating: 4 },
];

export default function FeedbackResults({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const filteredPending = pendingResults.filter(result =>
    result.athleteName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompleted = completedResults.filter(result =>
    result.athleteName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendFeedback = (result: any) => {
    navigation.navigate('SendFeedback', { result });
  };

  return (
    <View className="flex-1 bg-[#F5F5F7]">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          
          {/* --- HEADER --- */}
          <View className="bg-white px-6 pt-4 pb-4 rounded-b-[32px] shadow-sm mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Pressable 
                onPress={() => navigation.goBack()} 
                className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100 active:bg-slate-100"
              >
                <Ionicons name="arrow-back" size={20} color="#334155" />
              </Pressable>
              <Text className="text-xl font-bold text-slate-900">Gestión de Feedback</Text>
              <View className="w-10" />
            </View>

            {/* BUSCADOR */}
            <View className="relative">
              <View className="absolute left-4 top-3.5 z-10">
                <Ionicons name="search" size={20} color="#94A3B8" />
              </View>
              <TextInput
                placeholder="Buscar atleta..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <ScrollView 
            className="flex-1 px-6"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >

            {/* --- RESUMEN (TARJETAS LIMPIAS) --- */}
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1 bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex-row items-center justify-between">
                <View>
                  <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Pendientes</Text>
                  <Text className="text-3xl font-extrabold text-slate-900">{pendingResults.length}</Text>
                </View>
                <View className="w-10 h-10 bg-orange-50 rounded-full items-center justify-center">
                    <Ionicons name="time" size={20} color="#F97316" />
                </View>
              </View>

              <View className="flex-1 bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex-row items-center justify-between">
                <View>
                  <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Listos</Text>
                  <Text className="text-3xl font-extrabold text-slate-900">{completedResults.length}</Text>
                </View>
                <View className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center">
                    <Ionicons name="checkmark-done" size={20} color="#10B981" />
                </View>
              </View>
            </View>

            {/* --- TABS --- */}
            <View className="flex-row bg-slate-200/60 p-1 rounded-xl mb-6">
              <Pressable
                onPress={() => setActiveTab('pending')}
                className={`flex-1 py-2.5 rounded-lg items-center justify-center ${
                  activeTab === 'pending' ? 'bg-white shadow-sm' : 'bg-transparent'
                }`}
              >
                <Text className={`font-bold text-sm ${activeTab === 'pending' ? 'text-slate-900' : 'text-slate-500'}`}>
                  Por Revisar
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('completed')}
                className={`flex-1 py-2.5 rounded-lg items-center justify-center ${
                  activeTab === 'completed' ? 'bg-white shadow-sm' : 'bg-transparent'
                }`}
              >
                <Text className={`font-bold text-sm ${activeTab === 'completed' ? 'text-slate-900' : 'text-slate-500'}`}>
                  Historial
                </Text>
              </Pressable>
            </View>

            {/* --- LISTA PENDIENTES --- */}
            {activeTab === 'pending' && (
              <View className="space-y-4">
                {filteredPending.map((result) => (
                    <View key={result.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                      <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                                <Text className="font-bold text-blue-600 text-lg">{result.athleteName.charAt(0)}</Text>
                            </View>
                            <View>
                                <Text className="text-slate-900 font-bold text-base">{result.athleteName}</Text>
                                <Text className="text-slate-500 text-xs">{result.test}</Text>
                            </View>
                        </View>
                        <View className="bg-slate-100 px-2 py-1 rounded-md">
                            <Text className="text-[10px] font-bold text-slate-500">{result.time}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
                        <View className="flex-1 items-center border-r border-slate-200">
                            <Text className="text-xs text-slate-400 font-bold uppercase">Resultado</Text>
                            <Text className="text-slate-900 font-bold text-base">{result.result}</Text>
                        </View>
                        <View className="flex-1 items-center">
                            <Text className="text-xs text-slate-400 font-bold uppercase">Mejora</Text>
                            <Text className={`font-bold text-base ${result.improvement.includes('+') ? 'text-emerald-600' : 'text-slate-700'}`}>
                                {result.improvement}
                            </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => handleSendFeedback(result)}
                        className="w-full bg-blue-600 h-12 rounded-xl flex-row items-center justify-center shadow-md shadow-blue-200 active:scale-[0.98]"
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={18} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold">Dar Feedback</Text>
                      </Pressable>
                    </View>
                ))}
              </View>
            )}

            {/* --- LISTA COMPLETADOS --- */}
            {activeTab === 'completed' && (
              <View className="space-y-4">
                {filteredCompleted.map((result) => (
                    <View key={result.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 opacity-80">
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            </View>
                            <View>
                                <Text className="text-slate-900 font-bold text-base">{result.athleteName}</Text>
                                <Text className="text-slate-500 text-xs">{result.test} • {result.result}</Text>
                            </View>
                        </View>
                      </View>

                      <View className="bg-blue-50/50 p-3 rounded-xl mb-3 border-l-4 border-blue-400">
                         <Text className="text-slate-600 text-sm italic">"{result.feedbackSummary}"</Text>
                      </View>

                      <View className="flex-row justify-between items-center">
                         <View className="flex-row">
                            {[...Array(5)].map((_, i) => (
                                <Ionicons key={i} name="star" size={14} color={i < result.rating ? "#F59E0B" : "#E2E8F0"} />
                            ))}
                         </View>
                         <Text className="text-xs text-slate-400">{result.feedbackDate}</Text>
                      </View>
                    </View>
                ))}
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 16,
    color: '#0F172A'
  }
});