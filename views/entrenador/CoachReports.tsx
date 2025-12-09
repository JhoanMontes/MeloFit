import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  ScrollView, 
  Modal, 
  Alert,
  ActivityIndicator,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  ArrowLeft, 
  Download, 
  FileSpreadsheet, 
  ChevronDown, 
  Check, 
  Calendar as CalendarIcon,
  Users,
  User,
  Activity
} from "lucide-react-native";

// --- SOLUCIÓN DE IMPORTACIONES ---
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

// 1. Importamos desde 'legacy' para recuperar writeAsStringAsync
// 2. Usamos @ts-ignore para evitar que TypeScript se queje si no encuentra los tipos legacy
// @ts-ignore 
import * as FileSystem from 'expo-file-system/legacy';

import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "CoachReports">;

export default function CoachReports({ navigation }: Props) {
  const { user } = useAuth();
  
  // --- ESTADOS ---
  const [loadingData, setLoadingData] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Datos
  const [myAthletes, setMyAthletes] = useState<{label: string, value: string, email: string}[]>([]);
  const [myGroups, setMyGroups] = useState<{label: string, value: string, emails: string[]}[]>([]);
  const [myTests, setMyTests] = useState<{label: string, value: string}[]>([]);

  // Filtros
  const [filters, setFilters] = useState({
    type: '' as 'athlete' | 'group' | 'test' | 'all' | '',
    selection: '', 
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)), 
    dateTo: new Date()
  });

  // UI Modales
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  
  // Date Pickers
  const [showPickerFrom, setShowPickerFrom] = useState(false);
  const [showPickerTo, setShowPickerTo] = useState(false);

  const reportTypes = [
    { label: "Atleta Individual", value: "athlete", icon: User },
    { label: "Grupo Completo", value: "group", icon: Users },
    { label: "Prueba Específica", value: "test", icon: Activity },
    { label: "General (Todos)", value: "all", icon: FileSpreadsheet },
  ];

  // 1. CARGAR DATOS
  useEffect(() => {
    const loadFilterData = async () => {
      if (!user) return;
      setLoadingData(true);
      try {
        const { data: trainer } = await supabase.from('usuario').select('no_documento').eq('auth_id', user.id).single();
        if (!trainer) return;

        const { data: groups } = await supabase
          .from('grupo')
          .select(`codigo, nombre, atleta_has_grupo(atleta(usuario(email)))`)
          .eq('entrenador_no_documento', trainer.no_documento);

        if (groups) {
            const formattedGroups = groups.map(g => ({
                label: g.nombre,
                value: g.codigo,
                emails: g.atleta_has_grupo.map((item: any) => item.atleta?.usuario?.email).filter(Boolean)
            }));
            setMyGroups(formattedGroups);
        }

        const { data: athletesData } = await supabase
            .from('atleta_has_grupo')
            .select(`atleta(no_documento, usuario(nombre_completo, email))`)
            .in('grupo_codigo', groups?.map(g => g.codigo) || []);
        
        if (athletesData) {
            const map = new Map();
            athletesData.forEach((item: any) => {
                const doc = item.atleta.no_documento;
                if (!map.has(doc)) {
                    map.set(doc, {
                        label: item.atleta.usuario.nombre_completo,
                        value: String(doc),
                        email: item.atleta.usuario.email
                    });
                }
            });
            setMyAthletes(Array.from(map.values()));
        }

        const { data: tests } = await supabase.from('prueba').select('id, nombre');
        if (tests) {
            setMyTests(tests.map(t => ({ label: t.nombre, value: String(t.id) })));
        }

      } catch (e) {
        console.error("Error cargando filtros:", e);
      } finally {
        setLoadingData(false);
      }
    };
    loadFilterData();
  }, [user]);

  // 2. GENERAR Y COMPARTIR
  const generateAndShareReport = async () => {
    setGenerating(true);
    try {
        if (!filters.type) {
            Alert.alert("Error", "Selecciona un tipo de reporte.");
            setGenerating(false);
            return;
        }

        // QUERY
        const { data: results, error } = await supabase
            .from('resultado_prueba')
            .select(`
                valor,
                fecha_realizacion,
                atleta!inner (
                    no_documento,
                    estatura, 
                    peso,
                    usuario ( nombre_completo, email ),
                    atleta_has_grupo (
                        grupo ( codigo, nombre )
                    )
                ),
                prueba_asignada!inner (
                    id,
                    prueba ( id, nombre, descripcion )
                )
            `)
            .gte('fecha_realizacion', filters.dateFrom.toISOString())
            .lte('fecha_realizacion', filters.dateTo.toISOString())
            .order('fecha_realizacion', { ascending: false });

        if (error) throw new Error(error.message);

        let processedData = results || [];

        // FILTRADO JS
        if (filters.type === 'athlete' && filters.selection) {
            processedData = processedData.filter((r: any) => 
                String(r.atleta.no_documento) === filters.selection
            );
        } 
        else if (filters.type === 'group' && filters.selection) {
            processedData = processedData.filter((r: any) => {
                const gruposDelAtleta = r.atleta.atleta_has_grupo || [];
                return gruposDelAtleta.some((g: any) => g.grupo.codigo === filters.selection);
            });
        } 
        else if (filters.type === 'test' && filters.selection) {
            processedData = processedData.filter((r: any) => 
                String(r.prueba_asignada.prueba.id) === filters.selection
            );
        }

        if (processedData.length === 0) {
            Alert.alert("Sin datos", "No se encontraron resultados con los filtros actuales.");
            setGenerating(false);
            return;
        }

        // MAPEO
        const excelRows = processedData.map((item: any) => {
            const atleta = item.atleta;
            const prueba = item.prueba_asignada.prueba;
            
            const grupos = atleta.atleta_has_grupo?.map((g: any) => g.grupo?.nombre).join(", ") || "Sin Grupo";
            
            let imc = "N/A";
            let valoracion = "Pendiente"; 
            
            if (atleta.peso && atleta.estatura) {
                const alturaM = atleta.estatura > 3 ? atleta.estatura / 100 : atleta.estatura;
                const calculo = (atleta.peso / (alturaM * alturaM));
                imc = calculo.toFixed(1);
                
                if (calculo < 18.5) valoracion = "Bajo Peso";
                else if (calculo < 24.9) valoracion = "Normal";
                else if (calculo < 29.9) valoracion = "Sobrepeso";
                else valoracion = "Obesidad";
            }

            return {
                "FECHA": new Date(item.fecha_realizacion).toLocaleDateString(),
                "ATLETA": atleta.usuario?.nombre_completo || "Desconocido",
                "GRUPOS": grupos,
                "PRUEBA": prueba?.nombre || "Prueba",
                "RESULTADO": item.valor,
                "ESTATURA (m)": atleta.estatura ? (atleta.estatura > 3 ? atleta.estatura/100 : atleta.estatura) : "-",
                "PESO (kg)": atleta.peso || "-",
                "IMC": imc,
                "VALORACIÓN": valoracion,
                "EMAIL": atleta.usuario?.email || "-"
            };
        });

        // GENERAR EXCEL
        const ws = XLSX.utils.json_to_sheet(excelRows);
        ws['!cols'] = [
            { wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, 
            { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, 
            { wch: 15 }, { wch: 25 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Rendimiento");
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        
        // --- GUARDAR ARCHIVO (FIX LEGACY) ---
        const fileName = `Reporte_${filters.type}_${Date.now()}.xlsx`;
        
        // Obtenemos el directorio. Si documentDirectory no existe en legacy (raro pero posible), usamos cacheDirectory
        const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
        const uri = dir + fileName;

        // Escribimos usando la función legacy con el string 'base64' manual
        await FileSystem.writeAsStringAsync(uri, wbout, {
            encoding: 'base64'
        });

        // COMPARTIR
        let recipients: string[] = [];
        if (filters.type === 'athlete' && filters.selection) {
            const ath = myAthletes.find(a => a.value === filters.selection);
            if (ath?.email) recipients.push(ath.email);
        } else if (filters.type === 'group' && filters.selection) {
            const grp = myGroups.find(g => g.value === filters.selection);
            if (grp?.emails) recipients = [...grp.emails];
        }
        if (user?.email) recipients.push(user.email);
        recipients = [...new Set(recipients)].filter(Boolean);

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: `Enviar reporte`,
                UTI: 'com.microsoft.excel.xlsx'
            });
            
            if (recipients.length > 0) {
                 Alert.alert(
                    "Reporte Listo", 
                    `Sugerencia: Puedes enviarlo a:\n\n${recipients.slice(0, 3).join('\n')}${recipients.length > 3 ? '...' : ''}`
                );
            }
        } else {
            Alert.alert("Error", "Compartir no disponible.");
        }

    } catch (error: any) {
        console.error("Error generando Excel:", error);
        Alert.alert("Error", `No se pudo generar el reporte: ${error.message || "Error desconocido"}`);
    } finally {
        setGenerating(false);
    }
  };

  // UI HELPERS
  const getOptions = () => {
    switch(filters.type) {
        case 'athlete': return myAthletes;
        case 'group': return myGroups;
        case 'test': return myTests;
        default: return [];
    }
  };

  const getLabel = (opts: any[], val: string) => opts.find(o => o.value === val)?.label || "Seleccionar...";
  const getTypeLabel = () => reportTypes.find(t => t.value === filters.type)?.label || "Seleccionar Tipo";

  const onChangeDateFrom = (event: any, selectedDate?: Date) => {
    setShowPickerFrom(Platform.OS === 'ios');
    if (selectedDate) setFilters({...filters, dateFrom: selectedDate});
    if (Platform.OS === 'android') setShowPickerFrom(false);
  };

  const onChangeDateTo = (event: any, selectedDate?: Date) => {
    setShowPickerTo(Platform.OS === 'ios');
    if (selectedDate) setFilters({...filters, dateTo: selectedDate});
    if (Platform.OS === 'android') setShowPickerTo(false);
  };

  return (
    <View className="flex-1 bg-[#F5F5F7]">
       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          
          <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center mb-6">
              <Pressable 
                onPress={() => navigation.goBack()} 
                className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 mr-4"
              >
                <ArrowLeft size={20} color="#334155" />
              </Pressable>
              <View>
                <Text className="text-gray-900 text-2xl font-bold">Reportes Excel</Text>
                <Text className="text-gray-500 text-sm">Exporta rendimiento y métricas</Text>
              </View>
            </View>
          </View>

          <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 120 }}>
            
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm">
              <Text className="text-gray-900 font-bold text-base mb-1">Configuración</Text>
              <Text className="text-gray-500 text-xs mb-4">Define el alcance de los datos</Text>

              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">Tipo de Filtro</Text>
                  <Pressable
                    onPress={() => setShowTypeModal(true)}
                    className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14"
                  >
                    <View className="flex-row items-center gap-3">
                        {filters.type ? (
                            React.createElement(reportTypes.find(t=>t.value===filters.type)?.icon || FileSpreadsheet, {size: 20, color: '#2563eb'})
                        ) : null}
                        <Text className={`text-base ${filters.type ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                        {getTypeLabel()}
                        </Text>
                    </View>
                    <ChevronDown size={20} color="#6B7280" />
                  </Pressable>
                </View>

                {filters.type && filters.type !== 'all' && (
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">
                      {filters.type === 'athlete' ? 'Atleta Específico' : 
                       filters.type === 'group' ? 'Grupo Específico' : 'Prueba Específica'}
                    </Text>
                    {loadingData ? (
                        <ActivityIndicator color="#2563eb" style={{ alignSelf: 'flex-start', marginLeft: 10 }} />
                    ) : (
                        <Pressable
                        onPress={() => setShowSelectionModal(true)}
                        className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14"
                        >
                        <Text className={`text-base ${filters.selection ? 'text-gray-900' : 'text-gray-400'}`} numberOfLines={1}>
                            {getLabel(getOptions(), filters.selection)}
                        </Text>
                        <ChevronDown size={20} color="#6B7280" />
                        </Pressable>
                    )}
                  </View>
                )}
              </View>
            </View>

            <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm">
              <Text className="text-gray-900 font-bold text-base mb-1">Periodo de Análisis</Text>
              <Text className="text-gray-500 text-xs mb-4">Selecciona el rango de fechas</Text>

              <View className="flex-row gap-3">
                <View className="flex-1 space-y-2">
                  <Text className="text-gray-700 text-xs font-bold ml-1">Desde</Text>
                  <Pressable 
                    onPress={() => setShowPickerFrom(true)}
                    className="bg-gray-50 border border-gray-200 rounded-2xl px-3 h-12 flex-row items-center justify-between"
                  >
                    <Text className="text-gray-900 text-sm font-medium">
                        {filters.dateFrom.toLocaleDateString()}
                    </Text>
                    <CalendarIcon size={16} color="#64748b" />
                  </Pressable>
                  {showPickerFrom && (
                    <DateTimePicker
                        value={filters.dateFrom}
                        mode="date"
                        display="default"
                        onChange={onChangeDateFrom}
                        maximumDate={new Date()}
                    />
                  )}
                </View>

                <View className="flex-1 space-y-2">
                  <Text className="text-gray-700 text-xs font-bold ml-1">Hasta</Text>
                  <Pressable 
                    onPress={() => setShowPickerTo(true)}
                    className="bg-gray-50 border border-gray-200 rounded-2xl px-3 h-12 flex-row items-center justify-between"
                  >
                    <Text className="text-gray-900 text-sm font-medium">
                        {filters.dateTo.toLocaleDateString()}
                    </Text>
                    <CalendarIcon size={16} color="#64748b" />
                  </Pressable>
                  {showPickerTo && (
                    <DateTimePicker
                        value={filters.dateTo}
                        mode="date"
                        display="default"
                        onChange={onChangeDateTo}
                        minimumDate={filters.dateFrom}
                        maximumDate={new Date()}
                    />
                  )}
                </View>
              </View>
            </View>

            <View className="bg-white rounded-3xl p-5 mb-6 shadow-sm border border-gray-100 flex-row gap-4">
              <View className="bg-green-50 p-3 rounded-2xl h-12 w-12 items-center justify-center">
                <FileSpreadsheet size={24} color="#16A34A" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-bold text-sm mb-1">Incluido en el Excel:</Text>
                <View className="flex-row flex-wrap gap-2 mt-1">
                    {["Resultados", "Fechas", "IMC Calculado", "Grupos"].map((tag, i) => (
                        <View key={i} className="bg-gray-100 px-2 py-1 rounded-md">
                            <Text className="text-[10px] text-gray-600 font-bold">{tag}</Text>
                        </View>
                    ))}
                </View>
              </View>
            </View>

          </ScrollView>

        <View className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-6 shadow-lg pb-8">
          <Pressable
            onPress={generateAndShareReport}
            disabled={generating || (!filters.type) || (filters.type !== 'all' && !filters.selection)}
            className={`w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg ${
              (generating || (!filters.type) || (filters.type !== 'all' && !filters.selection))
                ? 'bg-gray-300' 
                : 'bg-green-600 shadow-green-200'
            }`}
          >
            {generating ? (
                <ActivityIndicator color="white" />
            ) : (
                <>
                    <Download size={22} color="white" style={{ marginRight: 8 }} />
                    <Text className="text-white font-bold text-lg">Generar y Enviar</Text>
                </>
            )}
          </Pressable>
        </View>

      </SafeAreaView>

      <Modal visible={showTypeModal} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/40 justify-center px-6" onPress={() => setShowTypeModal(false)}>
          <View className="bg-white rounded-3xl p-4 shadow-xl">
            <Text className="text-center font-bold text-lg mb-4 text-gray-800">Seleccionar Tipo</Text>
            {reportTypes.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => { setFilters({...filters, type: opt.value as any, selection: ''}); setShowTypeModal(false); }}
                className={`p-4 flex-row justify-between items-center rounded-2xl mb-2 ${filters.type === opt.value ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}
              >
                <View className="flex-row items-center gap-3">
                    <opt.icon size={20} color={filters.type === opt.value ? '#2563EB' : '#64748b'} />
                    <Text className={`text-base ${filters.type === opt.value ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>{opt.label}</Text>
                </View>
                {filters.type === opt.value && <Check size={18} color="#2563EB" />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showSelectionModal} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/40 justify-center px-6" onPress={() => setShowSelectionModal(false)}>
          <View className="bg-white rounded-3xl p-4 shadow-xl max-h-[60%]">
             <Text className="text-center font-bold text-lg mb-4 text-gray-800">Seleccionar Opción</Text>
             <ScrollView showsVerticalScrollIndicator={false}>
                {getOptions().length === 0 ? (
                    <Text className="text-center text-gray-400 py-4">No hay opciones disponibles.</Text>
                ) : (
                    getOptions().map((opt) => (
                    <Pressable
                        key={opt.value}
                        onPress={() => { setFilters({...filters, selection: opt.value}); setShowSelectionModal(false); }}
                        className={`p-4 flex-row justify-between items-center rounded-2xl mb-2 ${filters.selection === opt.value ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}
                    >
                        <Text className={`text-base ${filters.selection === opt.value ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>{opt.label}</Text>
                        {filters.selection === opt.value && <Check size={18} color="#2563EB" />}
                    </Pressable>
                    ))
                )}
             </ScrollView>
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}