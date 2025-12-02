import React, { useState } from "react";
import { 
  View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, CheckCircle2, User, Dumbbell } from "lucide-react-native";
import { AuthStackParamList } from "../../navigation/types";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import CustomAlert, { AlertType } from "../../components/CustomAlert"; // <--- IMPORTAR

type Props = NativeStackScreenProps<AuthStackParamList, "RegistrationStep2">;

export default function RegistrationStep2({ navigation, route }: Props) {
  const { signIn } = useAuth(); // Ahora signIn SÍ EXISTE en el contexto :)
  let { nombre_completo, email, no_documento } = route.params;

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    role: "atleta" as "atleta" | "entrenador"
  });

  // ESTADO DEL MODAL
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

  const handleComplete = async () => {
    if (!formData.password || formData.password !== formData.confirmPassword) {
      setAlert({ visible: true, title: "Error", message: "Las contraseñas no coinciden.", type: "warning", action: null });
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            nombre_completo,
            no_documento,
            role: formData.role // 'atleta' o 'entrenador'
          }
        }
      });

      if (error) {
        setAlert({ visible: true, title: "Error de Registro", message: error.message, type: "error", action: null });
        return;
      }

      // ÉXITO: Navegamos manualmente usando signIn del contexto
      setAlert({
        visible: true,
        title: "¡Cuenta Creada!",
        message: "Tu registro fue exitoso. Bienvenido a LOCOOM.",
        type: "success",
        action: () => {
          // Convertimos 'atleta' a 'aprendiz' si es necesario para el Contexto
          if (formData.role === 'entrenador') {
            signIn('entrenador');
          } else {
            signIn('aprendiz');
          }
        }
      });

    } catch (err: any) {
      setAlert({ visible: true, title: "Error", message: "Ocurrió un error inesperado.", type: "error", action: null });
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <CustomAlert 
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={closeAlert}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            
            <View className="px-6 pt-4">
               <Pressable onPress={() => navigation.goBack()} className="p-2 bg-gray-100 rounded-full w-10 h-10 items-center justify-center">
                  <ArrowLeft size={20} color="black" />
               </Pressable>
            </View>

            <View className="px-6 mt-6 mb-6">
              <Text className="text-3xl font-bold text-slate-900">Seguridad y Rol</Text>
              <Text className="text-slate-500 text-base mt-2">Último paso para crear tu cuenta.</Text>
            </View>

            <View className="px-6 space-y-4">
              <View>
                  <Text className="mb-2 font-bold text-slate-700">Contraseña</Text>
                  <TextInput 
                      secureTextEntry
                      className="bg-slate-50 p-4 rounded-2xl border border-slate-200"
                      placeholder="••••••••"
                      value={formData.password}
                      onChangeText={(t) => setFormData({...formData, password: t})}
                  />
              </View>
              <View>
                  <Text className="mb-2 font-bold text-slate-700">Confirmar Contraseña</Text>
                  <TextInput 
                      secureTextEntry
                      className="bg-slate-50 p-4 rounded-2xl border border-slate-200"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChangeText={(t) => setFormData({...formData, confirmPassword: t})}
                  />
              </View>

              <Text className="text-lg font-bold mt-4">Soy...</Text>
              
              <Pressable 
                  onPress={() => setFormData({...formData, role: 'atleta'})}
                  className={`flex-row items-center p-4 rounded-2xl border ${formData.role === 'atleta' ? 'bg-blue-50 border-blue-600' : 'bg-white border-slate-200'}`}
              >
                  <User size={24} color={formData.role === 'atleta' ? '#2563EB' : '#64748b'} />
                  <Text className={`ml-3 text-lg flex-1 ${formData.role === 'atleta' ? 'font-bold text-blue-800' : 'text-slate-600'}`}>Deportista</Text>
                  {formData.role === 'atleta' && <CheckCircle2 size={20} color="#2563EB" />}
              </Pressable>

              <Pressable 
                  onPress={() => setFormData({...formData, role: 'entrenador'})}
                  className={`flex-row items-center p-4 rounded-2xl border ${formData.role === 'entrenador' ? 'bg-blue-50 border-blue-600' : 'bg-white border-slate-200'}`}
              >
                  <Dumbbell size={24} color={formData.role === 'entrenador' ? '#2563EB' : '#64748b'} />
                  <Text className={`ml-3 text-lg flex-1 ${formData.role === 'entrenador' ? 'font-bold text-blue-800' : 'text-slate-600'}`}>Entrenador</Text>
                  {formData.role === 'entrenador' && <CheckCircle2 size={20} color="#2563EB" />}
              </Pressable>
            </View>

            <View className="flex-1" />

            <View className="px-6 py-6 pb-10">
              <Pressable onPress={handleComplete} className="bg-blue-600 h-14 rounded-2xl items-center justify-center shadow-lg active:opacity-90">
                  <Text className="text-white font-bold text-lg">Completar Registro</Text>
              </Pressable>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}