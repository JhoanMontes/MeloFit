import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
  ArrowLeft, 
  Users, 
  AlignLeft,
  Type
} from "lucide-react-native";
import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "./../../lib/supabase"; 
import { useAuth } from "./../../context/AuthContext";
import CustomAlert, { AlertType } from "../../components/CustomAlert";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "CreateGroup">;

// --- CONSTANTES DE DISEÑO ---
const COLORS = {
  primary: "#2563EB",     // Azul vibrante
  background: "#F8FAFC",  // Gris muy claro (Slate 50)
  cardBg: "#FFFFFF",
  textDark: "#0F172A",    // Slate 900
  textMuted: "#64748B",   // Slate 500
  borderColor: "#E2E8F0", // Slate 200
  inputBg: "#F1F5F9",     // Slate 100
  shadow: "#000000",
  disabled: "#CBD5E1"     // Slate 300
};

export default function CreateGroup({ navigation }: Props) {
  const { user } = useAuth(); 
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  // --- ESTADO PARA CUSTOM ALERT ---
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as AlertType,
    buttonText: "Entendido",
    onAction: undefined as (() => void) | undefined,
  });

  const showAlert = (
    title: string, 
    message: string, 
    type: AlertType = "info", 
    onAction?: () => void,
    buttonText: string = "Entendido"
  ) => {
    setAlertConfig({ visible: true, title, message, type, onAction, buttonText });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
    if (alertConfig.onAction) {
      alertConfig.onAction();
    }
  };

  // --- LÓGICA DE NEGOCIO ---

  const generarCodigoGrupo = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const verificarCodigoGrupo = async () => {
    let isUnique = false;
    let codigoNuevo = '';

    while (!isUnique) {
      codigoNuevo = generarCodigoGrupo();
      const { data } = await supabase
        .from('grupo')
        .select('codigo')
        .eq('codigo', codigoNuevo)
        .maybeSingle()
      if (!data) isUnique = true;
    }
    return codigoNuevo;
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showAlert("Falta el nombre", "Por favor asigna un nombre al grupo.", "warning");
      return;
    }

    try {
      setLoading(true);

      const { data: trainerData, error: trainerError } = await supabase
        .from('usuario')
        .select('no_documento')
        .eq('auth_id', user.id)
        .single();

      if (trainerError || !trainerData) throw new Error("No se encontró información del entrenador");
      const trainerId = trainerData.no_documento;

      // Verificar duplicados de nombre
      const { data: existingGroup } = await supabase
        .from('grupo')
        .select('codigo')
        .eq('nombre', groupName.trim())
        .eq('entrenador_no_documento', trainerId)
        .maybeSingle();

      if (existingGroup) {
        showAlert("Nombre duplicado", "Ya tienes un grupo con este nombre. Por favor elige otro.", "warning");
        setLoading(false);
        return;
      }

      // Generar Código
      const uniqueCode = await verificarCodigoGrupo();

      // Insertar (Asegurando 'activo: true' para Soft Delete compatibility)
      const { error: insertError } = await supabase
        .from('grupo')
        .insert({
          nombre: groupName.trim(),
          descripcion: groupDescription.trim(),
          codigo: uniqueCode,
          entrenador_no_documento: trainerId,
          fecha_creacion: new Date(),
          activo: true 
        });

      if (insertError) throw insertError;

      // ÉXITO: Mostrar código y navegar al cerrar
      showAlert(
        "¡Grupo Creado!", 
        `Código de acceso: ${uniqueCode}\nEl grupo "${groupName}" está listo para recibir atletas.`, 
        "success",
        () => navigation.navigate('MyGroups'),
        "Ir a Mis Grupos"
      );

    } catch (error: any) {
      console.error(error);
      showAlert("Error", error.message || "No se pudo crear el grupo", "error");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = groupName.trim().length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* ALERT COMPONENT */}
      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttonText={alertConfig.buttonText}
        onClose={closeAlert}
        // En este caso usamos onClose para manejar la acción del botón único
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          
          {/* --- HEADER --- */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Pressable 
                onPress={() => navigation.goBack()} 
                style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
              >
                <ArrowLeft size={22} color={COLORS.textDark} />
              </Pressable>
              <View>
                <Text style={styles.headerTitle}>Crear Grupo</Text>
                <Text style={styles.headerSubtitle}>Organiza a tus atletas</Text>
              </View>
            </View>
          </View>

          {/* --- CONTENT --- */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            
            {/* TARJETA DETALLES */}
            <View style={styles.card}>
              
              {/* Título de Tarjeta */}
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Users size={22} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Detalles Básicos</Text>
                  <Text style={styles.cardSubtitle}>Información general del equipo</Text>
                </View>
              </View>

              <View style={styles.formContainer}>
                
                {/* Input: Nombre */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Type size={14} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.label}>Nombre del Grupo</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      placeholder="Ej: Fuerza Avanzada"
                      value={groupName}
                      onChangeText={setGroupName}
                      style={styles.input}
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Input: Descripción */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <AlignLeft size={14} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.label}>Descripción (Opcional)</Text>
                  </View>
                  <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                    <TextInput
                      placeholder="Objetivos, horarios, notas..."
                      value={groupDescription}
                      onChangeText={setGroupDescription}
                      multiline
                      textAlignVertical="top"
                      style={[styles.input, styles.textArea]}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

              </View>
            </View>

          </ScrollView>

          {/* --- FOOTER FIXED --- */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <Pressable
              onPress={handleCreateGroup}
              disabled={!isFormValid || loading}
              style={({ pressed }) => [
                styles.createButton, 
                (!isFormValid || loading) ? styles.createButtonDisabled : styles.createButtonActive,
                pressed && isFormValid && styles.createButtonPressed
              ]}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Users size={20} color={isFormValid ? "white" : "#94A3B8"} style={{ marginRight: 10 }} />
                  <Text style={[styles.createButtonText, !isFormValid && styles.createButtonTextDisabled]}>
                    Crear Grupo
                  </Text>
                </>
              )}
            </Pressable>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// --- ESTILOS STRICTOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  
  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backButtonPressed: {
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 150, // Espacio para el footer
  },
  
  // Card
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  iconContainer: {
    backgroundColor: '#EFF6FF', // Blue 50
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },

  // Form Inputs
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569', // Slate 600
  },
  inputWrapper: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    height: '100%',
  },
  textAreaWrapper: {
    height: 140,
    paddingVertical: 16,
    justifyContent: 'flex-start',
  },
  textArea: {
    height: '100%',
    lineHeight: 22,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderColor,
    paddingHorizontal: 24,
    paddingTop: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  createButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonActive: {
    backgroundColor: COLORS.primary,
  },
  createButtonDisabled: {
    backgroundColor: COLORS.inputBg,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  createButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  createButtonTextDisabled: {
    color: '#94A3B8', // Slate 400
  },
});