import React, { useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Alert,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, Users, UserPlus, Send, MoreVertical, TrendingUp, Award, Calendar, MessageSquare, Target, Check } from "lucide-react-native";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "GroupDetail">;

const groupMembers = [
  { id: 1, name: 'Alex Johnson', avatar: '👨', age: 24, level: 'Avanzado', joinDate: 'Hace 3 meses', testsCompleted: 12, avgPerformance: 'Excelente', lastActivity: 'Hace 2 horas', progress: 85 },
  { id: 2, name: 'Maria García', avatar: '👩', age: 28, level: 'Intermedio', joinDate: 'Hace 2 meses', testsCompleted: 8, avgPerformance: 'Bueno', lastActivity: 'Hace 5 horas', progress: 72 },
  { id: 4, name: 'Sarah Miller', avatar: '👩', age: 26, level: 'Avanzado', joinDate: 'Hace 4 meses', testsCompleted: 15, avgPerformance: 'Excelente', lastActivity: 'Hace 1 día', progress: 90 },
  { id: 5, name: 'John Smith', avatar: '👨', age: 30, level: 'Intermedio', joinDate: 'Hace 1 mes', testsCompleted: 6, avgPerformance: 'Bueno', lastActivity: 'Hace 2 días', progress: 68 },
  { id: 6, name: 'Emma Wilson', avatar: '👩', age: 25, level: 'Avanzado', joinDate: 'Hace 3 meses', testsCompleted: 14, avgPerformance: 'Excelente', lastActivity: 'Hace 3 horas', progress: 88 },
];

const performanceColors: any = {
  'Excelente': { bg: 'bg-green-100', text: 'text-green-700' },
  'Bueno': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Mejorable': { bg: 'bg-orange-100', text: 'text-orange-700' },
};

