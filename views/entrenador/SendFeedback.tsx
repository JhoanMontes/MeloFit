import React, { useState, useEffect } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    Pressable, 
    ScrollView, 
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Alert,
    ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "SendFeedback">;

// --- INTERFAZ AJUSTADA para tipar el JSONB de niveles de la BD ---
interface TestRange {
    id: number;
    nombre: string; // <--- USAMOS 'nombre' para que coincida con tu JSONB de niveles
    min: number;
    max: number;
    color: string; // Tailwind class
    bg: string; // Tailwind class
    border: string; // Tailwind class
}

// --- MOCK DE NIVELES (USANDO 'nombre' y ajustando a la interfaz) ---
const testRangesMock: TestRange[] = [
    { id: 1, nombre: 'Principiante', min: 0, max: 10, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
    { id: 2, nombre: 'Intermedio', min: 11, max: 20, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 3, nombre: 'Avanzado', min: 21, max: 30, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { id: 4, nombre: 'Elite', min: 31, max: 999, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];


export default function SendFeedback({ navigation, route }: Props) {
    const { result } = route.params || {};

    const athleteId = result?.athleteId;
    const athleteName = result?.athleteName || "Jhonny Diaz"; 
    const assignmentId = result?.assignmentId;
    const testName = result?.test || "Prueba";

    const athleteData = {
        name: athleteName,
        weight: result?.weight || "—", 
        height: result?.height || "—",
        age: result?.age || "—"
    };

    // ESTADOS
    const [metricValue, setMetricValue] = useState('');
    const [comments, setComments] = useState('');
    const [testRanges, setTestRanges] = useState<TestRange[]>(testRangesMock); 
    const [calculatedLevel, setCalculatedLevel] = useState<TestRange | null>(null);
    const [saving, setSaving] = useState(false);
    const [loadingLevels, setLoadingLevels] = useState(true); 

    const getLocalYYYYMMDD = (date: Date) => {
        const tzOff = date.getTimezoneOffset() * 60000;
        const local = new Date(date.getTime() - tzOff);
        return local.toISOString().split('T')[0];
    };
    
    // ----------------------------------------------------
    // LÓGICA DE CARGA DE NIVELES DESDE SUPABASE
    // ----------------------------------------------------
    useEffect(() => {
        const fetchTestLevels = async () => {
            if (!assignmentId) {
                setLoadingLevels(false);
                return;
            }

            try {
                // 1. Obtener el prueba_id desde prueba_asignada
                const { data: assignmentData, error: assignError } = await supabase
                    .from('prueba_asignada')
                    .select('prueba_id')
                    .eq('id', assignmentId)
                    .single();

                if (assignError || !assignmentData) throw assignError || new Error("Assignment not found.");

                const pruebaId = assignmentData.prueba_id;

                // 2. Obtener la columna 'niveles' (JSONB) desde la tabla prueba
                const { data: testData, error: testError } = await supabase
                    .from('prueba')
                    .select('niveles')
                    .eq('id', pruebaId)
                    .single();

                if (testError || !testData) throw testError || new Error("Test levels not found.");

                // Validamos que 'niveles' sea un array antes de usarlo
                const loadedLevels = Array.isArray(testData.niveles) ? (testData.niveles as TestRange[]) : [];
                
                if(loadedLevels.length > 0) {
                    setTestRanges(loadedLevels);
                } else {
                    setTestRanges(testRangesMock);
                }

            } catch (err) {
                console.error("Error fetching test levels, using mock data:", err);
            } finally {
                setLoadingLevels(false);
            }
        };

        fetchTestLevels();
    }, [assignmentId]);


    // LÓGICA: Iluminar la tabla según lo que escribe el entrenador
    useEffect(() => {
        const val = parseFloat(metricValue);
        if (!isNaN(val) && Array.isArray(testRanges)) {
            const found = testRanges.find(r => val >= r.min && val <= r.max);
            setCalculatedLevel(found || null);
        } else {
            setCalculatedLevel(null);
        }
    }, [metricValue, testRanges]); 

    // Envío a Supabase (VERSIÓN ORIGINAL Y SEGURA)
    const saveResultToSupabase = async () => {
        if (!assignmentId || !athleteId || !metricValue.trim()) {
            Alert.alert("Error", "Faltan datos requeridos.");
            return;
        }

        setSaving(true);
        try {
            const today = getLocalYYYYMMDD(new Date());

            const { error } = await supabase
                .from("resultado_prueba")
                .insert({
                    prueba_asignada_id: assignmentId,
                    atleta_no_documento: athleteId,
                    fecha_realizacion: today,
                    valor: metricValue.trim()
                });

            if (error) throw error;

            Alert.alert("Éxito", "Resultado registrado correctamente.", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (err: any) {
            console.error("Error saving result:", err);
            const message = err?.message || "Ocurrió un error al guardar el resultado.";
            Alert.alert("Error", message);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = () => {
        if (!metricValue.trim()) {
            Alert.alert("Falta el resultado", "Debes ingresar el valor obtenido por el atleta.");
            return;
        }
        // Usamos level.nombre para la clasificación
        const nivelFinal = calculatedLevel ? calculatedLevel.nombre : "Sin Clasificación";

        Alert.alert(
            "¿Registrar Resultado?", 
            `Atleta: ${athleteData.name}\nResultado: ${metricValue.trim()}\nClasificación: ${nivelFinal}`, 
            [
                { text: "Corregir", style: "cancel" },
                { 
                    text: "Confirmar", 
                    onPress: saveResultToSupabase 
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-[#F5F5F7]">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                    
                    {/* --- HEADER --- */}
                    <View className="px-6 pt-4 pb-2">
                        <Pressable 
                            onPress={() => navigation.goBack()} 
                            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm mb-4 border border-gray-100 active:bg-gray-50"
                        >
                            <Ionicons name="arrow-back" size={20} color="#111827" />
                        </Pressable>
                        
                        <Text className="text-gray-900 text-3xl font-bold mb-1">Registrar Resultado</Text>
                        <Text className="text-gray-500 text-base font-medium">
                            Evaluando: <Text className="text-blue-600 font-bold">{testName}</Text>
                        </Text>
                    </View>

                    <ScrollView 
                        className="flex-1 px-6 pt-6" 
                        contentContainerStyle={{ paddingBottom: 120 }}
                        showsVerticalScrollIndicator={false}
                    >
                        
                        {/* TARJETA 1: DATOS DEL ATLETA */}
                        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                            <View className="flex-row items-center gap-3 mb-4">
                                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                                    <Ionicons name="person" size={20} color="#2563EB" />
                                </View>
                                <View>
                                    <Text className="text-lg font-bold text-slate-900">{athleteData.name}</Text>
                                    <Text className="text-xs text-slate-400 font-bold uppercase">Datos Físicos</Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <View className="items-center flex-1 border-r border-slate-200">
                                    <Text className="text-xs text-slate-400 uppercase font-bold">Peso</Text>
                                    <Text className="text-slate-900 font-bold text-base">{athleteData.weight}</Text>
                                </View>
                                <View className="items-center flex-1 border-r border-slate-200">
                                    <Text className="text-xs text-slate-400 uppercase font-bold">Altura</Text>
                                    <Text className="text-slate-900 font-bold text-base">{athleteData.height}</Text>
                                </View>
                                <View className="items-center flex-1">
                                    <Text className="text-xs text-slate-400 uppercase font-bold">Edad</Text>
                                    <Text className="text-slate-900 font-bold text-base">{athleteData.age}</Text>
                                </View>
                            </View>
                        </View>

                        {/* TARJETA 2: INGRESO DE RESULTADO */}
                        <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 items-center">
                            <Text className="text-gray-900 font-bold text-lg mb-2">Ingresa el Valor</Text>
                            <Text className="text-gray-400 text-xs mb-4 text-center">
                                Escribe el resultado obtenido por el atleta
                            </Text>
                            
                            <View className="flex-row items-end justify-center w-full mb-4">
                                <TextInput 
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={metricValue}
                                    onChangeText={setMetricValue}
                                    style={styles.bigInput} 
                                    placeholderTextColor="#E2E8F0"
                                />
                                <Text className="text-gray-400 font-bold text-xl mb-4 ml-2">
                                    Unit
                                </Text>
                            </View>

                            {calculatedLevel && (
                                <View className={`px-4 py-2 rounded-full ${calculatedLevel.bg} border ${calculatedLevel.border}`}>
                                    {/* USAMOS level.nombre AQUÍ */}
                                    <Text className={`font-bold text-sm ${calculatedLevel.color}`}>
                                        CLASIFICACIÓN: {calculatedLevel.nombre.toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* TARJETA 3: TABLA DE REFERENCIA (Carga niveles desde Supabase) */}
                        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
                            <View className="bg-gray-50 p-4 border-b border-gray-100 flex-row items-center gap-2">
                                <Ionicons name="list" size={18} color="#64748B" />
                                <Text className="text-gray-900 font-bold text-sm">Tabla de Referencia</Text>
                            </View>
                            
                            <View className="p-2">
                                {loadingLevels ? (
                                    <View className="items-center p-3">
                                        <ActivityIndicator size="small" color="#6B7280" />
                                        <Text className="text-xs text-gray-400 mt-2">Cargando niveles...</Text>
                                    </View>
                                ) : testRanges.length === 0 ? (
                                    <Text className="text-gray-400 text-center p-3">No hay niveles de referencia definidos para esta prueba.</Text>
                                ) : (
                                    (Array.isArray(testRanges) ? testRanges : []).map((level, index) => {
                                        const isActive = calculatedLevel?.id === level.id;
                                        return (
                                            <View 
                                                key={level.id || index} 
                                                className={`flex-row justify-between items-center p-3 rounded-xl border mb-1 ${
                                                    isActive ? `${level.bg} ${level.border}` : 'bg-white border-transparent'
                                                }`}
                                            >
                                                <View className="flex-row items-center gap-3">
                                                    <View className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                                    {/* USAMOS level.nombre AQUÍ */}
                                                    <Text className={`font-bold text-sm ${isActive ? 'text-slate-900' : 'text-gray-400'}`}>
                                                        {level.nombre} 
                                                    </Text>
                                                </View>
                                                <View className="flex-row items-center">
                                                    <Text className={`text-xs ${isActive ? 'font-bold text-slate-700' : 'text-gray-300'}`}>
                                                        {level.min} - {level.max}
                                                    </Text>
                                                    {isActive && <Ionicons name="checkmark" size={16} color="#2563EB" style={{marginLeft: 6}} />}
                                                </View>
                                            </View>
                                        );
                                    })
                                )}
                            </View>
                        </View>

                        {/* TARJETA 4: COMENTARIOS */}
                        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                            <Text className="text-gray-900 font-bold text-base mb-3">Observaciones (Opcional)</Text>
                            <View style={styles.textAreaContainer}>
                                <TextInput 
                                    placeholder="Técnica, esfuerzo, dolor..."
                                    multiline
                                    textAlignVertical="top"
                                    value={comments}
                                    onChangeText={setComments}
                                    style={styles.textArea} 
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                    </ScrollView>

                    {/* FOOTER */}
                    <View className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-6 pb-8 shadow-2xl">
                        <Pressable 
                            onPress={handleSubmit}
                            className={`w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg active:scale-[0.98] transition-all ${
                                metricValue.length > 0 ? 'bg-blue-600 shadow-blue-200' : 'bg-gray-200 shadow-none'
                            }`}
                            disabled={metricValue.length === 0 || saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Ionicons name="save-outline" size={20} color={metricValue.length > 0 ? "white" : "#9CA3AF"} style={{ marginRight: 8 }} />
                                    <Text className={`font-bold text-lg ${metricValue.length > 0 ? "text-white" : "text-gray-400"}`}>
                                        Guardar Resultado
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    </View>

                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

// ESTILOS SEGUROS
const styles = StyleSheet.create({
    bigInput: {
        fontSize: 56,
        fontWeight: '800',
        color: '#0F172A',
        borderBottomWidth: 2,
        borderBottomColor: '#2563EB',
        textAlign: 'center',
        minWidth: 100,
        paddingBottom: 8,
        height: 80
    },
    textAreaContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
        height: 120,
    },
    textArea: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        textAlignVertical: 'top',
    }
});