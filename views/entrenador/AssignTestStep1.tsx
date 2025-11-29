import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  StatusBar 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
  ArrowLeft, 
  Search, 
  Dumbbell, 
  Activity, 
  Timer, 
  ChevronRight, 
  Plus 
} from "lucide-react-native";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "AssignTestStep1">;

export interface TestData {
  id: number;
  name: string;
  description: string;
  type: string;
}

const testCategories = [
  {
    category: 'Fuerza',
    Icon: Dumbbell,
    color: '#2563EB', // blue-600
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    tests: [
      { id: 1, name: 'Press de Banca', description: 'Peso máximo × reps', type: 'Fuerza' },
      { id: 2, name: 'Sentadilla', description: 'Peso máximo × reps', type: 'Fuerza' },
      { id: 3, name: 'Peso Muerto', description: 'Peso máximo × reps', type: 'Fuerza' }
    ]
  },
  {
    category: 'Resistencia',
    Icon: Activity,
    color: '#059669', // emerald-600
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    tests: [
      { id: 4, name: 'Test de Cooper', description: 'Basado en distancia', type: 'Resistencia' },
      { id: 5, name: 'Carrera 5km', description: 'Basado en tiempo', type: 'Resistencia' },
      { id: 6, name: 'Carrera 10km', description: 'Basado en tiempo', type: 'Resistencia' },
      { id: 7, name: 'Ciclismo 20km', description: 'Basado en tiempo', type: 'Resistencia' }
    ]
  },
  {
    category: 'Velocidad',
    Icon: Timer,
    color: '#EA580C', // orange-600
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    tests: [
      { id: 8, name: 'Sprint 100m', description: 'Mejor tiempo', type: 'Velocidad' },
      { id: 9, name: 'Sprint 400m', description: 'Mejor tiempo', type: 'Velocidad' }
    ]
  }
];

export default function AssignTestStep1({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectTest = (test: TestData) => {
    // CORRECCIÓN: Descomentamos la navegación
    navigation.navigate('AssignTestStep2', { test }); 
  };

  // Lógica de filtrado original
  const filteredCategories = testCategories.map(cat => ({
    ...cat,
    tests: cat.tests.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.tests.length > 0);

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* --- HEADER --- */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center mb-8">
            <Pressable 
              onPress={() => navigation.goBack()} 
              className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-200 mr-5 active:bg-slate-50"
            >
              <ArrowLeft size={22} color="#334155" />
            </Pressable>
            <View>
              <Text className="text-slate-900 text-2xl font-extrabold tracking-tight">Asignar Prueba</Text>
              <Text className="text-slate-500 text-sm font-medium">Selecciona una evaluación</Text>
            </View>
          </View>

          {/* Buscador (Más alto y espaciado) */}
          <View className="relative mb-2">
            <View className="absolute left-4 top-4 z-10">
              <Search size={22} color="#9CA3AF" />
            </View>
            <TextInput
              placeholder="Buscar prueba..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-white border border-slate-200 rounded-2xl h-14 pl-12 pr-4 text-base text-slate-900 font-medium shadow-sm shadow-slate-200/50"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <ScrollView 
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 60, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
        >
          
          {/* --- CATEGORÍAS --- */}
          <View className="space-y-8">
            {filteredCategories.map((category, index) => (
              <View 
                key={index} 
                className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100"
              >
                
                {/* Header Categoría */}
                <View className="flex-row items-center space-x-4 mb-6 pb-4 border-b border-slate-50">
                  <View className={`p-3 rounded-2xl ${category.bg}`}>
                    <category.Icon size={24} color={category.color} />
                  </View>
                  <Text className="text-slate-900 font-bold text-xl">{category.category}</Text>
                </View>

                {/* Lista de Pruebas */}
                <View className="space-y-4">
                  {category.tests.map((test) => (
                    <Pressable
                      key={test.id}
                      onPress={() => handleSelectTest(test)}
                      className="flex-row items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 active:bg-blue-50 active:border-blue-100 transition-all"
                    >
                      <View className="flex-1 mr-4">
                        <Text className="text-slate-900 font-bold text-base mb-1">{test.name}</Text>
                        <Text className="text-slate-500 text-xs font-medium leading-4">{test.description}</Text>
                      </View>
                      
                      <View className="bg-white w-10 h-10 rounded-full items-center justify-center shadow-sm border border-slate-100">
                        <ChevronRight size={18} color="#cbd5e1" />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* --- CREAR PRUEBA PERSONALIZADA --- */}
          <Pressable 
            onPress={() => navigation.navigate('AdminCreateTest')}
            className="mt-10 w-full bg-blue-600 rounded-[28px] p-6 flex-row items-center justify-between shadow-xl shadow-blue-600/30 active:scale-[0.98] active:opacity-90"
          >
            <View className="flex-row items-center space-x-5">
              <View className="bg-white/20 p-3.5 rounded-2xl">
                <Plus size={26} color="white" />
              </View>
              <View>
                <Text className="text-white font-bold text-lg">Crear Personalizada</Text>
                <Text className="text-blue-100 text-sm font-medium">Diseña tu propia evaluación</Text>
              </View>
            </View>
            <View className="bg-white/10 w-10 h-10 rounded-full items-center justify-center">
                <ChevronRight size={20} color="white" />
            </View>
          </Pressable>

          {/* Espaciador final */}
          <View className="h-8" />

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}