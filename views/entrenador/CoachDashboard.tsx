import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Modal,
    StatusBar,
    ActivityIndicator
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
} from "lucide-react-native";

import { useAuth } from "../../context/AuthContext";
import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "Dashboard">;

const CARD_COLORS = [
    { bg: 'bg-indigo-100', iconColor: '#4338ca' },
    { bg: 'bg-emerald-100', iconColor: '#059669' },
    { bg: 'bg-orange-100', iconColor: '#ea580c' },
    { bg: 'bg-blue-100', iconColor: '#2563EB' },
    { bg: 'bg-purple-100', iconColor: '#9333EA' }
];

export default function CoachDashboard({ navigation }: Props) {
    const { logout, user } = useAuth();

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [nombre, setNombre] = useState<String>("Entrenador");

    const [recentGroups, setRecentGroups] = useState<any[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(true);

    const [assignedTests, setAssignedTests] = useState<any[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(true);

    // ======================================================
    //              CARGAR NOMBRE DEL ENTRENADOR
    // ======================================================
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.id) return;
            try {
                const { data } = await supabase
                    .from('usuario')
                    .select('nombre_completo')
                    .eq('auth_id', user.id)
                    .single();

                if (data) {
                    const primer = data.nombre_completo.trim().split(" ")[0];
                    setNombre(primer.charAt(0).toUpperCase() + primer.slice(1).toLowerCase());
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchUserData();
    }, [user]);

    // ======================================================
    //                    CARGAR GRUPOS
    // ======================================================
    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const fetchRecentGroups = async () => {
                if (!user) return;
                try {
                    const { data: trainerData } = await supabase
                        .from('usuario')
                        .select('no_documento')
                        .eq('auth_id', user.id)
                        .single();
                    if (!trainerData) return;

                    const { data, error } = await supabase
                        .from('grupo')
                        .select('*, atleta_has_grupo(count)')
                        .eq('entrenador_no_documento', trainerData.no_documento)
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
                    console.error("Error fetching dashboard groups:", error);
                } finally {
                    if (isActive) setLoadingGroups(false);
                }
            };
            fetchRecentGroups();
            return () => { isActive = false };
        }, [user])
    );

    // ======================================================
    //       CARGAR ÚLTIMAS ASIGNACIONES REALES (FULL BD)
    // ======================================================
    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const loadAssignments = async () => {
                try {
                    // 1. Obtener documento de entrenador
                    const { data: trainer } = await supabase
                        .from("usuario")
                        .select("no_documento")
                        .eq("auth_id", user?.id)
                        .single();

                    if (!trainer) return;

                    // 2. Obtener atletas del entrenador mediante sus grupos
                    const { data: athleteGroups } = await supabase
                        .from("grupo")
                        .select("codigo")
                        .eq("entrenador_no_documento", trainer.no_documento);

                    if (!athleteGroups || athleteGroups.length === 0) {
                        setAssignedTests([]);
                        return;
                    }

                    const groupCodes = athleteGroups.map(g => g.codigo);

                    // 3. Traer asignaciones
                    const { data: asignaciones } = await supabase
                        .from("prueba_asignada_has_atleta")
                        .select(`
                            prueba_asignada_id,
                            atleta_no_documento,
                            grupo_codigo,
                            prueba_asignada (
                                id,
                                fecha_asignacion,
                                fecha_limite,
                                prueba (
                                    id,
                                    nombre,
                                    descripcion
                                )
                            )
                        `)
                        .in("grupo_codigo", groupCodes);

                    if (!asignaciones || asignaciones.length === 0) {
                        setAssignedTests([]);
                        return;
                    }

                    // 4. Tomar solo la última asignación de cada prueba (Simplificado)
                    const map: Record<number, any> = {};
                    asignaciones.forEach(a => {
                        const pruebaId = a.prueba_asignada.prueba.id;
                        // Usamos una clave compuesta (prueba_id + grupo_codigo) para manejar asignaciones repetidas a diferentes grupos
                        const key = `${pruebaId}-${a.grupo_codigo}`; 
                        const fecha = new Date(a.prueba_asignada.fecha_asignacion);

                        if (!map[key] || fecha > new Date(map[key].prueba_asignada.fecha_asignacion)) {
                            map[key] = a;
                        }
                    });

                    const latest = Object.values(map);

                    // 5. Obtener nombres de grupos
                    const uniqueGroups = [...new Set(latest.map(x => x.grupo_codigo))];

                    const { data: gruposInfo } = await supabase
                        .from("grupo")
                        .select("codigo, nombre")
                        .in("codigo", uniqueGroups);

                    const grupoMap: Record<string, string> = {};
                    gruposInfo?.forEach(g => grupoMap[g.codigo] = g.nombre);

                    // 6. Formato final para la UI
                    const finalData = await Promise.all(
                        latest.map(async (a) => {
                            const assignmentId = a.prueba_asignada.id;

                            // ---- TOTAL ASIGNADOS ----
                            const { count: totalCount } = await supabase
                                .from("prueba_asignada_has_atleta")
                                .select("*", { count: "exact", head: true })
                                .eq("prueba_asignada_id", assignmentId);

                            // ---- COMPLETADOS: quienes ya tienen un resultado ----
                            const { count: completedCount } = await supabase
                                .from("resultado_prueba")
                                .select("*", { count: "exact", head: true })
                                .eq("prueba_asignada_id", assignmentId);

                            const completed = completedCount ?? 0;
                            const total = totalCount ?? 0;

                            return {
                                // Aquí se corrige para que item.id sea el ID de la asignación
                                id: assignmentId, // <-- Aseguramos que sea el ID de prueba_asignada (ej: 5)
                                test: a.prueba_asignada.prueba.nombre,
                                descripcion: a.prueba_asignada.prueba.descripcion,
                                fecha: a.prueba_asignada.fecha_asignacion,

                                groupName: grupoMap[a.grupo_codigo] ?? "Grupo desconocido",

                                completed,
                                total,
                                progress: total > 0 ? Math.round((completed / total) * 100) : 0,

                                deadline: a.prueba_asignada.fecha_limite,
                            };
                        })
                    );

                    if (isActive) setAssignedTests(finalData);

                } catch (err) {
                    console.error(err);
                } finally {
                    if (isActive) setLoadingAssignments(false);
                }
            };

            loadAssignments();
            return () => { isActive = false };
        }, [user])
    );

    // ======================================================
    //                       UI
    // ======================================================

    const ProfileModal = () => (
        <Modal animationType="fade" transparent visible={showProfileModal}>
            <View className="flex-1 bg-slate-900/60 justify-end">
                <Pressable className="flex-1" onPress={() => setShowProfileModal(false)} />
                <View className="bg-white rounded-t-[40px] p-6 pb-10 shadow-2xl">
                    <View className="items-center mb-6">
                        <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
                    </View>

                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-2xl font-bold text-slate-900">Tu Cuenta</Text>
                        <Pressable onPress={() => setShowProfileModal(false)} className="p-2 bg-slate-100 rounded-full">
                            <X size={20} color="#64748b" />
                        </Pressable>
                    </View>

                    <Pressable
                        onPress={() => { setShowProfileModal(false); navigation.navigate("Profile"); }}
                        className="flex-row items-center bg-slate-50 p-4 rounded-3xl mb-6 border border-slate-100"
                    >
                        <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4">
                            <User size={30} color="#2563EB" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-slate-900">{nombre}</Text>
                            <Text className="text-slate-500 font-medium">{user?.email}</Text>
                        </View>
                        <ChevronRight size={20} color="#94a3b8" />
                    </Pressable>

                    <Pressable
                        onPress={() => { setShowProfileModal(false); logout(); }}
                        className="w-full bg-red-50 py-4 rounded-2xl flex-row items-center justify-center gap-2"
                    >
                        <LogOut size={20} color="#DC2626" />
                        <Text className="text-red-600 font-bold text-base">Cerrar Sesión</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );

    return (
        <View className="flex-1 bg-[#F5F5F7]">
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <ProfileModal />

            <SafeAreaView style={{ flex: 1 }}>

                {/* HEADER */}
                <View className="px-6 pb-4 mt-3 flex-row items-center justify-between">
                    <View>
                        <Text className="text-slate-500 text-sm font-semibold">Panel del Entrenador</Text>
                        <Text className="text-slate-900 text-2xl font-extrabold">Hola, {nombre}</Text>
                    </View>

                    <View className="flex-row items-center gap-x-3">
                        <Pressable
                            onPress={() => navigation.navigate('Notifications')}
                            className="w-12 h-12 bg-white rounded-full items-center justify-center border border-slate-100"
                        >
                            <Bell size={22} color="#334155" />
                            <View className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                        </Pressable>

                        <Pressable
                            onPress={() => setShowProfileModal(true)}
                            className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center border border-blue-100"
                        >
                            <User size={22} color="#2563EB" />
                        </Pressable>
                    </View>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 140, paddingTop: 10 }}
                >

                    {/* Quick Actions */}
                    <View className="px-6 flex-row justify-between mb-8">
                        <Pressable
                            onPress={() => navigation.navigate('CoachReports')}
                            className="bg-white rounded-[24px] p-4 flex-1 mr-3 shadow-sm border border-slate-100 flex-row items-center"
                        >
                            <View className="bg-indigo-50 p-3 rounded-2xl mr-3">
                                <FileText size={20} color="#4f46e5" />
                            </View>
                            <View>
                                <Text className="text-slate-900 font-bold text-base">Reportes</Text>
                                <Text className="text-slate-400 text-[10px]">Exportar datos</Text>
                            </View>
                        </Pressable>

                        <Pressable
                            onPress={() => navigation.navigate('ManageTests')}
                            className="bg-white rounded-[24px] p-4 flex-1 ml-3 shadow-sm border border-slate-100 flex-row items-center"
                        >
                            <View className="bg-blue-50 p-3 rounded-2xl mr-3">
                                <Settings size={20} color="#2563EB" />
                            </View>
                            <View>
                                <Text className="text-slate-900 font-bold text-base">Pruebas</Text>
                                <Text className="text-slate-400 text-[10px]">Gestionar</Text>
                            </View>
                        </Pressable>
                    </View>

                    {/* ======================================================
                        SECCIÓN REAL: ESTADO DE ASIGNACIONES
                    ====================================================== */}
                    <View className="mb-8">
                        <View className="flex-row items-center justify-between px-6 mb-4">
                            <Text className="text-slate-900 text-lg font-bold">Estado de Asignaciones</Text>
                            <Pressable onPress={() => navigation.navigate('AssignmentsOverview')}>
                                <Text className="text-blue-600 text-sm font-bold">Ver todos</Text>
                            </Pressable>
                        </View>

                        {loadingAssignments ? (
                            <View className="pl-6 mb-4"><ActivityIndicator color="#2563EB" /></View>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 24 }}
                            >
                                {assignedTests.length === 0 ? (
                                    <View className="h-32 justify-center">
                                        <Text className="text-slate-400 italic">No hay asignaciones activas</Text>
                                    </View>
                                ) : (
                                    assignedTests.map(item => (
                                        <Pressable
                                            key={item.id}
                                            onPress={() => navigation.navigate("TestAssignmentDetail", {
                                                assignmentId: item.id, // <-- ID de prueba_asignada (CORRECTO)
                                                testName: item.test,
                                                groupName: item.groupName
                                            })}
                                            className="bg-white p-4 rounded-[24px] mr-4 w-72 shadow-sm border border-slate-100"
                                        >
                                            <View className="flex-row justify-between items-start mb-3">
                                                <View className="flex-1 mr-2">
                                                    <Text className="text-slate-900 font-bold text-base" numberOfLines={1}>
                                                        {item.groupName}
                                                    </Text>
                                                    <Text className="text-slate-500 text-xs">{item.test}</Text>
                                                </View>
                                                <View className="px-2 py-1 bg-slate-100 rounded-lg">
                                                    <Text className="text-[10px] font-bold text-slate-600">
                                                        {item.deadline || "—"}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Barra de progreso */}
                                            <View>
                                                <View className="flex-row justify-between mb-1.5">
                                                    <Text className="text-xs text-slate-400 font-medium">Progreso</Text>
                                                    <Text className="text-xs text-blue-600 font-bold">
                                                        {item.completed}/{item.total} completados
                                                    </Text>
                                                </View>
                                                <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <View
                                                        className="h-full rounded-full bg-blue-600"
                                                        style={{ width: `${item.progress}%` }}
                                                    />
                                                </View>
                                            </View>
                                        </Pressable>
                                    ))
                                )}
                            </ScrollView>
                        )}
                    </View>

                    {/* GRUPOS */}
                    <View className="mb-4">
                        <View className="flex-row items-center justify-between px-6 mb-4">
                            <Text className="text-slate-900 text-lg font-bold">Mis Grupos</Text>
                            <Pressable onPress={() => navigation.navigate('MyGroups')}>
                                <Text className="text-blue-600 text-sm font-bold">Ver todos</Text>
                            </Pressable>
                        </View>

                        {loadingGroups ? (
                            <View className="pl-6"><ActivityIndicator color="#2563EB" /></View>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 24 }}
                            >
                                <Pressable
                                    onPress={() => navigation.navigate('CreateGroup')}
                                    className="p-5 rounded-[28px] mr-3 w-40 h-40 justify-center items-center border-2 border-dashed border-slate-300"
                                >
                                    <Plus size={32} color="#cbd5e1" />
                                    <Text className="text-slate-400 text-xs font-bold mt-2">Crear Nuevo</Text>
                                </Pressable>

                                {recentGroups.length > 0 ? recentGroups.map((group, i) => {
                                    const color = CARD_COLORS[i % CARD_COLORS.length];
                                    return (
                                        <Pressable
                                            key={group.codigo}
                                            onPress={() => navigation.navigate('GroupDetail', { group })}
                                            className={`p-5 rounded-[28px] mr-3 w-40 h-40 justify-between ${color.bg}`}
                                        >
                                            <View className="bg-white/60 w-10 h-10 rounded-full items-center justify-center">
                                                <Users size={20} color={color.iconColor} />
                                            </View>
                                            <View>
                                                <Text className="text-slate-900 font-bold text-base" numberOfLines={2}>
                                                    {group.nombre}
                                                </Text>
                                                <Text className="text-slate-600 text-xs">{group.members} atletas</Text>
                                            </View>
                                        </Pressable>
                                    );
                                }) : (
                                    <View className="justify-center h-40">
                                        <Text className="text-slate-400 italic">No hay grupos activos</Text>
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