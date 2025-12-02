import React, { useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  TextInput, 
  FlatList,
  StyleSheet 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
// USAMOS IONICONS (Seguro anti-crash)
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "MyGroups">;

const allGroups = [
  { id: 1, name: 'Fuerza Avanzada', members: 12, code: 'FZ-992', description: 'Entrenamiento de fuerza máxima.' },
  { id: 2, name: 'Principiantes', members: 8, code: 'PR-101', description: 'Introducción a movimientos básicos.' },
  { id: 3, name: 'Resistencia', members: 6, code: 'RE-554', description: 'Mejora de capacidad cardiovascular.' },
  { id: 4, name: 'Velocidad', members: 10, code: 'VL-332', description: 'Sprints y pliometría.' },
  { id: 5, name: 'Hipertrofia Mañana', members: 15, code: 'HM-112', description: 'Ganancia muscular matutina.' },
];

export default function MyGroups({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = allGroups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: typeof allGroups[0] }) => (
    <Pressable 
      onPress={() => navigation.navigate('GroupDetail', { group: item })}
      className="bg-white p-4 rounded-2xl mb-3 flex-row items-center justify-between shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center flex-1 mr-4">
        <View className="bg-blue-50 w-10 h-10 rounded-full items-center justify-center mr-3">
          <Ionicons name="people-outline" size={20} color="#2563EB" />
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-bold text-base">{item.name}</Text>
          <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>{item.description}</Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="pricetag-outline" size={12} color="#6B7280" />
            <Text className="text-gray-400 text-[10px] ml-1 uppercase font-bold">COD: {item.code}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </Pressable>
  );

  return (
    <View className="flex-1 bg-[#F5F5F7]">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* --- HEADER (Igual a ManageTests) --- */}
        <View className="px-6 pt-4 pb-2">
          <Pressable 
            onPress={() => navigation.goBack()} 
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm mb-4 border border-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text className="text-gray-900 text-3xl font-bold">Mis Grupos</Text>
          <Text className="text-gray-500 text-base">Gestiona tus equipos y atletas</Text>
        </View>

        {/* --- BOTÓN CREAR (Igual a ManageTests) --- */}
        <View className="px-6 py-4">
          <Pressable
            onPress={() => navigation.navigate('CreateGroup')}
            className="w-full bg-blue-600 rounded-2xl h-14 flex-row justify-center items-center shadow-lg shadow-blue-300 active:bg-blue-700"
          >
            <Ionicons name="add" size={24} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-bold text-lg">Crear Nuevo Grupo</Text>
          </Pressable>
        </View>

        {/* --- LISTA Y BUSCADOR --- */}
        <View className="flex-1 px-6">
          {/* Buscador Seguro */}
          <View className="mb-4 relative">
             <View className="absolute left-4 top-3.5 z-10">
              <Ionicons name="search" size={20} color="#9CA3AF" />
            </View>
            <TextInput
              placeholder="Buscar grupo..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              // Usamos style nativo para evitar el crash de NativeWind con Inputs
              style={{
                backgroundColor: 'white',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 16,
                height: 48,
                paddingLeft: 48,
                paddingRight: 16,
                fontSize: 16,
                color: '#111827'
              }}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-900 font-bold text-lg">Listado ({filteredGroups.length})</Text>
          </View>

          <FlatList
            data={filteredGroups}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Text className="text-gray-400">No se encontraron grupos.</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </View>
  );
}