import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, Search, MessageSquare, CheckCircle2, Clock, TrendingUp, Filter } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient"; // Asegúrate de tener instalado expo-linear-gradient
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "FeedbackResults">;

// DATOS MOCK
const pendingResults = [
  { id: 1, athleteName: 'Alex Johnson', athleteAvatar: '👨', test: 'Test de Cooper', result: '2850m', time: 'Hace 2 horas', performance: 'Excelente', improvement: '+150m' },
  { id: 2, athleteName: 'Maria García', athleteAvatar: '👩', test: 'Sentadilla', result: '90 kg × 8 reps', time: 'Hace 5 horas', performance: 'Bueno', improvement: '+5 kg' },
  { id: 3, athleteName: 'David Lee', athleteAvatar: '👨', test: 'Peso Muerto', result: '110 kg × 6 reps', time: 'Hace 1 día', performance: 'Mejorable', improvement: '-2 reps' },
  { id: 4, athleteName: 'Sarah Miller', athleteAvatar: '👩', test: 'Carrera 5km', result: '24:30', time: 'Hace 1 día', performance: 'Excelente', improvement: '-1:15' },
];

const completedResults = [
  { id: 11, athleteName: 'Ana Martínez', athleteAvatar: '👩', test: 'Test de Cooper', result: '2700m', feedbackDate: 'Hace 3 días', feedbackSummary: 'Excelente progreso, mantén el ritmo...', performance: 'Excelente', rating: 5 },
  { id: 12, athleteName: 'Luis Fernández', athleteAvatar: '👨', test: 'Sentadilla', result: '95 kg × 10 reps', feedbackDate: 'Hace 4 días', feedbackSummary: 'Buena técnica, considera aumentar...', performance: 'Bueno', rating: 4 },
];

const performanceColors: Record<string, { bg: string, text: string, border: string }> = {
  'Excelente': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  'Bueno': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'Mejorable': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
};

