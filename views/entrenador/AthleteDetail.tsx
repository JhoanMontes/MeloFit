import React, { useState, useCallback, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StatusBar,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

// --- CONSTANTES DE DISEÑO ---
const COLORS = {
    primary: "#2563EB",
    background: "#F8FAFC",
    cardBg: "#FFFFFF",
    textDark: "#0F172A",
    textMuted: "#64748B",
    borderColor: "#E2E8F0",
    success: "#10B981",
    warning: "#F59E0B",
    orangeBg: "#FFF7ED",
    orangeText: "#C2410C",
};

type Props = NativeStackScreenProps<EntrenadorStackParamList, "AthleteDetail">;

interface TestItem {
    assignmentId: number;
    testName: string;
    date: string;
    deadline?: string;
    status: 'pending' | 'completed';
    result?: string;
    score?: string; // Aquí guardaremos la unidad formateada (ej: "Min")
}

interface AthleteProfile {
    weight: string;
    height: string;
    age: string;
    name: string;
    role: string;
}

export default function AthleteDetail({ navigation, route }: Props) {
    const { user } = useAuth();
    const { athlete } = route.params || {}; 
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Estados de Datos
    const [profile, setProfile] = useState<AthleteProfile>({
        weight: '--', height: '--', age: '--', name: athlete?.name || '', role: athlete?.role || ''
    });
    const [pendingTests, setPendingTests] = useState<TestItem[]>([]);
    const [historyTests, setHistoryTests] = useState<TestItem[]>([]);

    // --- HELPER: FORMATEO DE UNIDADES ---
    const formatUnit = (raw: string | null) => {
        if (!raw) return '';
        const r = raw.toLowerCase();
        
        if (r === 'time_min' || r.includes('minutos') || r.includes('minute')) return 'Min';
        if (r === 'time_sec' || r.includes('segundos') || r.includes('second')) return 'Seg';
        if (r.includes('rep')) return 'Reps';
        if (r.includes('kilo') || r.includes('kg')) return 'Kg';
        if (r.includes('metr')) return 'm';
        
        return raw; 
    };

    // ----------------------------------------------------------------------
    // 1. CARGA DE DATOS OPTIMIZADA
    // ----------------------------------------------------------------------
    const fetchData = useCallback(async () => {
        if (!athlete?.id || !user?.id) return;

        try {
            setLoading(true);

            // 1. OBTENER ID DEL ENTRENADOR
            const { data: currentCoach, error: coachError } = await supabase
                .from('usuario')
                .select('no_documento')
                .eq('auth_id', user.id)
                .single();

            if (coachError || !currentCoach) throw new Error("No se pudo identificar al entrenador");
            const coachId = currentCoach.no_documento;

            // 2. CARGAR PERFIL
            const { data: athleteData } = await supabase
                .from('atleta')
                .select(`
                    peso, estatura, fecha_nacimiento, 
                    usuario!atleta_no_documento_fkey ( nombre_completo )
                `)
                .eq('no_documento', athlete.id)
                .single();

            if (athleteData) {
                const userData: any = Array.isArray(athleteData.usuario) ? athleteData.usuario[0] : athleteData.usuario;
                let ageStr = '--';
                if (athleteData.fecha_nacimiento) {
                    const diff = Date.now() - new Date(athleteData.fecha_nacimiento).getTime();
                    const ageDate = new Date(diff);
                    ageStr = Math.abs(ageDate.getUTCFullYear() - 1970).toString();
                }
                setProfile({
                    weight: athleteData.peso ? `${athleteData.peso} kg` : '--',
                    height: athleteData.estatura ? `${athleteData.estatura} cm` : '--',
                    age: ageStr !== '--' ? `${ageStr} años` : '--',
                    name: userData?.nombre_completo || athlete.name,
                    role: 'Atleta'
                });
            }

            // 3. CARGAR RESULTADOS (HISTORIAL) PRIMERO
            const { data: historyData, error: historyError } = await supabase
                .from('resultado_prueba')
                .select(`
                    valor,
                    fecha_realizacion,
                    prueba_asignada_id,
                    prueba_asignada!inner (
                        id,
                        prueba:prueba_id ( 
                            nombre, 
                            tipo_metrica,
                            entrenador_no_documento
                        )
                    )
                `)
                .eq('atleta_no_documento', athlete.id)
                .order('fecha_realizacion', { ascending: false });

            if (historyError) throw historyError;

            const completedAssignmentIds = new Set(); 
            const historyList: TestItem[] = [];

            if (historyData) {
                historyData.forEach((res: any) => {
                    // Guardamos ID completado para filtrar pendientes después
                    if (res.prueba_asignada_id) {
                        completedAssignmentIds.add(res.prueba_asignada_id);
                    }

                    // Armamos lista historial visual (solo mis pruebas)
                    const p = res.prueba_asignada?.prueba;
                    if (p && p.entrenador_no_documento === coachId) {
                        historyList.push({
                            assignmentId: res.prueba_asignada.id,
                            testName: p.nombre,
                            date: res.fecha_realizacion,
                            status: 'completed',
                            result: res.valor,
                            // APLICAMOS LA CONVERSIÓN DE UNIDAD AQUÍ
                            score: formatUnit(p.tipo_metrica) 
                        });
                    }
                });
            }
            setHistoryTests(historyList);

            // 4. CARGAR ASIGNACIONES Y FILTRAR PENDIENTES
            const { data: assignmentsData, error: assignError } = await supabase
                .from('prueba_asignada_has_atleta')
                .select(`
                    prueba_asignada:prueba_asignada_id (
                        id,
                        fecha_limite,
                        fecha_asignacion,
                        prueba:prueba_id ( 
                            nombre,
                            entrenador_no_documento 
                        )
                    )
                `)
                .eq('atleta_no_documento', athlete.id);

            if (assignError) throw assignError;

            const pendingList: TestItem[] = [];

            if (assignmentsData) {
                assignmentsData.forEach((item: any) => {
                    const assign = item.prueba_asignada;
                    
                    // FILTRO 1: Creada por mí
                    // FILTRO 2: NO está en la lista de completadas
                    if (assign && 
                        assign.prueba?.entrenador_no_documento === coachId && 
                        !completedAssignmentIds.has(assign.id) 
                    ) {
                        pendingList.push({
                            assignmentId: assign.id,
                            testName: assign.prueba?.nombre || 'Prueba',
                            date: assign.fecha_asignacion,
                            deadline: assign.fecha_limite,
                            status: 'pending'
                        });
                    }
                });
            }

            // Ordenar por urgencia
            pendingList.sort((a, b) => {
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            });

            setPendingTests(pendingList);

        } catch (e) {
            console.error("Error cargando detalle atleta:", e);
            Alert.alert("Error", "No se pudieron cargar los datos.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [athlete?.id, user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRegisterResult = (test: TestItem) => {
        navigation.navigate('SendFeedback', {
            result: {
                athleteId: parseInt(athlete.id), 
                athleteName: profile.name,
                assignmentId: test.assignmentId,
                test: test.testName,
            }
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>

                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.navBar}>
                        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
                        </Pressable>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>ACTIVO</Text>
                        </View>
                    </View>

                    <View style={styles.profileRow}>
                        <View style={styles.avatarLarge}>
                            <Ionicons name="person" size={32} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.profileName}>{profile.name}</Text>
                            <Text style={styles.profileRole}>{profile.role}</Text>
                        </View>
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={[styles.statItem, styles.borderRight]}>
                            <Text style={styles.statLabel}>EDAD</Text>
                            <Text style={styles.statValue}>{profile.age}</Text>
                        </View>
                        <View style={[styles.statItem, styles.borderRight]}>
                            <Text style={styles.statLabel}>PESO</Text>
                            <Text style={styles.statValue}>{profile.weight}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>ESTATURA</Text>
                            <Text style={styles.statValue}>{profile.height}</Text>
                        </View>
                    </View>

                    <View style={styles.tabContainer}>
                        <Pressable
                            onPress={() => setActiveTab('pending')}
                            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                        >
                            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                                Pendientes ({pendingTests.length})
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setActiveTab('history')}
                            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                        >
                            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                                Historial
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* LISTA */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
                >
                    {loading && !refreshing ? (
                        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                    ) : activeTab === 'pending' ? (
                        <View>
                            {pendingTests.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="clipboard-outline" size={48} color={COLORS.borderColor} />
                                    <Text style={styles.emptyText}>No tienes pruebas pendientes con este atleta.</Text>
                                </View>
                            ) : (
                                pendingTests.map((item, index) => (
                                    <View key={index} style={styles.card}>
                                        <View style={styles.cardLeft}>
                                            <View style={styles.iconBoxOrange}>
                                                <Ionicons name="time" size={20} color={COLORS.orangeText} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.cardTitle}>{item.testName}</Text>
                                                <Text style={styles.cardSubtitle}>
                                                    Vence: {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'Sin fecha'}
                                                </Text>
                                            </View>
                                        </View>

                                        <Pressable
                                            onPress={() => handleRegisterResult(item)}
                                            style={({pressed}) => [styles.actionButton, pressed && { opacity: 0.8 }]}
                                        >
                                            <Text style={styles.actionButtonText}>Evaluar</Text>
                                        </Pressable>
                                    </View>
                                ))
                            )}
                        </View>
                    ) : (
                        <View>
                            {historyTests.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="list-outline" size={48} color={COLORS.borderColor} />
                                    <Text style={styles.emptyText}>No hay historial disponible para tus pruebas.</Text>
                                </View>
                            ) : (
                                historyTests.map((item, index) => (
                                    <View key={index} style={[styles.card, { opacity: 0.9 }]}>
                                        <View style={styles.cardLeft}>
                                            <View style={styles.iconBoxGreen}>
                                                <Ionicons name="checkmark-done" size={20} color={COLORS.success} />
                                            </View>
                                            <View>
                                                <Text style={styles.cardTitle}>{item.testName}</Text>
                                                <Text style={styles.cardSubtitle}>{new Date(item.date).toLocaleDateString()}</Text>
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.resultValue}>{item.result}</Text>
                                            {/* AQUÍ SE MUESTRA LA UNIDAD FORMATEADA */}
                                            <Text style={styles.resultScore}>{item.score}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.cardBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderColor,
    },
    statusBadge: {
        backgroundColor: '#DCFCE7', 
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        color: '#15803D', 
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarLarge: {
        width: 64,
        height: 64,
        backgroundColor: '#DBEAFE', 
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.cardBg,
        marginRight: 16,
    },
    profileName: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    profileRole: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textMuted,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    borderRight: {
        borderRightWidth: 1,
        borderRightColor: COLORS.borderColor,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8', 
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#EFF6FF', 
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    activeTabText: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        marginRight: 8,
    },
    iconBoxOrange: {
        width: 40,
        height: 40,
        backgroundColor: COLORS.orangeBg,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconBoxGreen: {
        width: 40,
        height: 40,
        backgroundColor: '#ECFDF5',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    cardSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    actionButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        elevation: 2,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    resultValue: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    resultScore: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textMuted,
        textTransform: 'uppercase'
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
        padding: 20,
        opacity: 0.6
    },
    emptyText: {
        color: COLORS.textMuted,
        fontStyle: 'italic',
        marginTop: 8
    },
});