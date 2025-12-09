// TestAssignmentDetail.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
    View, Text, ScrollView, Pressable, StatusBar, Modal, Alert, TouchableOpacity, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "TestAssignmentDetail">;

// Interfaz para los niveles (debe coincidir con la estructura JSONB)
interface TestRange {
    id: number;
    nombre: string;
    min: number;
    max: number;
    color: string;
    bg: string;
    border: string;
}

interface Participant {
    id: number;
    name: string;
    status: 'pending' | 'completed';
    result: string | null;
    result_id: number | null; // <-- Nuevo: ID del resultado de prueba
    level: string | null;
    obs: string; // <-- Ahora contendrá el mensaje del comentario
    physical: {
        weight?: string | null;
        height?: string | null;
        age?: string | null;
    };
    isDeficient: boolean;
}

export default function TestAssignmentDetail({ navigation, route }: Props) {
    // params: acepta assignmentId (prueba_asignada_id), testName, groupName, initialTab
    const { testName = "Test", groupName = "Grupo", assignmentId, initialTab } = route.params || {};

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>(initialTab || 'pending');

    const [selectedAthlete, setSelectedAthlete] = useState<Participant | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    
    // --- NUEVO: Estado para almacenar los niveles de la prueba ---
    const [testLevels, setTestLevels] = useState<TestRange[]>([]);
    const [loadingLevels, setLoadingLevels] = useState(true);

    // helpers
    const calcAge = (birth?: string | null) => {
        if (!birth) return null;
        try {
            const bd = new Date(birth);
            const diff = Date.now() - bd.getTime();
            const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
            return `${age} años`;
        } catch {
            return null;
        }
    };
    
    // --- NUEVO: Función para calcular el nivel del resultado ---
    const calculateLevel = useCallback((value: string, levels: TestRange[]): string | null => {
        const val = parseFloat(value);
        if (isNaN(val) || !Array.isArray(levels) || levels.length === 0) return null;

        const found = levels.find(r => val >= r.min && val <= r.max);
        return found ? found.nombre : 'Fuera de Rango';
    }, []);

    // ----------------------------------------------------
    // 🔥 LÓGICA DE CARGA DE NIVELES (separada para reusar)
    // ----------------------------------------------------
    useEffect(() => {
        const fetchLevels = async () => {
            if (!assignmentId) return;

            try {
                // Obtener prueba_id desde prueba_asignada
                const { data: assignmentData, error: assignError } = await supabase
                    .from('prueba_asignada')
                    .select('prueba_id')
                    .eq('id', assignmentId)
                    .single();
                
                if (assignError || !assignmentData) throw assignError || new Error("Assignment not found.");

                const pruebaId = assignmentData.prueba_id;

                // Obtener la columna 'niveles' (JSONB) desde la tabla prueba
                const { data: testData, error: testError } = await supabase
                    .from('prueba')
                    .select('niveles')
                    .eq('id', pruebaId)
                    .single();

                if (testError || !testData) throw testError || new Error("Test levels not found.");

                const loadedLevels: TestRange[] = Array.isArray(testData.niveles) ? (testData.niveles as TestRange[]) : [];
                setTestLevels(loadedLevels);

            } catch (err) {
                console.error("Error fetching test levels:", err);
            } finally {
                setLoadingLevels(false);
            }
        };

        fetchLevels();
    }, [assignmentId]);


    // ------------------------------------------------------------------------
    // 🔥 LÓGICA PRINCIPAL DE CARGA DE PARTICIPANTES (Actualizada)
    // ------------------------------------------------------------------------
    useEffect(() => {
        let isActive = true;
        const load = async () => {
            if (loadingLevels) return; // Esperar a que se carguen los niveles

            setLoading(true);
            try {
                if (!assignmentId) {
                    Alert.alert("Error", "No se recibió assignmentId (prueba_asignada_id).");
                    setParticipants([]);
                    return;
                }

                // 1) Obtener filas de prueba_asignada_has_atleta para esta asignación
                const { data: assignedRows, error: assignedErr } = await supabase
                    .from("prueba_asignada_has_atleta")
                    .select("prueba_asignada_id, atleta_no_documento, grupo_codigo")
                    .eq("prueba_asignada_id", assignmentId);

                if (assignedErr) throw assignedErr;
                if (!assignedRows || assignedRows.length === 0) {
                    setParticipants([]);
                    return;
                }

                const athleteIds = Array.from(new Set(assignedRows.map((r: any) => r.atleta_no_documento)));

                // 2) Traer info de usuario (nombre) y atleta (peso,estatura,fecha_nacimiento)
                const { data: usuarios } = await supabase
                    .from("usuario")
                    .select("no_documento, nombre_completo")
                    .in("no_documento", athleteIds);

                const { data: atletas } = await supabase
                    .from("atleta")
                    .select("no_documento, estatura, peso, fecha_nacimiento")
                    .in("no_documento", athleteIds);

                // 3) Traer resultados (valor) y comentarios (mensaje)
                const { data: resultados } = await supabase
                    .from("resultado_prueba")
                    .select(`
                        id, 
                        atleta_no_documento, 
                        valor,
                        comentario ( mensaje )
                    `)
                    .eq("prueba_asignada_id", assignmentId);

                // Crear mapas por no_documento para acceso rápido
                const userMap: Record<number, any> = {};
                (usuarios || []).forEach((u: any) => { userMap[Number(u.no_documento)] = u; });

                const atletaMap: Record<number, any> = {};
                (atletas || []).forEach((a: any) => { atletaMap[Number(a.no_documento)] = a; });
                
                // Mapear resultados por atleta_no_documento
                const resultadoMap: Record<number, any> = {};
                (resultados || []).forEach((r: any) => { resultadoMap[Number(r.atleta_no_documento)] = r; });

                // 4) Armar participantes
                const built: Participant[] = assignedRows.map((row: any) => {
                    const id = Number(row.atleta_no_documento);
                    const u = userMap[id];
                    const at = atletaMap[id];
                    const res = resultadoMap[id];
                    
                    const fullName = u?.nombre_completo ?? `Atleta ${id}`;
                    const resultVal = res?.valor ?? null;
                    const resultId = res?.id ?? null; // <-- Nuevo ID de resultado

                    // 🔥 CLASIFICAR NIVEL Y OBTENER COMENTARIO
                    const level = resultVal ? calculateLevel(resultVal, testLevels) : null;
                    const obs = res?.comentario?.[0]?.mensaje ?? ''; // Extrae el mensaje del comentario (array de 1)
                    
                    // Lógica de deficiencia (ejemplo: si el nivel es 'Bajo' o 'Principiante')
                    // Esto depende de cómo definas el nivel "deficiente" en tus TestRange
                    const isDeficient = level && level.toLowerCase().includes('principiante'); 

                    return {
                        id,
                        name: fullName,
                        status: resultVal ? 'completed' : 'pending',
                        result: resultVal,
                        result_id: resultId, // <-- Nuevo campo
                        level, // <-- Campo calculado
                        obs, // <-- Campo obtenido del comentario
                        physical: {
                            weight: at?.peso ? `${at.peso}kg` : null,
                            height: at?.estatura ? `${at.estatura}m` : null,
                            age: calcAge(at?.fecha_nacimiento ?? null)
                        },
                        isDeficient
                    } as Participant;
                });

                if (isActive) {
                    setParticipants(built);
                    const hasCompleted = built.some(p => p.status === 'completed');
                    const hasPending = built.some(p => p.status === 'pending');
                    
                    if (initialTab) {
                         setActiveTab(initialTab);
                    } else {
                        // Asegura que la pestaña activa tenga contenido, si es posible.
                        setActiveTab(hasPending ? 'pending' : (hasCompleted ? 'completed' : 'pending'));
                    }
                }
            } catch (err) {
                console.error("Error cargando participantes:", err);
                Alert.alert("Error", "No se pudieron cargar los participantes. Revisa la consola.");
                setParticipants([]);
            } finally {
                if (isActive) setLoading(false);
            }
        };

        load();
        return () => { isActive = false; };
    }, [assignmentId, loadingLevels, calculateLevel]); // Dependencia de loadingLevels y calculateLevel

    // Filtrados
    const pendingList = participants.filter(p => p.status === 'pending');
    const completedList = participants.filter(p => p.status === 'completed');

    const openDetails = (athlete: Participant) => {
        setSelectedAthlete(athlete);
        setModalVisible(true);
    };

    const handleEvaluate = (athlete: Participant) => {
        navigation.navigate('SendFeedback', {
            result: {
                athleteId: athlete.id,
                athleteName: athlete.name,
                test: testName,
                assignmentId,

                // 🔥 ENVIAR DATOS FÍSICOS
                weight: athlete.physical.weight,
                height: athlete.physical.height,
                age: athlete.physical.age
            }
        });
    };


    const handleResetTest = async () => {
        if (!selectedAthlete) return;

        Alert.alert(
            "Reiniciar Prueba",
            `¿Deseas invalidar el resultado de ${selectedAthlete.name} y enviarlo a pendientes? Se eliminarán el resultado y los comentarios asociados.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sí, reiniciar",
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // La eliminación en 'resultado_prueba' debe eliminar en cascada
                            // los comentarios si configuraste la FK en tu BD para DELETE CASCADE.
                            // Asumo que sí, pero si no, debes eliminarlos explícitamente primero.
                            const { error } = await supabase
                                .from('resultado_prueba')
                                .delete()
                                .eq('prueba_asignada_id', assignmentId)
                                .eq('atleta_no_documento', selectedAthlete.id);

                            if (error) throw error;

                            // Refrescar lista local
                            const updated = participants.map(p =>
                                p.id === selectedAthlete.id
                                    ? { ...p, status: 'pending', result: null, result_id: null, level: null, obs: '', isDeficient: false }
                                    : p
                            );
                            setParticipants(updated);
                            setModalVisible(false);
                            setActiveTab('pending');
                        } catch (err) {
                            console.error("Error reiniciando resultado:", err);
                            Alert.alert("Error", "No se pudo reiniciar el resultado. Asegúrate de que los comentarios también se eliminen.");
                        }
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-[#F5F5F7]">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Modal detalle */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <Pressable className="flex-1" onPress={() => setModalVisible(false)} />

                    <View className="bg-white rounded-t-[32px] p-6 pb-10 shadow-2xl">
                        <View className="items-center mb-6"><View className="w-12 h-1.5 bg-gray-300 rounded-full" /></View>

                        {selectedAthlete && (
                            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '80%' }}>
                                <View className="flex-row justify-between items-start mb-6">
                                    <View>
                                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Resultado Final</Text>
                                        <Text className="text-2xl font-bold text-slate-900">{selectedAthlete.name}</Text>
                                    </View>
                                    
                                    {/* 🔥 MOSTRAR NIVEL DE CLASIFICACIÓN */}
                                    <View className={`px-3 py-1 rounded-full ${selectedAthlete.isDeficient ? 'bg-red-100' : 'bg-green-100'}`}>
                                        <Text className={`font-bold text-xs ${selectedAthlete.isDeficient ? 'text-red-700' : 'text-green-700'}`}>
                                            {selectedAthlete.level ?? 'Nivel Desconocido'}
                                        </Text>
                                    </View>
                                </View>

                                <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 items-center mb-6">
                                    <Text className="text-slate-500 text-sm font-medium mb-1">Valor Registrado</Text>
                                    <Text className="text-4xl font-extrabold text-slate-900 tracking-tight">{selectedAthlete.result ?? '-'}</Text>
                                </View>

                                <Text className="font-bold text-slate-900 mb-3">Datos Físicos al evaluar</Text>
                                <View className="flex-row justify-between mb-6 gap-3">
                                    <View className="flex-1 bg-white border border-gray-200 p-3 rounded-xl items-center shadow-sm">
                                        <Text className="text-xs text-gray-500 mb-1">Peso</Text>
                                        <Text className="font-bold text-slate-800 text-lg">{selectedAthlete.physical.weight ?? '-'}</Text>
                                    </View>
                                    <View className="flex-1 bg-white border border-gray-200 p-3 rounded-xl items-center shadow-sm">
                                        <Text className="text-xs text-gray-500 mb-1">Altura</Text>
                                        <Text className="font-bold text-slate-800 text-lg">{selectedAthlete.physical.height ?? '-'}</Text>
                                    </View>
                                    <View className="flex-1 bg-white border border-gray-200 p-3 rounded-xl items-center shadow-sm">
                                        <Text className="text-xs text-gray-500 mb-1">Edad</Text>
                                        <Text className="font-bold text-slate-800 text-lg">{selectedAthlete.physical.age ?? '-'}</Text>
                                    </View>
                                </View>

                                {/* 🔥 MOSTRAR COMENTARIO */}
                                <Text className="font-bold text-slate-900 mb-2">Observación del Entrenador</Text>
                                <View className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-8">
                                    <Text className="text-slate-700 italic leading-5">"{selectedAthlete.obs || 'El entrenador no dejó observaciones.'}"</Text>
                                </View>

                                <View className="gap-3">
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
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Pantalla principal */}
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
                    {loading || loadingLevels ? (
                        <View className="items-center mt-20">
                            <ActivityIndicator size="large" color="#2563EB" />
                            <Text className="text-gray-500 mt-2">Cargando participantes y niveles...</Text>
                        </View>
                    ) : (
                        <>
                            {activeTab === 'pending' ? (
                                <View className="space-y-3">
                                    {pendingList.map((item) => (
                                        <View
                                            key={item.id}
                                            className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex-row justify-between items-center my-2"
                                        >
                                            <View className="flex-row items-center gap-3">
                                                <View className="w-11 h-11 bg-gray-100 rounded-full items-center justify-center shadow-sm">
                                                    <Text className="font-bold text-gray-600 text-base">{item.name.charAt(0)}</Text>
                                                </View>
                                                <Text className="font-semibold text-slate-900 text-base">{item.name}</Text>
                                            </View>

                                            <Pressable
                                                onPress={() => handleEvaluate(item)}
                                                className="bg-blue-600 px-4 py-2 rounded-xl active:bg-blue-700 shadow-sm"
                                            >
                                                <Text className="text-white text-xs font-bold tracking-wide">Evaluar</Text>
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
                                <View className="space-y-3">
                                    {completedList.map((item) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            onPress={() => openDetails(item)}
                                            className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm active:bg-slate-50 my-2"
                                        >
                                            <View className="flex-row justify-between items-center mb-1">
                                                <View className="flex-row items-center gap-3">
                                                    <View className={`w-11 h-11 rounded-full items-center justify-center shadow-sm ${item.isDeficient ? 'bg-red-100' : 'bg-emerald-100'}`}>
                                                        {item.isDeficient ? <Ionicons name="alert" size={20} color="#DC2626" /> : <Ionicons name="checkmark" size={20} color="#059669" />}
                                                    </View>

                                                    <View>
                                                        <Text className="font-semibold text-slate-900 text-base leading-tight">{item.name}</Text>
                                                        {/* 🔥 MOSTRAR NIVEL EN LA LISTA */}
                                                        <Text className={`text-[11px] mt-0.5 ${item.isDeficient ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                                                            Nivel: <Text className="font-bold text-slate-600">{item.level ?? '-'}</Text>
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View className="items-end">
                                                    <Text className="font-extrabold text-slate-900 text-lg leading-none">{item.result ?? '-'}</Text>
                                                    <Text className="text-[10px] text-blue-600 font-bold mt-1">Ver detalle</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}

                                    {completedList.length === 0 && (
                                        <Text className="text-center text-gray-400 mt-10 italic">Aún no has evaluado a nadie.</Text>
                                    )}
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}