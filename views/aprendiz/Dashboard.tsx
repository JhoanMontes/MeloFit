import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StatusBar,
  TextInput,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import {
  Bell,
  User,
  TrendingUp,
  BarChart3,
  ClipboardList,
  Users,
  Plus,
  X,
  LogOut,
  Trophy,
  MessageSquare,
  ChevronRight,
  Clock,
  Calendar,
  ArrowRight
} from "lucide-react-native";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { AprendizStackParamList } from "../../navigation/types";
import CustomAlert, { AlertType } from "../../components/CustomAlert";

type Props = NativeStackScreenProps<AprendizStackParamList, "Dashboard">;

const { width } = Dimensions.get("window");

// --- PALETA DE COLORES REFINADA ---
const COLORS = {
  primary: "#2563eb",       // Azul vibrante
  primaryLight: "#eff6ff",  // Fondo azul muy claro
  primaryDark: "#1e40af",   // Azul oscuro
  background: "#F8FAFC",    // Fondo general (Slate 50)
  white: "#ffffff",
  textDark: "#0f172a",      // Texto principal (Slate 900)
  textMuted: "#64748b",     // Texto secundario (Slate 500)
  borderColor: "#e2e8f0",   // Bordes sutiles
  success: "#10b981",       // Verde éxito
  successBg: "#ecfdf5",
  warning: "#f59e0b",       // Naranja alerta
  warningBg: "#fffbeb",
  danger: "#ef4444",        // Rojo error
  dangerBg: "#fef2f2",
  shadow: "#64748b",        // Color base para sombras
};

