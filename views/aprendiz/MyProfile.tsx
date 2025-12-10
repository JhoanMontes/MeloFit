import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  FlatList,
  StyleSheet
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  Save,
  Info,
  User,
  Lock,
  Ruler,
  Weight,
  Calendar,
  ChevronDown,
  Check,
  X
} from "lucide-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { AprendizStackParamList } from "../../navigation/types";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import CustomAlert, { AlertType } from "../../components/CustomAlert";

type Props = NativeStackScreenProps<AprendizStackParamList, "Profile">;

interface GenderOption {
  id: number;
  nombre: string;
}

const COLORS = {
  primary: "#2563eb",
  primaryLight: "#eff6ff",
  primaryBorder: "#dbeafe",
  background: "#f8fafc",
  white: "#ffffff",
  textDark: "#0f172a",
  textLabel: "#334155",
  textMuted: "#64748b",
  textLight: "#94a3b8",
  borderColor: "#e2e8f0",
  inputBg: "#ffffff",
  inputDisabledBg: "#f8fafc",
  shadow: "#000000",
};

export default function MyProfile({ navigation }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCoach, setIsCoach] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    documentNumber: '',
    height: '',
    weight: '',
    genderId: null as number | null,
    genderName: ''
  });

  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [genderOptions, setGenderOptions] = useState<GenderOption[]>([]);
  const [showGenderModal, setShowGenderModal] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as AlertType,
    onCloseAction: null as (() => void) | null
  });

  const showAlert = (title: string, message: string, type: AlertType = "info", action: (() => void) | null = null) => {
    setAlertConfig({ visible: true, title, message, type, onCloseAction: action });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
    if (alertConfig.onCloseAction) {
      alertConfig.onCloseAction();
    }
  };

  const parseLocalDate = (dateString: string) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getLocalISOString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setBirthDate(selectedDate);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        const { data: gendersData } = await supabase.from('genero').select('*');
        if (gendersData) setGenderOptions(gendersData);

        const { data: userData, error: userError } = await supabase
          .from('usuario')
          .select('no_documento, nombre_completo, rol')
          .eq('auth_id', user.id)
          .single();

        if (userError) throw userError;

        const userIsCoach = userData.rol === 'entrenador';
        setIsCoach(userIsCoach);

        setFormData(prev => ({
          ...prev,
          name: userData.nombre_completo || '',
          documentNumber: userData.no_documento.toString(),
        }));

        if (!userIsCoach) {
          const { data: athleteData } = await supabase
            .from('atleta')
            .select('estatura, peso, fecha_nacimiento, genero_id')
            .eq('no_documento', userData.no_documento)
            .single();

          const currentGender = gendersData?.find(g => g.id === athleteData?.genero_id);

          setFormData(prev => ({
            ...prev,
            height: athleteData?.estatura ? athleteData.estatura.toString() : '',
            weight: athleteData?.peso ? athleteData.peso.toString() : '',
            genderId: athleteData?.genero_id || null,
            genderName: currentGender ? currentGender.nombre : ''
          }));

          if (athleteData?.fecha_nacimiento) {
            setBirthDate(parseLocalDate(athleteData.fecha_nacimiento));
          }
        }

      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // --- LOGICA DE GUARDADO MEJORADA CON HISTORIAL ---
  const handleSave = async () => {
    if (!formData.documentNumber) return;

    if (isCoach) {
      showAlert("Información", "Tus datos son gestionados por administración.", "info");
      return;
    }

    setSaving(true);
    try {
      const heightVal = parseFloat(formData.height);
      const weightVal = parseFloat(formData.weight); // Use float for precision if needed

      if (formData.height && isNaN(heightVal)) {
        showAlert("Dato inválido", "La altura debe ser un número válido.", "warning");
        setSaving(false);
        return;
      }

      const updates: any = {
        estatura: heightVal || null,
        peso: weightVal || null,
        genero_id: formData.genderId
      };

      if (birthDate) {
        updates.fecha_nacimiento = getLocalISOString(birthDate);
      }

      const docId = parseInt(formData.documentNumber);

      // 1. Actualizar tabla 'atleta'
      const { error: updateError } = await supabase
        .from('atleta')
        .update(updates)
        .eq('no_documento', docId);

      if (updateError) throw updateError;

      // 2. Insertar en 'historial_fisico' (NUEVO)
      // Guardamos la foto del estado físico actual para reportes futuros
      const { error: historyError } = await supabase
        .from('historial_fisico')
        .insert({
          atleta_no_documento: docId,
          peso: weightVal || null,
          estatura: heightVal || null,
          // Calculamos IMC si hay datos
          imc: (weightVal && heightVal) ? (weightVal / ((heightVal/100) * (heightVal/100))).toFixed(2) : null,
          fecha_registro: new Date().toISOString()
        });

      if (historyError) {
        console.error("Advertencia: No se guardó el historial", historyError);
        // No lanzamos error para no bloquear al usuario, pero lo logueamos
      }

      showAlert(
        "Perfil Actualizado",
        "Tus datos han sido guardados y tu progreso registrado.",
        "success",
        () => navigation.goBack()
      );

    } catch (error: any) {
      console.error("Error guardando:", error);
      showAlert("Error", "No se pudieron guardar los cambios.", "error");
    } finally {
      setSaving(false);
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

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={closeAlert}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

            <View style={styles.headerContainer}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed
                ]}
              >
                <ArrowLeft size={22} color={COLORS.textLabel} />
              </Pressable>
            </View>

            <View style={styles.heroSection}>
              <View style={styles.heroImageContainer}>
                <User size={56} color={COLORS.primary} />
                <View style={styles.heroBadge}>
                  <User size={14} color="white" />
                </View>
              </View>
              <Text style={styles.heroTitle}>Mi Perfil</Text>
              <Text style={styles.heroSubtitle}>
                {isCoach ? "Información de Entrenador" : "Actualiza tu información personal"}
              </Text>
            </View>

            <View style={styles.mainContainer}>

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <View style={styles.iconBox}>
                      <User size={20} color={COLORS.textMuted} />
                    </View>
                    <Text style={styles.cardTitle}>Identidad</Text>
                  </View>
                  <View style={styles.protectedBadge}>
                    <Lock size={12} color={COLORS.textLight} />
                    <Text style={styles.protectedText}>Protegido</Text>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nombre Completo</Text>
                    <View style={styles.inputWrapperDisabled}>
                      <TextInput
                        value={formData.name}
                        editable={false}
                        style={styles.inputDisabled}
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Número de Documento</Text>
                    <View style={styles.inputWrapperDisabled}>
                      <TextInput
                        value={formData.documentNumber}
                        editable={false}
                        style={styles.inputDisabled}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {!isCoach && (
                <>
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Datos Físicos</Text>
                      <Text style={styles.cardSubtitle}>Información necesaria para tus métricas</Text>
                    </View>

                    <View style={styles.cardContent}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Género</Text>
                        <Pressable
                          onPress={() => setShowGenderModal(true)}
                          style={({ pressed }) => [
                            styles.selectButton,
                            pressed && styles.selectButtonPressed
                          ]}
                        >
                          <View style={styles.selectContent}>
                            <User size={20} color={COLORS.textLight} style={styles.inputIcon} />
                            <Text style={[
                              styles.selectText,
                              formData.genderId ? styles.textDark : styles.textLight
                            ]}>
                              {formData.genderName || "Seleccionar género"}
                            </Text>
                          </View>
                          <ChevronDown size={20} color={COLORS.textMuted} />
                        </Pressable>
                      </View>

                      <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                          <Text style={styles.label}>Altura</Text>
                          <View style={styles.inputWrapperRow}>
                            <Ruler size={20} color={COLORS.textLight} style={styles.inputIcon} />
                            <TextInput
                              value={formData.height}
                              onChangeText={(text) => setFormData({ ...formData, height: text })}
                              keyboardType="numeric"
                              placeholder="0"
                              style={styles.inputNumber}
                            />
                            <View style={styles.unitBadge}>
                              <Text style={styles.unitText}>CM</Text>
                            </View>
                          </View>
                        </View>

                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                          <Text style={styles.label}>Peso</Text>
                          <View style={styles.inputWrapperRow}>
                            <Weight size={20} color={COLORS.textLight} style={styles.inputIcon} />
                            <TextInput
                              value={formData.weight}
                              onChangeText={(text) => setFormData({ ...formData, weight: text })}
                              keyboardType="numeric"
                              placeholder="0"
                              style={styles.inputNumber}
                            />
                            <View style={styles.unitBadge}>
                              <Text style={styles.unitText}>KG</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Fecha de Nacimiento</Text>
                        <Pressable
                          onPress={() => setShowDatePicker(true)}
                          style={({ pressed }) => [
                            styles.selectButton,
                            pressed && styles.selectButtonPressed
                          ]}
                        >
                          <Calendar size={20} color={COLORS.textLight} style={styles.inputIcon} />
                          {birthDate ? (
                            <Text style={[styles.selectText, styles.textDark]}>
                              {birthDate.toLocaleDateString()}
                            </Text>
                          ) : (
                            <Text style={[styles.selectText, styles.textLight]}>
                              Seleccionar fecha...
                            </Text>
                          )}
                        </Pressable>
                        {showDatePicker && (
                          <DateTimePicker
                            value={birthDate || new Date(2000, 0, 1)}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                            maximumDate={new Date()}
                          />
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.infoBanner}>
                    <Info size={22} color={COLORS.primary} style={{ marginTop: 2 }} />
                    <Text style={styles.infoText}>
                      Mantener tus datos actualizados nos ayuda a calcular tu IMC y personalizar tus cargas de entrenamiento.
                    </Text>
                  </View>
                </>
              )}

            </View>
          </ScrollView>

          {!isCoach && (
            <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveButton,
                  saving && styles.saveButtonDisabled,
                  pressed && !saving && styles.saveButtonPressed
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Save size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          <Modal
            visible={showGenderModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowGenderModal(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setShowGenderModal(false)}>
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalHandle} />
                
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Selecciona tu Género</Text>
                  <Pressable onPress={() => setShowGenderModal(false)} style={styles.modalCloseButton}>
                    <X size={20} color={COLORS.textMuted} />
                  </Pressable>
                </View>

                {genderOptions.length === 0 ? (
                  <View style={styles.loadingModal}>
                    <Text style={styles.textMuted}>Cargando opciones...</Text>
                    <ActivityIndicator color={COLORS.primary} style={{ marginTop: 8 }} />
                  </View>
                ) : (
                  <FlatList
                    data={genderOptions}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => {
                          setFormData({ ...formData, genderId: item.id, genderName: item.nombre });
                          setShowGenderModal(false);
                        }}
                        style={[
                          styles.genderOption,
                          formData.genderId === item.id && styles.genderOptionSelected
                        ]}
                      >
                        <Text style={[
                          styles.genderText,
                          formData.genderId === item.id ? styles.genderTextSelected : styles.genderTextDefault
                        ]}>
                          {item.nombre}
                        </Text>
                        {formData.genderId === item.id && (
                          <View style={styles.checkContainer}>
                            <Check size={16} color={COLORS.primary} />
                          </View>
                        )}
                      </Pressable>
                    )}
                  />
                )}
              </Pressable>
            </Pressable>
          </Modal>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
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
  backButtonPressed: {
    backgroundColor: COLORS.background,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  heroImageContainer: {
    width: 112,
    height: 112,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 6,
    borderColor: COLORS.white,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  heroBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 4,
  },
  mainContainer: {
    paddingHorizontal: 24,
    gap: 32,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
    marginBottom: 20,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
    marginTop: 4,
  },
  protectedBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  protectedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  cardContent: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLabel,
    marginLeft: 4,
  },
  inputWrapperDisabled: {
    backgroundColor: COLORS.inputDisabledBg,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  inputDisabled: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  selectButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: COLORS.borderColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 1,
  },
  selectButtonPressed: {
    backgroundColor: COLORS.background,
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 12,
  },
  selectText: {
    fontSize: 16,
    fontWeight: '500',
  },
  textDark: {
    color: COLORS.textDark,
  },
  textLight: {
    color: COLORS.textLight,
  },
  textMuted: {
    color: COLORS.textMuted,
  },
  row: {
    flexDirection: 'row',
  },
  inputWrapperRow: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 16,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: COLORS.borderColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 1,
  },
  inputNumber: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  unitBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unitText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  infoBanner: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '500',
    color: '#1e3a8a',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
    paddingHorizontal: 24,
    paddingTop: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  saveButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#60a5fa',
    shadowOpacity: 0,
  },
  saveButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 48,
    height: 6,
    backgroundColor: COLORS.borderColor,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  modalCloseButton: {
    padding: 8,
    backgroundColor: COLORS.background,
    borderRadius: 20,
  },
  loadingModal: {
    padding: 16,
    alignItems: 'center',
  },
  genderOption: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    backgroundColor: COLORS.white,
  },
  genderOptionSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: '#bfdbfe',
  },
  genderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  genderTextDefault: {
    color: COLORS.textLabel,
  },
  genderTextSelected: {
    color: '#1d4ed8',
  },
  checkContainer: {
    backgroundColor: '#dbeafe',
    padding: 4,
    borderRadius: 12,
  },
});