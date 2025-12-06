import React, { useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Search, Dumbbell, Activity, Timer, ChevronRight } from "lucide-react-native";
import { supabase } from "../../lib/supabase"; 
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "AssignTestStep1">;

export interface Prueba {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo_metrica: string;
}

// 1. OJO: Agregamos 'route' aquí para recibir los parametros
export default function AssignTestStep1({ navigation, route }: Props) {
  
  // 2. RECUPERAMOS EL GRUPO (Si viene undefined, todo fallará después)
  const { targetGroup } = route.params || {}; 

  const [searchQuery, setSearchQuery] = useState('');
  const [tests, setTests] = useState<Prueba[]>([]);
  const [loading, setLoading] = useState(true);

  // ... (tu fetchTests sigue igual) ...
  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('prueba')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      if (data) setTests(data);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTests();
    }, [])
  );

  const handleSelectTest = (test: Prueba) => {
    console.log("Navegando al paso 2 con grupo:", targetGroup); // Log de seguridad
    
    // 3. ¡AQUÍ ESTÁ LA CORRECCIÓN! Pasamos el targetGroup al siguiente paso
    navigation.navigate('AssignTestStep2', { 
        test, 
        targetGroup 
    }); 
  };

  // ... (tu lógica de categorías sigue igual) ...
  const getCategorizedTests = () => {
    const filteredTests = tests.filter(t => 
      t.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const categoriesStructure = [
      { key: 'fuerza', category: 'Fuerza', Icon: Dumbbell, color: '#2563EB', bg: 'bg-blue-50', metrics: ['WEIGHT_KG', 'REPS'] },
      { key: 'resistencia', category: 'Resistencia', Icon: Activity, color: '#059669', bg: 'bg-emerald-50', metrics: ['DISTANCE_KM'] },
      { key: 'velocidad', category: 'Velocidad / Tiempo', Icon: Timer, color: '#EA580C', bg: 'bg-orange-50', metrics: ['TIME_MIN'] }
    ];
    return categoriesStructure.map(cat => ({
      ...cat,
      tests: filteredTests.filter(t => t.tipo_metrica && cat.metrics.includes(t.tipo_metrica.toUpperCase()))
    })).filter(cat => cat.tests.length > 0); 
  };

  const categoriesToRender = getCategorizedTests();

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* HEADER */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center mb-8">
            <Pressable onPress={() => navigation.goBack()} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-200 mr-5">
              <ArrowLeft size={22} color="#334155" />
            </Pressable>
            <View>
              <Text className="text-slate-900 text-2xl font-extrabold tracking-tight">Asignar Prueba</Text>
              {/* Feedback visual para saber si tenemos el grupo */}
              <Text className="text-slate-500 text-sm font-medium">
                  {targetGroup ? `Para: ${targetGroup.nombre}` : "Selecciona una evaluación"}
              </Text>
            </View>
          </View>

          {/* Buscador */}
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

        {loading ? (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        ) : (
            <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 60, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
                {categoriesToRender.length > 0 ? (
                    <View className="space-y-8">
                        {categoriesToRender.map((category) => (
                        <View key={category.key} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                            <View className="flex-row items-center space-x-4 mb-6 pb-4 border-b border-slate-50">
                                <View className={`p-3 rounded-2xl ${category.bg}`}>
                                    <category.Icon size={24} color={category.color} />
                                </View>
                                <Text className="text-slate-900 font-bold text-xl">{category.category}</Text>
                            </View>
                            <View className="space-y-4">
                            {category.tests.map((test) => (
                                <Pressable key={test.id} onPress={() => handleSelectTest(test)} className="flex-row items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 active:bg-blue-50 active:border-blue-100 transition-all">
                                <View className="flex-1 mr-4">
                                    <Text className="text-slate-900 font-bold text-base mb-1">{test.nombre}</Text>
                                    <Text className="text-slate-500 text-xs font-medium leading-4" numberOfLines={2}>{test.descripcion || "Sin descripción"}</Text>
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
                ) : (
                    <View className="items-center justify-center py-10">
                        <Text className="text-slate-400 font-medium">No se encontraron pruebas.</Text>
                    </View>
                )}
                <View className="h-8" />
            </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}