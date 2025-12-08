import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
  Modal,
  Dimensions,
  StyleSheet,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LineChart, PieChart } from "react-native-gifted-charts";
import {
  ArrowLeft,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2
} from "lucide-react-native";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "AssignmentsOverview">;

const { width } = Dimensions.get('window');

// --- MOCK DATA ---
const groupsData = [
  {
    id: 1, name: "Fuerza Avanzada", trend: [{ value: 60 }, { value: 80 }, { value: 75 }, { value: 90 }],
    color: '#4F46E5', avg: 86, activeTests: 3
  },
  {
    id: 2, name: "Velocidad Elite", trend: [{ value: 50 }, { value: 55 }, { value: 65 }, { value: 70 }],
    color: '#059669', avg: 72, activeTests: 1
  },
  {
    id: 3, name: "Principiantes", trend: [{ value: 40 }, { value: 30 }, { value: 45 }, { value: 35 }],
    color: '#EA580C', avg: 45, activeTests: 5
  },
];

const assignmentsList = [
  { id: 1, title: "Sentadilla Max (1RM)", group: "Fuerza Avanzada", deadline: "Hoy", completed: 8, total: 10, color: '#4F46E5' },
  { id: 2, title: "Test de Cooper", group: "Principiantes", deadline: "Mañana", completed: 3, total: 15, color: '#EA580C' },
  { id: 3, title: "100m Planos", group: "Velocidad Elite", deadline: "Ayer", completed: 8, total: 8, color: '#059669' },
  { id: 4, title: "Flexibilidad", group: "Principiantes", deadline: "3 días", completed: 0, total: 15, color: '#EA580C' },
  { id: 5, title: "Press Banca", group: "Fuerza Avanzada", deadline: "Semana pasada", completed: 10, total: 10, color: '#4F46E5' },
];

