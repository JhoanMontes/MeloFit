import React, { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase"; 
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "ManageTests">;

export interface Prueba {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo_metrica: string;
  fecha_registro?: string;
  niveles?: any;
  entrenador_no_documento?: number;
}

const METRIC_LABELS: Record<string, string> = {
  'TIME_MIN': 'TIEMPO (MIN)',
  'DISTANCE_KM': 'DISTANCIA (KM)',
  'WEIGHT_KG': 'PESO (KG)',
  'REPS': 'REPETICIONES',
};

export default function ManageTests({ navigation }: Props) {
  const [tests, setTests] = useState<Prueba[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('prueba') 
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      if (data) setTests(data);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTests();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTests();
  };

  const renderItem = ({ item }: { item: Prueba }) => {
    // --- LÓGICA DE CORRECCIÓN ---
    // 1. Quitamos espacios en blanco accidentales (.trim())
    // 2. Forzamos mayúsculas para asegurar que coincida con el diccionario (.toUpperCase())
    const rawMetric = item.tipo_metrica ? item.tipo_metrica.trim() : '';
    const label = METRIC_LABELS[rawMetric] || METRIC_LABELS[rawMetric.toUpperCase()] || rawMetric;
    // ----------------------------

    return (
      <Pressable 
          onPress={() => navigation.navigate('TestDetail', { test: item })} 
          className="bg-white p-4 rounded-2xl mb-3 flex-row items-center justify-between shadow-sm border border-gray-100"
      >
        <View className="flex-row items-center flex-1 mr-4">
          <View className="bg-blue-50 w-10 h-10 rounded-full items-center justify-center mr-3">
            <Ionicons name="document-text-outline" size={20} color="#2563EB" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-bold text-base">{item.nombre}</Text>
            
            <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
              {item.descripcion || "Sin descripción"}
            </Text>
            
            <View className="flex-row items-center mt-1">
              <Ionicons name="resize-outline" size={12} color="#6B7280" />
              {/* Usamos la variable 'label' calculada arriba */}
              <Text className="text-gray-400 text-[10px] ml-1 uppercase">
                {label}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-[#F5F5F7]">
       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* --- HEADER --- */}
        <View className="px-6 pt-4 pb-2">
          <Pressable 
            onPress={() => navigation.goBack()} 
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm mb-4 border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text className="text-gray-900 text-3xl font-bold">Mis Pruebas</Text>
          <Text className="text-gray-500 text-base">Gestiona tu biblioteca de evaluaciones</Text>
        </View>

        {/* --- BOTÓN CREAR --- */}
        <View className="px-6 py-4">
          <Pressable
            onPress={() => navigation.navigate('AdminCreateTest')}
            className="w-full bg-blue-600 rounded-2xl h-14 flex-row justify-center items-center shadow-lg shadow-blue-300 active:bg-blue-700"
          >
            <Ionicons name="add" size={24} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-bold text-lg">Crear Nueva Prueba</Text>
          </Pressable>
        </View>

        {/* --- LISTA DE PRUEBAS --- */}
        <View className="flex-1 px-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-900 font-bold text-lg">Biblioteca ({tests.length})</Text>
            <Pressable>
              <Text className="text-blue-600 text-sm font-medium">Filtros</Text>
            </Pressable>
          </View>

          {loading ? (
             <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563EB" />
             </View>
          ) : (
            <FlatList
                data={tests}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} />
                }
                ListEmptyComponent={
                <View className="items-center justify-center py-10">
                    <Ionicons name="flask-outline" size={48} color="#D1D5DB" style={{ marginBottom: 10 }} />
                    <Text className="text-gray-400 text-center">No has creado pruebas aún.</Text>
                </View>
                }
            />
          )}
        </View>

      </SafeAreaView>
    </View>
  );
}