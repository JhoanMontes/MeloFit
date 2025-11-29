import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
  ArrowLeft, 
  User, 
  Users, 
  Check, 
  Calendar, 
  Search, 
  Clock, 
  Target 
} from "lucide-react-native";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "AssignTestStep2">;

// Mock Data (Datos de prueba)
const athletes = [
  { id: 1, name: 'Alex Johnson', documentNumber: '12345678A', group: 'Fuerza Avanzada', active: true },
  { id: 2, name: 'Maria García', documentNumber: '87654321B', group: 'Fuerza Avanzada', active: true },
  { id: 3, name: 'David Lee', documentNumber: '45678912C', group: 'Principiantes', active: false },
  { id: 4, name: 'Sarah Miller', documentNumber: '78912345D', group: 'Resistencia', active: false },
  { id: 5, name: 'John Smith', documentNumber: '32165498E', group: 'Fuerza Avanzada', active: true },
  { id: 6, name: 'Emma Wilson', documentNumber: '65498732F', group: 'Principiantes', active: true }
];

const groups = [
  { id: 1, name: 'Fuerza Avanzada', members: 12 },
  { id: 2, name: 'Principiantes', members: 8 },
  { id: 3, name: 'Resistencia', members: 6 }
];

export default function AssignTestStep2({ navigation, route }: Props) {
  const { test } = route.params; // Recibimos la prueba del Paso 1
  const insets = useSafeAreaInsets();

  const [selectedAthletes, setSelectedAthletes] = useState<number[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [activeTab, setActiveTab] = useState<'athletes' | 'groups'>('athletes');
  const [searchQuery, setSearchQuery] = useState('');

  // --- LÓGICA ORIGINAL ---
  const toggleAthlete = (id: number) => {
    setSelectedAthletes(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleGroup = (id: number) => {
    setSelectedGroups(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAssign = () => {
    // Lógica de guardado simulada
    console.log("Asignando prueba:", {
      testId: test.id,
      athletes: selectedAthletes,
      groups: selectedGroups,
      dueDate
    });

    Alert.alert(
      "¡Asignación Exitosa!", 
      `Se ha asignado "${test.name}" correctamente a los destinatarios seleccionados.`, 
      [{ text: "Volver al Dashboard", onPress: () => navigation.navigate('Dashboard') }]
    );
  };

  const filteredAthletes = athletes.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const totalSelectionCount = selectedAthletes.length + selectedGroups.length;
  // -----------------------

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
            <View className="flex-row items-center mb-6">
              <Pressable 
                onPress={() => navigation.goBack()} 
                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-200 mr-4 active:bg-slate-50"
              >
                <ArrowLeft size={22} color="#334155" />
              </Pressable>
              <View>
                <Text className="text-slate-900 text-2xl font-extrabold tracking-tight">Asignar Prueba</Text>
                <Text className="text-slate-500 text-sm font-medium">Paso 2: Seleccionar Destinatarios</Text>
              </View>
            </View>
          </View>

          <ScrollView 
            className="flex-1 px-6"
            contentContainerStyle={{ paddingBottom: 160 }} // Espacio amplio para el footer grande
            showsVerticalScrollIndicator={false}
          >
            
            {/* 1. RESUMEN DE LA PRUEBA (CARD HERO) */}
            <View className="bg-white rounded-[32px] p-6 mb-6 shadow-sm border border-slate-100 flex-row items-start justify-between">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-2">
                    <View className="bg-blue-100 px-2 py-1 rounded-md mr-2">
                        <Text className="text-[10px] font-bold text-blue-700 uppercase">Seleccionada</Text>
                    </View>
                </View>
                <Text className="text-slate-900 text-xl font-bold mb-1">{test?.name || 'Prueba'}</Text>
                <Text className="text-slate-500 text-sm leading-5">{test?.description || 'Sin descripción'}</Text>
              </View>
              <View className="bg-blue-50 p-3 rounded-2xl">
                <Target size={24} color="#2563EB" />
              </View>
            </View>

            {/* 2. FECHA LÍMITE */}
            <View className="mb-8">
              <Text className="text-slate-700 font-bold text-sm ml-1 mb-3">Fecha Límite (Opcional)</Text>
              <View className="bg-white border border-slate-200 rounded-2xl h-14 flex-row items-center px-4 shadow-sm shadow-slate-200/50">
                <Calendar size={20} color="#94a3b8" style={{ marginRight: 12 }} />
                <TextInput
                  placeholder="DD/MM/AAAA"
                  value={dueDate}
                  onChangeText={setDueDate}
                  className="flex-1 text-slate-900 text-base font-medium"
                  placeholderTextColor="#cbd5e1"
                />
              </View>
            </View>

            {/* 3. SELECCIÓN DE DESTINATARIOS */}
            <View>
              <Text className="text-slate-900 font-bold text-lg mb-4">¿A quién va dirigida?</Text>

              {/* Tabs Switcher */}
              <View className="bg-slate-200/50 p-1 rounded-2xl flex-row mb-6">
                <Pressable
                  onPress={() => setActiveTab('athletes')}
                  className={`flex-1 py-3 rounded-xl items-center justify-center transition-all ${
                    activeTab === 'athletes' 
                      ? 'bg-white shadow-sm' 
                      : 'bg-transparent'
                  }`}
                >
                  <Text className={`font-bold text-sm ${activeTab === 'athletes' ? 'text-blue-600' : 'text-slate-500'}`}>
                    Atletas Individuales
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setActiveTab('groups')}
                  className={`flex-1 py-3 rounded-xl items-center justify-center transition-all ${
                    activeTab === 'groups' 
                      ? 'bg-white shadow-sm' 
                      : 'bg-transparent'
                  }`}
                >
                  <Text className={`font-bold text-sm ${activeTab === 'groups' ? 'text-blue-600' : 'text-slate-500'}`}>
                    Grupos Enteros
                  </Text>
                </Pressable>
              </View>

              {/* Buscador */}
              <View className="relative mb-6">
                <View className="absolute left-4 top-4 z-10">
                  <Search size={20} color="#9CA3AF" />
                </View>
                <TextInput
                  placeholder={activeTab === 'athletes' ? "Buscar atleta..." : "Buscar grupo..."}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="bg-white border border-slate-200 rounded-2xl h-14 pl-12 pr-4 text-base font-medium shadow-sm shadow-slate-200/50"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* --- LISTA DE ATLETAS --- */}
              {activeTab === 'athletes' && (
                <View className="space-y-3">
                  {filteredAthletes.map((athlete) => {
                    const isSelected = selectedAthletes.includes(athlete.id);
                    return (
                      <Pressable
                        key={athlete.id}
                        onPress={() => toggleAthlete(athlete.id)}
                        className={`flex-row items-center p-4 rounded-2xl border transition-all active:scale-[0.99] ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-500 shadow-sm' 
                            : 'bg-white border-slate-100'
                        }`}
                      >
                        {/* Avatar / Icono */}
                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 border ${
                            isSelected ? 'bg-blue-100 border-blue-200' : 'bg-slate-50 border-slate-200'
                        }`}>
                            <User size={20} color={isSelected ? '#2563EB' : '#64748b'} />
                        </View>
                        
                        {/* Info */}
                        <View className="flex-1">
                          <Text className={`font-bold text-base mb-0.5 ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                            {athlete.name}
                          </Text>
                          <View className="flex-row items-center">
                             <Text className="text-xs text-slate-500 font-medium">{athlete.group}</Text>
                             {!athlete.active && (
                                <View className="ml-2 bg-red-100 px-1.5 py-0.5 rounded text-[10px]">
                                    <Text className="text-red-600 text-[10px] font-bold">Inactivo</Text>
                                </View>
                             )}
                          </View>
                        </View>

                        {/* Checkbox Visual */}
                        <View className={`w-6 h-6 rounded-full border items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'bg-white border-slate-300'
                        }`}>
                          {isSelected && <Check size={14} color="white" strokeWidth={4} />}
                        </View>
                      </Pressable>
                    );
                  })}
                  {filteredAthletes.length === 0 && (
                      <Text className="text-center text-slate-400 mt-4">No se encontraron atletas</Text>
                  )}
                </View>
              )}

              {/* --- LISTA DE GRUPOS --- */}
              {activeTab === 'groups' && (
                <View className="space-y-3">
                  {filteredGroups.map((group) => {
                    const isSelected = selectedGroups.includes(group.id);
                    return (
                      <Pressable
                        key={group.id}
                        onPress={() => toggleGroup(group.id)}
                        className={`flex-row items-center p-4 rounded-2xl border transition-all active:scale-[0.99] ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-500 shadow-sm' 
                            : 'bg-white border-slate-100'
                        }`}
                      >
                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 border ${
                            isSelected ? 'bg-blue-100 border-blue-200' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <Users size={20} color={isSelected ? '#2563EB' : '#64748b'} />
                        </View>
                        
                        <View className="flex-1">
                          <Text className={`font-bold text-base mb-0.5 ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                            {group.name}
                          </Text>
                          <Text className="text-xs text-slate-500 font-medium">
                            {group.members} miembros totales
                          </Text>
                        </View>

                        <View className={`w-6 h-6 rounded-full border items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'bg-white border-slate-300'
                        }`}>
                          {isSelected && <Check size={14} color="white" strokeWidth={4} />}
                        </View>
                      </Pressable>
                    );
                  })}
                  {filteredGroups.length === 0 && (
                      <Text className="text-center text-slate-400 mt-4">No se encontraron grupos</Text>
                  )}
                </View>
              )}

            </View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* --- FOOTER FIXED --- */}
        <View 
          className="absolute bottom-0 w-full bg-white border-t border-slate-100 px-6 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          {/* Chip de Resumen */}
          {totalSelectionCount > 0 && (
            <View className="self-center bg-slate-900 px-4 py-1.5 rounded-full mb-4 shadow-sm">
              <Text className="text-white text-xs font-bold">
                {selectedAthletes.length} atletas • {selectedGroups.length} grupos seleccionados
              </Text>
            </View>
          )}

          <Pressable
            onPress={handleAssign}
            disabled={totalSelectionCount === 0}
            className={`w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg transition-all active:scale-[0.98] ${
              totalSelectionCount > 0 
                ? 'bg-blue-600 shadow-blue-600/30' 
                : 'bg-slate-200 shadow-none opacity-80'
            }`}
          >
            <Clock size={20} color={totalSelectionCount > 0 ? "white" : "#94a3b8"} style={{ marginRight: 8 }} />
            <Text className={`font-bold text-lg tracking-wide ${totalSelectionCount > 0 ? 'text-white' : 'text-slate-500'}`}>
              Confirmar Asignación
            </Text>
          </Pressable>
        </View>

      </SafeAreaView>
    </View>
  );
}