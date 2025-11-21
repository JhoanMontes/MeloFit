import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, Lock } from "lucide-react-native";
import { AuthStackParamList } from "../../navigation/types";
import { useAuth } from "../../context/AuthContext";

type Props = NativeStackScreenProps<AuthStackParamList, "RegistrationStep2">;

export default function RegistrationStep2({ navigation }: Props) {
  const { signIn } = useAuth(); // Hook para finalizar el registro y entrar
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    role: "athlete" as "athlete" | "coach" // Tipado estricto para el rol
  });

  const handleComplete = () => {
    // Validación simple (puedes mejorarla luego)
    if (!formData.password || formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden o están vacías.");
      return;
    }

    // LOGICA DE FINALIZACIÓN:
  
    if (formData.role === "coach") {
      signIn("entrenador");
    } else {
      signIn("aprendiz");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#F5F5F7]"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        
        {/* --- HEADER --- */}
        <View className="px-6 pt-12 pb-3">
          <Pressable 
            onPress={() => navigation.goBack()} // goBack es más seguro que navegar explícitamente atrás
            className="mb-4 w-10 h-10 justify-center items-start"
          >
            <ArrowLeft size={24} color="#111827" />
          </Pressable>
          <Text className="text-gray-900 mb-1 text-3xl font-bold">Crear Cuenta</Text>
          <Text className="text-gray-600 text-base">Paso 2 de 2 - Configuración de Cuenta</Text>
        </View>

        {/* --- MAIN CARD --- */}
        <View className="flex-1 px-6 pt-4">
          <View className="bg-white rounded-3xl shadow-sm p-6 space-y-6">
            
            {/* Icon Header */}
            <View className="flex items-center justify-center mb-2">
              <View className="bg-blue-600 p-4 rounded-2xl">
                <Lock size={32} color="white" />
              </View>
            </View>

            {/* Form Fields */}
            <View className="space-y-4">
              
              {/* Contraseña */}
              <View className="space-y-2">
                <Text className="text-gray-700 font-medium text-sm ml-1">Contraseña</Text>
                <TextInput
                  placeholder="••••••••"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  className="rounded-2xl h-12 border border-gray-200 bg-gray-50 px-4 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Confirmar Contraseña */}
              <View className="space-y-2">
                <Text className="text-gray-700 font-medium text-sm ml-1">Confirmar Contraseña</Text>
                <TextInput
                  placeholder="••••••••"
                  secureTextEntry
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  className="rounded-2xl h-12 border border-gray-200 bg-gray-50 px-4 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Custom Radio Group */}
              <View className="space-y-3 pt-2">
                <Text className="text-gray-900 font-medium ml-1">Soy un...</Text>
                
                {/* Opción Atleta */}
                <Pressable 
                  onPress={() => setFormData({ ...formData, role: "athlete" })}
                  className={`flex-row items-center space-x-3 p-4 rounded-2xl border ${
                    formData.role === "athlete" 
                      ? "bg-blue-50 border-blue-200" 
                      : "bg-gray-50 border-transparent"
                  }`}
                >
                  <View className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    formData.role === "athlete" ? "border-blue-600" : "border-gray-400"
                  }`}>
                    {formData.role === "athlete" && <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </View>
                  <Text className={`text-base ${formData.role === "athlete" ? "text-blue-900 font-medium" : "text-gray-600"}`}>
                    Atleta
                  </Text>
                </Pressable>

                {/* Opción Entrenador */}
                <Pressable 
                  onPress={() => setFormData({ ...formData, role: "coach" })}
                  className={`flex-row items-center space-x-3 p-4 rounded-2xl border ${
                    formData.role === "coach" 
                      ? "bg-blue-50 border-blue-200" 
                      : "bg-gray-50 border-transparent"
                  }`}
                >
                  <View className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    formData.role === "coach" ? "border-blue-600" : "border-gray-400"
                  }`}>
                    {formData.role === "coach" && <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </View>
                  <Text className={`text-base ${formData.role === "coach" ? "text-blue-900 font-medium" : "text-gray-600"}`}>
                    Entrenador
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Progress Bar (Completa) */}
            <View className="flex-row gap-2 pt-4">
              <View className="h-1.5 flex-1 bg-blue-600 rounded-full" />
              <View className="h-1.5 flex-1 bg-blue-600 rounded-full" />
            </View>
            
          </View>
        </View>

        {/* --- FOOTER BUTTON --- */}
        <View className="p-6 pb-10">
          <Pressable
            onPress={handleComplete}
            className="w-full bg-blue-600 rounded-2xl h-14 justify-center items-center shadow-lg active:bg-blue-700"
          >
            <Text className="text-white text-lg font-semibold">Completar Registro</Text>
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}