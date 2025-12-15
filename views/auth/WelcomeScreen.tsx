import React, { useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  StatusBar, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Easing
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Activity, ArrowRight } from "lucide-react-native";

import { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

const { width, height } = Dimensions.get("window");

const COLORS = {
  primary: "#2563eb",         // Azul principal
  primaryDark: "#1e40af",     // Azul oscuro (al presionar)
  secondary: "#f8fafc",       // Fondo botón secundario
  secondaryText: "#334155",   // Texto botón secundario
  background: "#ffffff",
  textTitle: "#0f172a",       // Negro azulado (Títulos)
  textBody: "#64748b",        // Gris medio (Cuerpos de texto)
  accentCircle: "rgba(37, 99, 235, 0.04)", // Decoración fondo muy sutil
};

export default function WelcomeScreen({ navigation }: Props) {
  // --- VALORES DE ANIMACIÓN ---
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const scaleLogo = useRef(new Animated.Value(0.6)).current; 
  const slideText = useRef(new Animated.Value(40)).current;  
  const slideButtons = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    // Secuencia de entrada (Intro única y elegante)
    Animated.parallel([
      // 1. Fade In General
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // 2. Logo: Rebote suave
      Animated.spring(scaleLogo, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      // 3. Textos y Botones: Cascada hacia arriba
      Animated.stagger(100, [
        Animated.timing(slideText, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideButtons, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Decoración de Fondo */}
      <View style={styles.backgroundCircleTop} />
      <View style={styles.backgroundCircleBottom} />

      <SafeAreaView style={styles.safeArea}>
        
        {/* --- SECCIÓN SUPERIOR --- */}
        <View style={styles.topSection}>
          
          {/* LOGO ESTÁTICO */}
          <Animated.View 
            style={[
              styles.logoContainer, 
              { opacity: fadeAnim, transform: [{ scale: scaleLogo }] }
            ]}
          >
            <View style={styles.logoInner}>
              <Activity size={64} color="white" strokeWidth={2.5} />
            </View>
            {/* Sombra sutil */}
            <View style={styles.logoShadow} />
          </Animated.View>

          {/* TEXTOS */}
          <Animated.View 
            style={{ 
              opacity: fadeAnim, 
              transform: [{ translateY: slideText }],
              alignItems: "center",
              width: '100%',
              paddingHorizontal: 24
            }}
          >
            <Text style={styles.heroTitle}>
              Sport<Text style={styles.highlight}>Sync</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              La plataforma definitiva para gestionar rendimiento deportivo.
            </Text>
          </Animated.View>
        </View>

        {/* --- SECCIÓN INFERIOR --- */}
        <Animated.View 
          style={[
            styles.bottomSection, 
            { opacity: fadeAnim, transform: [{ translateY: slideButtons }] }
          ]}
        >
          {/* Botón Principal */}
          <Pressable
            onPress={() => navigation.navigate("RegistrationStep1")}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed
            ]}
          >
            <Text style={styles.primaryButtonText}>Crear Cuenta Gratis</Text>
            <ArrowRight size={20} color="white" style={{ marginLeft: 8 }} strokeWidth={2.5} />
          </Pressable>

          {/* Separador */}
          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>¿Ya tienes cuenta?</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Botón Secundario */}
          <Pressable
            onPress={() => navigation.navigate("Login")}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed
            ]}
          >
            <Text style={styles.secondaryButtonText}>Iniciar Sesión</Text>
          </Pressable>

          <Text style={styles.termsText}>
            Al continuar, aceptas nuestros Términos de Servicio.
          </Text>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

// --- HOJA DE ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: "hidden",
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  
  // DECORACIÓN FONDO
  backgroundCircleTop: {
    position: "absolute",
    top: -height * 0.15,
    right: -width * 0.25,
    width: width,
    height: width,
    borderRadius: width / 2,
    backgroundColor: COLORS.accentCircle,
  },
  backgroundCircleBottom: {
    position: "absolute",
    bottom: -height * 0.1,
    left: -width * 0.3,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: COLORS.accentCircle,
  },

  // TOP SECTION
  topSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  
  // LOGO
  logoContainer: {
    marginBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 128,
    height: 128,
    backgroundColor: COLORS.primary,
    borderRadius: 42, // Squircle moderno
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    // Sombra del contenedor
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  logoShadow: {
    position: 'absolute',
    bottom: -24,
    width: 90,
    height: 20,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    opacity: 0.08, // Sombra muy sutil (corrección UX)
    transform: [{ scaleX: 1.4 }]
  },

  // TEXTOS
  heroTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: COLORS.textTitle,
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -1,
    lineHeight: 48,
  },
  highlight: {
    color: COLORS.primary,
  },
  heroSubtitle: {
    fontSize: 17,
    color: COLORS.textBody,
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "500",
    maxWidth: 320,
    paddingHorizontal: 10,
  },

  // BOTTOM SECTION
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    width: "100%",
  },
  
  // BOTÓN PRIMARIO
  primaryButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonPressed: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 0.97 }],
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // SEPARADOR
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  separatorText: {
    marginHorizontal: 16,
    color: "#64748b", // Gris más legible (corrección UX)
    fontSize: 14,
    fontWeight: "600",
  },

  // BOTÓN SECUNDARIO
  secondaryButton: {
    backgroundColor: COLORS.secondary,
    height: 64,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  secondaryButtonPressed: {
    backgroundColor: "#e2e8f0",
    transform: [{ scale: 0.97 }],
  },
  secondaryButtonText: {
    color: COLORS.secondaryText,
    fontSize: 17,
    fontWeight: "700",
  },

  // TERMS
  termsText: {
    marginTop: 32,
    textAlign: "center",
    color: "#94a3b8", // Contraste ajustado
    fontSize: 12,
    fontWeight: "500",
  },
});