import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, Users, Plus, Search, ChevronRight } from "lucide-react-native";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "MyGroups">;

const allGroups = [
  { id: 1, name: 'Fuerza Avanzada', members: 12, color: 'bg-indigo-100', iconColor: '#4338ca' },
  { id: 2, name: 'Principiantes', members: 8, color: 'bg-emerald-100', iconColor: '#059669' },
  { id: 3, name: 'Resistencia', members: 6, color: 'bg-orange-100', iconColor: '#ea580c' },
  { id: 4, name: 'Velocidad', members: 10, color: 'bg-blue-100', iconColor: '#2563EB' },
  { id: 5, name: 'Hipertrofia Mañana', members: 15, color: 'bg-purple-100', iconColor: '#9333EA' },
  { id: 6, name: 'Cardio Intensivo', members: 20, color: 'bg-red-100', iconColor: '#DC2626' },
];

export default function MyGroups({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = allGroups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-[#F5F5F7]">
      <SafeAreaView className="flex-1" edges={['top']}>
        
        {/* --- HEADER --- */}
        <View className="px-6 pt-4 pb-2 bg-white shadow-sm border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={() => navigation.goBack()} className="p-2 bg-gray-50 rounded-full">
              <ArrowLeft size={22} color="#4B5563" />
            </Pressable>
            <Pressable 
              onPress={() => navigation.navigate('CreateGroup')}
              className="flex-row items-center bg-blue-600 px-4 py-2 rounded-full shadow-sm shadow-blue-200"
            >
              <Plus size={18} color="white" style={{ marginRight: 4 }} />
              <Text className="text-white font-bold text-sm">Crear Nuevo</Text>
            </Pressable>
          </View>
          
          <Text className="text-gray-900 text-3xl font-bold mb-4">Mis Grupos</Text>

          {/* Search */}
          <View className="relative mb-2">
            <View className="absolute left-4 top-3.5 z-10">
              <Search size={20} color="#9CA3AF" />
            </View>
            <TextInput
              placeholder="Buscar grupo..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-gray-50 border border-gray-200 rounded-2xl h-12 pl-12 pr-4 text-base text-gray-900"
            />
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
          <Text className="text-gray-500 text-xs font-bold uppercase mb-3">
            {filteredGroups.length} Grupos Activos
          </Text>
          
          <View className="space-y-3">
            {filteredGroups.map((group, index) => (
              <Pressable 
                key={index}
                onPress={() => navigation.navigate('GroupDetail', { group })}
                className="flex-row items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:bg-gray-50"
              >
                <View className={`${group.color} p-3.5 rounded-2xl mr-4`}>
                  <Users size={24} color={group.iconColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold text-lg">{group.name}</Text>
                  <Text className="text-sm text-gray-500 font-medium">{group.members} atletas</Text>
                </View>
                <View className="bg-gray-50 p-2 rounded-full">
                    <ChevronRight size={20} color="#9CA3AF" />
                </View>
              </Pressable>
            ))}
            
            {filteredGroups.length === 0 && (
              <View className="items-center py-10">
                <Text className="text-gray-400">No se encontraron grupos.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}