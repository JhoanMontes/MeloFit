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
  Alert
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, CheckCircle2, User, Dumbbell } from "lucide-react-native";
import { AuthStackParamList } from "../../navigation/types";
import { supabase } from "lib/supabase";

type Props = NativeStackScreenProps<AuthStackParamList, "RegistrationStep2">;

export default function RegistrationStep2({ navigation, route }: Props) {

  // 🔹 Recibimos datos desde Step1
  const { nombre_completo, email, no_documento } = route.params;

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    role: "atleta" as "atleta" | "entrenador"
  });

  const handleComplete = async () => {
    if (!formData.password || formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden o están vacías.");
      return;
    }

    // 🔹 Unimos todos los datos en un JSON
    const finalData = {
      nombre_completo,
      email,
      no_documento,
      password: formData.password,
      role: formData.role
    };

    console.log(JSON.stringify(finalData, null, 2));

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
        console.error("❌ Error al registrar usuario:", error.message);
        Alert.alert("Error", error.message);
        return;
      }

      console.log("✅ Usuario creado correctamente:", data);
      Alert.alert("Éxito", "Usuario registrado con éxito.");

    } catch (err: any) {
      console.error("❌ Error inesperado:", err);
      Alert.alert("Error", "Ocurrió un error inesperado.");
    }

  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <SafeAreaView className="flex-row items-center px-4 py-2">
        <Pressable
          onPress={() => navigation.goBack()}
          className="p-2 rounded-full bg-gray-100 active:opacity-70"
        >
          <ArrowLeft size={22} color="#000" />
        </Pressable>

        <Text className="flex-1 text-center text-lg font-bold text-gray-800 -ml-8">
          Crear Cuenta — Paso 2
        </Text>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >

          {/* TITULO */}
          <View className="mt-4 mb-6">
            <Text className="text-2xl font-bold text-gray-900">Detalles Finales</Text>
            <Text className="text-gray-500 mt-1">
              Completa tu registro para acceder a la plataforma.
            </Text>
          </View>

          {/* PASSWORD */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-1">Contraseña</Text>
            <TextInput
              className="border rounded-xl px-4 h-12 bg-gray-50"
              secureTextEntry
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
            />
          </View>

          {/* CONFIRM PASSWORD */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-1">Confirmar Contraseña</Text>
            <TextInput
              className="border rounded-xl px-4 h-12 bg-gray-50"
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(text) =>
                setFormData({ ...formData, confirmPassword: text })
              }
            />
          </View>

          {/* ROLE SELECTOR */}
          <View className="mb-10">
            <Text className="text-gray-700 font-semibold mb-3">Tipo de Usuario</Text>

            {/* ATHLETE */}
            <Pressable
              onPress={() => setFormData({ ...formData, role: "atleta" })}
              className={`flex-row items-center p-4 rounded-2xl mb-3 border ${formData.role === "atleta"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 bg-white"
                }`}
            >
              <User size={28} color={formData.role === "atleta" ? "#2563eb" : "#444"} />
              <Text className="ml-3 text-lg font-semibold text-gray-800">
                Deportista
              </Text>
              {formData.role === "atleta" && (
                <CheckCircle2 size={22} color="#2563eb" className="ml-auto" />
              )}
            </Pressable>

            {/* COACH */}
            <Pressable
              onPress={() => setFormData({ ...formData, role: "entrenador" })}
              className={`flex-row items-center p-4 rounded-2xl border ${formData.role === "entrenador"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 bg-white"
                }`}
            >
              <Dumbbell size={28} color={formData.role === "entrenador" ? "#2563eb" : "#444"} />
              <Text className="ml-3 text-lg font-semibold text-gray-800">
                Entrenador
              </Text>
              {formData.role === "entrenador" && (
                <CheckCircle2 size={22} color="#2563eb" className="ml-auto" />
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* BOTÓN FINAL */}
      <View className="px-6 pb-8 pt-4">
        <Pressable
          onPress={handleComplete}
          className="w-full bg-blue-600 rounded-2xl h-14 justify-center items-center shadow-lg shadow-blue-600/25 active:opacity-90 active:scale-[0.98]"
        >
          <Text className="text-white text-lg font-bold tracking-wide">
            Completar Registro
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
