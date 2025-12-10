import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  ScrollView, 
  Modal, 
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet
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
  Activity,
  BarChart3
} from "lucide-react-native";

import * as Sharing from 'expo-sharing';
// @ts-ignore 
import * as FileSystem from 'expo-file-system/legacy';

import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "CoachReports">;

// --- COLORES ---
const COLORS = {
  primary: "#2563EB",
  background: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A",
  border: "#E2E8F0"
};

export default function CoachReports({ navigation }: Props) {
  const { user } = useAuth();
  
  const [loadingData, setLoadingData] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Datos para filtros
  const [myAthletes, setMyAthletes] = useState<{label: string, value: string, email: string}[]>([]);
  const [myGroups, setMyGroups] = useState<{label: string, value: string, emails: string[]}[]>([]);
  const [myTests, setMyTests] = useState<{label: string, value: string}[]>([]);

  // Filtros seleccionados
  const [filters, setFilters] = useState({
    type: '' as 'athlete' | 'group' | 'test' | 'all' | '',
    selection: '', 
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)), 
    dateTo: new Date()
  });

  // UI Modales
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showPickerFrom, setShowPickerFrom] = useState(false);
  const [showPickerTo, setShowPickerTo] = useState(false);

  const reportTypes = [
    { label: "Atleta Individual", value: "athlete", icon: User },
    { label: "Grupo Completo", value: "group", icon: Users },
    { label: "Prueba Específica", value: "test", icon: Activity },
    { label: "General (Todos)", value: "all", icon: FileSpreadsheet },
  ];

  // 1. CARGAR DATOS DE FILTROS
  useEffect(() => {
    const loadFilterData = async () => {
      if (!user) return;
      setLoadingData(true);
      try {
        const { data: trainer } = await supabase.from('usuario').select('no_documento').eq('auth_id', user.id).single();
        if (!trainer) return;

        // Cargar Grupos
        const { data: groups } = await supabase
          .from('grupo')
          .select(`codigo, nombre, atleta_has_grupo(atleta(usuario(email)))`)
          .eq('entrenador_no_documento', trainer.no_documento)
          .eq('activo', true);

        if (groups) {
            const formattedGroups = groups.map(g => ({
                label: g.nombre,
                value: g.codigo,
                emails: g.atleta_has_grupo.map((item: any) => item.atleta?.usuario?.email).filter(Boolean)
            }));
            setMyGroups(formattedGroups);
        }

        // Cargar Atletas
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

        // Cargar Pruebas
        const { data: tests } = await supabase
            .from('prueba')
            .select('id, nombre')
            .eq('entrenador_no_documento', trainer.no_documento);
            
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

  // --- GENERADOR DE HTML ESTILIZADO ---
  const createHTMLReport = (
    title: string, 
    subtitle: string, 
    performanceData: any[], 
    physicalData: any[] | null
  ) => {
    return `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
          .header { background-color: #2563EB; color: white; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0 0; font-size: 14px; opacity: 0.9; }
          
          .section { margin: 20px; }
          .section-title { 
            color: #2563EB; 
            border-bottom: 2px solid #2563EB; 
            padding-bottom: 5px; 
            margin-bottom: 10px; 
            font-size: 18px; 
            font-weight: bold;
          }

          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
          th { 
            background-color: #1E293B; 
            color: white; 
            padding: 10px; 
            text-align: left; 
            border: 1px solid #0F172A;
          }
          td { 
            padding: 8px; 
            border: 1px solid #CBD5E1; 
            color: #334155;
          }
          tr:nth-child(even) { background-color: #F1F5F9; }
          
          .tag-good { color: #16A34A; font-weight: bold; }
          .tag-alert { color: #EA580C; font-weight: bold; }
          .footer { font-size: 10px; color: #94A3B8; text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>${subtitle}</p>
          <p>Generado: ${new Date().toLocaleDateString()}</p>
        </div>

        ${physicalData && physicalData.length > 0 ? `
          <div class="section">
            <div class="section-title">Evolución Física (Salud)</div>
            <table>
              <thead>
                <tr>
                  <th>FECHA REGISTRO</th>
                  <th>PESO (KG)</th>
                  <th>ESTATURA (CM)</th>
                  <th>IMC</th>
                  <th>% GRASA</th>
                </tr>
              </thead>
              <tbody>
                ${physicalData.map(d => `
                  <tr>
                    <td>${new Date(d.fecha_registro).toLocaleDateString()}</td>
                    <td>${d.peso || '-'}</td>
                    <td>${d.estatura || '-'}</td>
                    <td>${d.imc || '-'}</td>
                    <td>${d.porcentaje_grasa ? d.porcentaje_grasa + '%' : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Resultados de Rendimiento</div>
          ${performanceData.length === 0 ? '<p>No hay resultados registrados en este periodo.</p>' : `
            <table>
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>ATLETA</th>
                  <th>PRUEBA</th>
                  <th>RESULTADO</th>
                  <th>GRUPO</th>
                  <th>OBSERVACIONES</th>
                </tr>
              </thead>
              <tbody>
                ${performanceData.map(r => `
                  <tr>
                    <td>${new Date(r.fecha_realizacion).toLocaleDateString()}</td>
                    <td><b>${r.atleta.usuario.nombre_completo}</b></td>
                    <td>${r.prueba_asignada.prueba.nombre}</td>
                    <td style="font-size:14px; font-weight:bold; color:#2563EB;">${r.valor}</td>
                    <td>${r.atleta.atleta_has_grupo?.[0]?.grupo?.nombre || 'General'}</td>
                    <td>${r.comentario?.[0]?.mensaje || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <div class="footer">
          Reporte generado automáticamente por MeloFit App.
        </div>
      </body>
      </html>
    `;
  };

  // 2. GENERAR REPORTE
  const generateAndShareReport = async () => {
    setGenerating(true);
    try {
        if (!filters.type) {
            Alert.alert("Error", "Selecciona un tipo de reporte.");
            setGenerating(false);
            return;
        }

        // A. CONSULTA DE RENDIMIENTO (Performance)
        let query = supabase
            .from('resultado_prueba')
            .select(`
                valor,
                fecha_realizacion,
                atleta!inner (
                    no_documento,
                    usuario ( nombre_completo, email ),
                    atleta_has_grupo ( grupo ( nombre ) )
                ),
                prueba_asignada!inner (
                    prueba ( id, nombre, tipo_metrica )
                ),
                comentario ( mensaje )
            `)
            .gte('fecha_realizacion', filters.dateFrom.toISOString())
            .lte('fecha_realizacion', filters.dateTo.toISOString())
            .order('fecha_realizacion', { ascending: false });

        // Filtros JS para rendimiento
        const { data: results, error } = await query;
        if (error) throw error;

        let filteredResults = results || [];
        if (filters.type === 'athlete' && filters.selection) {
            filteredResults = filteredResults.filter((r: any) => String(r.atleta.no_documento) === filters.selection);
        } else if (filters.type === 'test' && filters.selection) {
            filteredResults = filteredResults.filter((r: any) => String(r.prueba_asignada.prueba.id) === filters.selection);
        }

        // B. CONSULTA DE HISTORIAL FÍSICO (Solo si es por atleta)
        let physicalHistory = null;
        if (filters.type === 'athlete' && filters.selection) {
            const { data: physData } = await supabase
                .from('historial_fisico')
                .select('*')
                .eq('atleta_no_documento', filters.selection)
                .gte('fecha_registro', filters.dateFrom.toISOString())
                .order('fecha_registro', { ascending: false });
            
            physicalHistory = physData;
        }

        // C. CONSTRUCCIÓN DEL REPORTE
        const title = filters.type === 'athlete' 
            ? `Reporte Individual: ${myAthletes.find(a => a.value === filters.selection)?.label}`
            : "Reporte General de Rendimiento";
            
        const subtitle = `Periodo: ${filters.dateFrom.toLocaleDateString()} - ${filters.dateTo.toLocaleDateString()}`;

        const htmlContent = createHTMLReport(title, subtitle, filteredResults, physicalHistory);

        // D. GUARDAR Y COMPARTIR
        const fileName = `Reporte_${filters.type}_${Date.now()}.xls`; // .xls para que Excel lo abra como HTML
        const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
        const uri = dir + fileName;

        await FileSystem.writeAsStringAsync(uri, htmlContent, { encoding: FileSystem.EncodingType.UTF8 });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/vnd.ms-excel',
                dialogTitle: 'Compartir Reporte MeloFit'
            });
        } else {
            Alert.alert("Error", "Compartir no disponible en este dispositivo.");
        }

    } catch (error: any) {
        console.error("Error reporte:", error);
        Alert.alert("Error", "No se pudo generar el reporte.");
    } finally {
        setGenerating(false);
    }
  };

  // --- UI HELPERS ---
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

  const onDateChange = (isFrom: boolean, event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
        if (isFrom) setShowPickerFrom(false); else setShowPickerTo(false);
    }
    if (selectedDate) {
        if (isFrom) setFilters({...filters, dateFrom: selectedDate});
        else setFilters({...filters, dateTo: selectedDate});
    }
  };

  return (
    <View style={styles.container}>
       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                <ArrowLeft size={20} color={COLORS.text} />
              </Pressable>
              <Text style={styles.headerTitle}>Reportes Inteligentes</Text>
            </View>
            <Text style={styles.headerSubtitle}>Genera informes detallados en Excel</Text>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
            
            {/* 1. SECCIÓN TIPO */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>¿Qué deseas analizar?</Text>
              
              <Pressable
                onPress={() => setShowTypeModal(true)}
                style={styles.dropdown}
              >
                <View style={{flexDirection:'row', alignItems:'center', gap: 10}}>
                    {filters.type ? (
                        React.createElement(reportTypes.find(t=>t.value===filters.type)?.icon || FileSpreadsheet, {size: 20, color: COLORS.primary})
                    ) : <FileSpreadsheet size={20} color="#94a3b8" />}
                    
                    <Text style={[styles.dropdownText, filters.type ? {color: COLORS.text, fontWeight:'600'} : {color: '#94a3b8'}]}>
                        {getTypeLabel()}
                    </Text>
                </View>
                <ChevronDown size={20} color="#64748b" />
              </Pressable>

              {filters.type && filters.type !== 'all' && (
                <Pressable
                    onPress={() => setShowSelectionModal(true)}
                    style={[styles.dropdown, { marginTop: 12 }]}
                >
                    <Text style={[styles.dropdownText, filters.selection ? {color: COLORS.text} : {color: '#94a3b8'}]}>
                        {getLabel(getOptions(), filters.selection)}
                    </Text>
                    <ChevronDown size={20} color="#64748b" />
                </Pressable>
              )}
            </View>

            {/* 2. SECCIÓN FECHAS */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Rango de Fechas</Text>
              <View style={{flexDirection: 'row', gap: 12}}>
                <View style={{flex: 1}}>
                    <Text style={styles.label}>Desde</Text>
                    <Pressable onPress={() => setShowPickerFrom(true)} style={styles.dateInput}>
                        <CalendarIcon size={18} color="#64748b" />
                        <Text style={styles.dateText}>{filters.dateFrom.toLocaleDateString()}</Text>
                    </Pressable>
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.label}>Hasta</Text>
                    <Pressable onPress={() => setShowPickerTo(true)} style={styles.dateInput}>
                        <CalendarIcon size={18} color="#64748b" />
                        <Text style={styles.dateText}>{filters.dateTo.toLocaleDateString()}</Text>
                    </Pressable>
                </View>
              </View>
            </View>

            {/* INFO PREVIEW */}
            <View style={styles.infoBox}>
                <BarChart3 size={24} color={COLORS.primary} />
                <View style={{flex: 1}}>
                    <Text style={styles.infoTitle}>Contenido del Reporte</Text>
                    <Text style={styles.infoDesc}>
                        {filters.type === 'athlete' 
                            ? "Incluye tabla de resultados deportivos y tabla de evolución física (Peso, IMC, Grasa)."
                            : "Incluye tabla detallada de resultados, promedios y observaciones por grupo."}
                    </Text>
                </View>
            </View>

          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Pressable
                onPress={generateAndShareReport}
                disabled={generating || (!filters.type) || (filters.type !== 'all' && !filters.selection)}
                style={({pressed}) => [
                    styles.generateButton, 
                    (generating || !filters.type) && styles.buttonDisabled,
                    pressed && styles.buttonPressed
                ]}
            >
                {generating ? <ActivityIndicator color="white" /> : (
                    <>
                        <Download size={20} color="white" style={{marginRight: 8}} />
                        <Text style={styles.buttonText}>Descargar Reporte Excel</Text>
                    </>
                )}
            </Pressable>
          </View>

          {/* DATE PICKERS */}
          {showPickerFrom && (
            <DateTimePicker value={filters.dateFrom} mode="date" display="default" onChange={(e, d) => onDateChange(true, e, d)} maximumDate={new Date()} />
          )}
          {showPickerTo && (
            <DateTimePicker value={filters.dateTo} mode="date" display="default" onChange={(e, d) => onDateChange(false, e, d)} maximumDate={new Date()} />
          )}

      </SafeAreaView>

      {/* MODAL TIPOS */}
      <Modal visible={showTypeModal} transparent animationType="fade" onRequestClose={() => setShowTypeModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowTypeModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tipo de Reporte</Text>
            {reportTypes.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => { setFilters({...filters, type: opt.value as any, selection: ''}); setShowTypeModal(false); }}
                style={[styles.optionItem, filters.type === opt.value && styles.optionSelected]}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <View style={[styles.iconBg, filters.type === opt.value && {backgroundColor: COLORS.primary}]}>
                        <opt.icon size={18} color={filters.type === opt.value ? "white" : COLORS.primary} />
                    </View>
                    <Text style={[styles.optionText, filters.type === opt.value && {fontWeight: 'bold', color: COLORS.primary}]}>{opt.label}</Text>
                </View>
                {filters.type === opt.value && <Check size={18} color={COLORS.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* MODAL SELECCION */}
      <Modal visible={showSelectionModal} transparent animationType="fade" onRequestClose={() => setShowSelectionModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowSelectionModal(false)}>
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
             <Text style={styles.modalTitle}>Seleccionar</Text>
             <ScrollView>
                {getOptions().length === 0 ? (
                    <Text style={{textAlign: 'center', color: '#94a3b8', padding: 20}}>No hay datos disponibles.</Text>
                ) : (
                    getOptions().map((opt) => (
                    <Pressable
                        key={opt.value}
                        onPress={() => { setFilters({...filters, selection: opt.value}); setShowSelectionModal(false); }}
                        style={[styles.optionItem, filters.selection === opt.value && styles.optionSelected]}
                    >
                        <Text style={[styles.optionText, filters.selection === opt.value && {fontWeight: 'bold', color: COLORS.primary}]}>{opt.label}</Text>
                        {filters.selection === opt.value && <Check size={18} color={COLORS.primary} />}
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: 24, paddingBottom: 16 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: COLORS.border },
    headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
    headerSubtitle: { fontSize: 14, color: '#64748b', marginLeft: 52 },
    content: { paddingHorizontal: 24 },
    
    card: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
    dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: COLORS.border },
    dropdownText: { fontSize: 16 },
    
    label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6, marginLeft: 4 },
    dateInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
    dateText: { fontSize: 14, fontWeight: '600', color: COLORS.text },

    infoBox: { flexDirection: 'row', backgroundColor: '#eff6ff', padding: 16, borderRadius: 16, gap: 16, alignItems: 'center', borderLeftWidth: 4, borderLeftColor: COLORS.primary },
    infoTitle: { fontSize: 14, fontWeight: '700', color: '#1e3a8a', marginBottom: 2 },
    infoDesc: { fontSize: 12, color: '#3b82f6', lineHeight: 18 },

    footer: { padding: 24, backgroundColor: COLORS.card, borderTopWidth: 1, borderColor: COLORS.border },
    generateButton: { flexDirection: 'row', backgroundColor: '#10B981', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    buttonDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0 },
    buttonPressed: { opacity: 0.9, transform: [{scale: 0.98}] },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
    optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    optionSelected: { backgroundColor: '#eff6ff', borderRadius: 12, paddingHorizontal: 10, marginHorizontal: -10, borderBottomWidth: 0 },
    optionText: { fontSize: 16, color: COLORS.text },
    iconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center' }
});