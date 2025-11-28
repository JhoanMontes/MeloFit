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
  Users, 
  Search, 
  Check, 
  Palette, 
  UserPlus 
} from "lucide-react-native";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "CreateGroup">;

const availableAthletes = [
  { id: 1, name: 'Alex Johnson', age: 24, level: 'Avanzado', avatar: '👨‍🦱' },
  { id: 2, name: 'Maria García', age: 28, level: 'Intermedio', avatar: '👩‍🦰' },
  { id: 3, name: 'David Lee', age: 22, level: 'Principiante', avatar: '🧑' },
  { id: 4, name: 'Sarah Miller', age: 26, level: 'Avanzado', avatar: '👩‍🦱' },
  { id: 5, name: 'John Smith', age: 30, level: 'Intermedio', avatar: '🧔' },
];

const groupColors = [
  { name: 'Azul', value: '#2563EB', bg: 'bg-blue-600' },
  { name: 'Verde', value: '#059669', bg: 'bg-emerald-600' },
  { name: 'Violeta', value: '#7C3AED', bg: 'bg-violet-600' },
  { name: 'Rosa', value: '#DB2777', bg: 'bg-pink-600' },
  { name: 'Naranja', value: '#EA580C', bg: 'bg-orange-600' },
  { name: 'Rojo', value: '#DC2626', bg: 'bg-red-600' },
];

