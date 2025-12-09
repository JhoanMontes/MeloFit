import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import { AuthStackParamList } from "../../navigation/types";
import { useAuth } from "../../context/AuthContext";
import CustomAlert, { AlertType } from "../../components/CustomAlert";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

// Constantes de color para mantener consistencia
const COLORS = {
  primary: "#2563eb", // blue-600
  background: "#ffffff",
  inputBg: "#f8fafc", // slate-50
  borderColor: "#e2e8f0", // slate-200
  textDark: "#0f172a", // slate-900
  textLabel: "#334155", // slate-700
  textMuted: "#64748b", // slate-500
  placeholder: "#94a3b8",
  shadow: "#000000",
};

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // CONFIGURACIÓN DE ALERTA
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as AlertType
  });

  const showAlert = (title: string, message: string, type: AlertType = "error") => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      showAlert("Campos incompletos", "Ingresa correo y contraseña.", "warning");
      return;
    }

    const { success } = await login(formData.email, formData.password);

    if (!success) {
      showAlert(
        "Error al iniciar sesión",
        "Credenciales incorrectas, por favor verifica tu información",
        "error"
      );
      return;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* MODAL ALERT */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* HEADER - BOTÓN ATRÁS */}
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

            {/* TÍTULO Y DESCRIPCIÓN */}
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>
                Bienvenido de Nuevo
              </Text>
              <Text style={styles.subtitleText}>
                Inicia sesión para continuar tu progreso y alcanzar tus metas.
              </Text>
            </View>

            {/* FORMULARIO */}
            <View style={styles.formContainer}>
              
              {/* CAMPO CORREO */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo Electrónico</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="juan@ejemplo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    style={styles.textInput}
                    placeholderTextColor={COLORS.placeholder}
                  />
                </View>
              </View>

              {/* CAMPO CONTRASEÑA */}
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
                <Pressable style={styles.forgotPasswordButton}>
                  <Text style={styles.forgotPasswordText}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </Pressable>
              </View>

            </View>

            {/* ESPACIO FLEXIBLE */}
            <View style={styles.spacer} />

            {/* FOOTER - BOTONES DE ACCIÓN */}
            <View style={styles.footerContainer}>
              <Pressable
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.loginButtonPressed
                ]}
              >
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              </Pressable>

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>¿No tienes una cuenta?</Text>
                <Pressable onPress={() => navigation.navigate("RegistrationStep1")}>
                  <Text style={styles.registerLink}>Regístrate</Text>
                </Pressable>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ESTILOS ESTRICTOS
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
  // Header styles
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
    // Sombra suave en iOS
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Sombra en Android
    elevation: 2,
  },
  buttonPressed: {
    backgroundColor: COLORS.inputBg,
    transform: [{ scale: 0.98 }],
  },
  // Title Styles
  titleContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
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
    lineHeight: 24,
  },
  // Form Styles
  formContainer: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
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
  forgotPasswordButton: {
    alignItems: "flex-end",
    paddingTop: 8,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  // Spacer
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  // Footer Styles
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  loginButton: {
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
  loginButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  registerText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "500",
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 4,
    padding: 4,
  },
});