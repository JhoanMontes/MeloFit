import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "RegistrationStep1">;

export default function RegistrationStep1({ navigation }: Props) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    documentNumber: ""
  });

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* --- HEADER NAV --- */}
            <View className="px-6 pt-4 pb-2">
              <Pressable
                onPress={() => navigation.goBack()}
                className="w-12 h-12 rounded-full border border-slate-200 justify-center items-center bg-white shadow-sm active:bg-slate-50"
              >
                <ArrowLeft size={22} color="#334155" />
              </Pressable>
            </View>

            {/* --- TÍTULO Y PROGRESO --- */}
            <View className="px-6 mt-4 mb-8">
              <Text className="text-slate-900 text-3xl font-extrabold tracking-tight mb-2">
                Crear Cuenta
              </Text>
              <Text className="text-slate-500 text-base font-medium mb-6">
                Ingresa tus datos personales para comenzar.
              </Text>

              {/* Barra de Progreso Estilizada */}
              <View className="flex-row items-center gap-2">
                {/* Paso 1 (Activo) */}
                <View className="flex-1 h-2 bg-blue-600 rounded-full" />
                {/* Paso 2 (Inactivo) */}
                <View className="flex-1 h-2 bg-slate-100 rounded-full" />
              </View>
              <Text className="text-slate-400 text-xs font-bold mt-2 text-right">
                Paso 1 de 2
              </Text>
            </View>

            {/* --- FORMULARIO --- */}
            <View className="px-6 space-y-5">

              {/* Nombre Completo */}
              <View className="space-y-2">
                <Text className="text-slate-700 font-semibold text-sm ml-1">
                  Nombre Completo
                </Text>
                <View className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 justify-center focus:border-blue-500">
                  <TextInput
                    placeholder="Ej: Juan Pérez"
                    value={formData.fullName}
                    onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                    className="flex-1 text-slate-900 text-base"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              {/* Correo Electrónico */}
              <View className="space-y-2">
                <Text className="text-slate-700 font-semibold text-sm ml-1">
                  Correo Electrónico
                </Text>
                <View className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 justify-center focus:border-blue-500">
                  <TextInput
                    placeholder="juan@ejemplo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    className="flex-1 text-slate-900 text-base"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              {/* Número de Documento */}
              <View className="space-y-2">
                <Text className="text-slate-700 font-semibold text-sm ml-1">
                  Número de Documento
                </Text>
                <View className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 justify-center focus:border-blue-500">
                  <TextInput
                    placeholder="1234567890"
                    keyboardType="numeric"
                    value={formData.documentNumber}
                    onChangeText={(text) => setFormData({ ...formData, documentNumber: text })}
                    className="flex-1 text-slate-900 text-base"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

            </View>

            {/* Espaciador flexible para empujar el botón abajo si hay espacio */}
            <View className="flex-1 min-h-[40px]" />

            {/* --- FOOTER BUTTON --- */}
            <View className="px-6 pb-8 pt-4">
              <Pressable
                onPress={() =>
                  navigation.navigate("RegistrationStep2", {
                    nombre_completo: formData.fullName,
                    email: formData.email,
                    no_documento: formData.documentNumber
                  })
                }
                className="w-full bg-blue-600 rounded-2xl h-14 justify-center items-center shadow-lg shadow-blue-600/25 active:opacity-90 active:scale-[0.98]"
              >
                <Text className="text-white text-lg font-bold tracking-wide">
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