export default function CreateGroup({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(groupColors[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAthletes, setSelectedAthletes] = useState<number[]>([]);

  const filteredAthletes = availableAthletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    athlete.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAthlete = (athleteId: number) => {
    if (selectedAthletes.includes(athleteId)) {
      setSelectedAthletes(selectedAthletes.filter(id => id !== athleteId));
    } else {
      setSelectedAthletes([...selectedAthletes, athleteId]);
    }
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Alert.alert("Falta el nombre", "Por favor asigna un nombre al grupo.");
      return;
    }
    if (selectedAthletes.length === 0) {
      Alert.alert("Grupo vacío", "Debes seleccionar al menos un atleta.");
      return;
    }
    
    Alert.alert("¡Grupo Creado!", `El grupo "${groupName}" está listo.`, [
      { text: "Ir al Dashboard", onPress: () => navigation.navigate('Dashboard') }
    ]);
  };

  const isFormValid = groupName.trim().length > 0 && selectedAthletes.length > 0;

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          
          {/* --- HEADER --- */}
          <View className="px-6 pt-4 pb-4 bg-slate-50 z-10">
            <View className="flex-row items-center mb-2">
              <Pressable 
                onPress={() => navigation.goBack()} 
                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-200 mr-4 active:bg-slate-50"
              >
                <ArrowLeft size={22} color="#334155" />
              </Pressable>
              <View>
                <Text className="text-slate-900 text-2xl font-extrabold tracking-tight">Crear Grupo</Text>
                <Text className="text-slate-500 text-sm font-medium">Organiza a tus atletas</Text>
              </View>
            </View>
          </View>

          <ScrollView 
            className="flex-1 px-6"
            contentContainerStyle={{ paddingBottom: 150 }}
            showsVerticalScrollIndicator={false}
          >
            
            {/* CONTENEDOR PRINCIPAL: Espaciado vertical amplio entre secciones */}
            <View className="space-y-8">

              {/* 1. TARJETA DETALLES */}
              <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                
                {/* Título de Sección */}
                <View className="flex-row items-center mb-8 space-x-3 border-b border-slate-50 pb-4">
                  <View className="bg-blue-50 p-2.5 rounded-xl">
                    <Users size={22} color="#2563EB" />
                  </View>
                  <View>
                    <Text className="text-slate-900 font-bold text-lg">Detalles Básicos</Text>
                    <Text className="text-slate-400 text-xs font-medium">Información general</Text>
                  </View>
                </View>

                <View className="space-y-6">
                  {/* Nombre */}
                  <View>
                    <Text className="text-slate-700 font-bold text-sm ml-1 mb-3">Nombre del Grupo</Text>
                    <View className="bg-slate-50 border border-slate-200 rounded-2xl h-14 justify-center px-4 focus:border-blue-500">
                      <TextInput
                        placeholder="Ej: Fuerza Avanzada"
                        value={groupName}
                        onChangeText={setGroupName}
                        className="text-slate-900 text-base font-semibold"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>

                  {/* Descripción */}
                  <View>
                    <Text className="text-slate-700 font-bold text-sm ml-1 mb-3">Descripción (Opcional)</Text>
                    <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 h-32 focus:border-blue-500">
                      <TextInput
                        placeholder="Objetivos del grupo, horarios, notas..."
                        value={groupDescription}
                        onChangeText={setGroupDescription}
                        multiline
                        textAlignVertical="top"
                        className="text-slate-900 text-base font-medium h-full leading-5"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>

                  {/* Color Picker */}
                  <View className="pt-2">
                    <View className="flex-row items-center space-x-2 mb-4">
                       <Palette size={16} color="#64748b" />
                       <Text className="text-slate-700 font-bold text-sm">Etiqueta de Color</Text>
                    </View>
                    
                    {/* Grid de colores con más espacio */}
                    <View className="flex-row flex-wrap gap-4">
                      {groupColors.map((color) => {
                         const isSelected = selectedColor.value === color.value;
                         return (
                          <Pressable
                            key={color.value}
                            onPress={() => setSelectedColor(color)}
                            className={`w-12 h-12 rounded-full items-center justify-center ${color.bg} ${
                              isSelected ? 'ring-4 ring-offset-2 ring-slate-200 shadow-md scale-105' : 'opacity-80'
                            }`}
                            style={isSelected ? { borderWidth: 3, borderColor: 'white' } : {}}
                          >
                            {isSelected && <Check size={20} color="white" strokeWidth={3} />}
                          </Pressable>
                         );
                      })}
                    </View>
                  </View>
                </View>
              </View>

              {/* 2. TARJETA ATLETAS */}
              <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                <View className="flex-row items-center justify-between mb-6 border-b border-slate-50 pb-4">
                  <View className="flex-row items-center space-x-3">
                      <View className="bg-slate-100 p-2.5 rounded-xl">
                          <UserPlus size={22} color="#475569" />
                      </View>
                      <View>
                          <Text className="text-slate-900 font-bold text-lg">Miembros</Text>
                          <Text className="text-slate-400 text-xs font-medium">Selecciona integrantes</Text>
                      </View>
                  </View>
                  
                  {/* Contador */}
                  {selectedAthletes.length > 0 && (
                    <View 
                      className="px-3 py-1.5 rounded-full items-center justify-center shadow-sm"
                      style={{ backgroundColor: selectedColor.value }}
                    >
                      <Text className="text-white font-bold text-xs">{selectedAthletes.length} Añadidos</Text>
                    </View>
                  )}
                </View>

                {/* Buscador */}
                <View className="relative mb-6">
                  <View className="absolute left-4 top-3.5 z-10">
                    <Search size={20} color="#9CA3AF" />
                  </View>
                  <TextInput
                    placeholder="Buscar por nombre..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="bg-slate-50 border border-slate-200 rounded-2xl h-12 pl-12 pr-4 text-base text-slate-900 font-medium"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Lista de Atletas */}
                <View className="space-y-3">
                  {filteredAthletes.length > 0 ? (
                    filteredAthletes.map((athlete) => {
                      const isSelected = selectedAthletes.includes(athlete.id);
                      return (
                        <Pressable
                          key={athlete.id}
                          onPress={() => toggleAthlete(athlete.id)}
                          className={`flex-row items-center p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                            isSelected 
                              ? 'bg-blue-50/60 border-blue-200 shadow-sm' 
                              : 'bg-white border-slate-100'
                          }`}
                        >
                          <View className="bg-slate-50 w-12 h-12 rounded-full items-center justify-center mr-4 border border-slate-200">
                              <Text className="text-xl">{athlete.avatar}</Text>
                          </View>
                          
                          <View className="flex-1">
                            <Text className={`font-bold text-base mb-0.5 ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                              {athlete.name}
                            </Text>
                            <Text className="text-xs text-slate-500 font-medium">{athlete.level}</Text>
                          </View>

                          <View className={`w-7 h-7 rounded-full border items-center justify-center ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-600 shadow-sm' 
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check size={14} color="white" strokeWidth={4} />}
                          </View>
                        </Pressable>
                      );
                    })
                  ) : (
                    <View className="items-center py-8">
                      <Text className="text-slate-400 font-medium text-sm">No se encontraron atletas</Text>
                    </View>
                  )}
                </View>
              </View>

            </View>
          </ScrollView>

          {/* --- FOOTER FIXED --- */}
          <View 
            className="absolute bottom-0 w-full bg-white border-t border-slate-100 px-6 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          >
            <Pressable
              onPress={handleCreateGroup}
              disabled={!isFormValid}
              className={`w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg transition-all active:scale-[0.98] ${
                isFormValid 
                  ? 'bg-blue-600 shadow-blue-600/30' 
                  : 'bg-slate-200 shadow-none opacity-80'
              }`}
            >
              <Users size={20} color={isFormValid ? "white" : "#94a3b8"} style={{ marginRight: 8 }} />
              <Text className={`font-bold text-lg tracking-wide ${isFormValid ? 'text-white' : 'text-slate-500'}`}>
                Crear Grupo ({selectedAthletes.length})
              </Text>
            </Pressable>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}