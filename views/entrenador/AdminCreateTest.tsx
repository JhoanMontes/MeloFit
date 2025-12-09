import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
// Importamos el Alert Customizado
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
};

type Props = NativeStackScreenProps<EntrenadorStackParamList, "AdminCreateTest">;

interface PerformanceRange {
  id: number;
  label: string;
  minValue: string;
  maxValue: string;
}

const METRIC_OPTIONS = [
  { label: "Tiempo (Minutos)", value: "TIME_MIN", unit: "min" },
  { label: "Distancia (Kilómetros)", value: "DISTANCE_KM", unit: "km" },
  { label: "Peso (Kilogramos)", value: "WEIGHT_KG", unit: "kg" },
  { label: "Repeticiones", value: "REPS", unit: "reps" },
];

export default function AdminCreateTest({ navigation }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showMetricModal, setShowMetricModal] = useState(false);

  // --- ESTADO DEL CUSTOM ALERT ---
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    onCloseAction?: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  // Helper para mostrar alerta
  const showAlert = (title: string, message: string, type: AlertType = "info", onCloseAction?: () => void) => {
    setAlertConfig({ visible: true, title, message, type, onCloseAction });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
    if (alertConfig.onCloseAction) {
      alertConfig.onCloseAction();
    }
  };
  // ------------------------------

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metricType, setMetricType] = useState("");
  const [ranges, setRanges] = useState<PerformanceRange[]>([
    { id: 1, label: "", minValue: "", maxValue: "" }
  ]);

  const currentMetricUnit = METRIC_OPTIONS.find(o => o.value === metricType)?.unit || "";

  const addRange = () => {
    const newId = ranges.length > 0 ? Math.max(...ranges.map(r => r.id)) + 1 : 1;
    setRanges([...ranges, { id: newId, label: "", minValue: "", maxValue: "" }]);
  };

  const removeRange = (id: number) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter(r => r.id !== id));
    } else {
      // Reemplazo de Alert.alert por CustomAlert
      showAlert("Atención", "Debes tener al menos un nivel de evaluación.", "warning");
    }
  };

  const updateRange = (id: number, field: keyof PerformanceRange, value: string) => {
    setRanges(ranges.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    // Validaciones
    if (!name.trim() || !metricType) {
      showAlert("Faltan datos", "Por favor asigna un nombre y un tipo de métrica a la prueba.", "error");
      return;
    }

    const rangesIncomplete = ranges.some(r => !r.label.trim() || !r.minValue.trim() || !r.maxValue.trim());
    if (rangesIncomplete) {
      showAlert("Niveles incompletos", "Por favor completa todos los campos de los niveles de evaluación.", "error");
      return;
    }

    try {
      setLoading(true);

      const { data: trainerData, error: trainerError } = await supabase
        .from('usuario')
        .select('no_documento')
        .eq('auth_id', user.id)
        .single();

      if (trainerError || !trainerData) throw new Error("No se encontró el perfil del entrenador.");

      const nivelesParaGuardar = ranges.map(r => ({
        nombre: r.label,
        min: parseFloat(r.minValue.replace(',', '.')) || 0,
        max: parseFloat(r.maxValue.replace(',', '.')) || 0
      }));

      const { error: insertError } = await supabase
        .from('prueba')
        .insert({
          nombre: name.trim(),
          descripcion: description.trim(),
          tipo_metrica: metricType,
          niveles: nivelesParaGuardar,
          entrenador_no_documento: trainerData.no_documento,
          fecha_registro: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // ÉXITO: Pasamos la acción de navegar al cerrar el alert
      showAlert(
          "¡Creada con éxito!", 
          "La prueba se ha guardado correctamente en tu biblioteca.", 
          "success",
          () => navigation.goBack() 
      );

    } catch (error: any) {
      console.error(error);
      showAlert("Error", "Ocurrió un problema al intentar guardar la prueba. Inténtalo de nuevo.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          
          {/* HEADER */}
          <View style={styles.headerContainer}>
            <Pressable 
              style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>Nueva Prueba</Text>
              <Text style={styles.headerSubtitle}>Define los parámetros de evaluación</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* SECCIÓN 1: DATOS */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Información Básica</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre de la prueba</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Test de Cooper"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Instrucciones (Opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe brevemente cómo realizar la prueba..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  value={description}
                  onChangeText={setDescription}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tipo de Métrica</Text>
                <Pressable
                  style={({ pressed }) => [styles.selector, pressed && styles.buttonPressed]}
                  onPress={() => setShowMetricModal(true)}
                >
                  <Text style={[styles.selectorText, !metricType && { color: COLORS.textMuted }]}>
                    {METRIC_OPTIONS.find(o => o.value === metricType)?.label || "Seleccionar métrica..."}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
                </Pressable>
              </View>
            </View>

            {/* SECCIÓN 2: NIVELES */}
            <View style={styles.card}>
              <View style={styles.levelsHeader}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="layers-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Niveles de Rendimiento</Text>
                </View>
                <Pressable onPress={addRange} style={styles.addButtonSmall}>
                   <Ionicons name="add" size={16} color={COLORS.primary} />
                   <Text style={styles.addButtonText}>Añadir</Text>
                </Pressable>
              </View>

              {ranges.map((range, index) => (
                <View key={range.id} style={styles.levelCard}>
                  <View style={styles.levelHeader}>
                    <Text style={styles.levelLabel}>NIVEL {index + 1}</Text>
                    {ranges.length > 1 && (
                      <Pressable onPress={() => removeRange(range.id)}>
                        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                      </Pressable>
                    )}
                  </View>

                  <View style={styles.levelRow}>
                    <View style={{ flex: 2, marginRight: 12 }}>
                      <Text style={styles.miniLabel}>Etiqueta</Text>
                      <TextInput
                        style={styles.miniInput}
                        placeholder="Ej. Avanzado"
                        placeholderTextColor="#CBD5E1"
                        value={range.label}
                        onChangeText={(t) => updateRange(range.id, 'label', t)}
                      />
                    </View>

                    <View style={{ flex: 1, marginRight: 8 }}>
                       <Text style={styles.miniLabel}>Min {currentMetricUnit && `(${currentMetricUnit})`}</Text>
                       <TextInput
                        style={[styles.miniInput, { textAlign: 'center' }]}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor="#CBD5E1"
                        value={range.minValue}
                        onChangeText={(t) => updateRange(range.id, 'minValue', t)}
                       />
                    </View>

                    <View style={{ flex: 1 }}>
                       <Text style={styles.miniLabel}>Max {currentMetricUnit && `(${currentMetricUnit})`}</Text>
                       <TextInput
                        style={[styles.miniInput, { textAlign: 'center' }]}
                        placeholder="100"
                        keyboardType="numeric"
                        placeholderTextColor="#CBD5E1"
                        value={range.maxValue}
                        onChangeText={(t) => updateRange(range.id, 'maxValue', t)}
                       />
                    </View>
                  </View>
                </View>
              ))}
            </View>

          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Pressable 
                style={({pressed}) => [styles.saveButton, pressed && styles.saveButtonPressed, loading && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <>
                        <Ionicons name="save-outline" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.saveButtonText}>Guardar Prueba</Text>
                    </>
                )}
            </Pressable>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* MODAL MÉTRICA */}
      <Modal visible={showMetricModal} transparent animationType="fade" onRequestClose={() => setShowMetricModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowMetricModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona la Métrica</Text>
            {METRIC_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.modalOption, metricType === opt.value && styles.modalOptionActive]}
                onPress={() => {
                  setMetricType(opt.value);
                  setShowMetricModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, metricType === opt.value && styles.modalOptionTextActive]}>
                  {opt.label}
                </Text>
                {metricType === opt.value && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* --- INTEGRACIÓN CUSTOM ALERT --- */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={closeAlert}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    marginRight: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonPressed: {
    backgroundColor: COLORS.inputBg,
    transform: [{ scale: 0.96 }],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  // CARDS
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
    marginLeft: 8,
  },
  // INPUTS
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
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
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  selector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  selectorText: {
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  // LEVELS
  levelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  levelCard: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  miniLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
    fontWeight: '600',
  },
  miniInput: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 8,
    fontSize: 14,
    color: COLORS.textDark,
  },
  // FOOTER
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
    backgroundColor: COLORS.cardBg,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  // MODAL MÉTRICA (Este estilo se queda igual)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  modalOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});