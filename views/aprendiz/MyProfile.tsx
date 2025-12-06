import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  StatusBar,
  ActivityIndicator,
  Modal, // Importamos Modal
  FlatList
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
  ArrowLeft, 
  Save, 
  Info, 
  User, 
  Lock, 
  Ruler, 
  Weight, 
  Calendar,
  ChevronDown, // Icono para el select
  Check,
  X
} from "lucide-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { AprendizStackParamList } from "../../navigation/types";

// Integración Supabase
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

type Props = NativeStackScreenProps<AprendizStackParamList, "Profile">;

// Interfaz para los géneros de la BD
interface GenderOption {
  id: number;
  nombre: string;
}

export default function MyProfile({ navigation }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados del Formulario
  const [formData, setFormData] = useState({
    name: '',
    documentNumber: '',
    height: '',
    weight: '',
    genderId: null as number | null, // Guardamos el ID
    genderName: '' // Guardamos el nombre para mostrarlo
  });

  // Estados Fecha
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Estados Género (Select)
  const [genderOptions, setGenderOptions] = useState<GenderOption[]>([]);
  const [showGenderModal, setShowGenderModal] = useState(false);

  // --- HELPER FECHAS ---
  const parseLocalDate = (dateString: string) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getLocalISOString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setBirthDate(selectedDate);
  };

  // 1. CARGAR DATOS INICIALES (Perfil + Catálogo de Géneros)
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // A. Cargar catálogo de géneros
        const { data: gendersData } = await supabase.from('genero').select('*');
        if (gendersData) setGenderOptions(gendersData);

        // B. Cargar datos del usuario
        const { data: userData, error: userError } = await supabase
          .from('usuario')
          .select('no_documento, nombre_completo')
          .eq('auth_id', user.id)
          .single();

        if (userError) throw userError;

        // C. Cargar datos del atleta (incluyendo genero_id)
        const { data: athleteData } = await supabase
          .from('atleta')
          .select('estatura, peso, fecha_nacimiento, genero_id')
          .eq('no_documento', userData.no_documento)
          .single();

        // Encontrar el nombre del género si existe
        const currentGender = gendersData?.find(g => g.id === athleteData?.genero_id);

        setFormData({
          name: userData.nombre_completo || '',
          documentNumber: userData.no_documento.toString(),
          height: athleteData?.estatura ? athleteData.estatura.toString() : '',
          weight: athleteData?.peso ? athleteData.peso.toString() : '',
          genderId: athleteData?.genero_id || null,
          genderName: currentGender ? currentGender.nombre : ''
        });

        if (athleteData?.fecha_nacimiento) {
            setBirthDate(parseLocalDate(athleteData.fecha_nacimiento));
        }

      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // 2. GUARDAR CAMBIOS
  const handleSave = async () => {
    if (!formData.documentNumber) return;

    setSaving(true);
    try {
      const heightVal = parseFloat(formData.height);
      const weightVal = parseInt(formData.weight);

      if (formData.height && isNaN(heightVal)) {
        Alert.alert("Error", "La altura debe ser un número válido.");
        setSaving(false); return;
      }

      // Objeto de actualización
      const updates: any = {
        estatura: heightVal || null,
        peso: weightVal || null,
        genero_id: formData.genderId // Guardamos el ID del género
      };

      if (birthDate) {
          updates.fecha_nacimiento = getLocalISOString(birthDate);
      }

      const { error } = await supabase
        .from('atleta')
        .update(updates)
        .eq('no_documento', parseInt(formData.documentNumber));

      if (error) throw error;

      Alert.alert("Perfil Actualizado", "Tus datos han sido guardados correctamente.", [
        { text: "Entendido", onPress: () => navigation.goBack() } 
      ]);

    } catch (error: any) {
      console.error("Error guardando:", error);
      Alert.alert("Error", "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView 
            contentContainerStyle={{ paddingBottom: 150 }}
            showsVerticalScrollIndicator={false}
          >

            {/* HEADER NAV */}
            <View className="px-6 pt-4 pb-2">
              <Pressable
                onPress={() => navigation.goBack()}
                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-200 active:bg-slate-50"
              >
                <ArrowLeft size={22} color="#334155" />
              </Pressable>
            </View>

            {/* HERO SECTION */}
            <View className="items-center mt-4 mb-8 px-6">
              <View className="w-28 h-28 bg-blue-100 rounded-full items-center justify-center mb-5 border-[6px] border-white shadow-sm">
                <User size={56} color="#2563EB" />
                <View className="absolute bottom-0 right-0 bg-blue-600 p-2.5 rounded-full border-4 border-white">
                  <User size={14} color="white" />
                </View>
              </View>
              <Text className="text-slate-900 text-3xl font-extrabold tracking-tight">Mi Perfil</Text>
              <Text className="text-slate-500 text-base font-medium mt-1">Actualiza tu información personal</Text>
            </View>

            {/* CONTENEDOR PRINCIPAL */}
            <View className="px-6 gap-y-8">

              {/* CARD IDENTIDAD */}
              <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 gap-y-6">
                <View className="flex-row items-center justify-between pb-2 border-b border-slate-50">
                  <View className="flex-row items-center gap-x-3">
                    <View className="bg-slate-50 p-2 rounded-xl">
                      <User size={20} color="#64748b" />
                    </View>
                    <Text className="text-slate-900 font-bold text-lg">Identidad</Text>
                  </View>
                  <View className="bg-slate-100 px-3 py-1.5 rounded-lg flex-row items-center gap-x-1.5">
                    <Lock size={12} color="#94a3b8" />
                    <Text className="text-[10px] text-slate-500 font-bold uppercase">Protegido</Text>
                  </View>
                </View>

                <View className="gap-y-5">
                  <View className="gap-y-2">
                    <Text className="text-slate-700 font-semibold text-sm ml-1">Nombre Completo</Text>
                    <View className="bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14 justify-center">
                      <TextInput value={formData.name} editable={false} className="text-slate-500 font-medium text-base" />
                    </View>
                  </View>
                  <View className="gap-y-2">
                    <Text className="text-slate-700 font-semibold text-sm ml-1">Número de Documento</Text>
                    <View className="bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14 justify-center">
                      <TextInput value={formData.documentNumber} editable={false} className="text-slate-500 font-medium text-base" />
                    </View>
                  </View>
                </View>
              </View>

              {/* CARD DATOS FÍSICOS */}
              <View className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 gap-y-6">
                <View className="pb-2 border-b border-slate-50">
                  <Text className="text-slate-900 font-bold text-lg">Datos Físicos</Text>
                  <Text className="text-xs text-slate-400 font-medium mt-1">Información necesaria para tus métricas</Text>
                </View>

                {/* --- NUEVO: SELECTOR DE GÉNERO --- */}
                <View className="gap-y-2">
                  <Text className="text-slate-700 font-semibold text-sm ml-1">Género</Text>
                  <Pressable 
                    onPress={() => setShowGenderModal(true)}
                    className="bg-white border border-slate-200 rounded-2xl px-4 h-14 flex-row items-center justify-between shadow-sm shadow-slate-200/50 active:bg-slate-50"
                  >
                    <View className="flex-row items-center">
                        <User size={20} color="#94a3b8" className="mr-3" />
                        <Text className={`font-medium text-base ${formData.genderId ? 'text-slate-900' : 'text-slate-400'}`}>
                            {formData.genderName || "Seleccionar género"}
                        </Text>
                    </View>
                    <ChevronDown size={20} color="#64748b" />
                  </Pressable>
                </View>

                {/* FILA DE ALTURA Y PESO */}
                <View className="flex-row gap-x-4">
                  <View className="flex-1 gap-y-2">
                    <Text className="text-slate-700 font-semibold text-sm ml-1">Altura</Text>
                    <View className="bg-white border border-slate-200 rounded-2xl px-4 h-16 flex-row items-center focus:border-blue-500 shadow-sm shadow-slate-200/50">
                      <Ruler size={20} color="#94a3b8" className="mr-3" />
                      <TextInput
                        value={formData.height}
                        onChangeText={(text) => setFormData({ ...formData, height: text })}
                        keyboardType="numeric"
                        placeholder="0"
                        className="flex-1 text-slate-900 font-bold text-lg"
                      />
                      <Text className="text-slate-400 text-xs font-bold bg-slate-100 px-2 py-1 rounded">CM</Text>
                    </View>
                  </View>

                  <View className="flex-1 gap-y-2">
                    <Text className="text-slate-700 font-semibold text-sm ml-1">Peso</Text>
                    <View className="bg-white border border-slate-200 rounded-2xl px-4 h-16 flex-row items-center focus:border-blue-500 shadow-sm shadow-slate-200/50">
                      <Weight size={20} color="#94a3b8" className="mr-3" />
                      <TextInput
                        value={formData.weight}
                        onChangeText={(text) => setFormData({ ...formData, weight: text })}
                        keyboardType="numeric"
                        placeholder="0"
                        className="flex-1 text-slate-900 font-bold text-lg"
                      />
                      <Text className="text-slate-400 text-xs font-bold bg-slate-100 px-2 py-1 rounded">KG</Text>
                    </View>
                  </View>
                </View>

                {/* FECHA NACIMIENTO */}
                <View className="gap-y-2">
                  <Text className="text-slate-700 font-semibold text-sm ml-1">Fecha de Nacimiento</Text>
                  <Pressable onPress={() => setShowDatePicker(true)} className="bg-white border border-slate-200 rounded-2xl px-4 h-14 flex-row items-center shadow-sm shadow-slate-200/50 active:bg-slate-50">
                    <Calendar size={20} color="#94a3b8" className="mr-3" />
                    {birthDate ? (
                        <Text className="flex-1 text-slate-900 font-medium text-base">{birthDate.toLocaleDateString()}</Text>
                    ) : (
                        <Text className="flex-1 text-slate-400 font-medium text-base">Seleccionar fecha...</Text>
                    )}
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker value={birthDate || new Date(2000, 0, 1)} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onDateChange} maximumDate={new Date()} />
                  )}
                </View>
              </View>

              <View className="bg-blue-50/80 border border-blue-100 rounded-2xl p-5 flex-row items-start gap-x-3 mb-4">
                <Info size={22} color="#2563EB" style={{ marginTop: 2 }} />
                <Text className="text-blue-900 text-xs leading-5 font-medium flex-1">
                  Mantener tus datos actualizados nos ayuda a calcular tu IMC y personalizar tus cargas de entrenamiento.
                </Text>
              </View>

            </View>
          </ScrollView>

          {/* BOTÓN GUARDAR */}
          <View className="absolute bottom-0 w-full bg-white border-t border-slate-100 px-6 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
            <Pressable onPress={handleSave} disabled={saving} className={`w-full h-14 rounded-2xl flex-row justify-center items-center shadow-lg active:scale-[0.98] ${saving ? 'bg-blue-400 shadow-none' : 'bg-blue-600 shadow-blue-600/30'}`}>
              {saving ? <ActivityIndicator color="white" /> : (
                  <>
                    <Save size={20} color="white" className="mr-2" />
                    <Text className="text-white font-bold text-lg tracking-wide">Guardar Cambios</Text>
                  </>
              )}
            </Pressable>
          </View>

          {/* --- MODAL SELECTOR DE GÉNERO --- */}
          <Modal
            visible={showGenderModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowGenderModal(false)}
          >
            <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setShowGenderModal(false)}>
                <View className="bg-white rounded-t-[32px] p-6 pb-10">
                    <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mb-6" />
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xl font-bold text-slate-900">Selecciona tu Género</Text>
                        <Pressable onPress={() => setShowGenderModal(false)} className="p-2 bg-slate-100 rounded-full">
                            <X size={20} color="#64748b" />
                        </Pressable>
                    </View>
                    
                    {genderOptions.length === 0 ? (
                        <View className="py-4 items-center">
                            <Text className="text-slate-400">Cargando opciones...</Text>
                            <ActivityIndicator color="#2563EB" className="mt-2" />
                        </View>
                    ) : (
                        <FlatList 
                            data={genderOptions}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => {
                                        setFormData({ ...formData, genderId: item.id, genderName: item.nombre });
                                        setShowGenderModal(false);
                                    }}
                                    className={`p-4 mb-3 rounded-2xl flex-row justify-between items-center border ${
                                        formData.genderId === item.id 
                                            ? 'bg-blue-50 border-blue-200' 
                                            : 'bg-white border-slate-100'
                                    }`}
                                >
                                    <Text className={`text-base font-bold ${formData.genderId === item.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                        {item.nombre}
                                    </Text>
                                    {formData.genderId === item.id && (
                                        <View className="bg-blue-100 p-1 rounded-full">
                                            <Check size={16} color="#2563EB" />
                                        </View>
                                    )}
                                </Pressable>
                            )}
                        />
                    )}
                </View>
            </Pressable>
          </Modal>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}