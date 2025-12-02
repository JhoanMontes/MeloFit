import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
// CAMBIO: Eliminamos Lucide y usamos Ionicons
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "ManageTests">;

// Datos Mock de pruebas existentes
const existingTests = [
  { id: '1', name: 'Test de Cooper', metric: 'Distancia', description: 'Correr la mayor distancia posible en 12 min.' },
  { id: '2', name: 'Sentadilla Max', metric: 'Peso', description: '1RM de Sentadilla trasera.' },
  { id: '3', name: 'Carrera 5K', metric: 'Tiempo', description: 'Tiempo total en 5 kilómetros.' },
  { id: '4', name: 'Flexiones 1 min', metric: 'Repeticiones', description: 'Máximas flexiones en 60 segundos.' },
];

export default function ManageTests({ navigation }: Props) {
  
  const renderItem = ({ item }: { item: typeof existingTests[0] }) => (
    <Pressable className="bg-white p-4 rounded-2xl mb-3 flex-row items-center justify-between shadow-sm border border-gray-100">
      <View className="flex-row items-center flex-1 mr-4">
        <View className="bg-blue-50 w-10 h-10 rounded-full items-center justify-center mr-3">
          {/* Icono FileText reemplazado */}
          <Ionicons name="document-text-outline" size={20} color="#2563EB" />
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-bold text-base">{item.name}</Text>
          <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>{item.description}</Text>
          <View className="flex-row items-center mt-1">
            {/* Icono Ruler reemplazado */}
            <Ionicons name="resize-outline" size={12} color="#6B7280" />
            <Text className="text-gray-400 text-[10px] ml-1 uppercase">{item.metric}</Text>
          </View>
        </View>
      </View>
      {/* Icono ChevronRight reemplazado */}
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </Pressable>
  );

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

        {/* --- BOTÓN CREAR (ARRIBA) --- */}
        <View className="px-6 py-4">
          <Pressable
            onPress={() => navigation.navigate('AdminCreateTest')}
            className="w-full bg-blue-600 rounded-2xl h-14 flex-row justify-center items-center shadow-lg shadow-blue-300 active:bg-blue-700"
          >
            {/* Icono Plus reemplazado */}
            <Ionicons name="add" size={24} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-bold text-lg">Crear Nueva Prueba</Text>
          </Pressable>
        </View>

        {/* --- LISTA DE PRUEBAS --- */}
        <View className="flex-1 px-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-900 font-bold text-lg">Biblioteca ({existingTests.length})</Text>
            <Pressable>
              <Text className="text-blue-600 text-sm font-medium">Filtros</Text>
            </Pressable>
          </View>

          <FlatList
            data={existingTests}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Text className="text-gray-400">No has creado pruebas aún.</Text>
              </View>
            }
          />
        </View>

      </SafeAreaView>
    </View>
  );
}