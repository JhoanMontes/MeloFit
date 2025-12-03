import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  TextInput, 
  FlatList,
  ActivityIndicator, 
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "MyGroups">;

interface GroupData {
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export default function MyGroups({ navigation }: Props) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // 1. ESTADOS PARA LOS DATOS REALES
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. FUNCIÓN PARA TRAER DATOS (Se ejecuta al entrar a la pantalla)
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchGroups = async () => {
        console.log("🔄 Iniciando búsqueda de grupos...");

        // 1. CORRECCIÓN PRINCIPAL: Si no hay user, apagamos loading y salimos
        if (!user) {
          console.log("⚠️ No se detectó usuario logueado en useAuth");
          setLoading(false);
          return;
        }

        try {
          // A. Buscamos el ID numérico del entrenador
          console.log("📍 Buscando datos del entrenador para auth_id:", user.id);
          
          const { data: trainerData, error: trainerError } = await supabase
            .from('usuario')
            .select('no_documento')
            .eq('auth_id', user.id)
            .single();

          if (trainerError) {
            console.error("❌ Error buscando entrenador:", trainerError.message);
            throw trainerError;
          }
          
          if (!trainerData) {
            console.error("❌ No se encontró la fila del entrenador en la tabla 'usuario'");
            throw new Error("Entrenador no encontrado");
          }

          console.log("✅ Entrenador encontrado. ID:", trainerData.no_documento);

          // B. Buscamos los grupos
          const { data: groupsData, error: groupsError } = await supabase
            .from('grupo')
            .select('*')
            .eq('entrenador_no_documento', trainerData.no_documento)
            .order('fecha_creacion', { ascending: false });

          if (groupsError) {
            console.error("❌ Error buscando grupos:", groupsError.message);
            throw groupsError;
          }

          console.log("✅ Grupos encontrados:", groupsData?.length);

          if (isActive && groupsData) {
            setGroups(groupsData);
          }

        } catch (error: any) {
          console.error("💥 Error General:", error.message);
          // Opcional: Mostrar alerta si falla
          // Alert.alert("Error", "No se pudieron cargar los datos");
        } finally {
          // ESTO ASEGURA QUE EL LOADING SE APAGUE SIEMPRE
          if (isActive) {
            console.log("🏁 Finalizando carga (setLoading false)");
            setLoading(false);
          }
        }
      };

      fetchGroups();

      return () => { isActive = false; };
    }, [user])
  );

  // 3. FILTRADO CLIENT-SIDE (Más rápido para listas pequeñas)
  const filteredGroups = groups.filter(g => 
    g.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.codigo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 4. RENDER ITEM ADAPTADO A TU BASE DE DATOS
  const renderItem = ({ item }: { item: GroupData }) => (
    <Pressable 
      // @ts-ignore - Ajusta el tipo en tu navegación si es necesario
      onPress={() => navigation.navigate('GroupDetail', { group: item })}
      className="bg-white p-4 rounded-2xl mb-3 flex-row items-center justify-between shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center flex-1 mr-4">
        {/* Icono de Grupo */}
        <View className="bg-blue-50 w-10 h-10 rounded-full items-center justify-center mr-3">
          <Ionicons name="people-outline" size={20} color="#2563EB" />
        </View>
        
        <View className="flex-1">
          {/* Nombre desde BD */}
          <Text className="text-gray-900 font-bold text-base">{item.nombre}</Text>
          
          {/* Descripción desde BD (con fallback si está vacía) */}
          <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
            {item.descripcion || "Sin descripción"}
          </Text>
          
          <View className="flex-row items-center mt-1 space-x-3">
            {/* Código */}
            <View className="flex-row items-center">
                <Ionicons name="pricetag-outline" size={12} color="#6B7280" />
                <Text className="text-gray-400 text-[10px] ml-1 uppercase font-bold">
                    COD: {item.codigo}
                </Text>
            </View>
            
            {/* Miembros (Hardcodeado por ahora hasta tener la tabla de relación) */}
            {/* <View className="flex-row items-center ml-2">
                <Ionicons name="person" size={10} color="#9CA3AF" />
                <Text className="text-gray-400 text-[10px] ml-0.5">0</Text>
            </View> */}
          </View>
        </View>
      </View>
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
          <Text className="text-gray-900 text-3xl font-bold">Mis Grupos</Text>
          <Text className="text-gray-500 text-base">Gestiona tus equipos y atletas</Text>
        </View>

        {/* --- BOTÓN CREAR --- */}
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
          <View className="mb-4 relative">
             <View className="absolute left-4 top-3.5 z-10">
              <Ionicons name="search" size={20} color="#9CA3AF" />
            </View>
            <TextInput
              placeholder="Buscar grupo o código..."
              value={searchQuery}
              onChangeText={setSearchQuery}
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
            <Text className="text-gray-900 font-bold text-lg">
                Listado ({filteredGroups.length})
            </Text>
          </View>

          {/* INDICADOR DE CARGA */}
          {loading ? (
             <View className="mt-10">
                 <ActivityIndicator size="large" color="#2563EB" />
                 <Text className="text-center text-gray-400 mt-2">Cargando grupos...</Text>
             </View>
          ) : (
            <FlatList
                data={filteredGroups}
                keyExtractor={(item) => item.codigo} 
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={
                <View className="items-center justify-center py-10">
                    <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
                    <Text className="text-gray-400 mt-2 text-center">
                        No tienes grupos creados.{'\n'}¡Crea el primero arriba!
                    </Text>
                </View>
                }
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}