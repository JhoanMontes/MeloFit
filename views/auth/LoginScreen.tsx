// views/auth/LoginScreen.tsx
import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  StatusBar, 
  Alert,
  KeyboardAvoidingView, 
  Platform,
  ScrollView 

} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // 
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, Dumbbell, Check } from "lucide-react-native";
import { AuthStackParamList } from "../../navigation/types";
import { useAuth } from "../../context/AuthContext";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isCoach, setIsCoach] = useState(false);

 const handleLogin = () => {
   
    // if (!formData.email.trim() || !formData.password.trim()) {
    //   Alert.alert("Campos Incompletos", "Por favor ingresa tu correo y contraseña.");
    //   return; 
    // }

  
    if (isCoach) {
      signIn('entrenador');
    } else {
      signIn('aprendiz');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
       {/* USO CON STYLE NATIVO PARA EVITAR ERRORES VISUALES */}
       <SafeAreaView style={{ flex: 1 }}>
        
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

            {/* --- TEXTO DE BIENVENIDA --- */}
            <View className="px-6 mt-6 mb-8">
              <Text className="text-slate-900 text-3xl font-extrabold tracking-tight mb-2">
                Bienvenido de Nuevo
              </Text>
              <Text className="text-slate-500 text-base font-medium">
                Inicia sesión para continuar tu progreso y alcanzar tus metas.
              </Text>
            </View>

            {/* --- FORMULARIO --- */}
            <View className="px-6 space-y-5">
              
              {/* Email Input */}
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

              {/* Password Input */}
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
                <Pressable className="items-end pt-1">
                  <Text className="text-blue-600 text-sm font-bold">
                    ¿Olvidaste tu contraseña?
                  </Text>
                </Pressable>
              </View>

              {/* Coach Selector */}
              <Pressable 
                onPress={() => setIsCoach(!isCoach)}
                className={`flex-row items-center mt-4 p-4 rounded-2xl border transition-colors ${
                  isCoach ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200"
                }`}
              >
                <View 
                  className={`w-6 h-6 rounded-lg border justify-center items-center mr-3 ${
                    isCoach ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
                  }`}
                >
                  {isCoach && <Check size={14} color="white" strokeWidth={4} />}
                </View>
                <View className="flex-1">
                  <Text className={`text-sm font-bold ${isCoach ? "text-blue-800" : "text-slate-700"}`}>
                    Modo Entrenador
                  </Text>
                  <Text className="text-slate-500 text-xs">
                    Accede a herramientas de gestión
                  </Text>
                </View>
                {isCoach && <Dumbbell size={20} color="#2563eb" />}
              </Pressable>

            </View>

            {/* --- ESPACIADOR FLEXIBLE --- */}
            <View className="flex-1 min-h-[40px]" />

            {/* --- FOOTER ACTIONS --- */}
            <View className="px-6 pb-8 pt-4">
              <Pressable
                onPress={handleLogin}
                className="w-full bg-blue-600 rounded-2xl h-14 justify-center items-center shadow-lg shadow-blue-600/25 active:opacity-90 active:scale-[0.98]"
              >
                <Text className="text-white text-lg font-bold tracking-wide">
                  Iniciar Sesión
                </Text>
              </Pressable>

              <View className="flex-row justify-center items-center mt-6 space-x-1">
                <Text className="text-slate-500 font-medium">¿No tienes una cuenta?</Text>
                <Pressable onPress={() => navigation.navigate("RegistrationStep1")}>
                  <Text className="text-blue-600 font-bold ml-1 p-1">
                    Regístrate
                  </Text>
                </Pressable>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}