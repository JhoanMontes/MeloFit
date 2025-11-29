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

  // 🔹 Datos recibidos desde Step1
  let { nombre_completo, email, no_documento } = route.params;

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    role: "atleta" as "atleta" | "entrenador"
  });

  // 🔹 Función final de registro (viene de pantalla 2)
  const handleComplete = async () => {
    if (!formData.password || formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden o están vacías.");
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
        Alert.alert("Error", error.message);
        return;
      }

      console.log("✅ Usuario creado:", data);
      Alert.alert(
        "Registro Exitoso",
        "Serás enviado al inicio de sesión para que puedas acceder a tu cuenta",
        [
          { 
            text: "Ir al Login", 
            onPress: () => navigation.navigate('Login') 
          }
        ]
      );

    } catch (err: any) {
      console.error("❌ Error inesperado:", err);
      Alert.alert("Error", "Ocurrió un error inesperado.");
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

       <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* HEADER */}
            <View className="px-6 pt-4 pb-2">
              <Pressable
                onPress={() => navigation.goBack()}
                className="w-12 h-12 rounded-full border border-slate-200 justify-center items-center bg-white shadow-sm active:bg-slate-50"
              >
                <ArrowLeft size={22} color="#334155" />
              </Pressable>
            </View>

            {/* TÍTULO + PROGRESO */}
            <View className="px-6 mt-4 mb-8">
              <Text className="text-slate-900 text-3xl font-extrabold tracking-tight mb-2">
                Seguridad y Rol
              </Text>
              <Text className="text-slate-500 text-base font-medium mb-6">
                Define tu contraseña y tu tipo de usuario.
              </Text>

              <View className="flex-row items-center gap-2">
                <View className="flex-1 h-2 bg-blue-600 rounded-full" />
                <View className="flex-1 h-2 bg-blue-600 rounded-full" />
              </View>
              <Text className="text-blue-600 text-xs font-bold mt-2 text-right">
                Paso Final
              </Text>
            </View>

            {/* FORMULARIO */}
            <View className="px-6 space-y-6">

              {/* CONTRASEÑAS */}
              <View className="space-y-4">

                <View className="space-y-2">
                  <Text className="text-slate-700 font-semibold text-sm ml-1">
                    Contraseña
                  </Text>
                  <View className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 justify-center">
                    <TextInput
                      placeholder="••••••••"
                      secureTextEntry
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      className="flex-1 text-slate-900 text-base"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View className="space-y-2">
                  <Text className="text-slate-700 font-semibold text-sm ml-1">
                    Confirmar Contraseña
                  </Text>
                  <View className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 justify-center">
                    <TextInput
                      placeholder="••••••••"
                      secureTextEntry
                      value={formData.confirmPassword}
                      onChangeText={(text) =>
                        setFormData({ ...formData, confirmPassword: text })
                      }
                      className="flex-1 text-slate-900 text-base"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

              </View>

              {/* SEPARADOR */}
              <View className="h-[1px] bg-slate-100 my-2" />

              {/* SELECCIÓN DE ROL */}
              <View className="space-y-3">
                <Text className="text-slate-900 font-bold text-lg">
                  ¿Cuál es tu objetivo?
                </Text>

                {/* ATLETA */}
                <Pressable
                  onPress={() => setFormData({ ...formData, role: "atleta" })}
                  className={`flex-row items-center p-4 rounded-2xl border ${
                    formData.role === "atleta"
                      ? "bg-blue-50 border-blue-600 shadow-sm"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <View
                    className={`p-3 rounded-xl mr-4 ${
                      formData.role === "atleta" ? "bg-blue-200" : "bg-slate-100"
                    }`}
                  >
                    <User
                      size={24}
                      color={formData.role === "atleta" ? "#1d4ed8" : "#64748b"}
                    />
                  </View>

                  <View className="flex-1">
                    <Text
                      className={`text-base font-bold ${
                        formData.role === "atleta"
                          ? "text-blue-900"
                          : "text-slate-700"
                      }`}
                    >
                      Soy Deportista
                    </Text>
                    <Text className="text-slate-500 text-xs mt-0.5">
                      Quiero entrenar y ver mi progreso
                    </Text>
                  </View>

                  <View
                    className={`w-6 h-6 rounded-full border justify-center items-center ${
                      formData.role === "atleta"
                        ? "bg-blue-600 border-blue-600"
                        : "border-slate-300"
                    }`}
                  >
                    {formData.role === "atleta" && (
                      <CheckCircle2 size={14} color="white" />
                    )}
                  </View>
                </Pressable>

                {/* ENTRENADOR */}
                <Pressable
                  onPress={() => setFormData({ ...formData, role: "entrenador" })}
                  className={`flex-row items-center p-4 rounded-2xl border ${
                    formData.role === "entrenador"
                      ? "bg-blue-50 border-blue-600 shadow-sm"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <View
                    className={`p-3 rounded-xl mr-4 ${
                      formData.role === "entrenador"
                        ? "bg-blue-200"
                        : "bg-slate-100"
                    }`}
                  >
                    <Dumbbell
                      size={24}
                      color={formData.role === "entrenador" ? "#1d4ed8" : "#64748b"}
                    />
                  </View>

                  <View className="flex-1">
                    <Text
                      className={`text-base font-bold ${
                        formData.role === "entrenador"
                          ? "text-blue-900"
                          : "text-slate-700"
                      }`}
                    >
                      Soy Entrenador
                    </Text>
                    <Text className="text-slate-500 text-xs mt-0.5">
                      Gestionar atletas y rutinas
                    </Text>
                  </View>

                  <View
                    className={`w-6 h-6 rounded-full border justify-center items-center ${
                      formData.role === "entrenador"
                        ? "bg-blue-600 border-blue-600"
                        : "border-slate-300"
                    }`}
                  >
                    {formData.role === "entrenador" && (
                      <CheckCircle2 size={14} color="white" />
                    )}
                  </View>
                </Pressable>
              </View>

            </View>

            <View className="flex-1 min-h-[40px]" />

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

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
