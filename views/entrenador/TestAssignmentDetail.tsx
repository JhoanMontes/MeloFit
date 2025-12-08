import React, { useState } from "react";
import { 
  View, Text, ScrollView, Pressable, StatusBar, StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "TestAssignmentDetail">;

// Mock de participantes
const participants = [
  { id: 1, name: 'Alex Johnson', status: 'pending', result: null },
  { id: 2, name: 'Maria Garcia', status: 'completed', result: '2400 m', level: 'Avanzado' },
  { id: 3, name: 'David Lee', status: 'pending', result: null },
  { id: 4, name: 'Sarah Miller', status: 'completed', result: '1800 m', level: 'Principiante' },
  { id: 5, name: 'Jhonny Diaz', status: 'pending', result: null },
];

export default function TestAssignmentDetail({ navigation, route }: Props) {
  // Recibimos initialTab (si no viene, por defecto es 'pending')
  const { testName, groupName, initialTab } = route.params || { testName: 'Prueba', groupName: 'Grupo' };
  
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>(initialTab || 'pending');

  const pendingList = participants.filter(p => p.status === 'pending');
  const completedList = participants.filter(p => p.status === 'completed');

  const handleEvaluate = (athlete: any) => {
    navigation.navigate('SendFeedback', { 
        result: { 
            athleteName: athlete.name, 
            test: testName,
        } 
    });
  };

  return (
    <View className="flex-1 bg-[#F5F5F7]">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* HEADER */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center mb-4">
            <Pressable onPress={() => navigation.goBack()} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 active:bg-gray-50 mr-4">
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </Pressable>
            <View>
                <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider">{groupName}</Text>
                <Text className="text-gray-900 text-2xl font-bold">{testName}</Text>
            </View>
          </View>

          {/* TABS */}
          <View className="flex-row bg-white p-1 rounded-2xl mb-4 border border-gray-100 shadow-sm">
              <Pressable
                onPress={() => setActiveTab('pending')}
                className={`flex-1 py-3 rounded-xl items-center justify-center ${activeTab === 'pending' ? 'bg-orange-50' : 'bg-transparent'}`}
              >
                <Text className={`font-bold text-sm ${activeTab === 'pending' ? 'text-orange-700' : 'text-gray-500'}`}>
                  Faltan ({pendingList.length})
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('completed')}
                className={`flex-1 py-3 rounded-xl items-center justify-center ${activeTab === 'completed' ? 'bg-emerald-50' : 'bg-transparent'}`}
              >
                <Text className={`font-bold text-sm ${activeTab === 'completed' ? 'text-emerald-700' : 'text-gray-500'}`}>
                  Listos ({completedList.length})
                </Text>
              </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
            
            {activeTab === 'pending' ? (
                <View className="space-y-3">
                    {pendingList.map((item) => (
                        <View key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-row justify-between items-center">
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                                    <Text className="font-bold text-gray-600">{item.name.charAt(0)}</Text>
                                </View>
                                <Text className="font-bold text-slate-900 text-base">{item.name}</Text>
                            </View>
                            <Pressable 
                                onPress={() => handleEvaluate(item)}
                                className="bg-blue-600 px-4 py-2 rounded-xl active:bg-blue-700"
                            >
                                <Text className="text-white text-xs font-bold">Evaluar</Text>
                            </Pressable>
                        </View>
                    ))}
                    {pendingList.length === 0 && <Text className="text-center text-gray-400 mt-10">¡Todos evaluados!</Text>}
                </View>
            ) : (
                <View className="space-y-3">
                    {completedList.map((item) => (
                        <View key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 opacity-90 flex-row justify-between items-center">
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 bg-emerald-100 rounded-full items-center justify-center">
                                    <Ionicons name="checkmark" size={18} color="#059669" />
                                </View>
                                <View>
                                    <Text className="font-bold text-slate-900 text-base">{item.name}</Text>
                                    <Text className="text-xs text-slate-500">Nivel: {item.level}</Text>
                                </View>
                            </View>
                            <Text className="font-extrabold text-slate-900 text-lg">{item.result}</Text>
                        </View>
                    ))}
                </View>
            )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}