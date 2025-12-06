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
  StatusBar,
  ActivityIndicator
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  Clock,
  CheckCircle2
} from "lucide-react-native";
import { supabase } from "../../lib/supabase"; 
import { useAuth } from "../../context/AuthContext";
import { AprendizStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AprendizStackParamList, "LogResult">;

export default function LogResultScreen({ navigation, route }: Props) {
  // Recibimos los datos de la prueba desde la pantalla anterior
  const { assignmentId, testName } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [resultValue, setResultValue] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Fecha actual formateada
  const today = new Date();
  const dateString = today.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const handleSave = async () => {
    if (!resultValue.trim()) {
      Alert.alert("Faltan datos", "Por favor ingresa tu resultado.");
      return;
    }

    if (!user) return;

    setSaving(true);
    try {
      // 1. Obtener documento del atleta
      const { data: userData, error: userError } = await supabase
        .from('usuario')
        .select('no_documento')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      // 2. Insertar en 'resultado_prueba'
      const { error: insertError } = await supabase
        .from('resultado_prueba')
        .insert({
          prueba_asignada_id: assignmentId,
          atleta_no_documento: userData.no_documento,
          fecha_realizacion: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          valor: resultValue,
          // Si agregaste columna de notas/comentarios:
          // notas: notes 
        });

      if (insertError) throw insertError;

      Alert.alert("¡Excelente!", "Tu resultado ha sido registrado.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar el resultado.");
    } finally {
      setSaving(false);
    }
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
            <Text className="text-slate-500 text-base font-medium mt-1">Ingresa tu rendimiento</Text>
          </View>

          <ScrollView 
            className="flex-1 px-6 pt-4" 
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          >
            {/* --- INFO CARD --- */}
            <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 mb-6">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 mr-4">
                  <Text className="text-slate-900 text-xl font-bold mb-1">{testName}</Text>
                  <Text className="text-slate-500 text-sm font-medium">Nueva entrada</Text>
                </View>
                <View className="bg-blue-50 p-2.5 rounded-xl">
                  <Calendar size={22} color="#2563EB" />
                </View>
              </View>
              
              <View className="bg-slate-50 rounded-2xl p-4 flex-row items-center border border-slate-100 gap-2">
                <Clock size={16} color="#64748b" /> 
                <Text className="text-slate-600 text-sm font-medium">
                  <Text className="text-blue-600 font-bold">Hoy</Text> • {dateString}
                </Text>
              </View>
            </View>

            {/* --- INPUT FORM CARD --- */}
            <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 mb-6">
              <Text className="text-slate-900 font-bold text-lg mb-6">Tu Resultado</Text>

              {/* Input Principal */}
              <View className="mb-6">
                <Text className="text-slate-700 font-semibold text-sm ml-1 mb-2">Valor Obtenido</Text>
                <View className="bg-slate-50 border border-slate-200 rounded-2xl h-24 justify-center px-4 items-center shadow-inner">
                  <TextInput
                    placeholder="Ej: 10 Reps / 50 Kg / 12 min"
                    value={resultValue}
                    onChangeText={setResultValue}
                    placeholderTextColor="#cbd5e1"
                    style={{ 
                      fontSize: 24, 
                      fontWeight: '800', 
                      color: '#0f172a', 
                      textAlign: 'center', 
                      width: '100%' 
                    }}
                  />
                  <Text className="text-[10px] text-slate-400 font-bold absolute bottom-3">RESULTADO</Text>
                </View>
              </View>

              {/* Input Notas */}
              <View>
                <Text className="text-slate-700 font-semibold text-sm ml-1 mb-2">Notas (Opcional)</Text>
                <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 h-32">
                  <TextInput
                    placeholder="¿Cómo te sentiste? Alguna observación..."
                    value={notes}
                    onChangeText={setNotes}
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

            {/* --- TIP --- */}
            <View className="flex-row items-center justify-center space-x-2 opacity-60 mb-4">
                <CheckCircle2 size={16} color="#64748b" />
                <Text className="text-slate-500 text-xs font-medium">Asegúrate de ser honesto con tus datos.</Text>
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
            disabled={saving}
            className={`w-full h-14 rounded-2xl flex-row justify-center items-center shadow-lg active:scale-[0.98] gap-2 ${
                saving ? 'bg-blue-400' : 'bg-blue-600 shadow-blue-600/30'
            }`}
          >
            {saving ? (
                <ActivityIndicator color="white" />
            ) : (
                <>
                    <Save size={20} color="white" />
                    <Text className="text-white font-bold text-lg tracking-wide">Guardar Resultado</Text>
                </>
            )}
          </Pressable>
        </View>

      </SafeAreaView>
    </View>
  );
}