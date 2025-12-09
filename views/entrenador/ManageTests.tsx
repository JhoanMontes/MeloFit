import React, { useState, useCallback, useMemo } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  Pressable, 
  ActivityIndicator, 
  RefreshControl, 
  TextInput, 
  StyleSheet, 
  Platform 
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase"; 
import { EntrenadorStackParamList } from "../../navigation/types";

// --- CONSTANTES DE DISEÑO (Simulando tu archivo de constantes) ---
const COLORS = {
  primary: "#2563EB",       // Azul principal
  background: "#F8FAFC",    // Fondo gris muy claro
  cardBg: "#FFFFFF",        // Blanco
  textDark: "#1E293B",      // Texto oscuro
  textMuted: "#64748B",     // Texto gris
  borderColor: "#E2E8F0",   // Bordes suaves
  inputBg: "#F1F5F9",       // Fondo de inputs
  shadow: "#000000",        // Color de sombra
  blueLight: "#EFF6FF",     // Fondo azul claro para iconos
  blueText: "#1D4ED8",      // Texto azul oscuro
};

type Props = NativeStackScreenProps<EntrenadorStackParamList, "ManageTests">;

export interface Prueba {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo_metrica: string;
  entrenador_no_documento?: number;
}

// Configuración lógica de métricas
const METRIC_CONFIG: Record<string, { label: string, icon: keyof typeof Ionicons.glyphMap }> = {
  'TIME_MIN': { label: 'TIEMPO (MIN)', icon: 'timer-outline' },
  'DISTANCE_KM': { label: 'DISTANCIA (KM)', icon: 'map-outline' },
  'WEIGHT_KG': { label: 'PESO (KG)', icon: 'barbell-outline' },
  'REPS': { label: 'REPETICIONES', icon: 'repeat-outline' },
};

export default function ManageTests({ navigation }: Props) {
  const [tests, setTests] = useState<Prueba[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTests = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      const { data: userData } = await supabase
        .from('usuario')
        .select('no_documento')
        .eq('auth_id', user.id)
        .single();

      if (!userData) return;

      const { data, error } = await supabase
        .from('prueba') 
        .select('*')
        .eq('entrenador_no_documento', userData.no_documento)
        .order('id', { ascending: false });

      if (error) throw error;
      if (data) setTests(data);

    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTests();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTests();
  };

  const filteredTests = useMemo(() => {
    if (!searchQuery) return tests;
    const lowerQuery = searchQuery.toLowerCase();
    return tests.filter(t => 
      t.nombre.toLowerCase().includes(lowerQuery) ||
      (t.descripcion && t.descripcion.toLowerCase().includes(lowerQuery))
    );
  }, [tests, searchQuery]);

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: Prueba }) => {
    const rawMetric = item.tipo_metrica ? item.tipo_metrica.trim().toUpperCase() : '';
    const config = METRIC_CONFIG[rawMetric] || { label: rawMetric || 'GENERAL', icon: 'document-text-outline' };

    return (
      <Pressable 
        style={({ pressed }) => [
          styles.card, 
          pressed && styles.cardPressed
        ]}
        onPress={() => navigation.navigate('TestDetail', { test: item })}
      >
        <View style={styles.cardContent}>
          {/* Icon Box */}
          <View style={styles.iconBox}>
            <Ionicons name={config.icon} size={22} color={COLORS.primary} />
          </View>
          
          {/* Text Content */}
          <View style={styles.textContent}>
            <Text style={styles.cardTitle}>{item.nombre}</Text>
            <Text style={styles.cardDescription} numberOfLines={1}>
              {item.descripcion || "Sin descripción disponible"}
            </Text>
            
            {/* Badge */}
            <View style={styles.metricBadge}>
              <Ionicons name="resize-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.metricText}>{config.label}</Text>
            </View>
          </View>

          {/* Arrow */}
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
       <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        {/* --- HEADER --- */}
        <View style={styles.headerContainer}>
          <Pressable 
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
          </Pressable>
          
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Mis Pruebas</Text>
            <Text style={styles.subtitleText}>Gestiona tu biblioteca de evaluaciones</Text>
          </View>

          {/* --- SEARCH BAR --- */}
          <View style={styles.inputWrapper}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} style={{ marginRight: 8 }} />
            <TextInput 
                style={styles.textInput}
                placeholder="Buscar por nombre..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </Pressable>
            )}
          </View>
        </View>

        {/* --- LISTA --- */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>
                {searchQuery ? 'Resultados' : 'Biblioteca'} 
                <Text style={styles.countText}> ({filteredTests.length})</Text>
            </Text>
          </View>

          {loading ? (
             <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
             </View>
          ) : (
            <FlatList
                data={filteredTests}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons 
                        name={searchQuery ? "search-outline" : "file-tray-outline"} 
                        size={56} 
                        color="#CBD5E1" 
                    />
                    <Text style={styles.emptyTitle}>
                        {searchQuery ? "No se encontraron resultados" : "Tu biblioteca está vacía"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {searchQuery ? "Intenta con otro término de búsqueda" : "Crea tu primera prueba usando el botón +"}
                    </Text>
                  </View>
                }
            />
          )}
        </View>

        {/* --- FAB (Floating Action Button) --- */}
        {!searchQuery && (
          <Pressable
              style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
              onPress={() => navigation.navigate('AdminCreateTest')}
          >
              <Ionicons name="add" size={30} color="white" />
          </Pressable>
        )}

      </SafeAreaView>
    </View>
  );
}

// --- ESTILOS ADAPTADOS A TU LENGUAJE VISUAL ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  
  // Header Area
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.background, // Asegura que el fondo sea sólido
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    marginBottom: 16,
    // Sombras sutiles como pediste
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonPressed: {
    backgroundColor: COLORS.inputBg,
    transform: [{ scale: 0.96 }],
  },
  titleContainer: {
    marginBottom: 16,
  },
  titleText: {
    fontSize: 28, // Ajustado ligeramente para caber mejor
    fontWeight: "800",
    color: COLORS.textDark,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textMuted,
  },

  // Search Bar (Input Wrapper style)
  inputWrapper: {
    width: "100%",
    height: 52,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
    height: "100%",
  },

  // List Area
  listContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  countText: {
    fontSize: 14,
    fontWeight: "400",
    color: COLORS.textMuted,
  },
  scrollContent: {
    paddingBottom: 100, // Espacio para el FAB
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Cards (Items de la lista)
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    padding: 16,
    marginBottom: 12,
    // Sombras suaves
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "#F8FAFC",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  // Elementos dentro de la Card
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.blueLight, // Azul suave de fondo
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContent: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  metricBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metricText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginLeft: 4,
    textTransform: "uppercase",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    maxWidth: 250,
  },

  // FAB (Floating Action Button)
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    // Sombra fuerte para el botón flotante
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
});