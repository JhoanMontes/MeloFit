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
    ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";

import CustomAlert, { AlertType } from "../../components/CustomAlert";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "SendFeedback">;

// --- CONSTANTES DE DISEÑO ---
const COLORS = {
  primary: "#2563EB", 
  background: "#F5F5F7",
  cardBg: "#FFFFFF",
  textDark: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  inputBg: "#F8FAFC",
};

interface TestRange {
    id?: number; 
    nombre: string; // Unificado
    min: number;
    max: number;
    color: string; 
}

export default function SendFeedback({ navigation, route }: Props) {
    const { result } = route.params || {};

    const athleteId = result?.athleteId;
    const athleteName = result?.athleteName || "Atleta"; 
    const assignmentId = result?.assignmentId;
    const testName = result?.test || "Prueba";

    // ESTADOS
    const [metricValue, setMetricValue] = useState('');
    const [comments, setComments] = useState(''); 
    
    const [stats, setStats] = useState({ weight: '—', height: '—', age: '—' });
    const [unit, setUnit] = useState('Unidad');

    const [testRanges, setTestRanges] = useState<TestRange[]>([]); 
    const [calculatedLevel, setCalculatedLevel] = useState<TestRange | null>(null);
    const [saving, setSaving] = useState(false);
    const [loadingLevels, setLoadingLevels] = useState(true); 

    // --- ESTADO PARA CUSTOM ALERT ---
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: AlertType;
        onConfirm?: () => void;
        buttonText?: string;
        cancelText?: string;
    }>({
        visible: false,
        title: "",
        message: "",
        type: "info"
    });

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    const showAlert = (
        title: string, 
        message: string, 
        type: AlertType = "info", 
        onConfirm?: () => void,
        buttonText: string = "Entendido",
        cancelText?: string
    ) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            onConfirm,
            buttonText,
            cancelText
        });
    };

    const getLocalYYYYMMDD = (date: Date) => {
        const tzOff = date.getTimezoneOffset() * 60000;
        const local = new Date(date.getTime() - tzOff);
        return local.toISOString().split('T')[0];
    };

    // 1. CARGAR DATOS FÍSICOS
    useEffect(() => {
        const fetchAthleteStats = async () => {
            if (!athleteId) return;
            try {
                const { data, error } = await supabase
                    .from('atleta')
                    .select('peso, estatura, fecha_nacimiento')
                    .eq('no_documento', athleteId)
                    .single();

                if (data && !error) {
                    let ageStr = '—';
                    if (data.fecha_nacimiento) {
                        const diff = Date.now() - new Date(data.fecha_nacimiento).getTime();
                        const ageDate = new Date(diff); 
                        ageStr = Math.abs(ageDate.getUTCFullYear() - 1970).toString();
                    }

                    setStats({
                        weight: data.peso ? `${data.peso} kg` : '—',
                        height: data.estatura ? `${data.estatura} m` : '—',
                        age: ageStr !== '—' ? `${ageStr} años` : '—'
                    });
                }
            } catch (err) {
                console.error("Error cargando stats:", err);
            }
        };
        fetchAthleteStats();
    }, [athleteId]);
    
    // 2. CARGAR NIVELES REALES Y UNIDAD (CON CORRECCIÓN DE DATOS)
    useEffect(() => {
        const fetchTestDetails = async () => {
            if (!assignmentId) {
                setLoadingLevels(false);
                return;
            }

            try {
                const { data: assignmentData, error: assignError } = await supabase
                    .from('prueba_asignada')
                    .select('prueba_id')
                    .eq('id', assignmentId)
                    .single();

                if (assignError || !assignmentData) throw new Error("Assignment not found");

                const { data: testData, error: testError } = await supabase
                    .from('prueba')
                    .select('niveles, tipo_metrica')
                    .eq('id', assignmentData.prueba_id)
                    .single();

                if (testError) throw testError;

                // Detectar Unidad
                if (testData?.tipo_metrica) {
                    const raw = testData.tipo_metrica.toLowerCase().trim();
                    let shortUnit = testData.tipo_metrica;

                    if (raw === 'time_min' || raw.includes('minutos') || raw.includes('minute')) {
                        shortUnit = 'Min';
                    } 
                    else if (raw === 'time_sec' || raw.includes('segundos') || raw.includes('second')) {
                        shortUnit = 'Seg';
                    }
                    else if (raw.includes('rep')) {
                        shortUnit = 'Reps';
                    }
                    else if (raw.includes('kilo') || raw.includes('kg')) {
                        shortUnit = 'Kg';
                    }
                    else if (raw.includes('metr')) {
                        shortUnit = 'm';
                    }

                    setUnit(shortUnit);
                }
                
                // --- CORRECCIÓN CRÍTICA DE NIVELES ---
                // Normalizamos 'label' vs 'nombre' para que siempre exista 'nombre'
                let loadedLevels: TestRange[] = [];
                
                if (testData?.niveles && Array.isArray(testData.niveles)) {
                    loadedLevels = testData.niveles.map((l: any) => ({
                        id: l.id,
                        // Aquí está el truco: si no hay 'nombre', usa 'label', si no, "Nivel X"
                        nombre: l.nombre || l.label || 'Nivel', 
                        min: Number(l.min),
                        max: Number(l.max),
                        color: l.color || 'gray'
                    }));
                }
                
                setTestRanges(loadedLevels);

            } catch (err) {
                console.error("Error fetching levels:", err);
            } finally {
                setLoadingLevels(false);
            }
        };

        fetchTestDetails();
    }, [assignmentId]);

    // 3. CALCULAR NIVEL EN TIEMPO REAL
    useEffect(() => {
        const val = parseFloat(metricValue);
        if (!isNaN(val) && testRanges.length > 0) {
            const found = testRanges.find(r => val >= r.min && val <= r.max);
            setCalculatedLevel(found || null);
        } else {
            setCalculatedLevel(null);
        }
    }, [metricValue, testRanges]); 


    // 4. GUARDAR RESULTADO
    const saveResultToSupabase = async () => {
        closeAlert(); 
        
        if (!assignmentId || !athleteId || !metricValue.trim()) return;

        setSaving(true);
        const today = getLocalYYYYMMDD(new Date());

        try {
            const { data: resultData, error: resultError } = await supabase
                .from("resultado_prueba")
                .insert({
                    prueba_asignada_id: assignmentId,
                    atleta_no_documento: athleteId,
                    fecha_realizacion: today,
                    valor: metricValue.trim()
                })
                .select('id')
                .single();

            if (resultError) throw resultError;
            
            if (comments.trim() && resultData?.id) {
                await supabase
                    .from("comentario")
                    .insert({
                        resultado_prueba_id: resultData.id,
                        fecha: today,
                        mensaje: comments.trim()
                    });
            }

            showAlert(
                "¡Excelente!",
                "El resultado ha sido guardado correctamente.",
                "success",
                () => navigation.goBack(),
                "Finalizar"
            );

        } catch (err: any) {
            showAlert(
                "Error",
                err.message || "No se pudo guardar el resultado.",
                "error",
                undefined,
                "Intentar de nuevo"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = () => {
        if (!metricValue.trim()) {
            showAlert("Faltan datos", "Por favor ingresa el valor obtenido en la prueba.", "warning");
            return;
        }
        
        const nivelFinal = calculatedLevel?.nombre ? calculatedLevel.nombre : "Sin Clasificación";
        
        showAlert(
            "¿Confirmar Resultado?",
            `Vas a registrar:\n\nValor: ${metricValue} ${unit}\nNivel: ${nivelFinal}`,
            "info",
            saveResultToSupabase,
            "Sí, Guardar",
            "Cancelar"
        );
    };

    const getLevelStyle = (isActive: boolean, colorRef: string) => {
        if (!isActive) return { bg: '#FFFFFF', text: COLORS.textMuted, border: COLORS.background };
        const baseColor = colorRef ? colorRef.toLowerCase() : 'gray';
        
        if (baseColor.includes('green') || baseColor === 'verde') return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
        if (baseColor.includes('blue') || baseColor === 'azul') return { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' };
        if (baseColor.includes('orange') || baseColor === 'naranja') return { bg: '#FFEDD5', text: '#9A3412', border: '#FDBA74' };
        if (baseColor.includes('red') || baseColor === 'rojo') return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
        
        return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' }; 
    };

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    
                    {/* HEADER */}
                    <View style={styles.header}>
                        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
                        </Pressable>
                        <View>
                            <Text style={styles.headerTitle}>Registrar Resultado</Text>
                            <Text style={styles.headerSubtitle}>Prueba: <Text style={styles.headerHighlight}>{testName}</Text></Text>
                        </View>
                    </View>

                    <ScrollView 
                        style={styles.scrollView} 
                        contentContainerStyle={{ paddingBottom: 120 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* 1. TARJETA ATLETA */}
                        <View style={styles.card}>
                            <View style={styles.athleteHeader}>
                                <View style={styles.avatar}>
                                    <Ionicons name="person" size={24} color={COLORS.primary} />
                                </View>
                                <View>
                                    <Text style={styles.athleteName}>{athleteName}</Text>
                                    <Text style={styles.athleteLabel}>DATOS FÍSICOS</Text>
                                </View>
                            </View>

                            <View style={styles.statsRow}>
                                <View style={[styles.statCol, styles.statBorder]}>
                                    <Text style={styles.statLabel}>PESO</Text>
                                    <Text style={styles.statValue}>{stats.weight}</Text>
                                </View>
                                <View style={[styles.statCol, styles.statBorder]}>
                                    <Text style={styles.statLabel}>ESTATURA</Text>
                                    <Text style={styles.statValue}>{stats.height}</Text>
                                </View>
                                <View style={styles.statCol}>
                                    <Text style={styles.statLabel}>EDAD</Text>
                                    <Text style={styles.statValue}>{stats.age}</Text>
                                </View>
                            </View>
                        </View>

                        {/* 2. TARJETA INPUT */}
                        <View style={[styles.card, { alignItems: 'center', paddingVertical: 32 }]}>
                            <Text style={styles.inputLabel}>Ingresa el Valor</Text>
                            
                            <View style={styles.inputWrapper}>
                                <TextInput 
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={metricValue}
                                    onChangeText={setMetricValue}
                                    style={styles.bigInput} 
                                    placeholderTextColor="#E2E8F0"
                                />
                                <Text style={styles.unitText}>{unit}</Text>
                            </View>

                            {calculatedLevel && (
                                <View style={[
                                    styles.badge, 
                                    { backgroundColor: getLevelStyle(true, calculatedLevel.color).bg, borderColor: getLevelStyle(true, calculatedLevel.color).border }
                                ]}>
                                    <Text style={[
                                        styles.badgeText, 
                                        { color: getLevelStyle(true, calculatedLevel.color).text }
                                    ]}>
                                        {calculatedLevel?.nombre 
                                            ? calculatedLevel.nombre.toUpperCase() 
                                            : "NIVEL"}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* 3. TABLA REFERENCIA */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="list" size={18} color={COLORS.textMuted} />
                                <Text style={styles.cardTitle}>Tabla de Referencia</Text>
                            </View>
                            
                            <View style={{ padding: 8 }}>
                                {loadingLevels ? (
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                ) : testRanges.length === 0 ? (
                                    <Text style={styles.emptyText}>No hay niveles configurados para esta prueba.</Text>
                                ) : (
                                    testRanges.map((level, index) => {
                                        const isActive = calculatedLevel?.nombre === level.nombre;
                                        const styleProps = getLevelStyle(isActive, level.color);
                                        
                                        return (
                                            <View 
                                                key={index} 
                                                style={[
                                                    styles.tableRow, 
                                                    isActive && { backgroundColor: styleProps.bg }
                                                ]}
                                            >
                                                <View style={styles.rowLeft}>
                                                    <View style={[
                                                        styles.dot, 
                                                        { backgroundColor: isActive ? styleProps.text : '#D1D5DB' }
                                                    ]} />
                                                    <Text style={[
                                                        styles.rowName, 
                                                        isActive ? { color: COLORS.textDark, fontWeight: '700' } : { color: COLORS.textMuted }
                                                    ]}>
                                                        {level.nombre}
                                                    </Text>
                                                </View>
                                                <View style={styles.rowRight}>
                                                    <Text style={[
                                                        styles.rowRange,
                                                        isActive && { color: COLORS.textDark, fontWeight: '700' }
                                                    ]}>
                                                        {level.min} - {level.max} {unit}
                                                    </Text>
                                                    {isActive && <Ionicons name="checkmark" size={16} color={COLORS.primary} style={{marginLeft: 6}} />}
                                                </View>
                                            </View>
                                        );
                                    })
                                )}
                            </View>
                        </View>

                        {/* 4. COMENTARIOS */}
                        <View style={styles.card}>
                            <Text style={styles.commentTitle}>Observaciones (Opcional)</Text>
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
                    <View style={styles.footer}>
                        <Pressable 
                            onPress={handleSubmit}
                            style={[
                                styles.saveButton,
                                metricValue.length > 0 ? styles.saveButtonActive : styles.saveButtonDisabled
                            ]}
                            disabled={metricValue.length === 0 || saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Ionicons name="save-outline" size={20} color={metricValue.length > 0 ? "white" : "#9CA3AF"} />
                                    <Text style={[
                                        styles.saveButtonText,
                                        metricValue.length > 0 ? { color: "white" } : { color: "#9CA3AF" }
                                    ]}>
                                        Guardar Resultado
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    </View>

                </KeyboardAvoidingView>
            </SafeAreaView>

            <CustomAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={closeAlert}
                onConfirm={alertConfig.onConfirm}
                buttonText={alertConfig.buttonText}
                cancelText={alertConfig.cancelText}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    // Header
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.textDark,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    headerHighlight: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    // Cards
    card: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    // Athlete Section
    athleteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 48,
        height: 48,
        backgroundColor: '#EFF6FF',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    athleteName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    athleteLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textMuted,
        textTransform: 'uppercase',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statCol: {
        flex: 1,
        alignItems: 'center',
    },
    statBorder: {
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
    },
    statLabel: {
        fontSize: 10,
        color: COLORS.textMuted,
        fontWeight: '700',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    // Input Section
    inputLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginBottom: 24,
    },
    bigInput: {
        fontSize: 56,
        fontWeight: '800',
        color: COLORS.textDark,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
        textAlign: 'center',
        minWidth: 120,
        paddingBottom: 4,
        height: 80,
    },
    unitText: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginBottom: 16,
        marginLeft: 8,
    },
    badge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '800',
    },
    // Table Section
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        marginBottom: 8,
        gap: 8,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    rowName: {
        fontSize: 14,
        fontWeight: '500',
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowRange: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textMuted,
        padding: 12,
        fontStyle: 'italic',
    },
    // Comments
    commentTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 12,
    },
    textAreaContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        height: 120,
    },
    textArea: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textDark,
        textAlignVertical: 'top',
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: COLORS.cardBg,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingHorizontal: 24,
        paddingVertical: 24,
        paddingBottom: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    saveButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveButtonActive: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonDisabled: {
        backgroundColor: '#E2E8F0',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});