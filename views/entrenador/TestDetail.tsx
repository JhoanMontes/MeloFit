import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
  Modal,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Alert // Usado para alertas simples del sistema dentro del modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";
import CustomAlert, { AlertType } from "../../components/CustomAlert"; 

// --- CONSTANTES DE DISEÑO ---
const COLORS = {
  primary: "#2563EB",
  background: "#F8FAFC",
  cardBg: "#FFFFFF",
  textDark: "#1E293B",
  textMuted: "#64748B",
  borderColor: "#E2E8F0",
  inputBg: "#F1F5F9",
  shadow: "#000000",
  error: "#EF4444",
  success: "#10B981",
  overlay: 'rgba(0,0,0,0.5)',
};

type Props = NativeStackScreenProps<EntrenadorStackParamList, "TestDetail">;

const METRIC_LABELS: Record<string, string> = {
  'TIME_MIN': 'Tiempo (Min)',
  'DISTANCE_KM': 'Distancia (Km)',
  'WEIGHT_KG': 'Peso (Kg)',
  'REPS': 'Repeticiones',
};

export default function TestDetail({ navigation, route }: Props) {
  const { test } = route.params || {};

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false); // Menú de acciones
  const [showEditModal, setShowEditModal] = useState(false);       // Modal de edición básica
  const [showLevelsModal, setShowLevelsModal] = useState(false);   // Modal de gestión de niveles

  // Estados de Datos
  const [testName, setTestName] = useState(test?.nombre || 'Prueba Sin Nombre');
  const [description, setDescription] = useState(test?.descripcion || '');
  
  // Estado para gestión de niveles (Edición)
  const [editingLevels, setEditingLevels] = useState<any[]>([]);
  const [newLevel, setNewLevel] = useState({ label: '', min: '', max: '' });

  // Estados de Estadísticas
  const [athleteCount, setAthleteCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Estados de Alerta Custom
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    onCloseAction?: () => void;
    onConfirm?: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (title: string, message: string, type: AlertType = "info", action?: () => void) => {
    setAlertConfig({ visible: true, title, message, type, onCloseAction: action });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
    if (alertConfig.onCloseAction) alertConfig.onCloseAction();
  };

  // 1. Parsear Niveles para visualización (JSONB)
  // Nota: Usamos 'test.niveles' directamente, pero si editamos actualizamos la referencia local
  const displayLevels = useMemo(() => {
    if (!test?.niveles) return [];
    try {
      const nivelesArray = typeof test.niveles === 'string' ? JSON.parse(test.niveles) : test.niveles;
      return Array.isArray(nivelesArray) ? nivelesArray.map((l: any) => ({
        label: l.label || l.nombre, // Compatibilidad por si guardaste como 'nombre' antes
        min: l.min,
        max: l.max
      })) : [];
    } catch (e) {
      console.error("Error parseando niveles:", e);
      return [];
    }
  }, [test, test?.niveles]); // Dependencia actualizada

  // 2. Fetch Estadísticas
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      if (!test?.id) { setLoadingStats(false); return; }
      try {
        setLoadingStats(true);
        const { data, error } = await supabase
          .from('prueba_asignada_has_atleta')
          .select('atleta_no_documento, prueba_asignada!inner(prueba_id)')
          .eq('prueba_asignada.prueba_id', test.id);

        if (error) throw error;
        if (isMounted && data) {
          const uniqueAthletes = new Set(data.map(item => item.atleta_no_documento));
          setAthleteCount(uniqueAthletes.size);
        }
      } catch (e) { console.error("Error stats:", e); } 
      finally { if (isMounted) setLoadingStats(false); }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, [test.id]);

  // --- LOGICA DE GESTIÓN DE NIVELES ---

  const openLevelEditor = () => {
    // Cargamos los niveles actuales en el estado temporal de edición
    setEditingLevels([...displayLevels]);
    setNewLevel({ label: '', min: '', max: '' });
    setShowLevelsModal(true);
  };

  const handleAddLevelToTemp = () => {
    if (!newLevel.label || !newLevel.min || !newLevel.max) {
      Alert.alert("Campos incompletos", "Por favor llena nombre, mínimo y máximo.");
      return;
    }
    
    const minVal = parseFloat(newLevel.min);
    const maxVal = parseFloat(newLevel.max);

    if (isNaN(minVal) || isNaN(maxVal)) {
        Alert.alert("Error", "Los valores deben ser numéricos.");
        return;
    }

    if (minVal >= maxVal) {
        Alert.alert("Lógica incorrecta", "El valor Mínimo debe ser menor al Máximo.");
        return;
    }

    const levelObj = {
      label: newLevel.label,
      min: minVal,
      max: maxVal
    };

    setEditingLevels([...editingLevels, levelObj]);
    setNewLevel({ label: '', min: '', max: '' }); // Reset inputs
  };

  const handleRemoveLevelFromTemp = (index: number) => {
    const updated = editingLevels.filter((_, i) => i !== index);
    setEditingLevels(updated);
  };

  const handleSaveLevelsToSupabase = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('prueba')
        .update({ niveles: editingLevels }) // Guardamos el array JSON completo
        .eq('id', test.id);

      if (error) throw error;

      // Actualización optimista local
      test.niveles = editingLevels; 
      
      setShowLevelsModal(false);
      showAlert("Configuración guardada", "Los niveles se han actualizado correctamente.", "success");
    } catch (error) {
      console.error(error);
      showAlert("Error", "No se pudieron guardar los niveles.", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS GENERALES ---

  const confirmDelete = () => {
    setShowOptionsModal(false);
    setAlertConfig({
      visible: true,
      title: "¿Eliminar prueba?",
      message: "Esta acción no se puede deshacer. Se eliminarán los historiales asociados.",
      type: "warning",
      onConfirm: async () => {
        try {
          setLoading(true);
          const { error } = await supabase.from('prueba').delete().eq('id', test.id);
          if (error) throw error;
          navigation.goBack();
        } catch (error) {
          showAlert("Error", "No se pudo eliminar la prueba.", "error");
          setLoading(false);
        }
      }
    });
  };

  const handleUpdateBasicInfo = async () => {
    if (!testName.trim()) {
      showAlert("Nombre requerido", "La prueba debe tener un nombre.", "warning");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase
        .from('prueba')
        .update({ nombre: testName, descripcion: description })
        .eq('id', test.id);

      if (error) throw error;
      setShowEditModal(false);
      showAlert("Actualizado", "La prueba se ha actualizado correctamente.", "success");
    } catch (error) {
      showAlert("Error", "No se pudo actualizar la prueba.", "error");
    } finally {
      setLoading(false);
    }
  };

  const metricLabel = METRIC_LABELS[test?.tipo_metrica] || test?.tipo_metrica || 'GENERAL';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.navRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
            </Pressable>

            {/* Menú de Opciones */}
            <Pressable
              onPress={() => setShowOptionsModal(true)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textDark} />
            </Pressable>
          </View>

          <Text style={styles.titleText}>{testName}</Text>

          <View style={styles.subtitleRow}>
            <Text style={styles.subtitleText}>Detalles de evaluación</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{metricLabel}</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* TARJETA 1: INSTRUCCIONES */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconBox}>
                <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Instrucciones</Text>
                <Text style={styles.cardBody}>
                  {description || 'Sin instrucciones detalladas para esta prueba.'}
                </Text>
              </View>
            </View>
          </View>

          {/* TARJETA 2: ESTADÍSTICAS */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL ASIGNACIONES</Text>
              {loadingStats ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
              ) : (
                <Text style={styles.statValue}>
                  {athleteCount} <Text style={styles.statUnit}>atletas</Text>
                </Text>
              )}
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>RENDIMIENTO</Text>
              <Text style={styles.statValue}>--% <Text style={styles.statUnit}>promedio</Text></Text>
            </View>
          </View>

          {/* LISTA: NIVELES (Cabecera con Botón Gestionar) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Niveles Configurados</Text>
            <Pressable 
                onPress={openLevelEditor}
                style={({pressed}) => [{ flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#EFF6FF', borderRadius: 8 }, pressed && {opacity: 0.7}]}
            >
                <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 12, marginRight: 4 }}>GESTIONAR</Text>
                <Ionicons name="settings-outline" size={14} color={COLORS.primary} />
            </Pressable>
          </View>

          {displayLevels.length > 0 ? (
            <View style={styles.levelsContainer}>
              {/* Encabezados de Tabla */}
              <View style={[styles.levelRow, styles.levelHeader]}>
                <Text style={[styles.levelHeaderText, { flex: 2 }]}>NIVEL</Text>
                <Text style={[styles.levelHeaderText, { flex: 1, textAlign: 'center' }]}>MIN</Text>
                <Text style={[styles.levelHeaderText, { flex: 1, textAlign: 'center' }]}>MAX</Text>
              </View>

              {displayLevels.map((level: any, index: number) => (
                <View key={index} style={styles.levelRow}>
                  <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[
                      styles.dot,
                      { backgroundColor: index === 0 ? '#10B981' : index === displayLevels.length - 1 ? '#8B5CF6' : '#3B82F6' }
                    ]} />
                    <Text style={styles.levelLabel}>{level.label}</Text>
                  </View>
                  <Text style={styles.levelValue}>{level.min}</Text>
                  <Text style={styles.levelValue}>{level.max}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyLevels}>
              <Ionicons name="layers-outline" size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyLevelsText}>No hay niveles configurados</Text>
              <Pressable onPress={openLevelEditor} style={{ marginTop: 12 }}>
                <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Configurar ahora</Text>
              </Pressable>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>

      {/* --- MODAL 1: GESTIÓN DE NIVELES (FULL SCREEN) --- */}
      <Modal visible={showLevelsModal} animationType="slide" onRequestClose={() => setShowLevelsModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                
                {/* Header Modal */}
                <View style={[styles.headerContainer, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <View style={styles.navRow}>
                        <Pressable onPress={() => setShowLevelsModal(false)} style={styles.iconButton}>
                            <Ionicons name="close" size={24} color={COLORS.textDark} />
                        </Pressable>
                        <Text style={[styles.titleText, { fontSize: 20, marginBottom: 0, alignSelf: 'center' }]}>Configurar Niveles</Text>
                        <View style={{ width: 44 }} /> 
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
                    
                    {/* Formulario Agregar */}
                    <View style={styles.card}>
                        <Text style={[styles.inputLabel, { marginBottom: 12 }]}>Agregar Nuevo Nivel</Text>
                        
                        <TextInput 
                            placeholder="Nombre (Ej: Principiante)" 
                            value={newLevel.label}
                            onChangeText={(t) => setNewLevel({...newLevel, label: t})}
                            style={[styles.input, { backgroundColor: 'white' }]} 
                        />
                        
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.inputLabel, {fontSize: 12, marginBottom: 4}]}>Mínimo</Text>
                                <TextInput 
                                    placeholder="0" 
                                    keyboardType="numeric"
                                    value={newLevel.min}
                                    onChangeText={(t) => setNewLevel({...newLevel, min: t})}
                                    style={[styles.input, { backgroundColor: 'white' }]} 
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.inputLabel, {fontSize: 12, marginBottom: 4}]}>Máximo</Text>
                                <TextInput 
                                    placeholder="10" 
                                    keyboardType="numeric"
                                    value={newLevel.max}
                                    onChangeText={(t) => setNewLevel({...newLevel, max: t})}
                                    style={[styles.input, { backgroundColor: 'white' }]} 
                                />
                            </View>
                        </View>

                        <Pressable 
                            onPress={handleAddLevelToTemp}
                            style={({pressed}) => [styles.saveButton, { marginTop: 0, height: 48, backgroundColor: COLORS.textDark }, pressed && styles.buttonPressed]}
                        >
                            <Text style={styles.saveButtonText}>+ Agregar a la lista</Text>
                        </Pressable>
                    </View>

                    {/* Lista Temporal */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Vista Previa ({editingLevels.length})</Text>
                        <Text style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 8 }}>(No guardado aún)</Text>
                    </View>
                    
                    {editingLevels.length === 0 && (
                        <Text style={{ textAlign: 'center', color: COLORS.textMuted, fontStyle: 'italic', marginVertical: 20 }}>
                            Lista vacía. Agrega niveles arriba.
                        </Text>
                    )}

                    {editingLevels.map((l, index) => (
                        <View key={index} style={[styles.levelRow, { backgroundColor: 'white', borderRadius: 12, marginBottom: 8, borderBottomWidth: 0, paddingVertical: 12 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.levelLabel, { fontSize: 16 }]}>{l.label}</Text>
                                <Text style={{ fontSize: 13, color: COLORS.textMuted }}>Rango: <Text style={{fontWeight:'700'}}>{l.min}</Text> a <Text style={{fontWeight:'700'}}>{l.max}</Text></Text>
                            </View>
                            <Pressable onPress={() => handleRemoveLevelFromTemp(index)} style={{ padding: 10, backgroundColor: '#FEE2E2', borderRadius: 8 }}>
                                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                            </Pressable>
                        </View>
                    ))}
                    
                    {/* Espacio extra para scroll */}
                    <View style={{ height: 40 }} />

                </ScrollView>

                {/* Footer Flotante con Guardar */}
                <View style={{ padding: 24, backgroundColor: 'white', borderTopWidth: 1, borderColor: COLORS.borderColor, elevation: 10, shadowColor: "#000", shadowOffset: {width:0, height:-2}, shadowOpacity: 0.1 }}>
                    <Pressable onPress={handleSaveLevelsToSupabase} style={({pressed}) => [styles.saveButton, pressed && styles.buttonPressed]}>
                        <Text style={styles.saveButtonText}>Guardar Configuración</Text>
                    </Pressable>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* --- MODAL 2: OPCIONES (Action Sheet) --- */}
      <Modal visible={showOptionsModal} transparent animationType="slide" onRequestClose={() => setShowOptionsModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowOptionsModal(false)}>
          <View style={styles.actionSheet}>
            <View style={styles.dragHandle} />
            <Text style={styles.actionSheetTitle}>Opciones de Prueba</Text>

            <Pressable
              onPress={() => { setShowOptionsModal(false); setShowEditModal(true); }}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="create-outline" size={22} color={COLORS.textDark} />
              </View>
              <View>
                <Text style={styles.actionText}>Editar Información</Text>
                <Text style={styles.actionSubtext}>Modificar nombre o descripción</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={confirmDelete}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trash-outline" size={22} color={COLORS.error} />
              </View>
              <View>
                <Text style={[styles.actionText, { color: COLORS.error }]}>Eliminar Prueba</Text>
                <Text style={styles.actionSubtext}>Esta acción es permanente</Text>
              </View>
            </Pressable>

            <Pressable onPress={() => setShowOptionsModal(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* --- MODAL 3: EDICIÓN BÁSICA --- */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.editModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Prueba</Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              value={testName}
              onChangeText={setTestName}
              style={styles.input}
              placeholder="Nombre de la prueba"
            />

            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textArea]}
              multiline
              placeholder="Instrucciones..."
              textAlignVertical="top"
            />

            <Pressable
              onPress={handleUpdateBasicInfo}
              style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Alerta Personalizada */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={closeAlert}
        onConfirm={alertConfig.onConfirm} 
      />

    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header Sticky Fix
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.background, // Fondo sólido para sticky
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  titleText: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#DBEAFE', // Blue 100
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Contenido
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#EEF2FF', // Indigo 50
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  statUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },

  // Niveles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  levelsContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  levelRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  levelHeader: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  levelHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    textTransform: 'capitalize',
  },
  levelValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  emptyLevels: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderStyle: 'dashed',
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  emptyLevelsText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },

  // Modals Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionButtonPressed: {
    backgroundColor: '#F8FAFC',
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  actionSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  // Edit Modal Content
  editModalContent: {
    backgroundColor: 'white',
    margin: 24,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    marginBottom: Platform.OS === 'ios' ? 100 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: COLORS.textDark,
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});