import React, { useState, useEffect, useCallback } from "react";
import {
    View, 
    Text, 
    ScrollView, 
    Pressable, 
    StatusBar, 
    Modal, 
    Alert, 
    TouchableOpacity, 
    ActivityIndicator,
    StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native"; // <--- IMPORTANTE
import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";

// --- CONSTANTES DE DISEÑO ---
const COLORS = {
  primary: "#2563EB",
  background: "#F8FAFC",
  cardBg: "#FFFFFF",
  textDark: "#0F172A",
  textMuted: "#64748B",
  borderColor: "#E2E8F0",
  success: "#10B981",
  successBg: "#DCFCE7",
  successText: "#166534",
  danger: "#EF4444",
  dangerBg: "#FEE2E2",
  dangerText: "#991B1B",
  warning: "#F59E0B",
  orangeBg: "#FFF7ED",
  orangeText: "#C2410C",
};

type Props = NativeStackScreenProps<EntrenadorStackParamList, "TestAssignmentDetail">;

interface TestRange {
    id: number;
    nombre: string;
    min: number;
    max: number;
    color: string;
}

interface Participant {
    id: number;
    name: string;
    status: 'pending' | 'completed';
    result: string | null;
    result_id: number | null;
    level: string | null;
    obs: string;
    physical: {
        weight?: string | null;
        height?: string | null;
        age?: string | null;
    };
    isDeficient: boolean;
}

export default function TestAssignmentDetail({ navigation, route }: Props) {
    const { testName = "Test", groupName = "Grupo", assignmentId, initialTab } = route.params || {};

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>(initialTab || 'pending');

    const [selectedAthlete, setSelectedAthlete] = useState<Participant | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    
    const [testLevels, setTestLevels] = useState<TestRange[]>([]);
    const [loadingLevels, setLoadingLevels] = useState(true);

    // Helpers
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
    
    const calculateLevel = useCallback((value: string, levels: TestRange[]): string | null => {
        const val = parseFloat(value);
        if (isNaN(val) || !Array.isArray(levels) || levels.length === 0) return null;
        const found = levels.find(r => val >= r.min && val <= r.max);
        return found ? found.nombre : 'Fuera de Rango';
    }, []);

    // 1. Cargar Niveles (Esto solo necesita correr una vez al montar)
    useEffect(() => {
        const fetchLevels = async () => {
            if (!assignmentId) return;
            try {
                const { data: assignmentData, error: assignError } = await supabase
                    .from('prueba_asignada')
                    .select('prueba_id')
                    .eq('id', assignmentId)
                    .single();
                
                if (assignError || !assignmentData) throw assignError;

                const { data: testData, error: testError } = await supabase
                    .from('prueba')
                    .select('niveles')
                    .eq('id', assignmentData.prueba_id)
                    .single();

                if (testError || !testData) throw testError;

                const loadedLevels: TestRange[] = Array.isArray(testData.niveles) ? (testData.niveles as TestRange[]) : [];
                setTestLevels(loadedLevels);

            } catch (err) {
                console.error("Error fetching levels:", err);
            } finally {
                setLoadingLevels(false);
            }
        };
        fetchLevels();
    }, [assignmentId]);

    // 2. Cargar Participantes (Con useFocusEffect para actualizar al volver)
    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const loadParticipants = async () => {
                // Esperamos a que los niveles carguen para poder calcular bien el status
                if (loadingLevels) return;

                setLoading(true);
                try {
                    if (!assignmentId) {
                        Alert.alert("Error", "Falta ID de asignación.");
                        return;
                    }

                    // A. Obtener IDs de atletas
                    const { data: assignedRows, error: assignedErr } = await supabase
                        .from("prueba_asignada_has_atleta")
                        .select("atleta_no_documento")
                        .eq("prueba_asignada_id", assignmentId);

                    if (assignedErr) throw assignedErr;
                    if (!assignedRows || assignedRows.length === 0) {
                        if (isActive) setParticipants([]);
                        return;
                    }

                    const athleteIds = Array.from(new Set(assignedRows.map((r: any) => r.atleta_no_documento)));

                    // B. Obtener Nombres
                    const { data: usuarios } = await supabase
                        .from("usuario")
                        .select("no_documento, nombre_completo")
                        .in("no_documento", athleteIds);

                    // C. Obtener Datos Físicos
                    const { data: atletas } = await supabase
                        .from("atleta")
                        .select("no_documento, estatura, peso, fecha_nacimiento")
                        .in("no_documento", athleteIds);

                    // D. Obtener Resultados y Comentarios
                    const { data: resultados } = await supabase
                        .from("resultado_prueba")
                        .select(`id, atleta_no_documento, valor, comentario ( mensaje )`)
                        .eq("prueba_asignada_id", assignmentId);

                    // E. Mapeo Eficiente
                    const userMap: Record<number, any> = {};
                    (usuarios || []).forEach((u: any) => { userMap[Number(u.no_documento)] = u; });

                    const atletaMap: Record<number, any> = {};
                    (atletas || []).forEach((a: any) => { atletaMap[Number(a.no_documento)] = a; });
                    
                    const resultadoMap: Record<number, any> = {};
                    (resultados || []).forEach((r: any) => { resultadoMap[Number(r.atleta_no_documento)] = r; });

                    // F. Construcción del Objeto Participant
                    const built: Participant[] = assignedRows.map((row: any) => {
                        const id = Number(row.atleta_no_documento);
                        const u = userMap[id];
                        const at = atletaMap[id];
                        const res = resultadoMap[id];
                        
                        const fullName = u?.nombre_completo ?? `Atleta ${id}`;
                        const resultVal = res?.valor ?? null;
                        const resultId = res?.id ?? null;

                        const level = resultVal ? calculateLevel(resultVal, testLevels) : null;
                        const obs = res?.comentario?.[0]?.mensaje ?? ''; 
                        
                        const isDeficient = level ? level.toLowerCase().includes('principiante') || level.toLowerCase().includes('bajo') : false;

                        return {
                            id,
                            name: fullName,
                            status: resultVal ? 'completed' : 'pending',
                            result: resultVal,
                            result_id: resultId,
                            level,
                            obs,
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
                        // Solo establecemos el tab inicial si no hay interacción previa o se pide explícitamente
                        if (!initialTab && activeTab === 'pending') { 
                            // Lógica opcional: si todos están listos, cambiar a completed automáticamente
                            // const hasPending = built.some(p => p.status === 'pending');
                            // if (!hasPending) setActiveTab('completed');
                        }
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    if (isActive) setLoading(false);
                }
            };

            loadParticipants();

            return () => { isActive = false; };
        }, [assignmentId, loadingLevels, calculateLevel, testLevels, activeTab]) // Dependencias clave
    );

    // Filtros
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
            `¿Invalidar resultado de ${selectedAthlete.name}? Se borrará el historial actual.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sí, reiniciar",
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('resultado_prueba')
                                .delete()
                                .eq('prueba_asignada_id', assignmentId)
                                .eq('atleta_no_documento', selectedAthlete.id);

                            if (error) throw error;

                            const updated = participants.map(p => {
                                if (p.id === selectedAthlete.id) {
                                    return { 
                                        ...p, 
                                        status: 'pending' as const, 
                                        result: null, 
                                        result_id: null, 
                                        level: null, 
                                        obs: '', 
                                        isDeficient: false 
                                    };
                                }
                                return p;
                            });
                            
                            setParticipants(updated);
                            setModalVisible(false);
                            setActiveTab('pending');
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Error", "No se pudo reiniciar.");
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* --- MODAL DETALLE (BOTTOM SHEET) --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                    
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />

                        {selectedAthlete && (
                            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '90%' }}>
                                <View style={styles.modalHeaderRow}>
                                    <View>
                                        <Text style={styles.modalLabel}>RESULTADO FINAL</Text>
                                        <Text style={styles.modalTitle}>{selectedAthlete.name}</Text>
                                    </View>
                                    
                                    <View style={[
                                        styles.statusBadge, 
                                        selectedAthlete.isDeficient ? styles.statusBadgeDeficient : styles.statusBadgeSuccess
                                    ]}>
                                        <Text style={[
                                            styles.statusBadgeText, 
                                            selectedAthlete.isDeficient ? styles.statusTextDeficient : styles.statusTextSuccess
                                        ]}>
                                            {selectedAthlete.level ?? 'Nivel Desconocido'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Resultado Grande */}
                                <View style={styles.bigResultBox}>
                                    <Text style={styles.bigResultLabel}>Valor Registrado</Text>
                                    <Text style={styles.bigResultValue}>{selectedAthlete.result ?? '-'}</Text>
                                </View>

                                <Text style={styles.sectionTitle}>Datos Físicos al evaluar</Text>
                                <View style={styles.statsGrid}>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statLabel}>PESO</Text>
                                        <Text style={styles.statValue}>{selectedAthlete.physical.weight ?? '-'}</Text>
                                    </View>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statLabel}>ESTATURA</Text>
                                        <Text style={styles.statValue}>{selectedAthlete.physical.height ?? '-'}</Text>
                                    </View>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statLabel}>EDAD</Text>
                                        <Text style={styles.statValue}>{selectedAthlete.physical.age ?? '-'}</Text>
                                    </View>
                                </View>

                                <Text style={styles.sectionTitle}>Observación del Entrenador</Text>
                                <View style={styles.obsBox}>
                                    <Text style={styles.obsText}>
                                        "{selectedAthlete.obs || 'Sin observaciones registradas.'}"
                                    </Text>
                                </View>

                                <View style={styles.modalActions}>
                                    {selectedAthlete.isDeficient && (
                                        <TouchableOpacity onPress={handleResetTest} style={styles.resetButton}>
                                            <Ionicons name="refresh-circle" size={24} color={COLORS.danger} style={{ marginRight: 8 }} />
                                            <Text style={styles.resetButtonText}>Reiniciar Prueba</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                        <Text style={styles.closeButtonText}>Cerrar</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* --- PANTALLA PRINCIPAL --- */}
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.navBar}>
                        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
                        </Pressable>
                        
                        <View style={{ flex: 1 }}> 
                            <Text style={styles.headerSubtitle} numberOfLines={1}>
                                {groupName}
                            </Text>
                            <Text 
                                style={styles.headerTitle} 
                                numberOfLines={2} 
                                ellipsizeMode="tail"
                            >
                                {testName}
                            </Text>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <Pressable 
                            onPress={() => setActiveTab('pending')} 
                            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                        >
                            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                                Faltan ({pendingList.length})
                            </Text>
                        </Pressable>
                        <Pressable 
                            onPress={() => setActiveTab('completed')} 
                            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                        >
                            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
                                Listos ({completedList.length})
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* Contenido Scroll */}
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {loading || loadingLevels ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.loadingText}>Cargando datos...</Text>
                        </View>
                    ) : (
                        <>
                            {activeTab === 'pending' ? (
                                <View>
                                    {pendingList.length === 0 ? (
                                        <View style={styles.emptyState}>
                                            <Ionicons name="checkmark-done-circle-outline" size={60} color={COLORS.borderColor} />
                                            <Text style={styles.emptyText}>¡Todos evaluados!</Text>
                                        </View>
                                    ) : (
                                        pendingList.map((item) => (
                                            <View key={item.id} style={styles.card}>
                                                <View style={styles.cardLeft}>
                                                    <View style={styles.avatar}>
                                                        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                                                    </View>
                                                </View>

                                                <Pressable onPress={() => handleEvaluate(item)} style={styles.actionButton}>
                                                    <Text style={styles.actionButtonText}>Evaluar</Text>
                                                </Pressable>
                                            </View>
                                        ))
                                    )}
                                </View>
                            ) : (
                                <View>
                                    {completedList.length === 0 ? (
                                        <View style={styles.emptyState}>
                                            <Text style={styles.emptyText}>No hay resultados aún.</Text>
                                        </View>
                                    ) : (
                                        completedList.map((item) => (
                                            <TouchableOpacity 
                                                key={item.id} 
                                                onPress={() => openDetails(item)}
                                                style={styles.card}
                                            >
                                                <View style={styles.cardLeft}>
                                                    <View style={[
                                                        styles.avatar, 
                                                        item.isDeficient ? styles.avatarDeficient : styles.avatarSuccess
                                                    ]}>
                                                        <Ionicons 
                                                            name={item.isDeficient ? "alert" : "checkmark"} 
                                                            size={18} 
                                                            color={item.isDeficient ? COLORS.danger : COLORS.success} 
                                                        />
                                                    </View>

                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                                                        <Text style={[
                                                            styles.cardLevel,
                                                            item.isDeficient ? { color: COLORS.danger } : { color: COLORS.textMuted }
                                                        ]}>
                                                            Nivel: <Text style={{fontWeight: '700'}}>{item.level ?? '-'}</Text>
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View style={{alignItems: 'flex-end', marginLeft: 8}}>
                                                    <Text style={styles.resultValueSmall}>{item.result ?? '-'}</Text>
                                                    <Text style={styles.linkText}>Ver detalle</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    // Header
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
    },
    navBar: {
        flexDirection: 'row',
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
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // Tabs
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 4,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
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

    // Content & Cards
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 100,
        paddingTop: 16,
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
        elevation: 1,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textMuted,
    },
    avatarSuccess: { backgroundColor: COLORS.successBg },
    avatarDeficient: { backgroundColor: COLORS.dangerBg },
    
    cardName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    cardLevel: {
        fontSize: 12,
        marginTop: 2,
    },
    
    // Actions / Buttons inside cards
    actionButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    resultValueSmall: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    linkText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.primary,
        marginTop: 4,
    },

    // Loading & Empty
    loadingContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    loadingText: {
        color: COLORS.textMuted,
        marginTop: 8,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
        opacity: 0.6,
    },
    emptyText: {
        color: COLORS.textMuted,
        fontWeight: '500',
        marginTop: 8,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.cardBg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        maxHeight: '85%',
    },
    modalHandle: {
        width: 48,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 24,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    modalLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusBadgeSuccess: { backgroundColor: COLORS.successBg },
    statusBadgeDeficient: { backgroundColor: COLORS.dangerBg },
    statusBadgeText: { fontSize: 12, fontWeight: '700' },
    statusTextSuccess: { color: COLORS.successText },
    statusTextDeficient: { color: COLORS.dangerText },

    bigResultBox: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        marginBottom: 24,
    },
    bigResultLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    bigResultValue: {
        fontSize: 36,
        fontWeight: '900',
        color: COLORS.textDark,
    },

    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    obsBox: {
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    obsText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#1E40AF',
        lineHeight: 20,
    },

    modalActions: {
        gap: 12,
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.dangerBg,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    resetButtonText: {
        color: COLORS.dangerText,
        fontWeight: '700',
        fontSize: 14,
    },
    closeButton: {
        backgroundColor: COLORS.textDark,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
});