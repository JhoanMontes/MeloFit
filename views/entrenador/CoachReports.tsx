import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  Modal, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, Download, FileSpreadsheet, ChevronDown, Check, Calendar } from "lucide-react-native";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "CoachReports">;

export default function CoachReports({ navigation }: Props) {
  const [filters, setFilters] = useState({
    type: '',
    selection: '',
    dateFrom: '',
    dateTo: ''
  });

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);

  const reportTypes = [
    { label: "Atleta Individual", value: "athlete" },
    { label: "Grupo Completo", value: "group" },
    { label: "Prueba Específica", value: "test" },
    { label: "Todos los Atletas", value: "all" },
  ];

  // Opciones dinámicas según el tipo seleccionado
  const getSelectionOptions = () => {
    switch(filters.type) {
      case 'athlete':
        return [
          { label: "Alex Johnson", value: "alex" },
          { label: "Maria García", value: "maria" },
          { label: "David Lee", value: "david" }
        ];
      case 'group':
        return [
          { label: "Fuerza Avanzada", value: "advanced" },
          { label: "Principiantes", value: "beginners" },
          { label: "Resistencia", value: "endurance" }
        ];
      case 'test':
        return [
          { label: "Test de Cooper", value: "cooper" },
          { label: "Sentadilla", value: "squat" },
          { label: "Peso Muerto", value: "deadlift" }
        ];
      default:
        return [];
    }
  };

  const getLabel = (options: {label: string, value: string}[], value: string) => {
    return options.find(o => o.value === value)?.label || "Selecciona una opción";
  };

  const handleDownload = () => {
    console.log('Descargando reporte:', filters);
    Alert.alert("Descarga Iniciada", "El reporte se está generando y se descargará en breve.", [
        { text: "OK", onPress: () => navigation.goBack() }
    ]);
  };

  const applyQuickFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setFilters({
      ...filters,
      dateFrom: start.toISOString().split('T')[0],
      dateTo: end.toISOString().split('T')[0]
    });
  };

  return (
    <View className="flex-1 bg-[#F5F5F7]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          
          {/* --- HEADER --- */}
          <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center mb-6">
              <Pressable 
                onPress={() => navigation.goBack()} 
                className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 mr-4"
              >
                <ArrowLeft size={20} color="#334155" />
              </Pressable>
              <View>
                <Text className="text-gray-900 text-2xl font-bold">Generar Reportes</Text>
                <Text className="text-gray-500 text-sm">Exporta datos de rendimiento</Text>
              </View>
            </View>
          </View>

          <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 100 }}>
            
            {/* 1. TIPO DE REPORTE */}
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm">
              <Text className="text-gray-900 font-bold text-base mb-1">Tipo de Reporte</Text>
              <Text className="text-gray-500 text-xs mb-4">Selecciona qué datos deseas exportar</Text>

              <View className="space-y-4">
                {/* Selector Tipo Principal */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">Reportar sobre</Text>
                  <Pressable
                    onPress={() => setShowTypeModal(true)}
                    className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-4 h-12"
                  >
                    <Text className={`text-base ${filters.type ? 'text-gray-900' : 'text-gray-400'}`}>
                      {getLabel(reportTypes, filters.type)}
                    </Text>
                    <ChevronDown size={20} color="#6B7280" />
                  </Pressable>
                </View>

                {/* Selector Secundario (Condicional) */}
                {filters.type && filters.type !== 'all' && (
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">
                      {filters.type === 'athlete' ? 'Seleccionar Atleta' : 
                       filters.type === 'group' ? 'Seleccionar Grupo' : 'Seleccionar Prueba'}
                    </Text>
                    <Pressable
                      onPress={() => setShowSelectionModal(true)}
                      className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-4 h-12"
                    >
                      <Text className={`text-base ${filters.selection ? 'text-gray-900' : 'text-gray-400'}`}>
                        {getLabel(getSelectionOptions(), filters.selection)}
                      </Text>
                      <ChevronDown size={20} color="#6B7280" />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* 2. RANGO DE FECHAS */}
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm">
              <Text className="text-gray-900 font-bold text-base mb-1">Rango de Fechas</Text>
              <Text className="text-gray-500 text-xs mb-4">Define el período de tiempo</Text>

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 space-y-2">
                  <Text className="text-gray-700 text-xs font-bold ml-1">Desde</Text>
                  <View className="bg-gray-50 border border-gray-200 rounded-2xl px-3 h-12 justify-center">
                    <TextInput
                      placeholder="YYYY-MM-DD"
                      value={filters.dateFrom}
                      onChangeText={(t) => setFilters({...filters, dateFrom: t})}
                      className="text-base text-gray-900"
                    />
                  </View>
                </View>
                <View className="flex-1 space-y-2">
                  <Text className="text-gray-700 text-xs font-bold ml-1">Hasta</Text>
                  <View className="bg-gray-50 border border-gray-200 rounded-2xl px-3 h-12 justify-center">
                    <TextInput
                      placeholder="YYYY-MM-DD"
                      value={filters.dateTo}
                      onChangeText={(t) => setFilters({...filters, dateTo: t})}
                      className="text-base text-gray-900"
                    />
                  </View>
                </View>
              </View>

              <View className="bg-blue-50 p-3 rounded-2xl">
                <Text className="text-xs text-blue-800 font-bold mb-2">Accesos rápidos:</Text>
                <View className="flex-row gap-2">
                  <Pressable 
                    onPress={() => applyQuickFilter(7)}
                    className="bg-white px-3 py-1.5 rounded-lg border border-blue-100"
                  >
                    <Text className="text-blue-600 text-xs font-medium">Última semana</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => applyQuickFilter(30)}
                    className="bg-white px-3 py-1.5 rounded-lg border border-blue-100"
                  >
                    <Text className="text-blue-600 text-xs font-medium">Último mes</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* 3. INFO DE FORMATO */}
            <View className="bg-white rounded-3xl p-5 mb-6 shadow-sm border border-gray-100 flex-row gap-4">
              <View className="bg-green-50 p-3 rounded-2xl h-12 w-12 items-center justify-center">
                <FileSpreadsheet size={24} color="#16A34A" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-bold text-sm mb-1">Formato Excel (.xlsx)</Text>
                <Text className="text-gray-500 text-xs leading-4">
                  Incluye resultados, estadísticas de progreso y gráficos de tendencias del período seleccionado.
                </Text>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* --- FOOTER FIXED --- */}
        <View className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-6 shadow-lg">
          <Pressable
            onPress={handleDownload}
            disabled={!filters.type || !filters.dateFrom || !filters.dateTo}
            className={`w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg ${
              (!filters.type || !filters.dateFrom || !filters.dateTo)
                ? 'bg-gray-300' 
                : 'bg-blue-600 shadow-blue-300'
            }`}
          >
            <Download size={20} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-bold text-lg">Descargar Reporte</Text>
          </Pressable>
        </View>

      </SafeAreaView>

      {/* --- MODALES --- */}
      
      {/* Modal Tipo */}
      <Modal visible={showTypeModal} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/50 justify-center px-6" onPress={() => setShowTypeModal(false)}>
          <View className="bg-white rounded-3xl p-2 overflow-hidden">
            {reportTypes.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => { setFilters({...filters, type: opt.value, selection: ''}); setShowTypeModal(false); }}
                className={`p-4 flex-row justify-between items-center ${filters.type === opt.value ? 'bg-blue-50' : ''}`}
              >
                <Text className={`text-base ${filters.type === opt.value ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>{opt.label}</Text>
                {filters.type === opt.value && <Check size={18} color="#2563EB" />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Modal Selección Específica */}
      <Modal visible={showSelectionModal} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/50 justify-center px-6" onPress={() => setShowSelectionModal(false)}>
          <View className="bg-white rounded-3xl p-2 overflow-hidden">
            {getSelectionOptions().map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => { setFilters({...filters, selection: opt.value}); setShowSelectionModal(false); }}
                className={`p-4 flex-row justify-between items-center ${filters.selection === opt.value ? 'bg-blue-50' : ''}`}
              >
                <Text className={`text-base ${filters.selection === opt.value ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>{opt.label}</Text>
                {filters.selection === opt.value && <Check size={18} color="#2563EB" />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}