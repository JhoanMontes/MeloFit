import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Target,
  Eye,
  Check,
  Users,
  Search, // Restaurado (aunque esté oculto visualmente)
  User    // Restaurado
} from "lucide-react-native";
// IMPORTANTE: El nuevo selector de fecha
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from "../../lib/supabase"; 
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "AssignTestStep2">;

export default function AssignTestStep2({ navigation, route }: Props) {
  const { test, targetGroup } = route.params; 
  const insets = useSafeAreaInsets();

  // Estados principales
  const [athletesToAssign, setAthletesToAssign] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- LOGICA DE FECHA MEJORADA ---
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Estados Legacy (Mantengo esto para que no te de error de variables no usadas)
  const [activeTab, setActiveTab] = useState<'athletes' | 'groups'>('athletes');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. CARGA AUTOMÁTICA DE ATLETAS
  useEffect(() => {
    const loadGroupMembers = async () => {
      if (!targetGroup) {
          setLoading(false);
          return;
      }
      try {
        const { data, error } = await supabase
          .from('atleta_has_grupo')
          .select(`
            atleta_no_documento,
            atleta:atleta_no_documento (
              no_documento,
              usuario (nombre_completo)
            )
          `)
          .eq('grupo_codigo', targetGroup.codigo);

        if (error) throw error;

        const cleanData = data?.map((item: any) => ({
           no_documento: item.atleta.no_documento,
           nombre_completo: item.atleta.usuario?.nombre_completo || "Sin Nombre"
        })) || [];

        setAthletesToAssign(cleanData);
      } catch (error: any) {
        console.error("Error loading members:", error);
        Alert.alert("Error", "No se pudieron cargar los miembros del grupo.");
      } finally {
        setLoading(false);
      }
    };
    loadGroupMembers();
  }, [targetGroup]);

  // --- FUNCIÓN CLAVE: CORRECCIÓN DE ZONA HORARIA ---
  // Esto arregla que te salga el día siguiente (5 dic) cuando es de noche (4 dic)
  const getLocalISOString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000; // Offset en milisegundos
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  };

  // Manejador del Calendario
  const onDateChange = (event: any, selectedDate?: Date) => {
    // En Android hay que ocultar el picker manualmente
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      setDeadlineDate(selectedDate);
    }
  };

  // 2. GUARDAR ASIGNACIÓN
  const handleAssign = async () => {
    if (!deadlineDate) {
        Alert.alert("Falta fecha", "Por favor selecciona una fecha límite tocando el calendario.");
        return;
    }

    if (athletesToAssign.length === 0) {
        Alert.alert("Atención", "El grupo está vacío o no se seleccionaron atletas.");
        return;
    }
    
    setSaving(true);
    try {
      // Usamos la función corregida para obtener la fecha local
      const todayString = getLocalISOString(new Date()); 
      const deadlineString = getLocalISOString(deadlineDate);

      // A. Crear Encabezado
      const { data: asignacionData, error: asignacionError } = await supabase
        .from('prueba_asignada')
        .insert({
          prueba_id: test.id,
          fecha_asignacion: todayString, // Ahora será la fecha local correcta
          fecha_limite: deadlineString
        })
        .select()
        .single();

      if (asignacionError) throw asignacionError;
      const asignacionId = asignacionData.id;

      // B. Crear Detalles
      const detalleRows = athletesToAssign.map(a => ({
        prueba_asignada_id: asignacionId,
        atleta_no_documento: a.no_documento
      }));

      const { error: detailError } = await supabase
        .from('prueba_asignada_has_atleta')
        .insert(detalleRows);

      if (detailError) throw detailError;

      Alert.alert(
        "¡Asignación Exitosa!", 
        `Prueba asignada correctamente para el ${deadlineString}.`, 
        [{ text: "Listo", onPress: () => navigation.pop(2) }] 
      );

    } catch (error: any) {
      console.error("Error asignando:", error);
      Alert.alert("Error", "Ocurrió un fallo al asignar la prueba.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          
          {/* HEADER */}
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
                <Text className="text-slate-500 text-sm font-medium">Paso 2: Confirmar</Text>
              </View>
            </View>
          </View>

          <ScrollView 
            className="flex-1 px-6"
            contentContainerStyle={{ paddingBottom: 160 }} 
            showsVerticalScrollIndicator={false}
          >
            
            {/* RESUMEN PRUEBA */}
            <View className="bg-white rounded-[32px] p-6 mb-6 shadow-sm border border-slate-100 flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-2">
                    <View className="bg-blue-100 px-2 py-1 rounded-md mr-2">
                        <Text className="text-[10px] font-bold text-blue-700 uppercase">Seleccionada</Text>
                    </View>
                </View>
                <Text className="text-slate-900 text-xl font-bold mb-1">{test?.nombre}</Text>
                <Text className="text-slate-500 text-sm leading-5" numberOfLines={2}>
                    {test?.descripcion || 'Sin descripción'}
                </Text>
              </View>
              <Pressable 
                onPress={() => navigation.navigate('TestDetail', { test })}
                className="bg-blue-50 w-12 h-12 rounded-full items-center justify-center active:bg-blue-100 border border-blue-100"
              >
                <Eye size={22} color="#2563EB" />
              </Pressable>
            </View>

            {/* TARJETA GRUPO */}
            {targetGroup && (
                <View className="bg-blue-600 rounded-[24px] p-6 mb-8 shadow-lg shadow-blue-200">
                    <View className="flex-row items-center space-x-3 mb-4">
                        <View className="bg-white/20 p-2 rounded-lg">
                            <Users size={20} color="white" />
                        </View>
                        <View>
                            <Text className="text-blue-100 text-xs font-medium uppercase">Asignando a Grupo</Text>
                            <Text className="text-white font-bold text-lg">
                                {targetGroup.nombre}
                            </Text>
                        </View>
                    </View>
                    
                    <View className="bg-white/10 rounded-xl p-4 flex-row items-center">
                        {loading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <Check size={16} color="#93C5FD" style={{ marginRight: 8 }} />
                                <Text className="text-white font-medium text-sm">
                                    {athletesToAssign.length > 0 
                                        ? `${athletesToAssign.length} atletas recibirán esta prueba`
                                        : "No se encontraron atletas en este grupo"
                                    }
                                </Text>
                            </>
                        )}
                    </View>
                </View>
            )}

            {/* FECHA LÍMITE (SELECTOR MEJORADO) */}
            <View className="mb-8">
              <Text className="text-slate-700 font-bold text-sm ml-1 mb-3">Fecha Límite</Text>
              
              <Pressable 
                onPress={() => setShowDatePicker(true)}
                className="bg-white border border-slate-200 rounded-2xl h-14 flex-row items-center px-4 shadow-sm shadow-slate-200/50 active:bg-slate-50"
              >
                <Calendar size={20} color="#94a3b8" style={{ marginRight: 12 }} />
                
                {/* Texto condicional: si hay fecha la muestra, si no muestra placeholder */}
                {deadlineDate ? (
                    <Text className="text-slate-900 text-base font-medium">
                        {/* Mostramos fecha legible ej: 04/12/2025 */}
                        {deadlineDate.toLocaleDateString()} 
                    </Text>
                ) : (
                    <Text className="text-slate-400 text-base font-medium">
                        Seleccionar fecha...
                    </Text>
                )}
              </Pressable>

              {/* Componente del Selector (Solo visible cuando showDatePicker es true) */}
              {showDatePicker && (
                <DateTimePicker
                    value={deadlineDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    minimumDate={new Date()} // Evita seleccionar el pasado
                />
              )}
            </View>

            {/* --- SECCIÓN MANUAL (COMENTADA Y OCULTA) --- */}
            {/*
            <View>
              <Text className="text-slate-900 font-bold text-lg mb-4">¿A quién va dirigida?</Text>
              <View className="bg-slate-200/50 p-1 rounded-2xl flex-row mb-6">
                <Pressable onPress={() => setActiveTab('athletes')} className={`flex-1 py-3 rounded-xl items-center justify-center ${activeTab === 'athletes' ? 'bg-white shadow-sm' : ''}`}>
                  <Text className={`font-bold text-sm ${activeTab === 'athletes' ? 'text-blue-600' : 'text-slate-500'}`}>Atletas</Text>
                </Pressable>
                <Pressable onPress={() => setActiveTab('groups')} className={`flex-1 py-3 rounded-xl items-center justify-center ${activeTab === 'groups' ? 'bg-white shadow-sm' : ''}`}>
                  <Text className={`font-bold text-sm ${activeTab === 'groups' ? 'text-blue-600' : 'text-slate-500'}`}>Grupos</Text>
                </Pressable>
              </View>
              <View className="relative mb-6">
                <View className="absolute left-4 top-4 z-10"><Search size={20} color="#9CA3AF" /></View>
                <TextInput placeholder="Buscar..." value={searchQuery} onChangeText={setSearchQuery} className="bg-white border border-slate-200 rounded-2xl h-14 pl-12 pr-4 text-base" />
              </View>
            </View> 
            */}

          </ScrollView>
        </KeyboardAvoidingView>

        {/* FOOTER */}
        <View 
          className="absolute bottom-0 w-full bg-white border-t border-slate-100 px-6 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <Pressable
            onPress={handleAssign}
            disabled={loading || saving || athletesToAssign.length === 0}
            className={`w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg transition-all active:scale-[0.98] ${
              !loading && !saving && athletesToAssign.length > 0 && deadlineDate
                ? 'bg-blue-600 shadow-blue-600/30' 
                : 'bg-slate-200 shadow-none opacity-80'
            }`}
          >
            {saving ? (
                 <ActivityIndicator size="small" color="white" />
            ) : (
                <>
                    <Clock size={20} color={deadlineDate ? "white" : "#94a3b8"} style={{ marginRight: 8 }} />
                    <Text className={`font-bold text-lg tracking-wide ${deadlineDate ? 'text-white' : 'text-slate-500'}`}>
                    Confirmar Asignación
                    </Text>
                </>
            )}
          </Pressable>
        </View>

      </SafeAreaView>
    </View>
  );
}