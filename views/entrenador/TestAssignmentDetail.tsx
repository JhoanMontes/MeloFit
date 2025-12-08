import React, { useState } from "react";
import {
    View, Text, ScrollView, Pressable, StatusBar, Modal, Alert, TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "TestAssignmentDetail">;

// 1. DEFINICIÓN DE INTERFAZ PARA EVITAR ERRORES DE TIPO
interface Participant {
    id: number;
    name: string;
    status: 'pending' | 'completed';
    result: string | null;
    level: string | null;
    obs: string;
    physical: {
        weight?: string;
        height?: string;
        age?: string; // Ahora usamos Edad en vez de Grasa
    };
    isDeficient: boolean;
}

// 2. DATOS MOCK TIPADOS
const initialParticipants: Participant[] = [
    { id: 1, name: 'Alex Johnson', status: 'pending', result: null, level: null, obs: '', physical: {}, isDeficient: false },
    {
        id: 2,
        name: 'Maria Garcia',
        status: 'completed',
        result: '2400 m',
        level: 'Avanzado',
        obs: 'Excelente resistencia aeróbica, mantuvo el ritmo constante. Superó su marca anterior.',
        physical: { weight: '62kg', height: '1.68m', age: '19 años' },
        isDeficient: false
    },
    { id: 3, name: 'David Lee', status: 'pending', result: null, level: null, obs: '', physical: {}, isDeficient: false },
    {
        id: 4,
        name: 'Sarah Miller',
        status: 'completed',
        result: '1400 m',
        level: 'Bajo',
        obs: 'Se fatigó muy rápido a los 5 minutos. Técnica de carrera deficiente.',
        physical: { weight: '70kg', height: '1.65m', age: '21 años' },
        isDeficient: true // Habilita el botón de reinicio
    },
    { id: 5, name: 'Jhonny Diaz', status: 'pending', result: null, level: null, obs: '', physical: {}, isDeficient: false },
];

export default function TestAssignmentDetail({ navigation, route }: Props) {
    const { testName, groupName, initialTab } = route.params || { testName: 'Test de Cooper', groupName: 'Grupo A' };

    // Estado tipado correctamente con <Participant[]>
    const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>(initialTab || 'pending');

    // Estado para el Modal
    const [selectedAthlete, setSelectedAthlete] = useState<Participant | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Listas filtradas
    const pendingList = participants.filter(p => p.status === 'pending');
    const completedList = participants.filter(p => p.status === 'completed');

    // Abrir modal
    const openDetails = (athlete: Participant) => {
        setSelectedAthlete(athlete);
        setModalVisible(true);
    };

    // Navegar a evaluar
    const handleEvaluate = (athlete: Participant) => {
        navigation.navigate('SendFeedback', {
            result: { athleteName: athlete.name, test: testName }
        });
    };

    // 3. LÓGICA DE REINICIO CORREGIDA
    const handleResetTest = () => {
        if (!selectedAthlete) return;

        Alert.alert(
            "Reiniciar Prueba",
            `¿Deseas invalidar el resultado de ${selectedAthlete.name} y enviarlo a pendientes?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sí, reiniciar",
                    style: 'destructive',
                    onPress: () => {
                        // Actualizamos la lista inmutanblemente
                        const updatedList = participants.map(p =>
                            p.id === selectedAthlete.id
                                ? {
                                    ...p,
                                    status: 'pending',
                                    result: null,
                                    level: null,
                                    isDeficient: false,
                                    // physical: {} // Descomenta si quieres borrar los datos físicos también
                                } as Participant
                                : p
                        );

                        setParticipants(updatedList);
                        setModalVisible(false);
                        setActiveTab('pending'); // Movemos la vista a pendientes automáticamente
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-[#F5F5F7]">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* --- MODAL DETALLE (BOTTOM SHEET) --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <Pressable className="flex-1" onPress={() => setModalVisible(false)} />

                    <View className="bg-white rounded-t-[32px] p-6 pb-10 shadow-2xl">
                        {/* Indicador visual */}
                        <View className="items-center mb-6">
                            <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
                        </View>

                        {selectedAthlete && (
                            <>
                                {/* Header del Modal */}
                                <View className="flex-row justify-between items-start mb-6">
                                    <View>
                                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Resultado Final</Text>
                                        <Text className="text-2xl font-bold text-slate-900">{selectedAthlete.name}</Text>
                                    </View>
                                    <View className={`px-3 py-1 rounded-full ${selectedAthlete.isDeficient ? 'bg-red-100' : 'bg-green-100'}`}>
                                        <Text className={`font-bold text-xs ${selectedAthlete.isDeficient ? 'text-red-700' : 'text-green-700'}`}>
                                            {selectedAthlete.level}
                                        </Text>
                                    </View>
                                </View>

                                {/* Resultado */}
                                <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 items-center mb-6">
                                    <Text className="text-slate-500 text-sm font-medium mb-1">Valor Registrado</Text>
                                    <Text className="text-4xl font-extrabold text-slate-900 tracking-tight">{selectedAthlete.result}</Text>
                                </View>

                                {/* Grid Datos Físicos (CON EDAD) */}
                                <Text className="font-bold text-slate-900 mb-3">Datos Físicos al evaluar</Text>
                                <View className="flex-row justify-between mb-6 gap-3">
                                    <View className="flex-1 bg-white border border-gray-200 p-3 rounded-xl items-center shadow-sm">
                                        <Text className="text-xs text-gray-500 mb-1">Peso</Text>
                                        <Text className="font-bold text-slate-800 text-lg">
                                            {selectedAthlete.physical.weight || '-'}
                                        </Text>
                                    </View>
                                    <View className="flex-1 bg-white border border-gray-200 p-3 rounded-xl items-center shadow-sm">
                                        <Text className="text-xs text-gray-500 mb-1">Altura</Text>
                                        <Text className="font-bold text-slate-800 text-lg">
                                            {selectedAthlete.physical.height || '-'}
                                        </Text>
                                    </View>
                                    <View className="flex-1 bg-white border border-gray-200 p-3 rounded-xl items-center shadow-sm">
                                        <Text className="text-xs text-gray-500 mb-1">Edad</Text>
                                        <Text className="font-bold text-slate-800 text-lg">
                                            {selectedAthlete.physical.age || '-'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Observaciones */}
                                <Text className="font-bold text-slate-900 mb-2">Observación del Entrenador</Text>
                                <View className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-8">
                                    <Text className="text-slate-700 italic leading-5">
                                        "{selectedAthlete.obs || 'Sin observaciones.'}"
                                    </Text>
                                </View>

                                {/* Botones de Acción */}
                                <View className="gap-3">
                                    {/* Solo mostrar REINICIAR si es deficiente */}
                                    {selectedAthlete.isDeficient && (
                                        <TouchableOpacity
                                            onPress={handleResetTest}
                                            className="w-full bg-red-50 py-4 rounded-xl flex-row justify-center items-center border border-red-100 active:bg-red-100"
                                        >
                                            <Ionicons name="refresh-circle" size={24} color="#DC2626" style={{ marginRight: 8 }} />
                                            <Text className="text-red-600 font-bold text-base">Reiniciar Prueba (Invalida)</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        onPress={() => setModalVisible(false)}
                                        className="w-full bg-slate-900 py-4 rounded-xl items-center active:bg-slate-800 shadow-lg shadow-slate-300"
                                    >
                                        <Text className="text-white font-bold text-base">Cerrar</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* --- PANTALLA PRINCIPAL --- */}
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
                        <Pressable onPress={() => setActiveTab('pending')} className={`flex-1 py-3 rounded-xl items-center justify-center ${activeTab === 'pending' ? 'bg-orange-50' : 'bg-transparent'}`}>
                            <Text className={`font-bold text-sm ${activeTab === 'pending' ? 'text-orange-700' : 'text-gray-500'}`}>Faltan ({pendingList.length})</Text>
                        </Pressable>
                        <Pressable onPress={() => setActiveTab('completed')} className={`flex-1 py-3 rounded-xl items-center justify-center ${activeTab === 'completed' ? 'bg-emerald-50' : 'bg-transparent'}`}>
                            <Text className={`font-bold text-sm ${activeTab === 'completed' ? 'text-emerald-700' : 'text-gray-500'}`}>Listos ({completedList.length})</Text>
                        </Pressable>
                    </View>
                </View>

                <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                    {activeTab === 'pending' ? (
                        // --- LISTA PENDIENTES ---
                        <View className="space-y-3">
                            {pendingList.map((item) => (
                                <View
                                    key={item.id}
                                    className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex-row justify-between items-center my-2"
                                >
                                    {/* Left side */}
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-11 h-11 bg-gray-100 rounded-full items-center justify-center shadow-sm">
                                            <Text className="font-bold text-gray-600 text-base">
                                                {item.name.charAt(0)}
                                            </Text>
                                        </View>

                                        <Text className="font-semibold text-slate-900 text-base">
                                            {item.name}
                                        </Text>
                                    </View>

                                    {/* Right side: button */}
                                    <Pressable
                                        onPress={() => handleEvaluate(item)}
                                        className="bg-blue-600 px-4 py-2 rounded-xl active:bg-blue-700 shadow-sm"
                                    >
                                        <Text className="text-white text-xs font-bold tracking-wide">
                                            Evaluar
                                        </Text>
                                    </Pressable>
                                </View>
                            ))}

                            {pendingList.length === 0 && (
                                <View className="items-center justify-center mt-10 opacity-50">
                                    <Ionicons name="checkmark-done-circle-outline" size={60} color="#9CA3AF" />
                                    <Text className="text-gray-400 mt-2 font-medium">¡Todos evaluados!</Text>
                                </View>
                            )}
                        </View>


                    ) : (
                        // --- LISTA COMPLETADOS ---
                        <View className="space-y-3">
                            {completedList.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => openDetails(item)}
                                    className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm active:bg-slate-50 my-2"
                                >
                                    {/* Top Row */}
                                    <View className="flex-row justify-between items-center mb-1">
                                        <View className="flex-row items-center gap-3">
                                            <View
                                                className={`w-11 h-11 rounded-full items-center justify-center shadow-sm
                        ${item.isDeficient ? 'bg-red-100' : 'bg-emerald-100'}`}
                                            >
                                                {item.isDeficient ? (
                                                    <Ionicons name="alert" size={20} color="#DC2626" />
                                                ) : (
                                                    <Ionicons name="checkmark" size={20} color="#059669" />
                                                )}
                                            </View>

                                            <View>
                                                <Text className="font-semibold text-slate-900 text-base leading-tight">
                                                    {item.name}
                                                </Text>
                                                <Text
                                                    className={`text-[11px] mt-0.5 ${item.isDeficient
                                                        ? 'text-red-600 font-semibold'
                                                        : 'text-slate-500'
                                                        }`}
                                                >
                                                    Nivel: {item.level}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="items-end">
                                            <Text className="font-extrabold text-slate-900 text-lg leading-none">
                                                {item.result}
                                            </Text>
                                            <Text className="text-[10px] text-blue-600 font-bold mt-1">
                                                Ver detalle
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}

                            {completedList.length === 0 && (
                                <Text className="text-center text-gray-400 mt-10 italic">
                                    Aún no has evaluado a nadie.
                                </Text>
                            )}
                        </View>


                    )}

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}