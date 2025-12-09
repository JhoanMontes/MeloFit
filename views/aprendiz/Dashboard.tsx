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
  ActivityIndicator
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
  AlertCircle,
  Calendar,
  Clock
} from "lucide-react-native";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { AprendizStackParamList } from "../../navigation/types";
import CustomAlert, { AlertType } from "../../components/CustomAlert";

type Props = NativeStackScreenProps<AprendizStackParamList, "Dashboard">;

const COLORS = {
  primary: "#2563eb",
  primaryLight: "#eff6ff",
  background: "#f8fafc",
  white: "#ffffff",
  textDark: "#0f172a",
  textMuted: "#64748b",
  borderColor: "#e2e8f0",
  success: "#22c55e",
  warning: "#f59e0b",
  warningBg: "#fff7ed",
  danger: "#dc2626",
  shadow: "#000000",
};

export default function Dashboard({ navigation }: Props) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [userData, setUserData] = useState<{ nombre: string, doc: number | null }>({ nombre: "Atleta", doc: null });
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [pendingTests, setPendingTests] = useState<any[]>([]);
  
  // NUEVO: Estado para notificaciones
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

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // 1. Usuario
      const { data: userRecord, error: userError } = await supabase
        .from('usuario').select('no_documento, nombre_completo').eq('auth_id', user.id).single();
      if (userError) throw userError;

      setUserData({ nombre: userRecord.nombre_completo || "Atleta", doc: userRecord.no_documento });
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

      // 4. Pruebas Pendientes
      const { data: assignmentsData } = await supabase
        .from('prueba_asignada_has_atleta')
        .select(`
          prueba_asignada!inner ( id, fecha_limite, prueba ( nombre ) ),
          grupo ( nombre ) 
        `)
        .eq('atleta_no_documento', docId)
        .gte('prueba_asignada.fecha_limite', new Date().toISOString().split('T')[0]);

      const completedIds = resultsData?.map((r: any) => r.prueba_asignada.id) || [];
      const pending = assignmentsData
        ?.filter((item: any) => !completedIds.includes(item.prueba_asignada.id))
        .map((item: any) => ({ ...item.prueba_asignada, grupo_nombre: item.grupo?.nombre })) || [];
      setPendingTests(pending);

      // 5. NUEVO: Verificar Notificaciones (Simulada: Algo nuevo en los últimos 3 días)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const dateLimit = threeDaysAgo.toISOString().split('T')[0];

      // Ver si hay asignaciones recientes
      const { count: newAssignments } = await supabase
        .from('prueba_asignada_has_atleta')
        .select('*', { count: 'exact', head: true })
        .eq('atleta_no_documento', docId)
        .gte('prueba_asignada.fecha_asignacion', dateLimit); // Requiere join implícito o fecha en tabla intermedia si existiera, pero usaremos lógica simple si falla el join en count.
      
      // Ver si hay comentarios recientes
      const { count: newComments } = await supabase
        .from('comentario')
        .select('id', { count: 'exact', head: true })
        .eq('resultado_prueba.atleta_no_documento', docId) // Supabase resuelve el join anidado automáticamente si está configurado FK
        .gte('fecha', dateLimit);

      // Si hay algo nuevo, activamos la campanita
      if ((newAssignments && newAssignments > 0) || (newComments && newComments > 0)) {
        setHasNotifications(true);
      } else {
        setHasNotifications(false);
      }

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
        {/* HEADER ACTUALIZADO CON CAMPANA */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Bienvenido,</Text>
            <Text style={styles.headerTitle}>{userData.nombre}</Text>
          </View>
          <View style={styles.headerIcons}>
            
            {/* BOTÓN NOTIFICACIONES */}
            <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.iconButton}>
              <Bell size={22} color={COLORS.textMuted} />
              {/* PUNTO ROJO SI HAY NOTIFICACIONES */}
              {hasNotifications && (
                <View style={styles.notificationDot} />
              )}
            </Pressable>

            <Pressable onPress={() => setShowProfileModal(true)} style={[styles.iconButton, styles.profileButton]}><User size={22} color={COLORS.primary} /></Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}>
          
          {/* SECCIÓN 1: AGENDA */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Agenda</Text>
            {pendingTests.length > 0 ? (
              pendingTests.map((test, index) => (
                <View key={index} style={styles.pendingCard}>
                  <View style={styles.pendingHeader}>
                    <View style={styles.pendingBadge}><AlertCircle size={16} color={COLORS.warning} /><Text style={styles.pendingBadgeText}>Pendiente</Text></View>
                    <View style={{flexDirection:'row', alignItems:'center'}}><Clock size={14} color={COLORS.textMuted} style={{marginRight:4}} /><Text style={styles.pendingDate}>Vence: {new Date(test.fecha_limite).toLocaleDateString()}</Text></View>
                  </View>
                  <Text style={styles.pendingTitle}>{test.prueba?.nombre}</Text>
                  <Text style={styles.pendingSubtitle}>Grupo: {test.grupo_nombre || "General"}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyPendingBox}><Calendar size={24} color={COLORS.textMuted} style={{marginBottom:8}} /><Text style={styles.emptyStateText}>¡Estás al día! No tienes pruebas pendientes.</Text></View>
            )}
          </View>

          {/* SECCIÓN 2: GRUPOS */}
          <View style={styles.sectionContainer}>
             <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mis Grupos</Text>
                <Pressable onPress={() => setShowJoinGroupModal(true)} style={styles.joinButtonSmall}><Plus size={16} color="white" /><Text style={styles.joinButtonText}>Unirse</Text></Pressable>
             </View>
             {myGroups.length > 0 ? (
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupsScroll}>
                 {myGroups.map((group, index) => (
                   <Pressable key={index} style={styles.groupCard} onPress={() => navigation.navigate('GroupDetail', { grupoCodigo: group.codigo, nombreGrupo: group.nombre })}>
                     <View style={styles.groupIconBg}><Users size={24} color={COLORS.primary} /></View>
                     <Text style={styles.groupName} numberOfLines={1}>{group.nombre}</Text>
                     <Text style={styles.groupDesc} numberOfLines={1}>{group.descripcion}</Text>
                   </Pressable>
                 ))}
               </ScrollView>
             ) : (
               <View style={styles.emptyStateBox}><Text style={styles.emptyStateText}>No perteneces a ningún grupo aún.</Text></View>
             )}
          </View>

          {/* SECCIÓN 3: RECIENTES */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Actividad Reciente</Text>
            {recentResults.length > 0 ? (
              recentResults.map((res) => (
                <View key={res.id} style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <View style={styles.resultInfo}>
                      <Text style={styles.testName}>{res.prueba_asignada?.prueba?.nombre}</Text>
                      <Text style={styles.testDate}>{new Date(res.fecha_realizacion).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.badgeValue}><Trophy size={14} color={COLORS.primary} style={{ marginRight: 4 }} /><Text style={styles.badgeText}>{res.valor} {res.prueba_asignada?.prueba?.tipo_metrica}</Text></View>
                  </View>
                  {res.comentario && res.comentario.length > 0 && (
                    <View style={styles.feedbackContainer}><MessageSquare size={16} color={COLORS.textMuted} style={{ marginTop: 2 }} /><Text style={styles.feedbackText}>"{res.comentario[0].mensaje}"</Text></View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyResultsContainer}><ClipboardList size={48} color={COLORS.borderColor} /><Text style={styles.emptyResultsTitle}>Sin registros</Text><Text style={styles.emptyResultsDesc}>Tu entrenador aún no ha subido resultados.</Text></View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable style={styles.navItem}><View style={styles.navIconActive}><TrendingUp size={24} color={COLORS.primary} strokeWidth={2.5} /></View><Text style={styles.navTextActive}>Inicio</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('Stats')} style={styles.navItemInactive}><BarChart3 size={24} color={COLORS.textMuted} strokeWidth={2.5} /><Text style={styles.navTextInactive}>Datos</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('MisPruebas')} style={styles.navItemInactive}><ClipboardList size={24} color={COLORS.textMuted} strokeWidth={2.5} /><Text style={styles.navTextInactive}>Historial</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('Profile')} style={styles.navItemInactive}><User size={24} color={COLORS.textMuted} strokeWidth={2.5} /><Text style={styles.navTextInactive}>Perfil</Text></Pressable>
      </View>
    </View>
  );
}

// ESTILOS IGUALES A ANTES + ESTILO DEL DOT
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 100, paddingHorizontal: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, marginTop: 8 },
  headerSubtitle: { fontSize: 14, fontWeight: "600", color: COLORS.textMuted },
  headerTitle: { fontSize: 24, fontWeight: "800", color: COLORS.textDark, letterSpacing: -0.5 },
  headerIcons: { flexDirection: "row", gap: 12 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: COLORS.borderColor },
  profileButton: { backgroundColor: COLORS.primaryLight, borderColor: "#bfdbfe" },
  
  // NUEVO: Punto rojo de notificación
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    borderWidth: 1,
    borderColor: COLORS.white
  },

  sectionContainer: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginBottom: 12 },
  joinButtonSmall: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center', gap: 4 },
  joinButtonText: { color: 'white', fontSize: 12, fontWeight: '700' },
  pendingCard: { backgroundColor: COLORS.white, padding: 16, borderRadius: 20, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: COLORS.warning, shadowColor: COLORS.shadow, shadowOffset: {width:0, height:2}, shadowOpacity:0.05, shadowRadius:4, elevation:2 },
  pendingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warningBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  pendingBadgeText: { color: '#c2410c', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  pendingDate: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  pendingTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  pendingSubtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  emptyPendingBox: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 16, padding: 20, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.borderColor },
  groupsScroll: { paddingBottom: 8 },
  groupCard: { width: 150, backgroundColor: COLORS.white, padding: 16, borderRadius: 20, marginRight: 12, borderWidth: 1, borderColor: COLORS.borderColor, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  groupIconBg: { width: 40, height: 40, backgroundColor: COLORS.primaryLight, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  groupName: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
  groupDesc: { fontSize: 12, color: COLORS.textMuted },
  emptyStateBox: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderColor, borderStyle: 'dashed' },
  emptyStateText: { color: COLORS.textMuted, fontSize: 14 },
  resultCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderColor, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  resultInfo: { flex: 1 },
  testName: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 2 },
  testDate: { fontSize: 12, color: COLORS.textMuted },
  badgeValue: { flexDirection: 'row', backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, alignItems: 'center' },
  badgeText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },
  feedbackContainer: { flexDirection: 'row', backgroundColor: "#f1f5f9", padding: 12, borderRadius: 12, gap: 8 },
  feedbackText: { flex: 1, fontSize: 13, color: COLORS.textDark, fontStyle: 'italic', lineHeight: 18 },
  emptyResultsContainer: { alignItems: 'center', padding: 32, opacity: 0.7 },
  emptyResultsTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMuted, marginTop: 12 },
  emptyResultsDesc: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
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
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
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
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.borderColor, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 64 },
  navItemInactive: { alignItems: 'center', justifyContent: 'center', minWidth: 64, opacity: 0.6 },
  navIconActive: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20, marginBottom: 4 },
  navTextActive: { fontSize: 10, color: COLORS.primary, fontWeight: 'bold' },
  navTextInactive: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500', marginTop: 4 },
});