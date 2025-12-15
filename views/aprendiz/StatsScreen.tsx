import React, { useState, useEffect } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  ChevronDown,
  Trophy,
  TrendingUp,
  Activity,
  Calendar,
  X,
  BarChart3,
  CheckCircle2
} from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";

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
  successBg: "#dcfce7",
  chartGradientFrom: "#2563eb",
  chartGradientTo: "#60a5fa",
  shadow: "#ffffff"
};

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function StatsScreen({ navigation }: Props) {
  const { user } = useAuth();

  // Estados
  const [loading, setLoading] = useState(true);
  const [testOptions, setTestOptions] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [stats, setStats] = useState({ best: 0, last: 0, avg: 0, unit: '' });
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Modal Selector
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    fetchAvailableTests();
  }, [user]);

  // --- HELPER: FORMATEO DE UNIDADES ---
  const formatUnit = (raw: string | null) => {
    if (!raw) return '';
    const r = raw.toLowerCase();

    if (r === 'time_min' || r.includes('minutos') || r.includes('minute')) return 'Min';
    if (r === 'time_sec' || r.includes('segundos') || r.includes('second')) return 'Seg';
    if (r.includes('rep')) return 'Reps';
    if (r.includes('kilo') || r.includes('kg')) return 'Kg';
    if (r.includes('metr')) return 'm';

    return raw;
  };

  // 1. Cargar pruebas disponibles
  const fetchAvailableTests = async () => {
    if (!user) return;
    try {
      const { data: userData } = await supabase.from('usuario').select('no_documento').eq('auth_id', user.id).single();
      if (!userData) return;

      const { data, error } = await supabase
        .from('resultado_prueba')
        .select(`
          prueba_asignada!inner (
            prueba ( id, nombre, tipo_metrica )
          )
        `)
        .eq('atleta_no_documento', userData.no_documento);

      if (error) throw error;

      // Filtrar únicos
      const uniqueTestsMap = new Map();
      data.forEach((item: any) => {
        const p = item.prueba_asignada.prueba;
        if (!uniqueTestsMap.has(p.id)) {
          uniqueTestsMap.set(p.id, p);
        }
      });

      const options = Array.from(uniqueTestsMap.values());
      setTestOptions(options);

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

  // 2. Cargar datos de la prueba seleccionada
  const handleSelectTest = async (testObj: any, docId?: number) => {
    setLoading(true);
    setSelectedTest(testObj);
    setShowSelector(false);

    try {
      let documento = docId;
      if (!documento) {
        const { data } = await supabase.from('usuario').select('no_documento').eq('auth_id', user!.id).single();
        documento = data?.no_documento;
      }

      const { data: results, error } = await supabase
        .from('resultado_prueba')
        .select(`
           valor,
           fecha_realizacion,
           prueba_asignada!inner ( prueba_id )
        `)
        .eq('atleta_no_documento', documento)
        .eq('prueba_asignada.prueba_id', testObj.id)
        .order('fecha_realizacion', { ascending: true });

      if (error) throw error;

      processChartData(results, testObj.tipo_metrica);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Procesar KPIs y Gráfica
  const processChartData = (data: any[], rawUnit: string) => {
    if (data.length === 0) {
      setChartData(null);
      return;
    }

    const shortUnit = formatUnit(rawUnit);

    const numericValues = data.map(d => parseFloat(d.valor) || 0);
    const labels = data.map(d => {
      // Tomamos el string "2025-12-20", hacemos split y usamos dia/mes directos
      if (!d.fecha_realizacion) return "";
      const parts = d.fecha_realizacion.split('T')[0].split('-'); // ["2025", "12", "20"]
      return `${parts[2]}/${parts[1]}`; // Retorna "20/12"
    });

    const sliceIndex = Math.max(0, numericValues.length - 6);

    setChartData({
      labels: labels.slice(sliceIndex),
      datasets: [{ data: numericValues.slice(sliceIndex) }]
    });

    const maxVal = Math.max(...numericValues);
    const lastVal = numericValues[numericValues.length - 1];
    const avgVal = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;

    setStats({
      best: maxVal,
      last: lastVal,
      avg: parseFloat(avgVal.toFixed(1)),
      unit: shortUnit // Usamos la unidad formateada
    });

    // Invertir lista para mostrar más reciente arriba
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
          <Text style={styles.headerTitle}>Tu Progreso</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* 1. SELECTOR */}
          <View style={styles.selectorContainer}>
            <Text style={styles.label}>Métrica a visualizar</Text>
            <Pressable
              onPress={() => setShowSelector(true)}
              style={({ pressed }) => [styles.selectorButton, pressed && styles.selectorPressed]}
            >
              <View style={styles.selectorContent}>
                <View style={styles.iconCircle}>
                  <BarChart3 size={20} color={COLORS.primary} />
                </View>
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
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Tendencia</Text>
                  <View style={styles.unitBadge}>
                    <Text style={styles.unitText}>{stats.unit}</Text>
                  </View>
                </View>

                <LineChart
                  data={chartData}
                  width={SCREEN_WIDTH - 80}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: "#ffffff",
                    backgroundGradientFrom: "#ffffff",
                    backgroundGradientTo: "#ffffff",
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: { r: "5", strokeWidth: "2", stroke: COLORS.primary }
                  }}
                  bezier
                  style={styles.chartStyle}
                />
              </View>

              {/* 3. KPIS (STATS) */}
              <View style={styles.statsRow}>
                {/* Mejor Marca */}
                <View style={[styles.statCard, styles.bestCard]}>
                  <View style={[styles.iconBg, styles.bestIconBg]}>
                    <Trophy size={18} color="#16a34a" />
                  </View>
                  <Text style={styles.statLabel}>Récord</Text>
                  <Text style={[styles.statValue, { color: '#16a34a' }]}>
                    {stats.best} <Text style={styles.statUnitSmall}>{stats.unit}</Text>
                  </Text>
                </View>

                {/* Último */}
                <View style={styles.statCard}>
                  <View style={styles.iconBg}>
                    <Activity size={18} color={COLORS.primary} />
                  </View>
                  <Text style={styles.statLabel}>Último</Text>
                  <Text style={styles.statValue}>
                    {stats.last} <Text style={styles.statUnitSmall}>{stats.unit}</Text>
                  </Text>
                </View>

                {/* Promedio */}
                <View style={styles.statCard}>
                  <View style={styles.iconBg}>
                    <TrendingUp size={18} color={COLORS.textMuted} />
                  </View>
                  <Text style={styles.statLabel}>Promedio</Text>
                  <Text style={[styles.statValue, { color: COLORS.textMuted }]}>
                    {stats.avg} <Text style={styles.statUnitSmall}>{stats.unit}</Text>
                  </Text>
                </View>
              </View>

              {/* 4. HISTORIAL LISTA */}
              <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>Historial Detallado</Text>
                {historyList.map((item, index) => (
                  <View key={index} style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <View style={styles.calendarIcon}>
                        <Calendar size={14} color={COLORS.textMuted} />
                      </View>
                      <Text style={styles.historyDate}>
                        {item.fecha_realizacion ? item.fecha_realizacion.split('T')[0].split('-').reverse().join('/') : ''}
                      </Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyValue}>{item.valor}</Text>
                      <Text style={styles.historyUnit}>{stats.unit}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <BarChart3 size={48} color={COLORS.borderColor} />
              <Text style={styles.emptyText}>
                {testOptions.length > 0
                  ? "Selecciona una prueba para analizar tu rendimiento."
                  : "Aún no tienes registros suficientes para generar estadísticas."}
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
                <Pressable onPress={() => setShowSelector(false)} style={styles.closeButton}>
                  <X size={20} color={COLORS.textMuted} />
                </Pressable>
              </View>
              <FlatList
                data={testOptions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
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
                    {selectedTest?.id === item.id && (
                      <View style={styles.checkIcon}>
                        <CheckCircle2 size={18} color={COLORS.primary} />
                      </View>
                    )}
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Modal>

      </SafeAreaView>
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
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderColor },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, flex: 1, textAlign: 'center' },

  // Selector
  selectorContainer: { marginTop: 16, marginBottom: 24 },
  label: { fontSize: 14, color: COLORS.textMuted, marginBottom: 8, fontWeight: '600' },
  selectorButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: COLORS.borderColor, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  selectorPressed: { backgroundColor: '#f1f5f9' },
  selectorContent: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  selectorText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },

  // Chart
  chartCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderColor, marginBottom: 24, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12, alignItems: 'center' },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  unitBadge: { backgroundColor: COLORS.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  unitText: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' },
  chartStyle: { marginVertical: 8, borderRadius: 16 },

  // Stats Row
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: COLORS.white, padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderColor, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  bestCard: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  iconBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  bestIconBg: { backgroundColor: '#dcfce7' },
  statLabel: { fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: '700', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.textDark },
  statUnitSmall: { fontSize: 10, fontWeight: '600' },

  // History List
  historySection: { backgroundColor: COLORS.white, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.borderColor },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 16 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  calendarIcon: { marginRight: 10, backgroundColor: COLORS.background, padding: 6, borderRadius: 8 },
  historyDate: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  historyRight: { flexDirection: 'row', alignItems: 'baseline' },
  historyValue: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
  historyUnit: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginLeft: 4, textTransform: 'uppercase' },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, opacity: 0.6 },
  emptyText: { marginTop: 16, fontSize: 16, color: COLORS.textMuted, textAlign: 'center', maxWidth: 260, lineHeight: 22 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  closeButton: { padding: 8, backgroundColor: COLORS.background, borderRadius: 20 },

  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  optionSelected: { backgroundColor: COLORS.primaryLight, marginHorizontal: -24, paddingHorizontal: 24 },
  optionText: { fontSize: 16, color: COLORS.textDark, fontWeight: '500' },
  optionTextSelected: { fontWeight: 'bold', color: COLORS.primary },
  checkIcon: { backgroundColor: COLORS.white, borderRadius: 10 },
});