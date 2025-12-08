import React, { useState } from "react";
import { 
  View, Text, ScrollView, Pressable, StatusBar, StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "AthleteDetail">;

// Mock Data
const pendingTests = [
    { id: 1, name: 'Test de Cooper', deadline: 'Hoy', status: 'Pendiente' },
    { id: 2, name: 'Sentadilla Max', deadline: 'Mañana', status: 'Pendiente' },
];

const historyTests = [
    { id: 10, name: 'Velocidad 100m', date: '01 Dic', result: '12.5s', score: 'Excelente' },
];

export default function AthleteDetail({ navigation, route }: Props) {
    const { athlete } = route.params || {};
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    // DATOS FÍSICOS MOCK (Deben venir de BD)
    const athleteStats = {
        age: '22 años',
        weight: '74 kg',
        height: '1.78 m',
        imc: '23.4'
    };

    const handleRegisterResult = (test: any) => {
        // Enviar a la pantalla de feedback con los datos de la prueba y el atleta
        navigation.navigate('SendFeedback', { 
            result: {
                athleteName: athlete?.name,
                test: test.name,
                // No mandamos resultado porque apenas se va a registrar
            } 
        });
    };

    return (
        <View className="flex-1 bg-[#F5F5F7]">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>

                {/* --- HEADER --- */}
                <View className="px-6 pt-4 pb-2">
                    <View className="flex-row items-center justify-between mb-4">
                        <Pressable onPress={() => navigation.goBack()} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 active:bg-gray-50">
                            <Ionicons name="arrow-back" size={20} color="#111827" />
                        </Pressable>
                        <View className="bg-green-100 px-3 py-1 rounded-full">
                            <Text className="text-green-700 text-xs font-bold uppercase">{athlete?.status || 'ACTIVO'}</Text>
                        </View>
                    </View>

                    {/* PERFIL */}
                    <View className="flex-row items-center gap-4 mb-4">
                        <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center border-2 border-white shadow-sm">
                            <Ionicons name="person" size={32} color="#2563EB" />
                        </View>
                        <View>
                            <Text className="text-gray-900 text-2xl font-bold">{athlete?.name || 'Nombre Atleta'}</Text>
                            <Text className="text-gray-500 text-sm font-medium">Nivel: {athlete?.level || 'Principiante'}</Text>
                        </View>
                    </View>

                    {/* DATOS FÍSICOS (Req 12) */}
                    <View className="flex-row justify-between bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-6">
                        <View className="items-center flex-1 border-r border-gray-100">
                            <Text className="text-gray-400 text-[10px] font-bold uppercase">Edad</Text>
                            <Text className="text-slate-900 font-bold">{athleteStats.age}</Text>
                        </View>
                        <View className="items-center flex-1 border-r border-gray-100">
                            <Text className="text-gray-400 text-[10px] font-bold uppercase">Peso</Text>
                            <Text className="text-slate-900 font-bold">{athleteStats.weight}</Text>
                        </View>
                        <View className="items-center flex-1">
                            <Text className="text-gray-400 text-[10px] font-bold uppercase">Altura</Text>
                            <Text className="text-slate-900 font-bold">{athleteStats.height}</Text>
                        </View>
                    </View>

                    {/* TABS */}
                    <View className="flex-row bg-white p-1 rounded-2xl mb-4 border border-gray-100">
                        <Pressable onPress={() => setActiveTab('pending')} className={`flex-1 py-3 rounded-xl items-center justify-center ${activeTab === 'pending' ? 'bg-blue-50' : 'bg-transparent'}`}>
                            <Text className={`font-bold text-sm ${activeTab === 'pending' ? 'text-blue-700' : 'text-gray-500'}`}>Pendientes</Text>
                        </Pressable>
                        <Pressable onPress={() => setActiveTab('history')} className={`flex-1 py-3 rounded-xl items-center justify-center ${activeTab === 'history' ? 'bg-blue-50' : 'bg-transparent'}`}>
                            <Text className={`font-bold text-sm ${activeTab === 'history' ? 'text-blue-700' : 'text-gray-500'}`}>Historial</Text>
                        </Pressable>
                    </View>
                </View>

                <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
                    {activeTab === 'pending' ? (
                        <View className="space-y-3">
                            {pendingTests.map((item) => (
                                <View key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-row justify-between items-center">
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-10 h-10 bg-orange-50 rounded-full items-center justify-center">
                                            <Ionicons name="time" size={20} color="#F97316" />
                                        </View>
                                        <View>
                                            <Text className="font-bold text-slate-900">{item.name}</Text>
                                            <Text className="text-xs text-slate-500">Vence: {item.deadline}</Text>
                                        </View>
                                    </View>
                                    
                                    {/* BOTÓN REGISTRAR RESULTADO */}
                                    <Pressable 
                                        onPress={() => handleRegisterResult(item)}
                                        className="bg-blue-600 px-4 py-2 rounded-xl active:bg-blue-700"
                                    >
                                        <Text className="text-white text-xs font-bold">Registrar</Text>
                                    </Pressable>
                                </View>
                            ))}
                            {pendingTests.length === 0 && (
                                <Text className="text-center text-gray-400 mt-4">No hay pruebas pendientes.</Text>
                            )}
                        </View>
                    ) : (
                        <View className="space-y-3">
                            {historyTests.map((item) => (
                                <View key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 opacity-80 flex-row justify-between items-center">
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center">
                                            <Ionicons name="checkmark" size={20} color="#10B981" />
                                        </View>
                                        <View>
                                            <Text className="font-bold text-slate-900">{item.name}</Text>
                                            <Text className="text-xs text-slate-500">{item.date}</Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="font-bold text-slate-900">{item.result}</Text>
                                        <Text className="text-xs text-emerald-600 font-bold">{item.score}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}