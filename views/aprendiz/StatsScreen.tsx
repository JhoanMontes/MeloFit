import React from "react";
import { View, Text, ScrollView, Pressable, Dimensions, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
  ArrowLeft, 
  TrendingUp, 
  Calendar, 
  Award, 
  Trophy, 
  Activity,
  BarChart2 
} from "lucide-react-native";
import { LineChart } from "react-native-gifted-charts"; 
import { AprendizStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AprendizStackParamList, "Stats">;

const performanceData = [
  { value: 65, label: '15 Sep' },
  { value: 70, label: '22 Sep' },
  { value: 72, label: '29 Sep' },
  { value: 75, label: '06 Oct' },
  { value: 80, label: '09 Oct' }
];

export default function StatsScreen({ navigation }: Props) {
  const screenWidth = Dimensions.get("window").width;

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* --- HEADER --- */}
        <View className="px-6 pt-4 pb-2">
          <Pressable 
            onPress={() => navigation.goBack()} 
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-200 mb-6 active:bg-slate-50"
          >
            <ArrowLeft size={22} color="#334155" />
          </Pressable>
          <Text className="text-slate-900 text-3xl font-extrabold tracking-tight">Estadísticas</Text>
          <Text className="text-slate-500 text-base font-medium mt-1">Tu evolución en números</Text>
        </View>

        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 pt-6">

            {/* --- SUMMARY CARDS (GRID) --- */}
            {/* Usamos flex-row y justify-between para asegurar distribución exacta */}
            <View className="flex-row justify-between mb-8">
              
              {/* Card 1: Pruebas */}
              <View className="bg-white rounded-[24px] p-4 w-[31%] shadow-sm border border-slate-100 items-center">
                <View className="bg-blue-50 p-2.5 rounded-xl mb-3">
                  <Activity size={20} color="#2563EB" />
                </View>
                <Text className="text-2xl font-extrabold text-slate-900 mb-0.5">12</Text>
                <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">Pruebas</Text>
              </View>

              {/* Card 2: Racha */}
              <View className="bg-white rounded-[24px] p-4 w-[31%] shadow-sm border border-slate-100 items-center">
                <View className="bg-orange-50 p-2.5 rounded-xl mb-3">
                  <Calendar size={20} color="#ea580c" />
                </View>
                <Text className="text-2xl font-extrabold text-slate-900 mb-0.5">28</Text>
                <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">Días Racha</Text>
              </View>

              {/* Card 3: Mejora */}
              <View className="bg-white rounded-[24px] p-4 w-[31%] shadow-sm border border-slate-100 items-center">
                <View className="bg-emerald-50 p-2.5 rounded-xl mb-3">
                  <TrendingUp size={20} color="#059669" />
                </View>
                <Text className="text-2xl font-extrabold text-slate-900 mb-0.5">+23%</Text>
                <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">Mejora</Text>
              </View>
            </View>

            {/* --- CHART CARD --- */}
            <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 mb-8">
              <View className="flex-row items-center justify-between mb-6">
                <View>
                    <Text className="text-slate-900 font-bold text-lg mb-1">Test de Cooper</Text>
                    <Text className="text-xs text-slate-400 font-medium uppercase tracking-wide">Progreso (metros)</Text>
                </View>
                <View className="bg-slate-50 p-2 rounded-xl">
                    <BarChart2 size={20} color="#64748b" />
                </View>
              </View>

              {/* Gráfico */}
              <View style={{ marginLeft: -14, overflow: 'visible' }}>
                <LineChart
                  data={performanceData}
                  color="#2563EB"
                  thickness={4}
                  dataPointsColor="#2563EB"
                  dataPointsRadius={6}
                  startFillColor="#2563EB"
                  endFillColor="#2563EB"
                  startOpacity={0.15}
                  endOpacity={0.01}
                  areaChart
                  curved
                  hideDataPoints={false}
                  showVerticalLines={false}
                  rulesType="dashed"
                  rulesColor="#e2e8f0"
                  yAxisColor="transparent"
                  xAxisColor="transparent"
                  yAxisTextStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}
                  xAxisLabelTextStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}
                  width={screenWidth - 84} // Ajuste preciso para padding
                  height={180}
                  spacing={56}
                  initialSpacing={24}
                  hideRules={false}
                />
              </View>

              {/* Insight Box */}
              <View className="mt-6 bg-blue-50 rounded-2xl p-4 border border-blue-100 flex-row items-start space-x-3">
                <Award size={20} color="#2563EB" style={{ marginTop: 2 }} />
                <Text className="text-sm text-blue-900 leading-5 flex-1">
                  ¡Increíble! Has aumentado tu resistencia en <Text className="font-bold">400 metros</Text> este mes. Sigue así. 🚀
                </Text>
              </View>
            </View>

            {/* --- PERSONAL RECORDS --- */}
            <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 mb-6">
              <View className="flex-row items-center mb-6 space-x-2">
                 <Trophy size={20} color="#ca8a04" />
                 <Text className="text-slate-900 text-lg font-bold">Récords Personales</Text>
              </View>
              
              <View className="space-y-4">
                {[
                  { exercise: 'Test de Cooper', record: '2850 m', date: '9 Oct', icon: '🏃' },
                  { exercise: 'Sentadilla', record: '100 kg × 8', date: '7 Oct', icon: '🏋️' },
                  { exercise: 'Peso Muerto', record: '120 kg × 6', date: '5 Oct', icon: '🔥' }
                ].map((pr, index) => (
                  <View 
                    key={index} 
                    className="flex-row items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
                  >
                    <View className="flex-row items-center space-x-4">
                        <View className="bg-white w-10 h-10 rounded-full items-center justify-center shadow-sm">
                            <Text className="text-lg">{pr.icon}</Text>
                        </View>
                        <View>
                            <Text className="text-slate-900 font-bold text-base">{pr.exercise}</Text>
                            <Text className="text-xs text-slate-400 font-bold uppercase mt-0.5">{pr.date}</Text>
                        </View>
                    </View>
                    <Text className="text-blue-600 font-extrabold text-lg tracking-tight">{pr.record}</Text>
                  </View>
                ))}
              </View>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}