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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  Ruler, 
  Clock 
} from "lucide-react-native";
import { AprendizStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AprendizStackParamList, "LogResult">;

export default function LogResultScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    value1: '', 
    value2: '', 
    notes: ''
  });

  const handleSave = () => {
    if (!formData.value1 && !formData.value2) {
      Alert.alert("Faltan datos", "Por favor ingresa al menos un valor.");
      return;
    }
    Alert.alert("¡Excelente!", "Resultado registrado.", [
      { text: "OK", onPress: () => navigation.navigate("Dashboard") }
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
          {/* --- HEADER --- */}
          <View className="px-6 pt-4 pb-2">
            <Pressable 
              onPress={() => navigation.goBack()} 
              className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-200 mb-6 active:bg-slate-50"
            >
              <ArrowLeft size={22} color="#334155" />
            </Pressable>
            <Text className="text-slate-900 text-3xl font-extrabold tracking-tight">Registrar Resultado</Text>
            <Text className="text-slate-500 text-base font-medium mt-1">Ingresa tu rendimiento en la prueba</Text>
          </View>

          <ScrollView 
            className="flex-1 px-6 pt-4" 
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          >
            {/* --- INFO CARD --- */}
            <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 mb-6">
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-slate-900 text-xl font-bold mb-1">Test de Cooper</Text>
                  <Text className="text-slate-500 text-sm font-medium">Prueba de Resistencia</Text>
                </View>
                <View className="bg-blue-50 p-2.5 rounded-xl">
                  <Calendar size={22} color="#2563EB" />
                </View>
              </View>
              
              <View className="bg-slate-50 rounded-2xl p-4 flex-row items-center border border-slate-100 gap-2">
                <Clock size={16} color="#64748b" /> 
                <Text className="text-slate-600 text-sm font-medium">
                  <Text className="text-blue-600 font-bold">Hoy</Text> • 9 de Octubre, 2025
                </Text>
              </View>
            </View>

            {/* --- INPUT FORM CARD --- */}
            <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 mb-6">
              <Text className="text-slate-900 font-bold text-lg mb-6">Tus Resultados</Text>

              {/* Fila de Inputs Principales */}
              <View className="flex-row justify-between mb-6">
                
                {/* Input 1: Distancia */}
                <View className="w-[48%]">
                  <Text className="text-slate-700 font-semibold text-sm ml-1 mb-2">Distancia</Text>
                  <View className="bg-slate-50 border border-slate-200 rounded-2xl h-20 justify-center px-4 items-center shadow-inner">
                    {/* CORRECCIÓN: Usamos style nativo para evitar error en TextInput */}
                    <TextInput
                      placeholder="0"
                      keyboardType="numeric"
                      value={formData.value1}
                      onChangeText={(text) => setFormData({ ...formData, value1: text })}
                      placeholderTextColor="#cbd5e1"
                      style={{ 
                        fontSize: 30, 
                        fontWeight: '800', 
                        color: '#0f172a', 
                        textAlign: 'center', 
                        width: '100%' 
                      }}
                    />
                    <Text className="text-[10px] text-slate-400 font-bold absolute bottom-2">METROS</Text>
                  </View>
                </View>

                {/* Input 2: Tiempo */}
                <View className="w-[48%]">
                  <Text className="text-slate-700 font-semibold text-sm ml-1 mb-2">Tiempo</Text>
                  <View className="bg-slate-50 border border-slate-200 rounded-2xl h-20 justify-center px-4 items-center shadow-inner">
                    {/* CORRECCIÓN: Usamos style nativo */}
                    <TextInput
                      placeholder="0"
                      keyboardType="numeric"
                      value={formData.value2}
                      onChangeText={(text) => setFormData({ ...formData, value2: text })}
                      placeholderTextColor="#cbd5e1"
                      style={{ 
                        fontSize: 30, 
                        fontWeight: '800', 
                        color: '#0f172a', 
                        textAlign: 'center', 
                        width: '100%' 
                      }}
                    />
                    <Text className="text-[10px] text-slate-400 font-bold absolute bottom-2">MINUTOS</Text>
                  </View>
                </View>
              </View>

              {/* Input 3: Notas */}
              <View>
                <Text className="text-slate-700 font-semibold text-sm ml-1 mb-2">Notas (Opcional)</Text>
                <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 h-32">
                  {/* CORRECCIÓN: Usamos style nativo */}
                  <TextInput
                    placeholder="¿Cómo te sentiste? Alguna observación..."
                    value={formData.notes}
                    onChangeText={(text) => setFormData({ ...formData, notes: text })}
                    multiline
                    textAlignVertical="top"
                    placeholderTextColor="#94a3b8"
                    style={{ 
                      fontSize: 16, 
                      color: '#0f172a', 
                      height: '100%',
                      lineHeight: 24 
                    }}
                  />
                </View>
              </View>
            </View>

            {/* --- SUGERENCIAS RÁPIDAS --- */}
            <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 mb-6">
              <View className="flex-row items-center mb-4 space-x-2">
                 <Ruler size={18} color="#64748b" />
                 <Text className="text-slate-500 text-sm font-bold uppercase tracking-wide">Relleno Rápido</Text>
              </View>
              
              <View className="flex-row flex-wrap mb-3">
                {['2400', '2600', '2800', '3000'].map((val) => (
                  <Pressable
                    key={val}
                    onPress={() => setFormData({ ...formData, value1: val })}
                    className="px-4 py-2 bg-blue-50 rounded-xl active:bg-blue-100 mr-2 mb-2 border border-blue-100"
                  >
                    <Text className="text-blue-700 text-xs font-bold">{val} m</Text>
                  </Pressable>
                ))}
              </View>

              <View className="flex-row flex-wrap">
                {['10', '11', '12', '13'].map((val) => (
                  <Pressable
                    key={val}
                    onPress={() => setFormData({ ...formData, value2: val })}
                    className="px-4 py-2 bg-slate-100 rounded-xl active:bg-slate-200 mr-2 mb-2 border border-slate-200"
                  >
                    <Text className="text-slate-600 text-xs font-bold">{val} min</Text>
                  </Pressable>
                ))}
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* --- BOTTOM ACTION BUTTON --- */}
        <View 
          className="absolute bottom-0 w-full bg-white border-t border-slate-100 px-6 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <Pressable
            onPress={handleSave}
            className="w-full bg-blue-600 rounded-2xl h-14 flex-row justify-center items-center shadow-lg shadow-blue-600/30 active:scale-[0.98] active:opacity-90 gap-2"
          >
            <Save size={20} color="white" />
            <Text className="text-white font-bold text-lg tracking-wide">Guardar Resultado</Text>
          </Pressable>
        </View>

      </SafeAreaView>
    </View>
  );
}