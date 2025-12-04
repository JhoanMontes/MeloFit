import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  ActivityIndicator // Importamos ActivityIndicator para feedback visual
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
  ArrowLeft,
  Activity,
  ChevronDown,
  Scale,
  Plus,
  Trash2,
  Save,
  Check
} from "lucide-react-native";
import { EntrenadorStackParamList } from "../../navigation/types";

// IMPORTACIONES DE SUPABASE Y AUTH
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "AdminCreateTest">;

interface PerformanceRange {
  id: number;
  label: string;
  minValue: string;
  maxValue: string;
}

export default function AdminCreateTest({ navigation }: Props) {
  const { user } = useAuth(); // Obtenemos el usuario autenticado
  const [loading, setLoading] = useState(false); // Estado de carga

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    metricType: ''
  });

  const [ranges, setRanges] = useState<PerformanceRange[]>([
    { id: 1, label: '', minValue: '', maxValue: '' }
  ]);

  const [showMetricModal, setShowMetricModal] = useState(false);

  // Iconos Lucide
  const metricOptions = [
    { label: "Distancia (metros)", value: "distance" },
    { label: "Tiempo (minutos)", value: "time_min" }, // Ajusté values para ser más consistentes
    { label: "Tiempo (segundos)", value: "time_sec" },
    { label: "Peso (kg) / Reps", value: "weight_reps" },
    { label: "Repeticiones", value: "repetitions" },
    { label: "Personalizado", value: "custom" },
  ];

  const addRange = () => {
    const newId = ranges.length > 0 ? Math.max(...ranges.map(r => r.id)) + 1 : 1;
    setRanges([...ranges, { id: newId, label: '', minValue: '', maxValue: '' }]);
  };

  const removeRange = (id: number) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter(r => r.id !== id));
    } else {
      Alert.alert("Mínimo requerido", "Debes mantener al menos un rango de evaluación.");
    }
  };

  const updateRange = (id: number, field: keyof PerformanceRange, value: string) => {
    setRanges(ranges.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // --- LÓGICA DE GUARDADO EN SUPABASE ---
  const handleSave = async () => {
    // 1. Validaciones Básicas
    if (!formData.name.trim() || !formData.metricType) {
      Alert.alert("Campos incompletos", "Por favor asigna un nombre y un tipo de métrica a la prueba.");
      return;
    }

    const rangesIncomplete = ranges.some(r => !r.label.trim() || !r.minValue.trim() || !r.maxValue.trim());
    if (rangesIncomplete) {
      Alert.alert("Niveles incompletos", "Asegúrate de llenar nombre, mínimo y máximo en todos los niveles.");
      return;
    }

    try {
      setLoading(true);
      console.log("📱 Intentando guardar desde móvil...");

      // 3. Obtener el ID del Entrenador
      const { data: trainerData, error: trainerError } = await supabase
        .from('usuario')
        .select('no_documento')
        .eq('auth_id', user.id)
        .single();

      if (trainerError || !trainerData) {
          console.error("Error Entrenador:", trainerError);
          throw new Error("No se encontró el perfil del entrenador.");
      }

      // 4. Formatear los Niveles (CORRECCIÓN IMPORTANTE)
      // Aseguramos que los números sean válidos y acepten comas del teclado móvil
      const nivelesParaGuardar = ranges.map(r => {
        // Reemplazamos coma por punto por si acaso el teclado móvil usó comas
        const minStr = r.minValue.replace(',', '.');
        const maxStr = r.maxValue.replace(',', '.');
        
        return {
            nombre: r.label,
            min: parseFloat(minStr) || 0, // Fallback a 0 si falla
            max: parseFloat(maxStr) || 0
        };
      });

      console.log("📦 Payload a enviar:", { 
          nombre: formData.name, 
          fecha: new Date().toISOString(),
          niveles: nivelesParaGuardar 
      });

      // 5. Insertar en la tabla 'prueba'
      const { data, error: insertError } = await supabase
        .from('prueba')
        .insert({
          nombre: formData.name.trim(),
          descripcion: formData.description.trim(),
          tipo_metrica: formData.metricType,
          niveles: nivelesParaGuardar,
          entrenador_no_documento: trainerData.no_documento,
          // CORRECCIÓN CLAVE: Usar toISOString() para que el móvil no envíe un objeto Date raro
          fecha_registro: new Date().toISOString() 
        })
        .select(); // Obligamos a devolver el dato creado

      if (insertError) {
          console.error("❌ Error Supabase:", insertError);
          throw insertError;
      }

      // 6. Validación de éxito real
      // Si data está vacío, la base de datos rechazó la inserción silenciosamente
      if (!data || data.length === 0) {
          console.error("⚠️ Alerta: Supabase devolvió éxito pero sin datos.");
          throw new Error("La operación no devolvió datos. Verifica permisos RLS.");
      }

      console.log("✅ Guardado exitoso:", data);

      // 7. Éxito
      Alert.alert("¡Éxito!", "La prueba ha sido creada correctamente.", [
        { text: "Entendido", onPress: () => navigation.goBack() }
      ]);

    } catch (error: any) {
      console.error("💥 Error en handleSave:", error);
      Alert.alert("Error", error.message || "No se pudo guardar la prueba. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = () => {
    const option = metricOptions.find(o => o.value === formData.metricType);
    return option ? option.label : "Seleccionar métrica";
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* LOADING OVERLAY (Opcional, para bloquear la UI mientras guarda) */}
      {loading && (
        <View className="absolute inset-0 bg-black/20 z-50 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* HEADER */}
          <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center mb-4">
              <Pressable
                onPress={() => navigation.goBack()}
                className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-slate-200 mr-4 active:bg-slate-100"
              >
                <ArrowLeft size={20} color="#334155" />
              </Pressable>
              <View>
                <Text className="text-slate-900 text-2xl font-extrabold tracking-tight">Nueva Prueba</Text>
                <Text className="text-slate-500 text-sm font-medium">Configura los parámetros</Text>
              </View>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24 }}
            showsVerticalScrollIndicator={false}
          >

            {/* SECCIÓN 1: Info Básica */}
            <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 mb-6 space-y-5">
              <View className="flex-row items-center space-x-2 mb-1">
                <Activity size={20} color="#2563EB" />
                <Text className="text-slate-900 font-bold text-lg">Información Básica</Text>
              </View>

              {/* Nombre */}
              <View className="space-y-2">
                <Text className="text-slate-700 font-semibold text-sm ml-1">Nombre de la Prueba</Text>
                <View className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 justify-center">
                  <TextInput
                    placeholder="Ej. Test de Cooper"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    style={styles.inputSafe}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              {/* Instrucciones */}
              <View className="space-y-2">
                <Text className="text-slate-700 font-semibold text-sm ml-1">Instrucciones</Text>
                <View className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[120px]">
                  <TextInput
                    placeholder="Describe cómo realizar la prueba..."
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    multiline
                    textAlignVertical="top"
                    style={[styles.inputSafe, { height: '100%', textAlignVertical: 'top' }]}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              {/* Métrica */}
              <View className="space-y-2">
                <Text className="text-slate-700 font-semibold text-sm ml-1">Métrica Principal</Text>
                <Pressable
                  onPress={() => setShowMetricModal(true)}
                  className={`w-full h-14 bg-slate-50 border rounded-2xl px-4 flex-row items-center justify-between active:bg-slate-100 ${formData.metricType ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200'
                    }`}
                >
                  <Text className={`text-base font-medium ${formData.metricType ? 'text-blue-700' : 'text-slate-400'}`}>
                    {getMetricLabel()}
                  </Text>
                  <ChevronDown size={20} color={formData.metricType ? "#2563EB" : "#94a3b8"} />
                </Pressable>
              </View>
            </View>

            {/* SECCIÓN 2: Niveles */}
            <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center space-x-2">
                  <Scale size={20} color="#2563EB" />
                  <Text className="text-slate-900 font-bold text-lg">Niveles</Text>
                </View>
                <Pressable
                  onPress={addRange}
                  className="flex-row items-center bg-blue-50 px-3 py-2 rounded-xl active:bg-blue-100"
                >
                  <Plus size={16} color="#2563EB" style={{ marginRight: 4 }} />
                  <Text className="text-blue-700 font-bold text-xs">Añadir</Text>
                </Pressable>
              </View>

              {ranges.map((range, index) => (
                <View key={range.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 relative">
                  {ranges.length > 1 && (
                    <Pressable
                      onPress={() => removeRange(range.id)}
                      className="absolute top-3 right-3 p-1.5 bg-white rounded-lg border border-slate-100 shadow-sm active:bg-red-50 z-10"
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </Pressable>
                  )}

                  <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Nivel {index + 1}
                  </Text>

                  <View className="space-y-3">
                    {/* Nombre Nivel */}
                    <TextInput
                      placeholder="Nombre del Nivel (Ej. Experto)"
                      value={range.label}
                      onChangeText={(text) => updateRange(range.id, 'label', text)}
                      style={[styles.inputSafe, styles.inputBorder]}
                      placeholderTextColor="#94a3b8"
                    />

                    {/* Min - Max */}
                    <View className="flex-row space-x-3">
                      <View className="flex-1 space-y-1">
                        <Text className="text-slate-400 text-[10px] font-bold ml-1">MÍNIMO</Text>
                        <TextInput
                          placeholder="0"
                          keyboardType="numeric"
                          value={range.minValue}
                          onChangeText={(text) => updateRange(range.id, 'minValue', text)}
                          style={[styles.inputSafe, styles.inputBorder, { textAlign: 'center' }]}
                          placeholderTextColor="#cbd5e1"
                        />
                      </View>

                      <View className="justify-end pb-3">
                        <Text className="text-slate-300">-</Text>
                      </View>

                      <View className="flex-1 space-y-1">
                        <Text className="text-slate-400 text-[10px] font-bold ml-1">MÁXIMO</Text>
                        <TextInput
                          placeholder="100"
                          keyboardType="numeric"
                          value={range.maxValue}
                          onChangeText={(text) => updateRange(range.id, 'maxValue', text)}
                          style={[styles.inputSafe, styles.inputBorder, { textAlign: 'center' }]}
                          placeholderTextColor="#cbd5e1"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

          </ScrollView>

          {/* FOOTER */}
          <View className="absolute bottom-0 w-full bg-white border-t border-slate-100 px-6 py-6 pb-8 shadow-2xl">
            <View className="flex-row gap-4">
              <Pressable
                onPress={() => navigation.goBack()}
                disabled={loading} // Deshabilitar si carga
                className="flex-1 h-14 rounded-2xl justify-center items-center border border-slate-200 active:bg-slate-50"
              >
                <Text className="text-slate-600 font-bold text-base">Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={loading} // Deshabilitar si carga
                className={`flex-1 bg-blue-600 h-14 rounded-2xl justify-center items-center flex-row shadow-lg shadow-blue-600/30 active:scale-[0.98] ${loading ? 'opacity-70' : ''
                  }`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Save size={20} color="white" style={{ marginRight: 8 }} />
                    <Text className="text-white font-bold text-base tracking-wide">Guardar Prueba</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* MODAL Métrica (Igual que antes) */}
      <Modal
        visible={showMetricModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMetricModal(false)}
      >
        <Pressable
          className="flex-1 bg-slate-900/60 justify-center px-6"
          onPress={() => setShowMetricModal(false)}
        >
          <View className="bg-white rounded-[28px] p-4 shadow-2xl overflow-hidden">
            <Text className="text-slate-900 font-bold text-lg mb-4 text-center">Selecciona una Métrica</Text>
            {metricOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  setFormData({ ...formData, metricType: option.value });
                  setShowMetricModal(false);
                }}
                className={`flex-row items-center justify-between p-4 rounded-2xl mb-2 border ${formData.metricType === option.value
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-transparent active:bg-slate-50'
                  }`}
              >
                <View className="flex-row items-center">
                  <Text className={`text-base font-medium ${formData.metricType === option.value ? 'text-blue-700' : 'text-slate-700'
                    }`}>
                    {option.label}
                  </Text>
                </View>
                {formData.metricType === option.value && (
                  <View className="bg-blue-600 rounded-full p-1">
                    <Check size={12} color="white" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  inputSafe: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
  },
  inputBorder: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  }
});