export default function AssignmentsOverview({ navigation }: Props) {
  const [selectedFilter, setSelectedFilter] = useState("Todos");
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const filters = ["Todos", "Pendientes", "Completados"];

  const filteredAssignments = assignmentsList.filter(item => {
    if (selectedFilter === "Todos") return true;
    if (selectedFilter === "Completados") return item.completed === item.total;
    if (selectedFilter === "Pendientes") return item.completed < item.total;
    return true;
  });

  // --- MODAL DETALLE ---
  const GroupDetailModal = () => (
    <Modal
      visible={!!selectedGroup}
      transparent
      animationType="slide"
      onRequestClose={() => setSelectedGroup(null)}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedGroup(null)} />
        
        <View style={styles.modalContent}>
          <View style={styles.modalHandleContainer}>
            <View style={styles.modalHandle} />
          </View>

          {selectedGroup && (
            <>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalSubtitle}>Reporte Rápido</Text>
                  <Text style={styles.modalTitle}>{selectedGroup.name}</Text>
                </View>
                <View style={styles.modalBadge}>
                  <Text style={styles.modalBadgeText}>{selectedGroup.avg}</Text>
                  <Text style={styles.modalBadgeLabel}>Promedio</Text>
                </View>
              </View>

              {/* GRÁFICO GRANDE EN MODAL */}
              <View style={styles.chartContainerLarge}>
                <LineChart
                  data={selectedGroup.trend.map((t: any) => ({ value: Number(t.value) }))}
                  color={selectedGroup.color}
                  thickness={4}
                  curved
                  hideRules
                  hideYAxisText
                  hideAxesAndRules
                  height={120}
                  width={width - 80} // Width calculado manualmente
                  startFillColor={selectedGroup.color}
                  endFillColor="rgba(255,255,255,0.01)"
                  startOpacity={0.2}
                  endOpacity={0.01}
                  areaChart
                  // Props para evitar crash por interacción
                  pointerConfig={{ pointerStripHeight: 0, pointerStripWidth: 0 }}
                  pressEnabled={false}
                  focusEnabled={false}
                />
              </View>

              <Pressable
                onPress={() => setSelectedGroup(null)}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                ]}
              >
                <Text style={styles.closeButtonText}>Cerrar Reporte</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <GroupDetailModal />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <ArrowLeft size={20} color="#1e293b" />
          </Pressable>
          <Text style={styles.headerTitle}>Gestión de Pruebas</Text>
          <Pressable style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}>
            <Search size={20} color="#1e293b" />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >

          {/* 1. SECCIÓN DE INSIGHTS (CARRUSEL) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Rendimiento por Grupo</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {groupsData.map((group) => (
                <Pressable
                  key={group.id}
                  onPress={() => setSelectedGroup(group)}
                  style={({ pressed }) => [
                    styles.cardGroup,
                    pressed && { transform: [{ scale: 0.96 }] }
                  ]}
                >
                  <View>
                    <Text style={styles.cardGroupTitle} numberOfLines={2}>{group.name}</Text>
                    <Text style={styles.cardGroupSubtitle}>{group.activeTests} pruebas activas</Text>
                  </View>

                  {/* MINI GRÁFICO (pointerEvents="none" CRUCIAL) */}
                  <View style={styles.miniChartContainer} pointerEvents="none">
                    <LineChart
                      data={group.trend.map((t: any) => ({ value: Number(t.value) }))}
                      color={group.color}
                      thickness={2}
                      curved
                      hideRules
                      hideAxesAndRules
                      height={60}
                      width={140}
                      initialSpacing={10}
                      yAxisOffset={0}
                      adjustToWidth={false}
                      isAnimated={false}
                      pressEnabled={false}
                      focusEnabled={false}
                    />
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.badgeSmall}>
                      <Text style={styles.badgeSmallText}>{group.avg}%</Text>
                    </View>
                    <View style={styles.chevronContainer}>
                      <ChevronRight size={12} color="#94a3b8" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* 2. FILTROS (CHIPS) */}
          <View style={styles.filtersContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {filters.map((filtro) => {
                const isActive = selectedFilter === filtro;
                return (
                  <Pressable
                    key={filtro}
                    onPress={() => setSelectedFilter(filtro)}
                    style={[
                      styles.filterChip,
                      isActive ? styles.filterChipActive : styles.filterChipInactive
                    ]}
                  >
                    <Text style={[
                      styles.filterText,
                      isActive ? styles.filterTextActive : styles.filterTextInactive
                    ]}>
                      {filtro}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>

          {/* 3. LISTA DE ASIGNACIONES */}
          <View style={styles.listContainer}>
            {filteredAssignments.map((item) => {
              const completedVal = Number(item.completed);
              const totalVal = Number(item.total);
              const progress = totalVal > 0 ? (completedVal / totalVal) * 100 : 0;
              const isDone = progress === 100;

              const pieData = [
                { value: completedVal, color: isDone ? '#22C55E' : item.color },
                { value: totalVal - completedVal, color: '#F1F5F9' }
              ];

              return (
                <Pressable
                  key={item.id}
                  onPress={() => navigation.navigate('TestAssignmentDetail', {
                    assignmentId: item.id,
                    testName: item.title,
                    groupName: item.group
                  })}
                  style={({ pressed }) => [
                    styles.listItem,
                    pressed && { backgroundColor: '#F8FAFC' }
                  ]}
                >
                  <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />

                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{item.title}</Text>
                    <View style={styles.listItemRow}>
                      <Text style={styles.listItemSubtitle}>{item.group}</Text>
                      <View style={[
                        styles.dateBadge,
                        isDone ? styles.dateBadgeGreen : styles.dateBadgeOrange
                      ]}>
                        {isDone ? <CheckCircle2 size={10} color="#15803d" /> : <Clock size={10} color="#c2410c" />}
                        <Text style={[
                          styles.dateBadgeText,
                          isDone ? { color: '#15803d' } : { color: '#c2410c' }
                        ]}>
                          {item.deadline}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.pieChartContainer} pointerEvents="none">
                    <PieChart
                      donut
                      radius={18}
                      innerRadius={14}
                      data={pieData}
                      centerLabelComponent={() => (
                        <Text style={styles.pieChartLabel}>{Math.round(progress)}%</Text>
                      )}
                    />
                  </View>

                  <ChevronRight size={18} color="#cbd5e1" />
                </Pressable>
              );
            })}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// --- ESTILOS PUROS (NO TAILWIND) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // slate-50
  },
  // Header
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconButtonPressed: {
    backgroundColor: '#F1F5F9',
  },
  // Section Carousel
  sectionContainer: {
    marginBottom: 24,
    paddingTop: 8,
  },
  sectionTitle: {
    paddingHorizontal: 24,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 24,
    marginRight: 12,
    width: 160,
    height: 176,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardGroupTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
    lineHeight: 18,
  },
  cardGroupSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  miniChartContainer: {
    height: 64,
    marginLeft: -16,
    overflow: 'hidden',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeSmall: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeSmallText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  chevronContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Filters
  filtersContainer: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterChipInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  filterText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterTextInactive: {
    color: '#475569',
  },
  // List Items
  listContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  colorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 16,
  },
  listItemContent: {
    flex: 1,
    marginRight: 8,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginRight: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dateBadgeGreen: { backgroundColor: '#DCFCE7' },
  dateBadgeOrange: { backgroundColor: '#FFF7ED' },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  pieChartContainer: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChartLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHandleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHandle: {
    width: 48,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalBadgeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563EB',
  },
  modalBadgeLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  chartContainerLarge: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  closeButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});