import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Dimensions,
  Modal,
  FlatList
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
  ArrowLeft, 
  ChevronDown, 
  Trophy, 
  TrendingUp, 
  Activity, 
  Calendar,
  X,
  BarChart3
} from "lucide-react-native";
import { LineChart } from "react-native-chart-kit"; // Requiere npm install react-native-chart-kit react-native-svg

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { AprendizStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AprendizStackParamList, "Stats">;

// --- COLORES ---
const COLORS = {
  primary: "#2563eb",
  primaryLight: "#eff6ff",
  background: "#f8fafc",
  white: "#ffffff",
  textDark: "#0f172a",
  textMuted: "#64748b",
  borderColor: "#e2e8f0",
  success: "#22c55e",
  chartGradientFrom: "#2563eb",
  chartGradientTo: "#60a5fa",
  shadow: "#000000",
};

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function StatsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Estados
  const [loading, setLoading] = useState(true);
  const [testOptions, setTestOptions] = useState<any[]>([]); // Lista de pruebas disponibles
  const [selectedTest, setSelectedTest] = useState<any>(null); // Prueba seleccionada
  const [chartData, setChartData] = useState<any>(null); // Datos para la gráfica
  const [stats, setStats] = useState({ best: 0, last: 0, avg: 0, unit: '' }); // KPIs
  const [historyList, setHistoryList] = useState<any[]>([]); // Lista inferior

  // Modal Selector
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    fetchAvailableTests();
  }, [user]);

  // 1. Cargar lista de pruebas que el atleta ha realizado
  const fetchAvailableTests = async () => {
    if (!user) return;
    try {
      const { data: userData } = await supabase.from('usuario').select('no_documento').eq('auth_id', user.id).single();
      if (!userData) return;

      // Traemos todos los resultados para filtrar nombres únicos
      const { data, error } = await supabase
        .from('resultado_prueba')
        .select(`
          prueba_asignada!inner (
            prueba ( id, nombre, tipo_metrica )
          )
        `)
        .eq('atleta_no_documento', userData.no_documento);

      if (error) throw error;

      // Filtramos duplicados en el cliente (Map por ID de prueba)
      const uniqueTestsMap = new Map();
      data.forEach((item: any) => {
        const p = item.prueba_asignada.prueba;
        if (!uniqueTestsMap.has(p.id)) {
          uniqueTestsMap.set(p.id, p);
        }
      });

      const options = Array.from(uniqueTestsMap.values());
      setTestOptions(options);

      // Seleccionar automáticamente el primero si existe
      if (options.length > 0) {
        handleSelectTest(options[0], userData.no_documento);
      } else {
        setLoading(false);
      }

    } catch (err) {
      console.error("Error cargando pruebas:", err);
      setLoading(false);
    }
  };

  // 2. Cargar datos específicos de una prueba
  const handleSelectTest = async (testObj: any, docId?: number) => {
    setLoading(true);
    setSelectedTest(testObj);
    setShowSelector(false);

    try {
      // Si no pasamos docId, lo buscamos (caso cambio manual)
      let documento = docId;
      if (!documento) {
        const { data } = await supabase.from('usuario').select('no_documento').eq('auth_id', user!.id).single();
        documento = data?.no_documento;
      }

      // Consulta historial de esa prueba específica
      const { data: results, error } = await supabase
        .from('resultado_prueba')
        .select(`
           valor,
           fecha_realizacion,
           prueba_asignada!inner ( prueba_id )
        `)
        .eq('atleta_no_documento', documento)
        .eq('prueba_asignada.prueba_id', testObj.id)
        .order('fecha_realizacion', { ascending: true }); // Orden ascendente para gráfica

      if (error) throw error;

      processChartData(results, testObj.tipo_metrica);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Procesar datos para la gráfica y KPIs
  const processChartData = (data: any[], unit: string) => {
    if (data.length === 0) {
      setChartData(null);
      return;
    }

    // A. Parsear valores numéricos
    const numericValues = data.map(d => parseFloat(d.valor) || 0);
    const labels = data.map(d => {
        const date = new Date(d.fecha_realizacion);
        return `${date.getDate()}/${date.getMonth() + 1}`; // Formato DD/MM
    });

    // B. Configurar Gráfica (Solo mostramos últimos 6 puntos para que no se sature)
    const sliceIndex = Math.max(0, numericValues.length - 6);
    
    setChartData({
      labels: labels.slice(sliceIndex),
      datasets: [{ data: numericValues.slice(sliceIndex) }]
    });

    // C. Calcular KPIs
    const maxVal = Math.max(...numericValues);
    const lastVal = numericValues[numericValues.length - 1];
    const avgVal = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;

    setStats({
      best: maxVal,
      last: lastVal,
      avg: parseFloat(avgVal.toFixed(1)),
      unit: unit
    });

    // D. Lista Histórica (Invertida: más reciente arriba)
    setHistoryList([...data].reverse());
  };

  if (loading && !selectedTest) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.textDark} />
          </Pressable>
          <Text style={styles.headerTitle}>Progreso</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* 1. SELECTOR DE PRUEBA */}
          <View style={styles.selectorContainer}>
            <Text style={styles.label}>Estás viendo:</Text>
            <Pressable 
              onPress={() => setShowSelector(true)}
              style={({pressed}) => [styles.selectorButton, pressed && styles.selectorPressed]}
            >
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <BarChart3 size={20} color={COLORS.primary} style={{marginRight: 10}}/>
                <Text style={styles.selectorText}>
                  {selectedTest ? selectedTest.nombre : "Seleccionar Prueba"}
                </Text>
              </View>
              <ChevronDown size={20} color={COLORS.textMuted} />
            </Pressable>
          </View>

          {selectedTest && chartData ? (
            <>
              {/* 2. GRÁFICA */}
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Evolución ({selectedTest.tipo_metrica})</Text>
                <LineChart
                  data={chartData}
                  width={SCREEN_WIDTH - 80} // Ajuste para padding
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: "#ffffff",
                    backgroundGradientFrom: "#ffffff",
                    backgroundGradientTo: "#ffffff",
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, // Color primario
                    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: { r: "5", strokeWidth: "2", stroke: COLORS.primary }
                  }}
                  bezier
                  style={{ marginVertical: 8, borderRadius: 16 }}
                />
              </View>

              {/* 3. TARJETAS DE KPIs */}
              <View style={styles.statsRow}>
                {/* Mejor Marca */}
                <View style={[styles.statCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                    <View style={[styles.iconBg, { backgroundColor: '#dcfce7' }]}>
                        <Trophy size={18} color="#16a34a" />
                    </View>
                    <Text style={styles.statLabel}>Mejor Marca</Text>
                    <Text style={[styles.statValue, { color: '#16a34a' }]}>
                        {stats.best} <Text style={{fontSize:10}}>{stats.unit}</Text>
                    </Text>
                </View>

                {/* Último */}
                <View style={styles.statCard}>
                    <View style={styles.iconBg}>
                        <Activity size={18} color={COLORS.primary} />
                    </View>
                    <Text style={styles.statLabel}>Último</Text>
                    <Text style={styles.statValue}>
                        {stats.last} <Text style={{fontSize:10}}>{stats.unit}</Text>
                    </Text>
                </View>

                {/* Promedio */}
                <View style={styles.statCard}>
                    <View style={styles.iconBg}>
                        <TrendingUp size={18} color={COLORS.primary} />
                    </View>
                    <Text style={styles.statLabel}>Promedio</Text>
                    <Text style={styles.statValue}>
                        {stats.avg} <Text style={{fontSize:10}}>{stats.unit}</Text>
                    </Text>
                </View>
              </View>

              {/* 4. HISTORIAL DETALLADO */}
              <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>Historial Completo</Text>
                {historyList.map((item, index) => (
                    <View key={index} style={styles.historyRow}>
                        <View style={{flexDirection:'row', alignItems:'center'}}>
                            <Calendar size={16} color={COLORS.textMuted} style={{marginRight:8}} />
                            <Text style={styles.historyDate}>
                                {new Date(item.fecha_realizacion).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </Text>
                        </View>
                        <Text style={styles.historyValue}>
                            {item.valor} {stats.unit}
                        </Text>
                    </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
                <BarChart3 size={48} color={COLORS.borderColor} />
                <Text style={styles.emptyText}>
                    {testOptions.length > 0 
                      ? "Selecciona una prueba para ver tus estadísticas." 
                      : "Aún no tienes registros de pruebas."}
                </Text>
            </View>
          )}

        </ScrollView>

        {/* --- MODAL SELECTOR --- */}
        <Modal visible={showSelector} transparent animationType="fade" onRequestClose={() => setShowSelector(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setShowSelector(false)}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Seleccionar Prueba</Text>
                        <Pressable onPress={() => setShowSelector(false)}>
                            <X size={24} color={COLORS.textMuted} />
                        </Pressable>
                    </View>
                    <FlatList 
                        data={testOptions}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({item}) => (
                            <Pressable 
                                onPress={() => handleSelectTest(item)}
                                style={[
                                    styles.optionItem,
                                    selectedTest?.id === item.id && styles.optionSelected
                                ]}
                            >
                                <Text style={[
                                    styles.optionText,
                                    selectedTest?.id === item.id && styles.optionTextSelected
                                ]}>{item.nombre}</Text>
                                {selectedTest?.id === item.id && <View style={styles.activeDot}/>}
                            </Pressable>
                        )}
                    />
                </View>
            </Pressable>
        </Modal>

      </SafeAreaView>

      {/* FOOTER - Mantener consistencia si lo usas aquí o es manejado por Stack */}
      {/* Como está dentro de un Stack y el footer está en Dashboard, aquí no necesitamos footer 
          a menos que quieras navegación inferior persistente. Si es stack, usa el botón Back. */}
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderColor },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, flex: 1, textAlign: 'center' },

  // Selector
  selectorContainer: { marginTop: 16, marginBottom: 24 },
  label: { fontSize: 14, color: COLORS.textMuted, marginBottom: 8, fontWeight: '500' },
  selectorButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.borderColor, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  selectorPressed: { backgroundColor: '#f1f5f9' },
  selectorText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },

  // Chart
  chartCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderColor, marginBottom: 24 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, alignSelf: 'flex-start', marginBottom: 8 },

  // Stats Row
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: COLORS.white, padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderColor, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  iconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statLabel: { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },

  // History List
  historySection: { backgroundColor: COLORS.white, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.borderColor },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 16 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  historyDate: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  historyValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, opacity: 0.5 },
  emptyText: { marginTop: 16, fontSize: 16, color: COLORS.textMuted, textAlign: 'center', maxWidth: 250 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  optionSelected: { backgroundColor: COLORS.primaryLight, marginHorizontal: -24, paddingHorizontal: 24 },
  optionText: { fontSize: 16, color: COLORS.textDark },
  optionTextSelected: { fontWeight: 'bold', color: COLORS.primary },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
});