export default function FeedbackResults({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const filteredPending = pendingResults.filter(result =>
    result.athleteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.test.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompleted = completedResults.filter(result =>
    result.athleteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.test.toLowerCase().includes(searchQuery.toLowerCase())
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
          <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center mb-6">
              <Pressable 
                onPress={() => navigation.goBack()} 
                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-200 mr-4 active:bg-slate-50"
              >
                <ArrowLeft size={22} color="#334155" />
              </Pressable>
              <View>
                <Text className="text-slate-900 text-2xl font-extrabold tracking-tight">Gestión de Feedback</Text>
                <Text className="text-slate-500 text-sm font-medium">Revisa resultados recientes</Text>
              </View>
            </View>

            {/* Search Bar */}
            <View className="relative mb-2">
              <View className="absolute left-4 top-3.5 z-10">
                <Search size={20} color="#9CA3AF" />
              </View>
              <TextInput
                placeholder="Buscar por atleta o prueba..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="bg-white border border-gray-200 rounded-2xl h-12 pl-12 pr-4 text-base text-gray-900 shadow-sm shadow-slate-200/50"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <ScrollView 
            className="flex-1 px-6 pt-2"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >

            {/* --- STATS CARDS --- */}
            <View className="flex-row gap-4 mb-6">
              <LinearGradient
                colors={['#F97316', '#EA580C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1 rounded-3xl p-5 shadow-lg shadow-orange-500/30"
                style={{ borderRadius: 24 }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="bg-white/20 p-1.5 rounded-xl">
                    <Clock size={16} color="white" />
                  </View>
                  <Text className="text-orange-50 text-xs font-bold uppercase">Pendientes</Text>
                </View>
                <Text className="text-white text-3xl font-extrabold">{pendingResults.length}</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1 rounded-3xl p-5 shadow-lg shadow-emerald-500/30"
                style={{ borderRadius: 24 }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="bg-white/20 p-1.5 rounded-xl">
                    <CheckCircle2 size={16} color="white" />
                  </View>
                  <Text className="text-emerald-50 text-xs font-bold uppercase">Completados</Text>
                </View>
                <Text className="text-white text-3xl font-extrabold">{completedResults.length}</Text>
              </LinearGradient>
            </View>

            {/* --- TABS --- */}
            <View className="flex-row bg-white p-1 rounded-2xl mb-6 shadow-sm border border-gray-100">
              <Pressable
                onPress={() => setActiveTab('pending')}
                className={`flex-1 py-3 rounded-xl items-center justify-center transition-all ${
                  activeTab === 'pending' ? 'bg-blue-600 shadow-sm' : 'bg-transparent'
                }`}
              >
                <Text className={`font-bold text-sm ${activeTab === 'pending' ? 'text-white' : 'text-gray-500'}`}>
                  Pendientes ({filteredPending.length})
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('completed')}
                className={`flex-1 py-3 rounded-xl items-center justify-center transition-all ${
                  activeTab === 'completed' ? 'bg-blue-600 shadow-sm' : 'bg-transparent'
                }`}
              >
                <Text className={`font-bold text-sm ${activeTab === 'completed' ? 'text-white' : 'text-gray-500'}`}>
                  Completados ({filteredCompleted.length})
                </Text>
              </Pressable>
            </View>

            {/* --- CONTENT: PENDING --- */}
            {activeTab === 'pending' && (
              <View className="space-y-4">
                {filteredPending.map((result) => {
                  const colors = performanceColors[result.performance] || performanceColors['Bueno'];
                  return (
                    <View key={result.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                      
                      <View className="flex-row items-start gap-4 mb-4">
                        <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                          <Text className="text-xl">{result.athleteAvatar}</Text>
                        </View>
                        <View className="flex-1">
                          <View className="flex-row justify-between items-start">
                            <Text className="text-gray-900 font-bold text-base">{result.athleteName}</Text>
                            <View className={`px-2.5 py-1 rounded-full border ${colors.bg} ${colors.border}`}>
                              <Text className={`text-[10px] font-bold ${colors.text} uppercase`}>{result.performance}</Text>
                            </View>
                          </View>
                          <Text className="text-gray-500 text-sm mt-0.5">{result.test}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-4 mb-4 bg-gray-50 p-3 rounded-2xl">
                        <View className="flex-row items-center gap-1.5">
                          <TrendingUp size={16} color="#4B5563" />
                          <Text className="text-gray-900 font-bold">{result.result}</Text>
                        </View>
                        <View className="h-4 w-[1px] bg-gray-300" />
                        <Text className={`${result.improvement.startsWith('+') ? 'text-green-600' : 'text-orange-600'} font-bold text-sm`}>
                          {result.improvement}
                        </Text>
                        <View className="flex-1 items-end">
                          <Text className="text-xs text-gray-400">{result.time}</Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => handleSendFeedback(result)}
                        className="w-full bg-blue-600 h-12 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 active:scale-[0.98]"
                      >
                        <MessageSquare size={18} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold">Enviar Feedback</Text>
                      </Pressable>
                    </View>
                  );
                })}
                {filteredPending.length === 0 && (
                  <View className="items-center py-10">
                    <CheckCircle2 size={48} color="#CBD5E1" />
                    <Text className="text-gray-400 mt-2 font-medium">¡Todo al día!</Text>
                  </View>
                )}
              </View>
            )}

            {/* --- CONTENT: COMPLETED --- */}
            {activeTab === 'completed' && (
              <View className="space-y-4">
                {filteredCompleted.map((result) => {
                  const colors = performanceColors[result.performance] || performanceColors['Bueno'];
                  return (
                    <View key={result.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 opacity-90">
                      
                      <View className="flex-row items-start gap-4 mb-3">
                        <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                          <Text className="text-xl">{result.athleteAvatar}</Text>
                        </View>
                        <View className="flex-1">
                          <View className="flex-row justify-between items-start">
                            <Text className="text-gray-900 font-bold text-base">{result.athleteName}</Text>
                            <View className="flex-row gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <View key={i} className={`w-1.5 h-1.5 rounded-full ${i < result.rating ? 'bg-blue-500' : 'bg-gray-200'}`} />
                              ))}
                            </View>
                          </View>
                          <Text className="text-gray-500 text-sm mt-0.5">{result.test} • {result.result}</Text>
                        </View>
                      </View>

                      <View className="bg-blue-50/50 p-3 rounded-2xl mb-3 border border-blue-100">
                        <View className="flex-row gap-2">
                          <MessageSquare size={14} color="#3B82F6" style={{ marginTop: 2 }} />
                          <Text className="text-gray-600 text-sm flex-1 italic">"{result.feedbackSummary}"</Text>
                        </View>
                      </View>

                      <View className="flex-row justify-between items-center">
                        <View className={`px-2.5 py-1 rounded-full border ${colors.bg} ${colors.border}`}>
                          <Text className={`text-[10px] font-bold ${colors.text} uppercase`}>{result.performance}</Text>
                        </View>
                        <Text className="text-xs text-gray-400">{result.feedbackDate}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}