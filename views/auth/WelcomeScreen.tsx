// views/auth/WelcomeScreen.tsx
import React from "react";
import { View, Text, Pressable, StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Dumbbell } from "lucide-react-native";

import { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

// --- COLORES Y CONSTANTES ---
const COLORS = {
  primary: "#2563eb",     // blue-600
  primaryLight: "#eff6ff", // blue-50 (Fondo logo)
  primaryBorder: "#dbeafe", // blue-100 (Borde logo)
  background: "#ffffff",
  textDark: "#0f172a",    // slate-900
  textMuted: "#64748b",   // slate-500
  textButtonSecondary: "#334155", // slate-700
  borderSecondary: "#e2e8f0",     // slate-200
  borderSecondaryActive: "#cbd5e1", // slate-300
};

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>

          {/* --- SECCIÓN SUPERIOR (Logo y Texto) --- */}
          <View style={styles.topSection}>
            
            {/* Logo Circular */}
            <View style={styles.logoOuterCircle}>
              <View style={styles.logoInnerSquare}>
                <Dumbbell size={48} color="white" strokeWidth={2.5} />
              </View>
            </View>

            {/* Títulos */}
            <Text style={styles.titleText}>
              Bienvenido a <Text style={styles.highlightText}>MeloFit</Text>
            </Text>

            <View style={styles.subtitleWrapper}>
              <Text style={styles.subtitleText}>
                Tu plataforma personal de entrenamiento fitness.
              </Text>
            </View>
          </View>

          {/* --- SECCIÓN INFERIOR (Botones) --- */}
          <View style={styles.bottomSection}>
            
            {/* Botón Comenzar */}
            <Pressable
              onPress={() => navigation.navigate("RegistrationStep1")}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed
              ]}
            >
              <Text style={styles.primaryButtonText}>
                Comenzar
              </Text>
            </Pressable>

            {/* Botón Ya Tengo Cuenta */}
            <Pressable
              onPress={() => navigation.navigate("Login")}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed
              ]}
            >
              <Text style={styles.secondaryButtonText}>
                Ya Tengo una Cuenta
              </Text>
            </Pressable>

          </View>

        </View>
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
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  // --- Top Section ---
  topSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoOuterCircle: {
    width: 144, // w-36
    height: 144, // h-36
    backgroundColor: COLORS.primaryLight,
    borderRadius: 72, // rounded-full
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  logoInnerSquare: {
    backgroundColor: COLORS.primary,
    padding: 24,
    borderRadius: 28,
    transform: [{ rotate: "3deg" }],
    // Shadows
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  titleText: {
    fontSize: 36, // text-4xl
    fontWeight: "800", // font-extrabold
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  highlightText: {
    color: COLORS.primary,
  },
  subtitleWrapper: {
    maxWidth: 300,
  },
  subtitleText: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
  },
  // --- Bottom Section ---
  bottomSection: {
    width: "100%",
    paddingBottom: 8,
  },
  // Primary Button
  primaryButton: {
    width: "100%",
    height: 56, // h-14
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16, // Espacio entre botones
    // Shadows
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // Secondary Button
  secondaryButton: {
    width: "100%",
    height: 56,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: COLORS.borderSecondary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonPressed: {
    backgroundColor: "#f8fafc", // slate-50
    borderColor: COLORS.borderSecondaryActive,
  },
  secondaryButtonText: {
    color: COLORS.textButtonSecondary,
    fontSize: 18,
    fontWeight: "700",
  },
});