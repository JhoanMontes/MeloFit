import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    StyleSheet,
    StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
    ArrowLeft,
    Users,
    Trophy,
    Calendar,
    User,
    Target,
    LogOut,
    ClipboardList
} from "lucide-react-native";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { AprendizStackParamList } from "../../navigation/types";
import CustomAlert, { AlertType } from "../../components/CustomAlert";

type Props = NativeStackScreenProps<AprendizStackParamList, "GroupDetail">;

// --- COLORES ---
const COLORS = {
    primary: "#2563eb",
    primaryLight: "#eff6ff",
    background: "#f8fafc",
    white: "#ffffff",
    textDark: "#0f172a",
    textMuted: "#64748b",
    borderColor: "#e2e8f0",
    shadow: "#000000",
    danger: "#ef4444",
    dangerBg: "#fef2f2",
};

export default function GroupDetail({ navigation, route }: Props) {
    const { grupoCodigo, nombreGrupo } = route.params;
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [leaving, setLeaving] = useState(false);
    
    // Datos
    const [groupInfo, setGroupInfo] = useState<any>(null);
    const [memberCount, setMemberCount] = useState(0);
    const [groupHistory, setGroupHistory] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<'atleta' | 'entrenador' | null>(null);
    const [userDoc, setUserDoc] = useState<number | null>(null);

    // Configuración de Alerta Personalizada
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: "",
        message: "",
        type: "info" as AlertType,
        buttonText: "Entendido",
        onConfirm: undefined as (() => void) | undefined,
        cancelText: undefined as string | undefined
    });

    useEffect(() => {
        fetchGroupDetails();
    }, []);

    // Helper para mostrar alertas simples
    const showAlert = (title: string, message: string, type: AlertType = "info") => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            buttonText: "Entendido",
            onConfirm: undefined,
            cancelText: undefined
        });
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

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

    const fetchGroupDetails = async () => {
        try {
            if (!user) return;

            // 1. Obtener Rol y Documento del Usuario Actual
            const { data: userData } = await supabase
                .from('usuario')
                .select('no_documento, rol')
                .eq('auth_id', user.id)
                .single();

            if (userData) {
                setUserRole(userData.rol as 'atleta' | 'entrenador');
                setUserDoc(userData.no_documento);
            }

            // 2. Info del Grupo
            const { data: groupData, error: groupError } = await supabase
                .from('grupo')
                .select(`
                  codigo,
                  nombre,
                  descripcion,
                  fecha_creacion,
                  entrenador (
                    usuario ( nombre_completo )
                  )
                `)
                .eq('codigo', grupoCodigo)
                .single();

            if (groupError) throw groupError;
            setGroupInfo(groupData);

            // 3. Contar Miembros
            const { count } = await supabase
                .from('atleta_has_grupo')
                .select('*', { count: 'exact', head: true })
                .eq('grupo_codigo', grupoCodigo);

            setMemberCount(count || 0);

            // 4. Historial del Usuario en este Grupo
            if (userData) {
                const { data: historyData, error: historyError } = await supabase
                    .from('resultado_prueba')
                    .select(`
                        id,
                        valor,
                        fecha_realizacion,
                        prueba_asignada!inner (
                            id,
                            prueba ( nombre, tipo_metrica ),
                            prueba_asignada_has_atleta!inner (
                                grupo_codigo
                            )
                        )
                    `)
                    .eq('atleta_no_documento', userData.no_documento)
                    .eq('prueba_asignada.prueba_asignada_has_atleta.grupo_codigo', grupoCodigo)
                    .order('fecha_realizacion', { ascending: false })
                    .limit(10);

                if (!historyError && historyData) {
                    const formattedHistory = historyData.map((item: any) => ({
                        id: item.id,
                        valor: item.valor,
                        fecha: item.fecha_realizacion,
                        prueba: item.prueba_asignada.prueba.nombre,
                        unidad: formatUnit(item.prueba_asignada.prueba.tipo_metrica)
                    }));
                    setGroupHistory(formattedHistory);
                }
            }

        } catch (error) {
            console.error("Error cargando detalle grupo:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA SALIR DEL GRUPO CON CUSTOM ALERT ---
    const handleLeaveGroup = () => {
        setAlertConfig({
            visible: true,
            title: "Salir del Equipo",
            message: `¿Estás seguro que deseas salir de "${groupInfo?.nombre}"? Esta acción no se puede deshacer.`,
            type: "warning",
            buttonText: "Sí, Salir",
            cancelText: "Cancelar",
            onConfirm: confirmLeave
        });
    };

    const confirmLeave = async () => {
        if (!userDoc) return;
        setLeaving(true);
        try {
            const { error } = await supabase
                .from('atleta_has_grupo')
                .delete()
                .eq('atleta_no_documento', userDoc)
                .eq('grupo_codigo', grupoCodigo);

            if (error) throw error;

            navigation.goBack();
        } catch (error) {
            console.error("Error al salir del grupo:", error);
            showAlert("Error", "No se pudo salir del grupo. Intenta nuevamente.", "error");
        } finally {
            setLeaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            {/* INTEGRACIÓN CUSTOM ALERT */}
            <CustomAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={closeAlert}
                buttonText={alertConfig.buttonText}
                onConfirm={alertConfig.onConfirm}
                cancelText={alertConfig.cancelText}
            />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>

                {/* HEADER */}
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={COLORS.textDark} />
                    </Pressable>
                    <Text style={styles.headerTitle} numberOfLines={1}>{nombreGrupo}</Text>
                    <View style={{ width: 48 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* HERO CARD */}
                    <View style={styles.heroCard}>
                        <View style={styles.iconCircle}>
                            <Users size={32} color={COLORS.primary} />
                        </View>
                        <Text style={styles.groupNameHero}>{groupInfo?.nombre}</Text>
                        <Text style={styles.groupDescHero}>{groupInfo?.descripcion}</Text>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <User size={16} color={COLORS.textMuted} style={{ marginBottom: 4 }} />
                                <Text style={styles.statLabel}>Entrenador</Text>
                                <Text style={styles.statValue}>{groupInfo?.entrenador?.usuario?.nombre_completo?.split(" ")[0] || "Coach"}</Text>
                            </View>
                            <View style={styles.dividerVertical} />
                            <View style={styles.statItem}>
                                <Users size={16} color={COLORS.textMuted} style={{ marginBottom: 4 }} />
                                <Text style={styles.statLabel}>Miembros</Text>
                                <Text style={styles.statValue}>{memberCount}</Text>
                            </View>
                            <View style={styles.dividerVertical} />
                            <View style={styles.statItem}>
                                <Calendar size={16} color={COLORS.textMuted} style={{ marginBottom: 4 }} />
                                <Text style={styles.statLabel}>Creado</Text>
                                <Text style={styles.statValue}>{new Date(groupInfo?.fecha_creacion).toLocaleDateString()}</Text>
                            </View>
                        </View>

                        {/* BOTÓN SALIR (Solo si es atleta) */}
                        {userRole === 'atleta' && (
                            <Pressable 
                                onPress={handleLeaveGroup} 
                                style={styles.leaveButton}
                                disabled={leaving}
                            >
                                {leaving ? (
                                    <ActivityIndicator size="small" color={COLORS.danger} />
                                ) : (
                                    <>
                                        <LogOut size={16} color={COLORS.danger} style={{marginRight: 6}} />
                                        <Text style={styles.leaveText}>Salir del Equipo</Text>
                                    </>
                                )}
                            </Pressable>
                        )}
                    </View>

                    {/* SECCIÓN HISTORIAL */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Target size={20} color={COLORS.textDark} style={{ marginRight: 8 }} />
                            <Text style={styles.sectionTitle}>Tu Historial en este Equipo</Text>
                        </View>

                        {groupHistory.length > 0 ? (
                            groupHistory.map((res, index) => (
                                <View key={index} style={styles.resultCard}>
                                    <View style={styles.resultLeft}>
                                        <View style={styles.resultIconBg}>
                                            <Trophy size={18} color={COLORS.primary} />
                                        </View>
                                        <View>
                                            <Text style={styles.resultTestName}>{res.prueba}</Text>
                                            <Text style={styles.resultDate}>{new Date(res.fecha).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.resultRight}>
                                        <Text style={styles.resultValue}>{res.valor}</Text>
                                        <Text style={styles.resultUnit}>{res.unidad}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <ClipboardList size={40} color={COLORS.borderColor} />
                                <Text style={styles.emptyStateText}>Aún no tienes registros en este grupo.</Text>
                            </View>
                        )}
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    backButton: {
        width: 48,
        height: 48,
        backgroundColor: COLORS.white,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
        flex: 1,
        textAlign: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    
    // HERO CARD
    heroCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        marginTop: 8,
        marginBottom: 32,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    groupNameHero: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.textDark,
        textAlign: 'center',
        marginBottom: 8,
    },
    groupDescHero: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.textDark,
        textAlign: 'center',
    },
    dividerVertical: {
        width: 1,
        backgroundColor: COLORS.borderColor,
        height: '100%',
    },
    // BOTÓN SALIR
    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: COLORS.dangerBg,
        borderWidth: 1,
        borderColor: '#fecaca',
        width: '100%',
    },
    leaveText: {
        color: COLORS.danger,
        fontWeight: '700',
        fontSize: 14,
    },

    // HISTORIAL
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    resultCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
    },
    resultLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    resultIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultTestName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    resultDate: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    resultRight: {
        alignItems: 'flex-end',
    },
    resultValue: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.primary,
    },
    resultUnit: {
        fontSize: 10,
        color: COLORS.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.borderColor,
        borderStyle: 'dashed',
    },
    emptyStateText: {
        marginTop: 8,
        color: COLORS.textMuted,
        fontSize: 14,
        textAlign: 'center',
    },
});