export default function Dashboard({ navigation }: Props) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  // --- ESTADOS ---
  const [userData, setUserData] = useState<{ nombre: string, doc: number | null }>({ nombre: "Atleta", doc: null });
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [pendingTests, setPendingTests] = useState<any[]>([]);
  const [hasNotifications, setHasNotifications] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [groupCodeInput, setGroupCodeInput] = useState("");
  const [joining, setJoining] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as AlertType
  });

  const showAlert = (title: string, message: string, type: AlertType = "info") => {
    setAlertConfig({ visible: true, title, message, type });
  };

  // --- HELPER: FORMATEO DE UNIDADES ---
  const formatUnit = (raw: string | null) => {
    if (!raw) return '';
    const r = raw.toLowerCase();
    
    if (r === 'time_min' || r.includes('minutos') || r.includes('minute')) {
        return 'Min';
    } 
    else if (r === 'time_sec' || r.includes('segundos') || r.includes('second')) {
        return 'Seg';
    }
    else if (r.includes('rep')) {
        return 'Reps';
    }
    else if (r.includes('kilo') || r.includes('kg')) {
        return 'Kg';
    }
    else if (r.includes('metr')) {
        return 'm';
    }
    return raw; // Retorno por defecto si no coincide
  };

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // 1. Usuario
      const { data: userRecord } = await supabase
        .from('usuario').select('no_documento, nombre_completo').eq('auth_id', user.id).single();
      
      if (!userRecord) return;

      setUserData({ nombre: userRecord.nombre_completo?.split(" ")[0] || "Atleta", doc: userRecord.no_documento });
      const docId = userRecord.no_documento;

      // 2. Mis Grupos
      const { data: groupsData } = await supabase.from('atleta_has_grupo').select(`grupo ( codigo, nombre, descripcion )`).eq('atleta_no_documento', docId);
      setMyGroups(groupsData?.map((item: any) => item.grupo) || []);

      // 3. Resultados Recientes
      const { data: resultsData } = await supabase
        .from('resultado_prueba')
        .select(`
          id, valor, fecha_realizacion,
          prueba_asignada!inner ( id, prueba ( nombre, tipo_metrica ) ),
          comentario ( mensaje )
        `)
        .eq('atleta_no_documento', docId)
        .order('fecha_realizacion', { ascending: false })
        .limit(5);
      setRecentResults(resultsData || []);

      // 4. Pruebas Pendientes (Agenda)
      const today = new Date().toISOString().split('T')[0];
      const { data: assignmentsData } = await supabase
        .from('prueba_asignada_has_atleta')
        .select(`
          prueba_asignada!inner ( id, fecha_limite, fecha_asignacion, prueba ( nombre ) ),
          grupo ( nombre ) 
        `)
        .eq('atleta_no_documento', docId)
        .gte('prueba_asignada.fecha_limite', today) 
        .order('prueba_asignada(fecha_limite)', { ascending: true });

      const completedIds = resultsData?.map((r: any) => r.prueba_asignada.id) || [];
      const pending = assignmentsData
        ?.filter((item: any) => !completedIds.includes(item.prueba_asignada.id))
        .map((item: any) => ({ ...item.prueba_asignada, grupo_nombre: item.grupo?.nombre })) || [];
      
      setPendingTests(pending);

      // 5. Notificaciones
      const { count: unreadCount } = await supabase
        .from('notificacion')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_no_documento', docId)
        .eq('leido', false);

      setHasNotifications(unreadCount !== null && unreadCount > 0);

    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, [user]));
  const onRefresh = () => { setRefreshing(true); fetchDashboardData(); };

  // --- JOIN GROUP ---
  const handleJoinGroup = async () => {
    if (!groupCodeInput.trim() || !userData.doc) { showAlert("Código inválido", "Ingresa un código.", "warning"); return; }
    setJoining(true);
    try {
      const { data: groupExists } = await supabase.from('grupo').select('codigo, nombre').eq('codigo', groupCodeInput.trim()).single();
      if (!groupExists) { showAlert("Error", "Grupo no encontrado.", "error"); setJoining(false); return; }
      
      const { data: already } = await supabase.from('atleta_has_grupo').select('*').eq('atleta_no_documento', userData.doc).eq('grupo_codigo', groupExists.codigo).single();
      if (already) { showAlert("Info", "Ya estás en este grupo.", "info"); setJoining(false); return; }
      
      const { error } = await supabase.from('atleta_has_grupo').insert({ atleta_no_documento: userData.doc, grupo_codigo: groupExists.codigo });
      if (error) throw error;
      
      showAlert("¡Éxito!", `Te uniste a ${groupExists.nombre}`, "success");
      setShowJoinGroupModal(false); setGroupCodeInput(""); fetchDashboardData();
    } catch (e) { showAlert("Error", "No se pudo unir.", "error"); } finally { setJoining(false); }
  };

  const getDaysRemaining = (dateString: string) => {
    const diff = new Date(dateString).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={() => setAlertConfig({...alertConfig, visible: false})} />

      {/* MODALES */}
      <Modal animationType="fade" transparent={true} visible={showProfileModal} onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowProfileModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tu Cuenta</Text>
              <Pressable onPress={() => setShowProfileModal(false)} style={styles.closeButton}><X size={20} color={COLORS.textMuted} /></Pressable>
            </View>
            <Pressable onPress={() => { setShowProfileModal(false); navigation.navigate("Profile"); }} style={styles.profileCard}>
              <View style={styles.profileIconContainer}><User size={30} color={COLORS.primary} /></View>
              <View style={{ flex: 1 }}><Text style={styles.profileName}>{userData.nombre}</Text><Text style={styles.profileEmail}>{user?.email}</Text></View>
              <ChevronRight size={20} color={COLORS.textMuted} />
            </Pressable>
            <Pressable onPress={() => { setShowProfileModal(false); logout(); }} style={styles.logoutButton}><LogOut size={20} color="#DC2626" /><Text style={styles.logoutText}>Cerrar Sesión</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={showJoinGroupModal} onRequestClose={() => setShowJoinGroupModal(false)}>
        <View style={styles.modalOverlayCenter}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowJoinGroupModal(false)} />
          <View style={styles.modalContentCenter}>
            <Text style={styles.modalTitleCenter}>Unirse a un Equipo</Text>
            <Text style={styles.modalSubtitleCenter}>Ingresa el código que te dio tu entrenador.</Text>
            <View style={styles.inputContainer}>
              <Users size={20} color={COLORS.textMuted} style={{ marginRight: 10 }} />
              <TextInput placeholder="Ej: G-123" placeholderTextColor={COLORS.textMuted} value={groupCodeInput} onChangeText={setGroupCodeInput} style={styles.textInput} autoCapitalize="characters" />
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowJoinGroupModal(false)} style={styles.btnCancel}><Text style={styles.btnCancelText}>Cancelar</Text></Pressable>
              <Pressable onPress={handleJoinGroup} style={styles.btnConfirm} disabled={joining}>{joining ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.btnConfirmText}>Unirse</Text>}</Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Hola,</Text>
            <Text style={styles.headerTitle}>{userData.nombre}</Text>
          </View>
          <View style={styles.headerIcons}>
            <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.iconButton}>
              <Bell size={22} color={COLORS.textMuted} />
              {hasNotifications && <View style={styles.notificationDot} />}
            </Pressable>
            <Pressable onPress={() => setShowProfileModal(true)} style={[styles.iconButton, styles.profileButton]}>
              <User size={22} color={COLORS.primary} />
            </Pressable>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false} 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          
          {/* 1. SECCIÓN AGENDA */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tu Agenda</Text>
              {pendingTests.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{pendingTests.length}</Text>
                </View>
              )}
            </View>

            {pendingTests.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.agendaScrollContent} // Padding corregido para no pegarse al borde
              >
                {pendingTests.map((test, index) => {
                  const daysLeft = getDaysRemaining(test.fecha_limite);
                  const isUrgent = daysLeft <= 2;
                  
                  return (
                    <Pressable 
                      key={index} 
                      style={({pressed}) => [
                        styles.agendaCard, 
                        isUrgent && styles.agendaCardUrgent,
                        pressed && styles.cardPressed
                      ]}
                    >
                      <View style={styles.agendaHeader}>
                        <View style={[
                          styles.agendaIcon, 
                          isUrgent ? { backgroundColor: '#fee2e2' } : { backgroundColor: '#e0f2fe' }
                        ]}>
                          <Clock size={18} color={isUrgent ? COLORS.danger : COLORS.primary} />
                        </View>
                        {isUrgent && (
                          <View style={styles.urgentTag}>
                            <Text style={styles.urgentText}>Pronto</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={styles.agendaTitle} numberOfLines={2}>{test.prueba?.nombre}</Text>
                      <Text style={styles.agendaGroup} numberOfLines={1}>{test.grupo_nombre || "General"}</Text>
                      
                      <View style={styles.agendaFooter}>
                        <Calendar size={12} color={isUrgent ? COLORS.danger : COLORS.textMuted} style={{marginRight: 4}} />
                        <Text style={[styles.agendaDate, isUrgent && { color: COLORS.danger }]}>
                          {daysLeft === 0 ? "Vence hoy" : daysLeft < 0 ? "Vencida" : `${daysLeft} días restantes`}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyAgendaBox}>
                <View style={styles.checkCircle}>
                  <ClipboardList size={24} color={COLORS.success} />
                </View>
                <View>
                  <Text style={styles.emptyTitle}>¡Todo listo!</Text>
                  <Text style={styles.emptySubtitle}>Disfruta tu descanso, no hay tareas.</Text>
                </View>
              </View>
            )}
          </View>

          {/* 2. SECCIÓN GRUPOS */}
          <View style={styles.sectionContainer}>
             <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mis Equipos</Text>
                {/* BOTÓN "UNIRSE" MEJORADO */}
                <Pressable onPress={() => setShowJoinGroupModal(true)} style={styles.joinButtonCapsule}>
                  <Plus size={14} color={COLORS.primary} strokeWidth={3} />
                  <Text style={styles.joinButtonText}>Unirse</Text>
                </Pressable>
             </View>
             
             <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.groupsScrollContent} // Padding corregido
             >
               {myGroups.length > 0 ? (
                 myGroups.map((group, index) => (
                   <Pressable 
                    key={index} 
                    style={({pressed}) => [styles.teamCard, pressed && styles.cardPressed]} 
                    onPress={() => navigation.navigate('GroupDetail', { grupoCodigo: group.codigo, nombreGrupo: group.nombre })}
                   >
                     <View style={styles.teamIcon}>
                        <Users size={20} color={COLORS.primary} />
                     </View>
                     <View style={styles.teamInfo}>
                        <Text style={styles.teamName} numberOfLines={1}>{group.nombre}</Text>
                        <Text style={styles.teamDesc} numberOfLines={1}>Ver detalles</Text>
                     </View>
                     <ChevronRight size={16} color={COLORS.borderColor} />
                   </Pressable>
                 ))
               ) : (
                 <View style={styles.emptyGroupBox}>
                   <Text style={styles.emptyGroupText}>Aún no perteneces a ningún equipo.</Text>
                 </View>
               )}
             </ScrollView>
          </View>

          {/* 3. ACTIVIDAD RECIENTE */}
          <View style={[styles.sectionContainer, { marginTop: 32 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 18, marginStart: 18 }]}>Actividad Reciente</Text>
            
            {recentResults.length > 0 ? (
              <View style={styles.activityList}>
                {recentResults.map((res, index) => {
                  const isLast = index === recentResults.length - 1;
                  return (
                    <View key={res.id} style={styles.activityItem}>
                      {/* Línea conectora */}
                      {!isLast && <View style={styles.timelineLine} />}
                      
                      <View style={styles.activityIconContainer}>
                        <View style={styles.activityIcon}>
                          <Trophy size={16} color={COLORS.primary} />
                        </View>
                      </View>
                      
                      <View style={styles.activityContent}>
                        <View style={styles.activityHeader}>
                          <Text style={styles.activityTitle} numberOfLines={1}>{res.prueba_asignada?.prueba?.nombre}</Text>
                          <Text style={styles.activityDate}>
                            {new Date(res.fecha_realizacion).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                          </Text>
                        </View>
                        
                        <View style={styles.activityResult}>
                          {/* USO DEL FORMATEADOR DE UNIDADES */}
                          <Text style={styles.resultValue}>{res.valor}</Text>
                          <Text style={styles.resultUnit}>{formatUnit(res.prueba_asignada?.prueba?.tipo_metrica)}</Text>
                        </View>

                        {res.comentario && res.comentario.length > 0 && (
                          <View style={styles.activityFeedback}>
                            <MessageSquare size={14} color={COLORS.textMuted} style={{marginTop:2}} />
                            <Text style={styles.activityFeedbackText} numberOfLines={2}>
                              "{res.comentario[0].mensaje}"
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <BarChart3 size={40} color={COLORS.borderColor} />
                <Text style={styles.emptyStateDesc}>Tus resultados aparecerán aquí.</Text>
              </View>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* NAV BAR */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable style={styles.navItem}><View style={styles.navIconActive}><TrendingUp size={24} color={COLORS.primary} strokeWidth={2.5} /></View><Text style={styles.navTextActive}>Inicio</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('Stats')} style={styles.navItemInactive}><BarChart3 size={24} color={COLORS.textMuted} strokeWidth={2.5} /><Text style={styles.navTextInactive}>Datos</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('MisPruebas')} style={styles.navItemInactive}><ClipboardList size={24} color={COLORS.textMuted} strokeWidth={2.5} /><Text style={styles.navTextInactive}>Historial</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('Profile')} style={styles.navItemInactive}><User size={24} color={COLORS.textMuted} strokeWidth={2.5} /><Text style={styles.navTextInactive}>Perfil</Text></Pressable>
      </View>
    </View>
  );
}

// --- ESTILOS OPTIMIZADOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 120 }, 
  
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, marginTop: 8 },
  headerSubtitle: { fontSize: 14, fontWeight: "600", color: COLORS.textMuted },
  headerTitle: { fontSize: 26, fontWeight: "800", color: COLORS.textDark, letterSpacing: -0.5 },
  headerIcons: { flexDirection: "row", gap: 12 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: COLORS.borderColor },
  profileButton: { backgroundColor: COLORS.primaryLight, borderColor: "#bfdbfe" },
  notificationDot: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger, borderWidth: 1, borderColor: COLORS.white },

  // Sections
  sectionContainer: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark},
  countBadge: { backgroundColor: COLORS.danger, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
  countText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  
  // BOTÓN UNIRSE MEJORADO
  joinButtonCapsule: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.primaryLight, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    alignItems: 'center', 
    gap: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  joinButtonText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },

  // AGENDA MEJORADA (Espaciado)
  agendaScrollContent: { paddingHorizontal: 24, paddingBottom: 16 }, // Padding para que no se pegue y sombra se vea
  agendaCard: {
    width: 170, // Un poco más ancho
    height: 160,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    justifyContent: 'space-between',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  agendaCardUrgent: {
    borderColor: '#fecaca', 
    backgroundColor: '#fff1f2', 
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  
  agendaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  agendaIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  urgentTag: { backgroundColor: COLORS.danger, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  urgentText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  
  agendaTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, lineHeight: 22, marginTop: 8 },
  agendaGroup: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  agendaFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  agendaDate: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },

  emptyAgendaBox: { marginHorizontal: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: COLORS.borderColor, borderStyle: 'dashed' },
  checkCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.successBg, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted },

  // EQUIPOS MEJORADOS
  groupsScrollContent: { paddingHorizontal: 24, paddingBottom: 8 },
  teamCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    padding: 12, 
    borderRadius: 18, 
    marginRight: 12, 
    borderWidth: 1, 
    borderColor: COLORS.borderColor,
    minWidth: 160, // Más ancho para que se vea bien
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  teamIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  teamInfo: { flex: 1 },
  teamName: { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  teamDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  
  emptyGroupBox: { paddingHorizontal: 24 },
  emptyGroupText: { color: COLORS.textMuted, fontSize: 14, fontStyle: 'italic' },

  // TIMELINE MEJORADO
  activityList: { paddingHorizontal: 24 },
  activityItem: { flexDirection: 'row', marginBottom: 24 },
  timelineLine: { position: 'absolute', left: 19, top: 40, bottom: -40, width: 2, backgroundColor: '#e2e8f0', zIndex: -1 },
  
  activityIconContainer: { marginRight: 16, alignItems: 'center' },
  activityIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderColor, shadowColor: COLORS.shadow, shadowOffset: {width:0,height:2}, shadowOpacity:0.05, shadowRadius:4, elevation:2 },
  
  activityContent: { flex: 1, backgroundColor: COLORS.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.borderColor, shadowColor: COLORS.shadow, shadowOffset: {width:0, height:2}, shadowOpacity:0.03, shadowRadius:8, elevation:2 },
  
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  activityTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, flex:1 },
  activityDate: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginLeft: 8 },
  
  activityResult: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  resultValue: { fontSize: 22, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  resultUnit: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' },
  
  activityFeedback: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', gap: 8 },
  activityFeedbackText: { flex: 1, fontSize: 13, color: COLORS.textDark, fontStyle: 'italic', lineHeight: 18 },

  emptyStateContainer: { alignItems: 'center', padding: 24, opacity: 0.6 },
  emptyStateDesc: { marginTop: 8, color: COLORS.textMuted },

  // FOOTER & MODALES (Igual que antes pero consistentes)
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.borderColor, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 64 },
  navItemInactive: { alignItems: 'center', justifyContent: 'center', minWidth: 64, opacity: 0.5 },
  navIconActive: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20, marginBottom: 4 },
  navTextActive: { fontSize: 10, color: COLORS.primary, fontWeight: 'bold' },
  navTextInactive: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500', marginTop: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textDark },
  closeButton: { padding: 8, backgroundColor: COLORS.background, borderRadius: 20 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, padding: 16, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: COLORS.borderColor },
  profileIconContainer: { width: 56, height: 56, backgroundColor: COLORS.primaryLight, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 2, borderColor: COLORS.white },
  profileName: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  profileEmail: { fontSize: 14, color: COLORS.textMuted },
  logoutButton: { flexDirection: 'row', backgroundColor: '#fef2f2', padding: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8 },
  logoutText: { color: '#dc2626', fontWeight: 'bold', fontSize: 16 },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalContentCenter: { width: '100%', backgroundColor: COLORS.white, borderRadius: 24, padding: 24, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  modalTitleCenter: { fontSize: 22, fontWeight: '800', color: COLORS.textDark, textAlign: 'center', marginBottom: 8 },
  modalSubtitleCenter: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 24 },
  textInput: { flex: 1, fontSize: 16, color: COLORS.textDark },
  modalActions: { flexDirection: 'row', gap: 12 },
  btnCancel: { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: COLORS.background },
  btnCancelText: { color: COLORS.textMuted, fontWeight: '600' },
  btnConfirm: { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: COLORS.primary },
  btnConfirmText: { color: 'white', fontWeight: 'bold' },
});