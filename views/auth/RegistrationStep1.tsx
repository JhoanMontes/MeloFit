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
import { ArrowLeft } from "lucide-react-native";
import { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "RegistrationStep1">;

// Constantes de color (Mismas que LoginScreen para consistencia)
const COLORS = {
  primary: "#2563eb", // blue-600
  background: "#ffffff",
  inputBg: "#f8fafc", // slate-50
  borderColor: "#e2e8f0", // slate-200
  textDark: "#0f172a", // slate-900
  textLabel: "#334155", // slate-700
  textMuted: "#64748b", // slate-500
  placeholder: "#94a3b8",
  inactiveBar: "#f1f5f9", // slate-100
  shadow: "#000000",
};

export default function RegistrationStep1({ navigation }: Props) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    documentNumber: ""
  });

  const handleNext = () => {
    // Aquí podrías agregar validación simple si lo deseas antes de navegar
    navigation.navigate("RegistrationStep2", {
      nombre_completo: formData.fullName,
      email: formData.email,
      no_documento: formData.documentNumber
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

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

            {/* --- HEADER NAV --- */}
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

            {/* --- TÍTULO Y PROGRESO --- */}
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>
                Crear Cuenta
              </Text>
              <Text style={styles.subtitleText}>
                Ingresa tus datos personales para comenzar.
              </Text>

              {/* Barra de Progreso */}
              <View style={styles.progressContainer}>
                {/* Paso 1 (Activo) */}
                <View style={[styles.progressBar, styles.progressBarActive]} />
                {/* Paso 2 (Inactivo) */}
                <View style={[styles.progressBar, styles.progressBarInactive]} />
              </View>
              
              <Text style={styles.stepIndicatorText}>
                Paso 1 de 2
              </Text>
            </View>

            {/* --- FORMULARIO --- */}
            <View style={styles.formContainer}>

              {/* Nombre Completo */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre Completo</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Ej: Juan Pérez"
                    value={formData.fullName}
                    onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                    style={styles.textInput}
                    placeholderTextColor={COLORS.placeholder}
                  />
                </View>
              </View>

              {/* Correo Electrónico */}
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

              {/* Número de Documento */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Número de Documento</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="1234567890"
                    keyboardType="numeric"
                    value={formData.documentNumber}
                    onChangeText={(text) => setFormData({ ...formData, documentNumber: text })}
                    style={styles.textInput}
                    placeholderTextColor={COLORS.placeholder}
                  />
                </View>
              </View>

            </View>

            {/* Espaciador flexible */}
            <View style={styles.spacer} />

            {/* --- FOOTER BUTTON --- */}
            <View style={styles.footerContainer}>
              <Pressable
                onPress={handleNext}
                style={({ pressed }) => [
                  styles.continueButton,
                  pressed && styles.continueButtonPressed
                ]}
              >
                <Text style={styles.continueButtonText}>
                  Continuar
                </Text>
              </Pressable>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ESTILOS
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
    // Sombras
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
    gap: 8, // Nota: gap funciona en versiones recientes de RN, si usas una antigua usa margins
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 999,
  },
  progressBarActive: {
    backgroundColor: COLORS.primary,
  },
  progressBarInactive: {
    backgroundColor: COLORS.inactiveBar,
  },
  stepIndicatorText: {
    color: "#94a3b8", // slate-400
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "right",
  },
  // Form Fields
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
  // Spacer
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  // Footer
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  continueButton: {
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
  continueButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  continueButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});