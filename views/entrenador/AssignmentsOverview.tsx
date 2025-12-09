import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    TextInput,
    ActivityIndicator,
    StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
    ChevronLeft, 
    Search, 
    Calendar, 
    CheckCircle2, 
    Users,
    AlertCircle
} from "lucide-react-native";

import { useAuth } from "../../context/AuthContext"; 
import { EntrenadorStackParamList } from "../../navigation/types"; 
import { supabase } from "../../lib/supabase"; 

type Props = NativeStackScreenProps<EntrenadorStackParamList, "AssignmentsOverview">;

// --- CONSTANTES ---
const COLORS = {
    primary: "#2563eb",
    primaryLight: "#eff6ff",
    background: "#f8fafc",
    white: "#ffffff",
    textDark: "#0f172a",
    textMuted: "#64748b",
    borderColor: "#e2e8f0",
    success: "#22c55e",
    danger: "#ef4444",
};

export default function AssignmentsOverview({ navigation }: Props) {
    const { user } = useAuth();
    
    // Estados
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Cargar Datos
    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            fetchAssignments(isActive);
            return () => { isActive = false };
        }, [user, activeTab])
    );

    const fetchAssignments = async (isActiveComponent: boolean) => {
        setLoading(true);
        try {
            const { data: trainer } = await supabase.from("usuario").select("no_documento").eq("auth_id", user?.id).single();
            if (!trainer) return;

            const { data: myGroups } = await supabase.from("grupo").select("codigo, nombre").eq("entrenador_no_documento", trainer.no_documento);
            if (!myGroups || myGroups.length === 0) {
                setAssignments([]);
                setLoading(false);
                return;
            }

            const groupCodes = myGroups.map(g => g.codigo);
            const groupMap: Record<string, string> = {};
            myGroups.forEach(g => groupMap[g.codigo] = g.nombre);

            const nowISO = new Date().toISOString();
            
            // Query Base: Partimos de la tabla intermedia que tiene grupo_codigo
            let query = supabase
                .from("prueba_asignada_has_atleta")
                .select(`
                    grupo_codigo,
                    prueba_asignada!inner (
                        id, 
                        fecha_asignacion, 
                        fecha_limite, 
                        prueba ( nombre )
                    )
                `)
                .in("grupo_codigo", groupCodes);

            // Filtro por fecha usando !inner
            if (activeTab === 'active') {
                query = query.gte("prueba_asignada.fecha_limite", nowISO);
            } else {
                query = query.lt("prueba_asignada.fecha_limite", nowISO);
            }

            const { data: rawData, error } = await query;

            if (error) throw error;

            if (rawData && isActiveComponent) {
                // 1. Desduplicar (Una fila por asignación, no por atleta)
                const uniqueMap = new Map();
                rawData.forEach((item: any) => {
                    const key = `${item.prueba_asignada.id}-${item.grupo_codigo}`;
                    if (!uniqueMap.has(key)) uniqueMap.set(key, item);
                });
                const uniqueItems = Array.from(uniqueMap.values());

                // 2. Enriquecer con conteos
                const enriched = await Promise.all(uniqueItems.map(async (item: any) => {
                     const p = item.prueba_asignada;
                     
                     const { count: total } = await supabase.from("prueba_asignada_has_atleta")
                        .select("*", { count: "exact", head: true }).eq("prueba_asignada_id", p.id);
                     
                     const { count: completed } = await supabase.from("resultado_prueba")
                        .select("*", { count: "exact", head: true }).eq("prueba_asignada_id", p.id);

                     return {
                         id: p.id,
                         fecha_asignacion: p.fecha_asignacion,
                         fecha_limite: p.fecha_limite,
                         testName: p.prueba?.nombre,
                         groupName: groupMap[item.grupo_codigo],
                         total: total || 0,
                         completed: completed || 0,
                         progress: (total && total > 0) ? Math.round(((completed || 0) / total) * 100) : 0
                     };
                }));

                // Ordenar
                if (activeTab === 'active') {
                    // Más urgentes primero
                    enriched.sort((a, b) => new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime());
                } else {
                    // Más recientes primero
                    enriched.sort((a, b) => new Date(b.fecha_limite).getTime() - new Date(a.fecha_limite).getTime());
                }

                setAssignments(enriched);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (isActiveComponent) setLoading(false);
        }
    };

    // Filtro local
    const filteredData = assignments.filter(item => 
        (item.testName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.groupName?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    const renderCard = ({ item }: { item: any }) => {
        const isExpired = new Date(item.fecha_limite) < new Date();
        // Calc días restantes
        const diffTime = new Date(item.fecha_limite).getTime() - new Date().getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return (
            <Pressable 
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => navigation.navigate("TestAssignmentDetail", {
                    assignmentId: item.id,
                    testName: item.testName,
                    groupName: item.groupName
                })}
            >
                {/* Header: Group Badge + Status */}
                <View style={styles.cardHeader}>
                    <View style={styles.groupBadge}>
                        <Users size={12} color={COLORS.primary} />
                        <Text style={styles.groupBadgeText}>{item.groupName}</Text>
                    </View>
                    <View style={[
                        styles.statusBadge, 
                        isExpired ? { backgroundColor: '#fee2e2' } : { backgroundColor: '#dcfce7' }
                    ]}>
                        <Text style={[
                            styles.statusText,
                            isExpired ? { color: COLORS.danger } : { color: COLORS.success }
                        ]}>
                            {isExpired ? "Cerrada" : `${daysLeft} días rest.`}
                        </Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.cardTitle}>{item.testName}</Text>

                {/* Dates Row */}
                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <Calendar size={14} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>Asignada: {formatDate(item.fecha_asignacion)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <AlertCircle size={14} color={isExpired ? COLORS.danger : COLORS.textMuted} />
                        <Text style={[styles.infoText, isExpired && { color: COLORS.danger }]}>
                            Límite: {formatDate(item.fecha_limite)}
                        </Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Entregas</Text>
                        <Text style={styles.progressValue}>{item.completed}/{item.total} ({item.progress}%)</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[
                            styles.progressBarFill, 
                            { width: `${item.progress}%`, backgroundColor: item.progress === 100 ? COLORS.success : COLORS.primary }
                        ]} />
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={COLORS.textDark} />
                </Pressable>
                <Text style={styles.headerTitle}>Gestionar Asignaciones</Text>
                <View style={{ width: 40 }} /> 
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Search size={20} color={COLORS.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por prueba o grupo..."
                    placeholderTextColor={COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <Pressable 
                    style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Activas</Text>
                </Pressable>
                <Pressable 
                    style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Historial</Text>
                </Pressable>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => `${item.id}-${item.groupName}`}
                    renderItem={renderCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <CheckCircle2 size={48} color={COLORS.borderColor} />
                            <Text style={styles.emptyText}>
                                {activeTab === 'active' 
                                    ? "No hay pruebas pendientes." 
                                    : "No hay historial de pruebas."}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        paddingHorizontal: 12,
        height: 48,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: COLORS.textDark,
        height: '100%',
    },
    // Tabs
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        backgroundColor: '#e2e8f0', 
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: COLORS.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
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
    // List
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        gap: 16,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        shadowColor: COLORS.borderColor, // Sombra sutil
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardPressed: {
        backgroundColor: '#f8fafc',
        transform: [{ scale: 0.99 }],
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    groupBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
    },
    groupBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    // Progress
    progressContainer: {
        gap: 6,
    },
    progressHeader: {
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
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: COLORS.background,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    // Utils
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        paddingTop: 60,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textMuted,
    }
});