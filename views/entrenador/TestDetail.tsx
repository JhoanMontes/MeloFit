import React, { useState, useMemo } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StatusBar,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";

// IMPORTAR SUPABASE
import { supabase } from "../../lib/supabase";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "TestDetail">;

// Diccionario para mostrar nombres bonitos de métricas
const METRIC_LABELS: Record<string, string> = {
  distance: "Distancia",
  time_min: "Tiempo (min)",
  time_sec: "Tiempo (seg)",
  weight_reps: "Peso / Reps",
  repetitions: "Repeticiones",
  custom: "Personalizado"
};

export default function TestDetail({ navigation, route }: Props) {
  const { test } = route.params || {};
  
  // Estados de carga
  const [loading, setLoading] = useState(false);

  // Estados de datos
  const [testName, setTestName] = useState(test?.nombre || 'Prueba Sin Nombre');
  const [description, setDescription] = useState(test?.descripcion || '');
  
  // Parsear los niveles (JSONB) para usarlos en la UI
  // La DB devuelve: { nombre: "x", min: 1, max: 10 }
  // La UI espera: { label: "x", min: 1, max: 10 }
  const levels = useMemo(() => {
    if (!test?.niveles) return [];
    // Si viene como string (a veces pasa en logs), lo parseamos
    const nivelesArray = typeof test.niveles === 'string' ? JSON.parse(test.niveles) : test.niveles;
    
    return nivelesArray.map((l: any) => ({
        label: l.nombre,
        min: l.min,
        max: l.max
    }));
  }, [test]);

  // Modales
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // --- ACCIÓN: ELIMINAR ---
  const handleDeleteTest = async () => {
    setShowOptionsModal(false);
    Alert.alert(
        "¿Eliminar Prueba?", 
        "Esta acción eliminará la prueba permanentemente. No se puede deshacer.", 
        [
            { text: "Cancelar", style: "cancel" },
            { 
                text: "Eliminar", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        setLoading(true);
                        const { error } = await supabase
                            .from('prueba')
                            .delete()
                            .eq('id', test.id);

                        if (error) throw error;

                        navigation.goBack();
                    } catch (err: any) {
                        Alert.alert("Error", "No se pudo eliminar: " + err.message);
                    } finally {
                        setLoading(false);
                    }
                } 
            }
        ]
    );
  };

  // --- ACCIÓN: ACTUALIZAR ---
  const handleUpdateTest = async () => {
    if (testName.trim() === "") {
        Alert.alert("Error", "El nombre no puede estar vacío");
        return;
    }

    try {
        setLoading(true);
        
        const { error } = await supabase
            .from('prueba')
            .update({ 
                nombre: testName,
                descripcion: description
            })
            .eq('id', test.id);

        if (error) throw error;

        setShowEditModal(false);
        Alert.alert("Éxito", "La prueba ha sido actualizada.");
        
        // NOTA: Como cambiamos el nombre localmente en el estado 'testName', 
        // la UI se ve actualizada, pero si vuelves atrás, la lista se actualizará 
        // gracias al useFocusEffect que pusimos en la pantalla anterior.

    } catch (err: any) {
        Alert.alert("Error", err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F5F5F7]">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {loading && (
        <View className="absolute inset-0 bg-black/20 z-50 items-center justify-center">
            <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}

       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* --- HEADER --- */}
        <View className="px-6 pt-4 pb-2">
          {/* Fila de Botones */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable 
                onPress={() => navigation.goBack()} 
                className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 active:bg-gray-50"
            >
                <Ionicons name="arrow-back" size={20} color="#111827" />
            </Pressable>

            <Pressable 
                onPress={() => setShowOptionsModal(true)} 
                className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 active:bg-gray-50"
            >
                <Ionicons name="ellipsis-horizontal" size={20} color="#111827" />
            </Pressable>
          </View>
          
          {/* Título Grande */}
          <Text className="text-gray-900 text-3xl font-bold mb-1">{testName}</Text>
          
          {/* Subtítulo / Badge */}
          <View className="flex-row items-center gap-2 mb-2">
             <Text className="text-gray-500 text-base font-medium">Detalles de evaluación</Text>
             <View className="bg-blue-100 px-2 py-0.5 rounded-md">
                <Text className="text-blue-700 text-xs font-bold tracking-widest uppercase">
                    {METRIC_LABELS[test?.tipo_metrica] || test?.tipo_metrica || 'GENERAL'}
                </Text>
             </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* TARJETA 1: INSTRUCCIONES */}
          <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
            <View className="flex-row items-start">
                <View className="w-12 h-12 bg-indigo-50 rounded-full items-center justify-center mr-4">
                   <Ionicons name="document-text-outline" size={24} color="#4F46E5" />
                </View>
                <View className="flex-1">
                    <Text className="text-gray-900 font-bold mb-1 text-lg">Instrucciones</Text>
                    <Text className="text-gray-500 leading-relaxed text-sm font-medium">
                        {description || 'Sin instrucciones detalladas para esta prueba.'}
                    </Text>
                </View>
            </View>
          </View>

          {/* TARJETA 2: ESTADÍSTICAS RÁPIDAS (Visual - Pendiente de conectar real) */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Total Asignaciones</Text>
                <Text className="text-2xl font-extrabold text-gray-900">-- <Text className="text-sm font-medium text-gray-400">atletas</Text></Text>
            </View>
            <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Rendimiento</Text>
                <Text className="text-2xl font-extrabold text-gray-900">--% <Text className="text-sm font-medium text-gray-400">promedio</Text></Text>
            </View>
          </View>

          {/* LISTA: NIVELES DE EVALUACIÓN (REALES) */}
          <Text className="text-gray-900 font-bold text-xl mb-4">Niveles Configurados</Text>
          
          {levels.length > 0 ? (
              <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    {/* Header Tabla */}
                    <View className="flex-row bg-gray-50 p-4 border-b border-gray-100">
                        <Text className="flex-1 text-xs font-bold text-gray-400 uppercase">Nivel</Text>
                        <Text className="flex-1 text-xs font-bold text-gray-400 uppercase text-center">Mínimo</Text>
                        <Text className="flex-1 text-xs font-bold text-gray-400 uppercase text-center">Máximo</Text>
                    </View>
                    
                    {/* Filas Dinámicas */}
                    {levels.map((level: any, index: number) => (
                        <View key={index} className="flex-row p-4 border-b border-gray-50 items-center">
                            <View className="flex-1 flex-row items-center gap-2">
                                <View className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500' : index === levels.length - 1 ? 'bg-purple-500' : 'bg-blue-500'}`} />
                                <Text className="font-bold text-gray-700 text-sm capitalize">{level.label}</Text>
                            </View>
                            <Text className="flex-1 text-center text-gray-500 font-medium">{level.min}</Text>
                            <Text className="flex-1 text-center text-gray-500 font-medium">{level.max}</Text>
                        </View>
                    ))}
              </View>
          ) : (
              <View className="p-4 bg-white rounded-2xl border border-dashed border-gray-300 mb-6">
                  <Text className="text-center text-gray-400">No hay niveles configurados</Text>
              </View>
          )}

        </ScrollView>
      </SafeAreaView>

      {/* --- MODAL 1: OPCIONES --- */}
      <Modal visible={showOptionsModal} transparent animationType="fade" onRequestClose={() => setShowOptionsModal(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowOptionsModal(false)}>
            <View className="bg-white rounded-t-[32px] p-6 pb-10">
                <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
                <Text className="text-xl font-bold text-gray-900 mb-6 text-center">Opciones de Prueba</Text>
                
                <Pressable 
                    onPress={() => { setShowOptionsModal(false); setShowEditModal(true); }}
                    className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-3 border border-gray-100 active:bg-gray-100"
                >
                    <Ionicons name="pencil" size={22} color="#475569" style={{marginRight: 12}} />
                    <Text className="text-base font-bold text-gray-700">Editar Información</Text>
                </Pressable>

                <Pressable 
                    onPress={handleDeleteTest}
                    className="flex-row items-center p-4 bg-red-50 rounded-2xl border border-red-100 active:bg-red-100"
                >
                    <Ionicons name="trash" size={22} color="#DC2626" style={{marginRight: 12}} />
                    <Text className="text-base font-bold text-red-600">Eliminar Prueba</Text>
                </Pressable>
            </View>
        </Pressable>
      </Modal>

      {/* --- MODAL 2: EDITAR --- */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View className="flex-1 bg-black/50 justify-center px-6">
            <View className="bg-white rounded-[32px] p-6 shadow-xl">
                <Text className="text-lg font-bold text-gray-900 mb-6 text-center">Editar Prueba</Text>
                
                <Text className="text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Nombre</Text>
                <TextInput 
                    value={testName}
                    onChangeText={setTestName}
                    style={styles.safeInput} 
                    placeholder="Nombre de la prueba"
                    placeholderTextColor="#9CA3AF"
                />

                <Text className="text-xs font-bold text-gray-400 uppercase mb-2 ml-1 mt-4">Instrucciones</Text>
                <TextInput 
                    value={description}
                    onChangeText={setDescription}
                    style={[styles.safeInput, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                    placeholder="Descripción..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                />

                <View className="flex-row gap-3 mt-8">
                    <Pressable onPress={() => setShowEditModal(false)} className="flex-1 h-12 justify-center items-center rounded-xl border border-gray-200 active:bg-gray-50">
                        <Text className="font-bold text-gray-600">Cancelar</Text>
                    </Pressable>
                    <Pressable onPress={handleUpdateTest} className="flex-1 h-12 justify-center items-center rounded-xl bg-blue-600 active:bg-blue-700">
                        {loading ? <ActivityIndicator color="white"/> : <Text className="font-bold text-white">Guardar</Text>}
                    </Pressable>
                </View>
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  safeInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: '#111827',
    marginBottom: 0
  }
});