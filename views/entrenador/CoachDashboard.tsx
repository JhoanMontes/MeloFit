import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Modal,
    StatusBar,
    ActivityIndicator,
    StyleSheet,
    Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import {
    Bell,
    User,
    Users,
    Plus,
    FileText,
    Settings,
    X,
    LogOut,
    ChevronRight,
    ClipboardList,
} from "lucide-react-native";

import { useAuth } from "../../context/AuthContext";
import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "Dashboard">;

// --- COLORES PROFESIONALES ---
const COLORS = {
    primary: "#2563eb",
    primaryLight: "#eff6ff",
    background: "#F8FAFC",
    white: "#ffffff",
    textDark: "#0f172a",
    textMuted: "#64748b",
    borderColor: "#e2e8f0",
    shadow: "#64748b",
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
};

// Paleta para avatares de grupos
const GROUP_COLORS = [
    { bg: '#e0e7ff', icon: '#4338ca' },
    { bg: '#dcfce7', icon: '#15803d' },
    { bg: '#ffedd5', icon: '#c2410c' },
    { bg: '#dbeafe', icon: '#1d4ed8' },
    { bg: '#f3e8ff', icon: '#7e22ce' }
];

export default function CoachDashboard({ navigation }: Props) {
    const { logout, user } = useAuth();

    // --- ESTADOS UI ---
    const [showProfileModal, setShowProfileModal] = useState(false);

    // --- ESTADOS DATOS ---
    const [nombre, setNombre] = useState<String>("Entrenador");
    const [recentGroups, setRecentGroups] = useState<any[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [assignedTests, setAssignedTests] = useState<any[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [hasNotifications, setHasNotifications] = useState(false);

    // 1. CARGAR USUARIO Y NOTIFICACIONES
    useFocusEffect(
        useCallback(() => {
            const fetchUserData = async () => {
                if (!user?.id) return;
                try {
                    const { data } = await supabase
                        .from('usuario')
                        .select('no_documento, nombre_completo')
                        .eq('auth_id', user.id)
                        .single();

                    if (data) {
                        const primer = data.nombre_completo.trim().split(" ")[0];
                        setNombre(primer.charAt(0).toUpperCase() + primer.slice(1).toLowerCase());

                        // CONSULTA NOTIFICACIONES REALES (No leídas)
                        const { count } = await supabase
                            .from('notificacion')
                            .select('*', { count: 'exact', head: true })
                            .eq('usuario_no_documento', data.no_documento)
                            .eq('leido', false);

                        setHasNotifications(count !== null && count > 0);
                    }
                } catch (e) {
                    console.error("Error user data:", e);
                }
            };
            fetchUserData();
        }, [user])
    );

    // 2. CARGAR GRUPOS (Con filtro de ACTIVO para Soft Delete)
    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const fetchRecentGroups = async () => {
                if (!user) return;
                try {
                    const { data: trainerData } = await supabase
                        .from('usuario').select('no_documento').eq('auth_id', user.id).single();
                    if (!trainerData) return;

                    const { data, error } = await supabase
                        .from('grupo')
                        .select('*, atleta_has_grupo(count)')
                        .eq('entrenador_no_documento', trainerData.no_documento)
                        .eq('activo', true) // <--- FILTRO CRÍTICO PARA SOFT DELETE
                        .order('fecha_creacion', { ascending: false })
                        .limit(5);

                    if (error) throw error;

                    if (isActive && data) {
                        const formatted = data.map(g => ({
                            ...g,
                            members: g.atleta_has_grupo?.[0]?.count || 0
                        }));
                        setRecentGroups(formatted);
                    }
                } catch (error) {
                    console.error("Error fetching groups:", error);
                } finally {
                    if (isActive) setLoadingGroups(false);
                }
            };
            fetchRecentGroups();
            return () => { isActive = false };
        }, [user])
    );

    // 3. CARGAR ASIGNACIONES ACTIVAS
    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const loadDashboardData = async () => {
                try {
                    const { data: trainer } = await supabase.from("usuario").select("no_documento").eq("auth_id", user?.id).single();
                    if (!trainer) return;

                    // B. ASIGNACIONES ACTIVAS
                    const { data: myGroups } = await supabase.from("grupo").select("codigo, nombre").eq("entrenador_no_documento", trainer.no_documento).eq('activo', true);

                    if (!myGroups || myGroups.length === 0) {
                        setAssignedTests([]);
                        return;
                    }

                    const groupCodes = myGroups.map(g => g.codigo);
                    const groupMap: Record<string, string> = {};
                    myGroups.forEach(g => groupMap[g.codigo] = g.nombre);

                    const nowISO = new Date().toISOString();

                    const { data: rawData } = await supabase
                        .from("prueba_asignada_has_atleta")
                        .select(`
                            grupo_codigo,
                            prueba_asignada!inner (
                                id, fecha_asignacion, fecha_limite,
                                prueba ( nombre, descripcion )
                            )
                        `)
                        .in("grupo_codigo", groupCodes)
                        .gte("prueba_asignada.fecha_limite", nowISO)
                        .order("grupo_codigo");

                    if (!rawData || rawData.length === 0) {
                        setAssignedTests([]);
                    } else {
                        const uniqueMap = new Map();
                        rawData.forEach((item: any) => {
                            const key = `${item.prueba_asignada.id}-${item.grupo_codigo}`;
                            if (!uniqueMap.has(key)) uniqueMap.set(key, item);
                        });

                        const finalAssignments = await Promise.all(
                            Array.from(uniqueMap.values()).map(async (item: any) => {
                                const p = item.prueba_asignada;

                                // Calcular progreso real
                                const { count: total } = await supabase
                                    .from("prueba_asignada_has_atleta")
                                    .select("*", { count: "exact", head: true })
                                    .eq("prueba_asignada_id", p.id);

                                const { count: completed } = await supabase
                                    .from("resultado_prueba")
                                    .select("*", { count: "exact", head: true })
                                    .eq("prueba_asignada_id", p.id);

                                return {
                                    id: p.id,
                                    test: p.prueba?.nombre || "Prueba",
                                    groupName: groupMap[item.grupo_codigo] ?? "Grupo",
                                    completed: completed ?? 0,
                                    total: total ?? 0,
                                    progress: (total && total > 0) ? Math.round(((completed ?? 0) / total) * 100) : 0,
                                    deadline: p.fecha_limite,
                                };
                            })
                        );
                        if (isActive) setAssignedTests(finalAssignments);
                    }

                } catch (err) {
                    console.error("Error loading dashboard:", err);
                } finally {
                    if (isActive) setLoadingAssignments(false);
                }
            };

            loadDashboardData();
            return () => { isActive = false };
        }, [user])
    );

    // ======================================================
    // MODAL PERFIL
    // ======================================================
    const renderProfileModal = () => (
        <Modal animationType="fade" transparent visible={showProfileModal} onRequestClose={() => setShowProfileModal(false)}>
            <View style={styles.modalOverlay}>
                <Pressable style={styles.modalBackdrop} onPress={() => setShowProfileModal(false)} />
                <View style={styles.modalContent}>
                    <View style={styles.modalHandle} />

                    <View style={styles.modalHeaderRow}>
                        <Text style={styles.modalTitle}>Tu Cuenta</Text>
                        <Pressable onPress={() => setShowProfileModal(false)} style={styles.closeButton}>
                            <X size={20} color={COLORS.textMuted} />
                        </Pressable>
                    </View>

                    <Pressable
                        onPress={() => { setShowProfileModal(false); navigation.navigate("Profile"); }}
                        style={({ pressed }) => [styles.profileCard, pressed && styles.profileCardPressed]}
                    >
                        <View style={styles.profileIconContainer}>
                            <User size={30} color={COLORS.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.profileName}>{nombre}</Text>
                            <Text style={styles.profileEmail}>{user?.email}</Text>
                        </View>
                        <ChevronRight size={20} color={COLORS.textMuted} />
                    </Pressable>

                    <Pressable onPress={() => { setShowProfileModal(false); logout(); }} style={styles.logoutButton}>
                        <LogOut size={20} color="#DC2626" />
                        <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            {renderProfileModal()}

            <SafeAreaView style={{ flex: 1 }}>

                {/* HEADER */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerSubtitle}>Panel de Entrenador</Text>
                        <Text style={styles.headerTitle}>Hola, {nombre}</Text>
                    </View>

                    <View style={styles.headerIcons}>
                        {/* NOTIFICACIONES CON PUNTO ROJO REAL */}
                        <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.iconButton}>
                            <Bell size={22} color={COLORS.textMuted} />
                            {hasNotifications && <View style={styles.notificationDot} />}
                        </Pressable>

                        <Pressable onPress={() => setShowProfileModal(true)} style={[styles.iconButton, styles.profileButton]}>
                            <User size={22} color={COLORS.primary} />
                        </Pressable>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* 1. ACCIONES RÁPIDAS */}
                    <View style={styles.quickActionsContainer}>
                        <Pressable
                            onPress={() => navigation.navigate('CoachReports')}
                            style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
                        >
                            <View style={[styles.actionIconBg, { backgroundColor: '#e0e7ff' }]}>
                                <FileText size={24} color="#4338ca" />
                            </View>
                            <Text style={styles.actionTitle}>Reportes</Text>
                            <Text style={styles.actionSubtitle}>Exportar datos</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => navigation.navigate('ManageTests')}
                            style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
                        >
                            <View style={[styles.actionIconBg, { backgroundColor: '#dbeafe' }]}>
                                <Settings size={24} color={COLORS.primary} />
                            </View>
                            <Text style={styles.actionTitle}>Pruebas</Text>
                            <Text style={styles.actionSubtitle}>Gestionar Tests</Text>
                        </Pressable>
                    </View>

                    {/* 2. ASIGNACIONES ACTIVAS */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Asignaciones Activas</Text>
                            <Pressable onPress={() => navigation.navigate('AssignmentsOverview')}>
                                <Text style={styles.linkText}>Ver todos</Text>
                            </Pressable>
                        </View>

                        {loadingAssignments ? (
                            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 24 }} />
                        ) : assignedTests.length === 0 ? (
                            <View style={styles.emptyStateBox}>
                                <ClipboardList size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
                                <Text style={styles.emptyStateText}>No tienes pruebas en curso.</Text>
                                <Pressable onPress={() => navigation.navigate('ManageTests')}>
                                    <Text style={styles.emptyStateLink}>Crear Asignación</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                                {assignedTests.map(item => (
                                    <Pressable
                                        key={item.id}
                                        onPress={() => navigation.navigate("TestAssignmentDetail", {
                                            assignmentId: item.id,
                                            testName: item.test,
                                            groupName: item.groupName
                                        })}
                                        style={({ pressed }) => [styles.assignmentCard, pressed && styles.cardPressed]}
                                    >
                                        <View style={styles.assignmentHeader}>
                                            <View style={{ flex: 1, marginRight: 8 }}>
                                                <Text style={styles.assignmentGroup} numberOfLines={1}>{item.groupName}</Text>
                                                <Text style={styles.assignmentTest} numberOfLines={1}>{item.test}</Text>
                                            </View>
                                            <View style={styles.deadlineBadge}>
                                                <Text style={styles.deadlineText}>
                                                    {/* Mostramos DD/MM manualmente */}
                                                    {(() => {
                                                        if (!item.deadline) return "";
                                                        const parts = item.deadline.split('T')[0].split('-'); // ["2025", "12", "20"]
                                                        return `${parts[2]}/${parts[1]}`; // Retorna "20/12"
                                                    })()}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.progressContainer}>
                                            <View style={styles.progressTextRow}>
                                                <Text style={styles.progressLabel}>Entregas</Text>
                                                <Text style={styles.progressValue}>{item.completed}/{item.total}</Text>
                                            </View>
                                            <View style={styles.progressBarBg}>
                                                <View style={[styles.progressBarFill, { width: `${item.progress}%` }]} />
                                            </View>
                                        </View>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    {/* 3. MIS GRUPOS */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Mis Grupos</Text>
                            <Pressable onPress={() => navigation.navigate('MyGroups')}>
                                <Text style={styles.linkText}>Gestionar</Text>
                            </Pressable>
                        </View>

                        {loadingGroups ? (
                            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 24 }} />
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                                <Pressable
                                    onPress={() => navigation.navigate('CreateGroup')}
                                    style={({ pressed }) => [styles.createGroupCard, pressed && styles.cardPressed]}
                                >
                                    <View style={styles.createIconBg}>
                                        <Plus size={24} color={COLORS.textMuted} />
                                    </View>
                                    <Text style={styles.createGroupText}>Nuevo Grupo</Text>
                                </Pressable>

                                {recentGroups.length > 0 ? recentGroups.map((group, i) => {
                                    const theme = GROUP_COLORS[i % GROUP_COLORS.length];
                                    return (
                                        <Pressable
                                            key={group.codigo}
                                            onPress={() => navigation.navigate('GroupDetail', { group })}
                                            style={({ pressed }) => [
                                                styles.groupCard,
                                                { backgroundColor: theme.bg },
                                                pressed && styles.cardPressed
                                            ]}
                                        >
                                            <View style={styles.groupHeader}>
                                                <View style={[styles.groupIconCircle, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                                                    <Users size={16} color={theme.icon} />
                                                </View>
                                                <View style={[styles.memberBadge, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                                                    <Text style={[styles.memberCount, { color: theme.icon }]}>{group.members}</Text>
                                                </View>
                                            </View>
                                            <View style={{ marginTop: 'auto' }}>
                                                <Text style={styles.groupName} numberOfLines={2}>{group.nombre}</Text>
                                            </View>
                                        </Pressable>
                                    );
                                }) : (
                                    <View style={styles.emptyGroupsBox}>
                                        <Text style={styles.emptyStateText}>Sin grupos activos</Text>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

// --- ESTILOS OPTIMIZADOS ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: 40,
        paddingTop: 10,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingBottom: 16,
        marginTop: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMuted,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: COLORS.textDark,
        letterSpacing: -0.5,
    },
    headerIcons: {
        flexDirection: "row",
        gap: 12,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.borderColor,
    },
    profileButton: {
        backgroundColor: COLORS.primaryLight,
        borderColor: "#bfdbfe",
    },
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        backgroundColor: COLORS.danger,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.white,
    },

    // Quick Actions
    quickActionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 24,
        gap: 12,
    },
    actionCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    actionIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
    },

    // Sections
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    linkText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    horizontalScroll: {
        paddingHorizontal: 24,
    },

    // ASSIGNMENT CARDS
    assignmentCard: {
        width: 260,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    assignmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    assignmentGroup: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 2,
    },
    assignmentTest: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    deadlineBadge: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    deadlineText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.textMuted,
    },
    progressContainer: {
        gap: 6,
    },
    progressTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    progressValue: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: COLORS.background,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },

    // GROUP CARDS
    createGroupCard: {
        width: 130,
        height: 130,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: COLORS.borderColor,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: 'transparent',
    },
    createIconBg: {
        marginBottom: 8,
    },
    createGroupText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textMuted,
    },
    groupCard: {
        width: 130,
        height: 130,
        borderRadius: 24,
        padding: 16,
        marginRight: 12,
        justifyContent: 'space-between',
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    groupIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    memberCount: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    groupName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textDark,
        lineHeight: 18,
    },

    // EMPTY STATES
    emptyStateBox: {
        width: 260,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        borderStyle: 'dashed',
    },
    emptyGroupsBox: {
        height: 140,
        justifyContent: 'center',
        paddingLeft: 12,
    },
    emptyStateText: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    emptyStateLink: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
    },

    // MODAL
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
    },
    modalHandle: {
        width: 48,
        height: 6,
        backgroundColor: COLORS.borderColor,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 24,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    closeButton: {
        padding: 8,
        backgroundColor: COLORS.background,
        borderRadius: 20,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
    },
    profileCardPressed: {
        backgroundColor: COLORS.primaryLight,
        borderColor: "#bfdbfe",
    },
    profileIconContainer: {
        width: 56,
        height: 56,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    profileEmail: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    logoutButton: {
        flexDirection: 'row',
        backgroundColor: '#fef2f2',
        padding: 16,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    logoutText: {
        color: '#dc2626',
        fontWeight: 'bold',
        fontSize: 16,
    },
});