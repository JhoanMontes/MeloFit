import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  StatusBar 
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
  ArrowLeft, 
  Save, 
  Info, 
  User, 
  Lock, 
  Ruler, 
  Weight, 
  Calendar 
} from "lucide-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AprendizStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AprendizStackParamList, "Profile">;

export default function MyProfile({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    name: 'Alex Johnson',
    documentNumber: '12345678A',
    height: '175',
    weight: '72',
    birthDate: '1995-03-15'
  });

  const handleSave = () => {
    console.log('Guardando perfil:', formData);
    Alert.alert("Perfil Actualizado", "Tus datos han sido guardados correctamente.", [
      { text: "Entendido", onPress: () => navigation.goBack() } 
    ]);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView 
            contentContainerStyle={{ paddingBottom: 150 }}
            showsVerticalScrollIndicator={false}
          >

            {/* HEADER NAV */}
            <View className="px-6 pt-4 pb-2">
              <Pressable
                onPress={() => navigation.goBack()}
                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-200 active:bg-slate-50"
              >
                <ArrowLeft size={22} color="#334155" />
              </Pressable>
            </View>

            {/* HERO SECTION (AVATAR) */}
            <View className="items-center mt-4 mb-8 px-6">
              <View className="w-28 h-28 bg-blue-100 rounded-full items-center justify-center mb-5 border-[6px] border-white shadow-sm">
                <User size={56} color="#2563EB" />
                <View className="absolute bottom-0 right-0 bg-blue-600 p-2.5 rounded-full border-4 border-white">
                  <User size={14} color="white" />
                </View>
              </View>

              <Text className="text-slate-900 text-3xl font-extrabold tracking-tight">Mi Perfil</Text>
              <Text className="text-slate-500 text-base font-medium mt-1">
                Actualiza tu información personal
              </Text>
            </View>

            {/* CONTENEDOR PRINCIPAL - Usamos 'gap-6' para separar las tarjetas verticalmente */}
            <View className="px-6 gap-y-8">

              {/* --- CARD IDENTIDAD --- */}
              <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 gap-y-6">
                
                {/* Título de Tarjeta */}
                <View className="flex-row items-center justify-between pb-2 border-b border-slate-50">
                  <View className="flex-row items-center gap-x-3">
                    <View className="bg-slate-50 p-2 rounded-xl">
                      <User size={20} color="#64748b" />
                    </View>
                    <Text className="text-slate-900 font-bold text-lg">Identidad</Text>
                  </View>
                  <View className="bg-slate-100 px-3 py-1.5 rounded-lg flex-row items-center gap-x-1.5">
                    <Lock size={12} color="#94a3b8" />
                    <Text className="text-[10px] text-slate-500 font-bold uppercase">Protegido</Text>
                  </View>
                </View>

                {/* Inputs Identidad */}
                <View className="gap-y-5">
                  <View className="gap-y-2">
                    <Text className="text-slate-700 font-semibold text-sm ml-1">Nombre Completo</Text>
                    <View className="bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14 justify-center">
                      <TextInput
                        value={formData.name}
                        editable={false}
                        className="text-slate-500 font-medium text-base"
                      />
                    </View>
                  </View>

                  <View className="gap-y-2">
                    <Text className="text-slate-700 font-semibold text-sm ml-1">Número de Documento</Text>
                    <View className="bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14 justify-center">
                      <TextInput
                        value={formData.documentNumber}
                        editable={false}
                        className="text-slate-500 font-medium text-base"
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* --- CARD DATOS FÍSICOS --- */}
              <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 gap-y-6">
                
                {/* Título */}
                <View className="pb-2 border-b border-slate-50">
                  <Text className="text-slate-900 font-bold text-lg">Datos Físicos</Text>
                  <Text className="text-xs text-slate-400 font-medium mt-1">
                    Información necesaria para tus métricas
                  </Text>
                </View>

                {/* FILA DE ALTURA Y PESO - AQUÍ ESTÁ EL CAMBIO CLAVE (gap-x-4) */}
                <View className="flex-row gap-x-4">
                  
                  {/* Columna Altura */}
                  <View className="flex-1 gap-y-2">
                    <Text className="text-slate-700 font-semibold text-sm ml-1">Altura</Text>
                    <View className="bg-white border border-slate-200 rounded-2xl px-4 h-16 flex-row items-center focus:border-blue-500 shadow-sm shadow-slate-200/50">
                      <Ruler size={20} color="#94a3b8" className="mr-3" />
                      <TextInput
                        value={formData.height}
                        onChangeText={(text) => setFormData({ ...formData, height: text })}
                        keyboardType="numeric"
                        placeholder="0"
                        className="flex-1 text-slate-900 font-bold text-lg"
                      />
                      <Text className="text-slate-400 text-xs font-bold bg-slate-100 px-2 py-1 rounded">CM</Text>
                    </View>
                  </View>

                  {/* Columna Peso */}
                  <View className="flex-1 gap-y-2">
                    <Text className="text-slate-700 font-semibold text-sm ml-1">Peso</Text>
                    <View className="bg-white border border-slate-200 rounded-2xl px-4 h-16 flex-row items-center focus:border-blue-500 shadow-sm shadow-slate-200/50">
                      <Weight size={20} color="#94a3b8" className="mr-3" />
                      <TextInput
                        value={formData.weight}
                        onChangeText={(text) => setFormData({ ...formData, weight: text })}
                        keyboardType="numeric"
                        placeholder="0"
                        className="flex-1 text-slate-900 font-bold text-lg"
                      />
                      <Text className="text-slate-400 text-xs font-bold bg-slate-100 px-2 py-1 rounded">KG</Text>
                    </View>
                  </View>

                </View>

                {/* Fecha */}
                <View className="gap-y-2">
                  <Text className="text-slate-700 font-semibold text-sm ml-1">Fecha de Nacimiento</Text>
                  <View className="bg-white border border-slate-200 rounded-2xl px-4 h-14 flex-row items-center focus:border-blue-500 shadow-sm shadow-slate-200/50">
                    <Calendar size={20} color="#94a3b8" className="mr-3" />
                    <TextInput
                      value={formData.birthDate}
                      onChangeText={(text) => setFormData({ ...formData, birthDate: text })}
                      placeholder="YYYY-MM-DD"
                      className="flex-1 text-slate-900 font-medium text-base"
                      placeholderTextColor="#cbd5e1"
                    />
                  </View>
                </View>

              </View>

              {/* CARD INFO EXTRA */}
              <View className="bg-blue-50/80 border border-blue-100 rounded-2xl p-5 flex-row items-start gap-x-3 mb-4">
                <Info size={22} color="#2563EB" style={{ marginTop: 2 }} />
                <Text className="text-blue-900 text-xs leading-5 font-medium flex-1">
                  Mantener tus datos actualizados nos ayuda a calcular tu IMC y personalizar tus cargas de entrenamiento con mayor precisión.
                </Text>
              </View>

            </View>
          </ScrollView>

          {/* BOTÓN FIJO FLOTANTE */}
          <View 
            className="absolute bottom-0 w-full bg-white border-t border-slate-100 px-6 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          >
            <Pressable
              onPress={handleSave}
              className="w-full bg-blue-600 rounded-2xl h-14 flex-row justify-center items-center shadow-lg shadow-blue-600/30 active:scale-[0.98] active:opacity-90"
            >
              <Save size={20} color="white" className="mr-2" />
              <Text className="text-white font-bold text-lg tracking-wide">Guardar Cambios</Text>
            </Pressable>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}