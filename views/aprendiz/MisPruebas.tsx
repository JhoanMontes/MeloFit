import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Keyboard,
  Modal,
  ScrollView
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Trophy, 
  MessageSquare,
  ClipboardList,
  TrendingUp,
  BarChart3,
  User,
  XCircle,
  X,
  Clock,
  Target
} from "lucide-react-native";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { AprendizStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AprendizStackParamList, "MisPruebas">;

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
};

export default function MisPruebas({ navigation }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Estados de Datos
  const [loading, setLoading] = useState(true);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Estados del Modal de Detalle
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [user]);

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

  // 1. Cargar Historial
  const fetchHistory = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: userData } = await supabase.from('usuario').select('no_documento').eq('auth_id', user.id).single();
      if (!userData) return;

      const { data, error } = await supabase
        .from('resultado_prueba')
        .select(`
          id,
          valor,
          fecha_realizacion,
          prueba_asignada!inner (
            id,
            prueba ( nombre, tipo_metrica, descripcion )
          ),
          comentario ( mensaje )
        `)
        .eq('atleta_no_documento', userData.no_documento)
        .order('fecha_realizacion', { ascending: false });

      if (error) throw error;
      setAllResults(data || []);
      setFilteredResults(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Búsqueda
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredResults(allResults);
    } else {
      const lowerText = text.toLowerCase();
      const filtered = allResults.filter((item) => {
        const testName = item.prueba_asignada?.prueba?.nombre?.toLowerCase() || "";
        return testName.includes(lowerText);
      });
      setFilteredResults(filtered);
    }
  };

  const openDetail = (item: any) => {
    setSelectedResult(item);
    setShowDetailModal(true);
  };

  // 3. Render Item (Tarjeta)
  const renderItem = ({ item }: { item: any }) => {
    const hasComment = item.comentario && item.comentario.length > 0;
    
    return (
      <Pressable 
        style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => openDetail(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconBg}>
            <Trophy size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.testName} numberOfLines={1}>
              {item.prueba_asignada?.prueba?.nombre}
            </Text>
            <View style={styles.dateRow}>
              <Calendar size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.testDate}>
                {new Date(item.fecha_realizacion).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeValue}>{item.valor}</Text>
            {/* UNIDAD FORMATEADA */}
            <Text style={styles.badgeUnit}>
              {formatUnit(item.prueba_asignada?.prueba?.tipo_metrica)}
            </Text>
          </View>
        </View>

        {hasComment && (
          <View style={styles.feedbackPreview}>
            <MessageSquare size={14} color={COLORS.textMuted} style={{ marginTop: 2 }} />
            <Text style={styles.feedbackTextPreview} numberOfLines={2}>
              "{item.comentario[0].mensaje}"
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* MODAL DE DETALLE */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={showDetailModal} 
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowDetailModal(false)} />
          <View style={styles.modalContent}>
            
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Target size={20} color={COLORS.primary} style={{marginRight: 8}}/>
                <Text style={styles.modalTitle}>Detalle del Resultado</Text>
              </View>
              <Pressable onPress={() => setShowDetailModal(false)} style={styles.closeButton}>
                <X size={24} color={COLORS.textMuted} />
              </Pressable>
            </View>

            {selectedResult && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
                
                {/* Info Principal */}
                <View style={styles.detailHero}>
                  <Text style={styles.detailTestName}>
                    {selectedResult.prueba_asignada?.prueba?.nombre}
                  </Text>
                  <View style={styles.detailDateBadge}>
                    <Clock size={14} color={COLORS.textMuted} style={{marginRight:4}} />
                    <Text style={styles.detailDateText}>
                      Realizado el {new Date(selectedResult.fecha_realizacion).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                  </View>
                </View>

                {/* Resultado Grande */}
                <View style={styles.bigResultBox}>
                   <Text style={styles.bigResultLabel}>Tu Marca</Text>
                   <Text style={styles.bigResultValue}>
                     {selectedResult.valor} 
                     {/* UNIDAD FORMATEADA */}
                     <Text style={styles.bigResultUnit}> {formatUnit(selectedResult.prueba_asignada?.prueba?.tipo_metrica)}</Text>
                   </Text>
                </View>

                {/* Descripción Prueba */}
                <View style={styles.infoSection}>
                   <Text style={styles.infoLabel}>Sobre la prueba</Text>
                   <Text style={styles.infoText}>
                     {selectedResult.prueba_asignada?.prueba?.descripcion || "Sin descripción disponible."}
                   </Text>
                </View>

                {/* Comentario Completo */}
                {selectedResult.comentario && selectedResult.comentario.length > 0 ? (
                  <View style={styles.commentBox}>
                    <View style={{flexDirection:'row', alignItems:'center', marginBottom:8}}>
                       <MessageSquare size={18} color={COLORS.primary} style={{marginRight:6}}/>
                       <Text style={styles.commentLabel}>Observación del Entrenador</Text>
                    </View>
                    <Text style={styles.commentText}>
                      {selectedResult.comentario[0].mensaje}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.noCommentBox}>
                    <Text style={styles.noCommentText}>No hay observaciones para este resultado.</Text>
                  </View>
                )}

              </ScrollView>
            )}

            <Pressable onPress={() => setShowDetailModal(false)} style={styles.btnCerrar}>
               <Text style={styles.btnCerrarText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.textDark} />
          </Pressable>
          <Text style={styles.headerTitle}>Historial</Text>
          <View style={{ width: 40 }} /> 
        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Buscar prueba..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={handleSearch}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => handleSearch("")}>
                <XCircle size={20} color={COLORS.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* LISTA */}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <ClipboardList size={48} color={COLORS.borderColor} />
                <Text style={styles.emptyTitle}>Sin resultados</Text>
                <Text style={styles.emptySubtitle}>No se encontraron pruebas registradas.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {/* FOOTER NAV */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable onPress={() => navigation.navigate('Dashboard')} style={styles.navItemInactive}>
          <TrendingUp size={24} color={COLORS.textMuted} strokeWidth={2.5} />
          <Text style={styles.navTextInactive}>Inicio</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Stats')} style={styles.navItemInactive}>
          <BarChart3 size={24} color={COLORS.textMuted} strokeWidth={2.5} />
          <Text style={styles.navTextInactive}>Datos</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <View style={styles.navIconActive}>
            <ClipboardList size={24} color={COLORS.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.navTextActive}>Historial</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Profile')} style={styles.navItemInactive}>
          <User size={24} color={COLORS.textMuted} strokeWidth={2.5} />
          <Text style={styles.navTextInactive}>Perfil</Text>
        </Pressable>
      </View>
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderColor },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },

  // Search
  searchContainer: { paddingHorizontal: 24, paddingBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.borderColor, borderRadius: 16, paddingHorizontal: 16, height: 50, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.textDark },

  // List
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderColor, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  cardPressed: { backgroundColor: COLORS.background },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardIconBg: { width: 44, height: 44, backgroundColor: COLORS.primaryLight, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  testName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  testDate: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  badgeContainer: { alignItems: 'flex-end', backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeValue: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  badgeUnit: { fontSize: 10, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  
  feedbackPreview: { marginTop: 12, backgroundColor: '#f1f5f9', padding: 10, borderRadius: 12, flexDirection: 'row', gap: 8 },
  feedbackTextPreview: { flex: 1, fontSize: 13, color: COLORS.textDark, fontStyle: 'italic', lineHeight: 18 },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.6 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMuted, marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 4, maxWidth: 250 },

  // Footer
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.borderColor, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 64 },
  navItemInactive: { alignItems: 'center', justifyContent: 'center', minWidth: 64, opacity: 0.6 },
  navIconActive: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20, marginBottom: 4 },
  navTextActive: { fontSize: 10, color: COLORS.primary, fontWeight: 'bold' },
  navTextInactive: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500', marginTop: 4 },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '80%', shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  closeButton: { padding: 8, backgroundColor: COLORS.background, borderRadius: 20 },
  
  detailHero: { alignItems: 'center', marginBottom: 24 },
  detailTestName: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, textAlign: 'center', marginBottom: 8 },
  detailDateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  detailDateText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },

  bigResultBox: { backgroundColor: COLORS.primaryLight, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#bfdbfe' },
  bigResultLabel: { fontSize: 14, textTransform: 'uppercase', color: COLORS.primary, fontWeight: '700', marginBottom: 4, letterSpacing: 1 },
  bigResultValue: { fontSize: 48, fontWeight: '900', color: COLORS.primary },
  bigResultUnit: { fontSize: 18, fontWeight: '600', color: COLORS.textMuted },

  infoSection: { marginBottom: 24 },
  infoLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  infoText: { fontSize: 15, color: COLORS.textMuted, lineHeight: 22 },

  commentBox: { backgroundColor: '#fff7ed', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#ffedd5' },
  commentLabel: { fontSize: 14, fontWeight: '700', color: '#c2410c' },
  commentText: { fontSize: 15, color: '#9a3412', lineHeight: 24, fontStyle: 'italic' },

  noCommentBox: { alignItems: 'center', padding: 16, opacity: 0.5 },
  noCommentText: { color: COLORS.textMuted, fontStyle: 'italic' },

  btnCerrar: { backgroundColor: COLORS.background, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  btnCerrarText: { color: COLORS.textDark, fontWeight: '700', fontSize: 16 }
});