export default function GroupDetail({ navigation, route }: Props) {
  const { group } = route.params || {};
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  // Datos del grupo (si no vienen params, usa default)
  const groupData = group || {
    name: 'Fuerza Avanzada',
    color: '#007BFF', // fallback color
    description: 'Grupo enfocado en desarrollo de fuerza máxima y técnica avanzada',
    createdDate: 'Hace 6 meses',
    members: groupMembers.length
  };

  // Convertimos el color de clase Tailwind (ej: 'bg-indigo-100') a Hex si es necesario, 
  // o usamos el valor directo. Para simplificar visualmente aquí usaremos un azul por defecto si es clase.
  const headerColor = groupData.iconColor || '#007BFF'; 

  const toggleMember = (memberId: number) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleAssignTest = () => {
    if (selectedMembers.length === 0) {
      Alert.alert("Selección vacía", "Selecciona al menos un atleta para asignar la prueba.");
      return;
    }
    // Navegar al flujo de asignación
    navigation.navigate('AssignTestStep1');
  };

  const handleOptions = () => {
    Alert.alert(
      "Opciones del Grupo",
      "¿Qué deseas hacer?",
      [
        { text: "Editar Grupo", onPress: () => console.log("Editar") },
        { text: "Añadir Miembros", onPress: () => console.log("Añadir") },
        { text: "Exportar Datos", onPress: () => console.log("Exportar") },
        { text: "Eliminar Grupo", onPress: () => console.log("Eliminar"), style: "destructive" },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  const avgProgress = Math.round(
    groupMembers.reduce((sum, member) => sum + member.progress, 0) / groupMembers.length
  );

  const totalTests = groupMembers.reduce((sum, member) => sum + member.testsCompleted, 0);

  return (
    <View className="flex-1 bg-[#F5F5F7]">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* --- HEADER --- */}
        <View className="bg-white shadow-sm border-b border-gray-100 px-6 pt-4 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable 
              onPress={() => navigation.goBack()}
              className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
            >
              <ArrowLeft size={22} color="#4B5563" />
            </Pressable>
            
            <View className="flex-1 items-center">
               {/* Titulo centrado o alineado */}
            </View>

            <Pressable 
              onPress={handleOptions}
              className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
            >
              <MoreVertical size={22} color="#4B5563" />
            </Pressable>
          </View>

          <View className="flex-row items-center gap-4 mb-2">
            <View 
              className="w-14 h-14 rounded-2xl items-center justify-center"
              style={{ backgroundColor: `${headerColor}20` }} // 20% opacidad
            >
               <Users size={28} color={headerColor} />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">{groupData.name}</Text>
              <Text className="text-sm text-gray-500">{groupData.members || groupMembers.length} miembros • {groupData.createdDate}</Text>
            </View>
          </View>

          <Text className="text-sm text-gray-600 leading-5 mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
            {groupData.description || 'Sin descripción'}
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* --- STATS CARDS --- */}
          <View className="px-6 mt-6">
            <View className="flex-row justify-between gap-3">
              <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm items-center border border-gray-100">
                <View className="bg-blue-50 p-2 rounded-xl mb-2">
                  <Users size={20} color="#2563EB" />
                </View>
                <Text className="text-xl font-bold text-gray-900">{groupMembers.length}</Text>
                <Text className="text-xs text-gray-500">Miembros</Text>
              </View>

              <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm items-center border border-gray-100">
                <View className="bg-green-50 p-2 rounded-xl mb-2">
                  <Target size={20} color="#16A34A" />
                </View>
                <Text className="text-xl font-bold text-gray-900">{totalTests}</Text>
                <Text className="text-xs text-gray-500">Pruebas</Text>
              </View>

              <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm items-center border border-gray-100">
                <View className="bg-purple-50 p-2 rounded-xl mb-2">
                  <TrendingUp size={20} color="#9333EA" />
                </View>
                <Text className="text-xl font-bold text-gray-900">{avgProgress}%</Text>
                <Text className="text-xs text-gray-500">Progreso</Text>
              </View>
            </View>
          </View>

          {/* --- QUICK ACTIONS --- */}
          <View className="px-6 mt-6">
            <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <Text className="text-gray-900 font-bold text-base mb-4">Acciones Rápidas</Text>
              <View className="flex-row gap-3">
                <Pressable 
                  onPress={() => navigation.navigate('AssignTestStep1')}
                  className="flex-1 bg-blue-600 h-12 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 active:scale-[0.98]"
                >
                  <Send size={18} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-bold text-sm">Asignar Prueba</Text>
                </Pressable>
                
                <Pressable 
                  onPress={() => Alert.alert("Mensaje", "Funcionalidad de chat en desarrollo")}
                  className="flex-1 bg-white border border-blue-600 h-12 rounded-2xl flex-row items-center justify-center active:bg-blue-50"
                >
                  <MessageSquare size={18} color="#2563EB" style={{ marginRight: 8 }} />
                  <Text className="text-blue-600 font-bold text-sm">Mensaje</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* --- SELECTION INFO --- */}
          {selectedMembers.length > 0 && (
            <View className="px-6 mt-6">
              <View className="bg-blue-600 rounded-2xl p-4 flex-row justify-between items-center shadow-lg shadow-blue-300">
                <View>
                  <Text className="text-blue-100 text-xs font-bold uppercase">Seleccionados</Text>
                  <Text className="text-white text-xl font-bold">{selectedMembers.length} atletas</Text>
                </View>
                <Pressable 
                  onPress={handleAssignTest}
                  className="bg-white px-4 py-2 rounded-xl"
                >
                  <Text className="text-blue-600 font-bold text-xs">Asignar a Selección</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* --- MEMBERS LIST --- */}
          <View className="px-6 mt-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-900 font-bold text-lg">Miembros del Grupo</Text>
              <Pressable 
                onPress={() => Alert.alert("Añadir", "Abrir modal de búsqueda de atletas")}
                className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-full"
              >
                <UserPlus size={14} color="#2563EB" style={{ marginRight: 4 }} />
                <Text className="text-blue-600 text-xs font-bold">Añadir</Text>
              </Pressable>
            </View>

            <View className="space-y-3">
              {groupMembers.map((member) => {
                const isSelected = selectedMembers.includes(member.id);
                return (
                  <Pressable
                    key={member.id}
                    onPress={() => toggleMember(member.id)}
                    className={`bg-white p-4 rounded-2xl border transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100'
                    }`}
                  >
                    <View className="flex-row items-start gap-4">
                      
                      {/* Checkbox / Avatar */}
                      <View>
                        <View className={`w-5 h-5 rounded-md border flex items-center justify-center mb-2 ${
                          isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <Check size={12} color="white" />}
                        </View>
                        <Text className="text-3xl">{member.avatar}</Text>
                      </View>

                      <View className="flex-1">
                        <View className="flex-row justify-between items-start mb-1">
                          <View>
                            <Text className="text-gray-900 font-bold text-base">{member.name}</Text>
                            <Text className="text-gray-500 text-xs">{member.age} años • {member.level}</Text>
                          </View>
                          <View className={`px-2 py-1 rounded-full ${performanceColors[member.avgPerformance].bg}`}>
                            <Text className={`text-[10px] font-bold ${performanceColors[member.avgPerformance].text} uppercase`}>
                              {member.avgPerformance}
                            </Text>
                          </View>
                        </View>

                        {/* Progress Bar */}
                        <View className="mt-2">
                          <View className="flex-row justify-between mb-1">
                            <Text className="text-[10px] text-gray-400">Progreso General</Text>
                            <Text className="text-[10px] text-gray-900 font-bold">{member.progress}%</Text>
                          </View>
                          <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <View 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${member.progress}%` }} 
                            />
                          </View>
                        </View>

                        <Text className="text-[10px] text-gray-400 mt-2 text-right">
                          Última actividad: {member.lastActivity}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}