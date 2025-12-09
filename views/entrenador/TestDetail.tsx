import React, { useState, useMemo, useEffect } from "react"; // 1. Agregar useEffect
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
import { supabase } from "../../lib/supabase";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "TestDetail">;

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
  
  const [loading, setLoading] = useState(false);
  const [testName, setTestName] = useState(test?.nombre || 'Prueba Sin Nombre');
  const [description, setDescription] = useState(test?.descripcion || '');
  
  // --- NUEVO ESTADO PARA EL CONTEO ---
  const [athleteCount, setAthleteCount] = useState<number>(0); 
  const [loadingStats, setLoadingStats] = useState(true);

  // Parsear niveles
  const levels = useMemo(() => {
    if (!test?.niveles) return [];
    const nivelesArray = typeof test.niveles === 'string' ? JSON.parse(test.niveles) : test.niveles;
    return nivelesArray.map((l: any) => ({
        label: l.nombre,
        min: l.min,
        max: l.max
    }));
  }, [test]);

  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);


  useEffect(() => {
  let isMounted = true;
  
  

const fetchStats = async () => {
  if (!test?.id) {
    setLoadingStats(false);
    return;
  }
  
  try {
    setLoadingStats(true); 

    // 1. TRAER TODOS LOS REGISTROS DE ASIGNACIÓN Y LOS IDs DE ATLETA
    const { data, error } = await supabase
      .from('prueba_asignada_has_atleta')
      // Importante: seleccionamos el ID de atleta y la prueba asignada para filtrar
      .select('atleta_no_documento, prueba_asignada!inner(prueba_id)')
      .eq('prueba_asignada.prueba_id', test.id);
      
    if (error) {
      console.error("Error obteniendo datos de asignación:", error);
      return;
    }

    // 2. CONTAR VALORES ÚNICOS EN JAVASCRIPT
    if (data && data.length > 0) {
      // Creamos un array con solo los 'atleta_no_documento'
      const athleteIds = data.map(item => item.atleta_no_documento);
      
      // Usamos Set para obtener solo IDs únicos (eliminando las repeticiones)
      const uniqueAthletes = new Set(athleteIds);
      
      setAthleteCount(uniqueAthletes.size); 
    } else {
      setAthleteCount(0);
    }

  } catch (e) {
    console.error("Error fatal en fetchStats:", e);
  } finally {
    setLoadingStats(false); 
  }
};


  fetchStats();
  
  return () => {
      isMounted = false;
  };
// Dependencia crítica: solo se ejecuta cuando el ID de la prueba cambia.
// Si no hay dependencias, se ejecuta solo al montar.
}, [test.id]);

  // ... (Funciones handleDeleteTest y handleUpdateTest se mantienen igual)
  const handleDeleteTest = async () => {
    // ... tu código existente de borrar ...
    setShowOptionsModal(false);
    Alert.alert("Eliminar", "¿Seguro?", [
        { text: "Cancelar" },
        { text: "Eliminar", onPress: async () => {
            await supabase.from('prueba').delete().eq('id', test.id);
            navigation.goBack();
        }}
    ]);
  };

  const handleUpdateTest = async () => {
     // ... tu código existente de actualizar ...
     setLoading(true);
     await supabase.from('prueba').update({ nombre: testName, descripcion: description }).eq('id', test.id);
     setLoading(false);
     setShowEditModal(false);
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
        
        {/* HEADER */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable 
                onPress={() => navigation.goBack()} 
                className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
            >
                <Ionicons name="arrow-back" size={20} color="#111827" />
            </Pressable>

            <Pressable 
                onPress={() => setShowOptionsModal(true)} 
                className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
            >
                <Ionicons name="ellipsis-horizontal" size={20} color="#111827" />
            </Pressable>
          </View>
          
          <Text className="text-gray-900 text-3xl font-bold mb-1">{testName}</Text>
          
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

          {/* TARJETA 2: ESTADÍSTICAS (AHORA CON DATOS REALES) */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Total Asignaciones</Text>
                
                {/* LÓGICA DE VISUALIZACIÓN DE CARGA */}
                {loadingStats ? (
                    <ActivityIndicator size="small" color="#2563EB" style={{alignSelf: 'flex-start', marginTop: 5}} />
                ) : (
                    <Text className="text-2xl font-extrabold text-gray-900">
                        {athleteCount} <Text className="text-sm font-medium text-gray-400">atletas</Text>
                    </Text>
                )}

            </View>
            <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Rendimiento</Text>
                <Text className="text-2xl font-extrabold text-gray-900">--% <Text className="text-sm font-medium text-gray-400">promedio</Text></Text>
            </View>
          </View>

          {/* LISTA: NIVELES (SIN CAMBIOS) */}
          <Text className="text-gray-900 font-bold text-xl mb-4">Niveles Configurados</Text>
          {/* ... resto de tu renderizado de niveles ... */}
          {levels.length > 0 ? (
              <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                 {/* ... tabla de niveles ... */}
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

      {/* MODALES (SIN CAMBIOS) */}
      <Modal visible={showOptionsModal} transparent animationType="fade" onRequestClose={() => setShowOptionsModal(false)}>
         {/* ... modal contenido ... */}
         {/* Asegúrate de incluir los componentes que ya tenías aquí */}
         <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowOptionsModal(false)}>
            <View className="bg-white rounded-t-[32px] p-6 pb-10">
                <Pressable onPress={() => { setShowOptionsModal(false); setShowEditModal(true); }} className="p-4 mb-2"><Text>Editar</Text></Pressable>
                <Pressable onPress={handleDeleteTest} className="p-4"><Text className="text-red-500">Eliminar</Text></Pressable>
            </View>
         </Pressable>
      </Modal>

      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
         {/* ... modal editar contenido ... */}
         <View className="flex-1 bg-black/50 justify-center px-6">
            <View className="bg-white p-6 rounded-2xl">
                <TextInput value={testName} onChangeText={setTestName} style={styles.safeInput} />
                <TextInput value={description} onChangeText={setDescription} style={styles.safeInput} multiline />
                <Pressable onPress={handleUpdateTest} className="mt-4 bg-blue-600 p-4 rounded-xl"><Text className="text-white text-center">Guardar</Text></Pressable>
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
    marginBottom: 10
  }
});