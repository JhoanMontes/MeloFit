import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "SendFeedback">;

// --- MOCK DE NIVELES DE LA PRUEBA (Referencia para el entrenador) ---
const testRangesMock = [
  { id: 1, label: 'Principiante', min: 0, max: 10, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
  { id: 2, label: 'Intermedio', min: 11, max: 20, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 3, label: 'Avanzado', min: 21, max: 30, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 4, label: 'Elite', min: 31, max: 999, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

export default function SendFeedback({ navigation, route }: Props) {
  const { result } = route.params || {};
  
  // DATOS DEL ATLETA (Contexto para el entrenador)
  const athleteData = {
    name: result?.athleteName || "Jhonny Diaz",
    weight: "74 kg", 
    height: "1.78 m",
    age: "22 años"
  };

  const testName = result?.test || "Prueba";

  const [metricValue, setMetricValue] = useState('');
  const [comments, setComments] = useState('');
  const [calculatedLevel, setCalculatedLevel] = useState<any>(null);

  // LÓGICA: Iluminar la tabla según lo que escribe el entrenador
  useEffect(() => {
    const val = parseFloat(metricValue);
    if (!isNaN(val)) {
        const found = testRangesMock.find(r => val >= r.min && val <= r.max);
        setCalculatedLevel(found || null);
    } else {
        setCalculatedLevel(null);
    }
  }, [metricValue]);

  const handleSubmit = () => {
    if (!metricValue.trim()) {
        Alert.alert("Falta el resultado", "Debes ingresar el valor obtenido por el atleta.");
        return;
    }
    
    // El sistema confirma la clasificación basada en el input del entrenador
    const nivelFinal = calculatedLevel ? calculatedLevel.label : "Sin Clasificación";

    Alert.alert(
        "¿Registrar Resultado?", 
        `Atleta: ${athleteData.name}\nResultado: ${metricValue}\nClasificación: ${nivelFinal}`, 
        [
            { text: "Corregir", style: "cancel" },
            { 
                text: "Confirmar", 
                onPress: () => {
                    // AQUÍ SE ENVÍA A SUPABASE (BACKEND)
                    navigation.goBack(); 
                } 
            }
        ]
    );
  };

  return (
    <View className="flex-1 bg-[#F5F5F7]">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          
          {/* --- HEADER --- */}
          <View className="px-6 pt-4 pb-2">
            <Pressable 
              onPress={() => navigation.goBack()} 
              className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm mb-4 border border-gray-100 active:bg-gray-50"
            >
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </Pressable>
            
            <Text className="text-gray-900 text-3xl font-bold mb-1">Registrar Resultado</Text>
            <Text className="text-gray-500 text-base font-medium">
              Evaluando: <Text className="text-blue-600 font-bold">{testName}</Text>
            </Text>
          </View>

          <ScrollView 
            className="flex-1 px-6 pt-6" 
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            
            {/* TARJETA 1: DATOS DEL ATLETA (CONTEXTO PARA EL ENTRENADOR) */}
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <View className="flex-row items-center gap-3 mb-4">
                    <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                        <Ionicons name="person" size={20} color="#2563EB" />
                    </View>
                    <View>
                        <Text className="text-lg font-bold text-slate-900">{athleteData.name}</Text>
                        <Text className="text-xs text-slate-400 font-bold uppercase">Datos Físicos</Text>
                    </View>
                </View>

                <View className="flex-row justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <View className="items-center flex-1 border-r border-slate-200">
                        <Text className="text-xs text-slate-400 uppercase font-bold">Peso</Text>
                        <Text className="text-slate-900 font-bold text-base">{athleteData.weight}</Text>
                    </View>
                    <View className="items-center flex-1 border-r border-slate-200">
                        <Text className="text-xs text-slate-400 uppercase font-bold">Altura</Text>
                        <Text className="text-slate-900 font-bold text-base">{athleteData.height}</Text>
                    </View>
                    <View className="items-center flex-1">
                        <Text className="text-xs text-slate-400 uppercase font-bold">Edad</Text>
                        <Text className="text-slate-900 font-bold text-base">{athleteData.age}</Text>
                    </View>
                </View>
            </View>

            {/* TARJETA 2: INGRESO DE RESULTADO */}
            <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 items-center">
                <Text className="text-gray-900 font-bold text-lg mb-2">Ingresa el Valor</Text>
                <Text className="text-gray-400 text-xs mb-4 text-center">
                    Escribe el resultado obtenido por el atleta
                </Text>
                
                <View className="flex-row items-end justify-center w-full mb-4">
                    <TextInput 
                        placeholder="0"
                        keyboardType="numeric"
                        value={metricValue}
                        onChangeText={setMetricValue}
                        // 🛡️ SEGURIDAD: Style nativo evita el crash
                        style={styles.bigInput} 
                        placeholderTextColor="#E2E8F0"
                    />
                    <Text className="text-gray-400 font-bold text-xl mb-4 ml-2">
                        Unit
                    </Text>
                </View>

                {calculatedLevel && (
                    <View className={`px-4 py-2 rounded-full ${calculatedLevel.bg} border ${calculatedLevel.border}`}>
                        <Text className={`font-bold text-sm ${calculatedLevel.color}`}>
                            CLASIFICACIÓN: {calculatedLevel.label.toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>

            {/* TARJETA 3: TABLA DE REFERENCIA (Para que el entrenador compare) */}
            <View className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
                <View className="bg-gray-50 p-4 border-b border-gray-100 flex-row items-center gap-2">
                    <Ionicons name="list" size={18} color="#64748B" />
                    <Text className="text-gray-900 font-bold text-sm">Tabla de Referencia</Text>
                </View>
                
                <View className="p-2">
                    {testRangesMock.map((level) => {
                        const isActive = calculatedLevel?.id === level.id;
                        return (
                            <View 
                                key={level.id} 
                                className={`flex-row justify-between items-center p-3 rounded-xl border mb-1 ${
                                    isActive ? `${level.bg} ${level.border}` : 'bg-white border-transparent'
                                }`}
                            >
                                <View className="flex-row items-center gap-3">
                                    <View className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                    <Text className={`font-bold text-sm ${isActive ? 'text-slate-900' : 'text-gray-400'}`}>
                                        {level.label}
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Text className={`text-xs ${isActive ? 'font-bold text-slate-700' : 'text-gray-300'}`}>
                                        {level.min} - {level.max}
                                    </Text>
                                    {isActive && <Ionicons name="checkmark" size={16} color="#2563EB" style={{marginLeft: 6}} />}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* TARJETA 4: COMENTARIOS */}
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <Text className="text-gray-900 font-bold text-base mb-3">Observaciones (Opcional)</Text>
                <View style={styles.textAreaContainer}>
                    <TextInput 
                        placeholder="Técnica, esfuerzo, dolor..."
                        multiline
                        textAlignVertical="top"
                        value={comments}
                        onChangeText={setComments}
                        // 🛡️ SEGURIDAD: Style nativo
                        style={styles.textArea} 
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>

          </ScrollView>

          {/* FOOTER */}
          <View className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-6 pb-8 shadow-2xl">
            <Pressable 
                onPress={handleSubmit}
                className={`w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg active:scale-[0.98] transition-all ${
                    metricValue.length > 0 ? 'bg-blue-600 shadow-blue-200' : 'bg-gray-200 shadow-none'
                }`}
                disabled={metricValue.length === 0}
            >
                <Ionicons name="save-outline" size={20} color={metricValue.length > 0 ? "white" : "#9CA3AF"} style={{ marginRight: 8 }} />
                <Text className={`font-bold text-lg ${metricValue.length > 0 ? "text-white" : "text-gray-400"}`}>
                    Guardar Resultado
                </Text>
            </Pressable>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ESTILOS SEGUROS (Evitan el error path.split de NativeWind)
const styles = StyleSheet.create({
  bigInput: {
    fontSize: 56,
    fontWeight: '800',
    color: '#0F172A',
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
    textAlign: 'center',
    minWidth: 100,
    paddingBottom: 8,
    height: 80
  },
  textAreaContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    height: 120,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
  }
});