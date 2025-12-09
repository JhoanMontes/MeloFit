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
  StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, CheckCircle2, User, Dumbbell } from "lucide-react-native";
import { AuthStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";
import CustomAlert, { AlertType } from "../../components/CustomAlert";

type Props = NativeStackScreenProps<AuthStackParamList, "RegistrationStep2">;

// --- COLORES Y CONSTANTES ---
const COLORS = {
  primary: "#2563eb",     // blue-600
  primaryLight: "#dbeafe", // blue-100/200 aprox para fondos suaves
  primaryDark: "#1e3a8a", // blue-900
  background: "#ffffff",
  inputBg: "#f8fafc",     // slate-50
  borderColor: "#e2e8f0", // slate-200
  borderActive: "#2563eb", // blue-600
  textDark: "#0f172a",    // slate-900
  textLabel: "#334155",   // slate-700
  textMuted: "#64748b",   // slate-500
  placeholder: "#94a3b8",
  shadow: "#000000",
  iconInactive: "#64748b",
  bgIconInactive: "#f1f5f9", // slate-100
};

export default function RegistrationStep2({ navigation, route }: Props) {

  // 🔹 Datos recibidos desde Step1
  let { nombre_completo, email, no_documento } = route.params;

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    role: "atleta" as "atleta" | "entrenador"
  });

  // 🔹 Estado del modal
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as AlertType,
    action: null as (() => void) | null
  });

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, visible: false }));
    if (alert.action) alert.action();
  };

  // 🔹 Función final de registro
  const handleComplete = async () => {
    if (!formData.password || formData.password !== formData.confirmPassword) {
      setAlert({
        visible: true,
        title: "Error",
        message: "Las contraseñas no coinciden o están vacías.",
        type: "warning",
        action: null
      });
      return;
    }

    email = email.trim();

    const finalData = {
      nombre_completo,
      email,
      no_documento,
      password: formData.password,
      role: formData.role
    };

    console.log("➡️ Datos enviados:", finalData);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: finalData.email,
        password: finalData.password,
        options: {
          data: {
            nombre_completo: finalData.nombre_completo,
            no_documento: finalData.no_documento,
            role: finalData.role
          }
        }
      });

      if (error) {
        console.error("❌ Error:", error.message);
        setAlert({
          visible: true,
          title: "Error",
          message: error.message,
          type: "error",
          action: null
        });
        return;
      }

      setAlert({
        visible: true,
        title: "Registro exitoso",
        message: "Tu cuenta fue creada correctamente.",
        type: "success",
        action: null
      });

    } catch (err: any) {
      console.error("❌ Error inesperado:", err);
      setAlert({
        visible: true,
        title: "Error",
        message: "Ocurrió un error inesperado.",
        type: "error",
        action: null
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={closeAlert}
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* HEADER */}
            <View style={styles.headerContainer}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.buttonPressed
                ]}
              >
                <ArrowLeft size={22} color="#334155" />
              </Pressable>
            </View>

            {/* TÍTULO Y PROGRESO */}
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>
                Seguridad y Rol
              </Text>
              <Text style={styles.subtitleText}>
                Define tu contraseña y tu tipo de usuario.
              </Text>

              {/* Barras de progreso */}
              <View style={styles.progressContainer}>
                {/* Paso 1 (Completo) */}
                <View style={styles.progressBarActive} />
                {/* Paso 2 (Completo/Activo) */}
                <View style={styles.progressBarActive} />
              </View>
              <Text style={styles.stepIndicatorText}>
                Paso Final
              </Text>
            </View>

            {/* FORMULARIO */}
            <View style={styles.formContainer}>
              
              {/* --- Sección Contraseña --- */}
              <View style={styles.sectionSpacing}>
                
                {/* Contraseña */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Contraseña</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      placeholder="••••••••"
                      secureTextEntry
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      style={styles.textInput}
                      placeholderTextColor={COLORS.placeholder}
                    />
                  </View>
                </View>

                {/* Confirmar Contraseña */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirmar Contraseña</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      placeholder="••••••••"
                      secureTextEntry
                      value={formData.confirmPassword}
                      onChangeText={(text) =>
                        setFormData({ ...formData, confirmPassword: text })
                      }
                      style={styles.textInput}
                      placeholderTextColor={COLORS.placeholder}
                    />
                  </View>
                </View>
              </View>

              {/* Separador */}
              <View style={styles.divider} />

              {/* --- Sección Rol --- */}
              <View style={styles.sectionSpacing}>
                <Text style={styles.sectionTitle}>
                  ¿Cuál es tu objetivo?
                </Text>

                {/* OPCIÓN 1: ATLETA */}
                <Pressable
                  onPress={() => setFormData({ ...formData, role: "atleta" })}
                  style={[
                    styles.roleCard,
                    formData.role === "atleta" ? styles.roleCardActive : styles.roleCardInactive
                  ]}
                >
                  <View style={[
                    styles.iconBox,
                    formData.role === "atleta" ? styles.iconBoxActive : styles.iconBoxInactive
                  ]}>
                    <User
                      size={24}
                      color={formData.role === "atleta" ? COLORS.primary : COLORS.iconInactive}
                    />
                  </View>

                  <View style={styles.roleTextContainer}>
                    <Text style={[
                      styles.roleTitle,
                      formData.role === "atleta" ? styles.roleTitleActive : styles.roleTitleInactive
                    ]}>
                      Soy Deportista
                    </Text>
                    <Text style={styles.roleSubtitle}>
                      Quiero entrenar y ver mi progreso
                    </Text>
                  </View>

                  <View style={[
                    styles.checkCircle,
                    formData.role === "atleta" ? styles.checkCircleActive : styles.checkCircleInactive
                  ]}>
                    {formData.role === "atleta" && (
                      <CheckCircle2 size={14} color="white" />
                    )}
                  </View>
                </Pressable>

                {/* OPCIÓN 2: ENTRENADOR */}
                <Pressable
                  onPress={() => setFormData({ ...formData, role: "entrenador" })}
                  style={[
                    styles.roleCard,
                    formData.role === "entrenador" ? styles.roleCardActive : styles.roleCardInactive
                  ]}
                >
                  <View style={[
                    styles.iconBox,
                    formData.role === "entrenador" ? styles.iconBoxActive : styles.iconBoxInactive
                  ]}>
                    <Dumbbell
                      size={24}
                      color={formData.role === "entrenador" ? COLORS.primary : COLORS.iconInactive}
                    />
                  </View>

                  <View style={styles.roleTextContainer}>
                    <Text style={[
                      styles.roleTitle,
                      formData.role === "entrenador" ? styles.roleTitleActive : styles.roleTitleInactive
                    ]}>
                      Soy Entrenador
                    </Text>
                    <Text style={styles.roleSubtitle}>
                      Gestionar atletas y rutinas
                    </Text>
                  </View>

                  <View style={[
                    styles.checkCircle,
                    formData.role === "entrenador" ? styles.checkCircleActive : styles.checkCircleInactive
                  ]}>
                    {formData.role === "entrenador" && (
                      <CheckCircle2 size={14} color="white" />
                    )}
                  </View>
                </Pressable>

              </View>

            </View>

            {/* Espaciador flexible */}
            <View style={styles.spacer} />

            {/* BOTÓN FINAL */}
            <View style={styles.footerContainer}>
              <Pressable
                onPress={handleComplete}
                style={({ pressed }) => [
                  styles.completeButton,
                  pressed && styles.completeButtonPressed
                ]}
              >
                <Text style={styles.completeButtonText}>
                  Completar Registro
                </Text>
              </Pressable>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// --- ESTILOS ESTRICTOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Header
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonPressed: {
    backgroundColor: COLORS.inputBg,
    transform: [{ scale: 0.98 }],
  },
  // Title & Progress
  titleContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 32,
  },
  titleText: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.textDark,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // Margen entre barras
  },
  progressBarActive: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  stepIndicatorText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "right",
  },
  // Form Area
  formContainer: {
    paddingHorizontal: 24,
  },
  sectionSpacing: {
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textLabel,
    marginLeft: 4,
    marginBottom: 8,
  },
  inputWrapper: {
    width: "100%",
    height: 56,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9", // slate-100
    marginVertical: 16,
  },
  // Role Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  roleCardInactive: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.borderColor,
  },
  roleCardActive: {
    backgroundColor: "#eff6ff", // blue-50
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  iconBox: {
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  iconBoxInactive: {
    backgroundColor: COLORS.bgIconInactive,
  },
  iconBoxActive: {
    backgroundColor: "#bfdbfe", // blue-200
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  roleTitleInactive: {
    color: COLORS.textLabel,
  },
  roleTitleActive: {
    color: COLORS.primaryDark,
  },
  roleSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircleInactive: {
    borderColor: "#cbd5e1", // slate-300
  },
  checkCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  // Spacer & Footer
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  completeButton: {
    width: "100%",
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  completeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});