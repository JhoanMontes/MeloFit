import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  TextInput, 
  ActivityIndicator, 
  ScrollView, 
  RefreshControl,
  StyleSheet,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

// --- CONSTANTES DE DISEÑO ---
const COLORS = {
  primary: "#2563EB",     // Blue 600
  background: "#F5F5F7",  // Light Gray
  cardBg: "#FFFFFF",
  textDark: "#111827",    // Gray 900
  textMuted: "#6B7280",   // Gray 500
  textLight: "#9CA3AF",   // Gray 400
  borderColor: "#E5E7EB",
  shadow: "#000000",
};

type Props = NativeStackScreenProps<EntrenadorStackParamList, "MyGroups">;

interface GroupData {
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export default function MyGroups({ navigation }: Props) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados de datos
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Función de carga
  const fetchGroups = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {          
      const { data: trainerData, error: trainerError } = await supabase
        .from('usuario')
        .select('no_documento')
        .eq('auth_id', user.id)
        .single();

      if (trainerError || !trainerData) throw new Error("Entrenador no encontrado");

      const { data: groupsData, error: groupsError } = await supabase
        .from('grupo')
        .select('*')
        .eq('entrenador_no_documento', trainerData.no_documento)
        .order('fecha_creacion', { ascending: false });

      if (groupsError) throw groupsError;

      if (groupsData) setGroups(groupsData);

    } catch (error: any) {
      console.error("Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  // Filtrado
  const filteredGroups = groups.filter(g => 
    g.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.codigo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Renderizado de tarjeta individual
  const renderGroupCard = (item: GroupData) => (
    <Pressable 
      key={item.codigo}
      // @ts-ignore
      onPress={() => navigation.navigate('GroupDetail', { group: item })}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardContent}>
        {/* Icono */}
        <View style={styles.iconContainer}>
          <Ionicons name="people-outline" size={20} color={COLORS.primary} />
        </View>
        
        {/* Textos */}
        <View style={styles.textContainer}>
          <Text style={styles.groupName}>{item.nombre}</Text>
          <Text style={styles.groupDesc} numberOfLines={1}>
            {item.descripcion || "Sin descripción"}
          </Text>
          
          <View style={styles.codeContainer}>
             <Ionicons name="pricetag-outline" size={12} color={COLORS.textMuted} />
             <Text style={styles.codeText}>COD: {item.codigo}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        {/* SCROLLVIEW CON STICKY HEADER
            stickyHeaderIndices={[1]} significa que el segundo hijo directo (el Buscador)
            se quedará pegado arriba cuando scrollees.
        */}
        <ScrollView 
            stickyHeaderIndices={[1]} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingBottom: 100 }}
        >

          {/* --- [ÍNDICE 0] HEADER SUPERIOR (Se va al hacer scroll) --- */}
          <View style={styles.headerContainer}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
            </Pressable>
            
            <Text style={styles.title}>Mis Grupos</Text>
            <Text style={styles.subtitle}>Gestiona tus equipos y atletas</Text>

            <Pressable
                onPress={() => navigation.navigate('CreateGroup')}
                style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
            >
                <Ionicons name="add" size={24} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.createButtonText}>Crear Nuevo Grupo</Text>
            </Pressable>
          </View>

          {/* --- [ÍNDICE 1] BUSCADOR STICKY (Se queda pegado) --- */}
          <View style={styles.stickySearchWrapper}>
            <View style={styles.searchContainer}>
                <View style={styles.searchIcon}>
                    <Ionicons name="search" size={20} color={COLORS.textLight} />
                </View>
                <TextInput
                    placeholder="Buscar grupo o código..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                    placeholderTextColor={COLORS.textLight}
                />
            </View>
            {/* Título de lista opcional que también se queda pegado si está dentro de este wrapper */}
            <View style={styles.listHeaderRow}>
                <Text style={styles.listTitle}>Listado ({filteredGroups.length})</Text>
            </View>
          </View>

          {/* --- [ÍNDICE 2] CONTENIDO DE LA LISTA (Pasa por debajo) --- */}
          <View style={styles.listContent}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Cargando grupos...</Text>
                </View>
            ) : filteredGroups.length > 0 ? (
                filteredGroups.map(renderGroupCard)
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>
                        No tienes grupos creados.{'\n'}¡Crea el primero arriba!
                    </Text>
                </View>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// --- ESTILOS STRICTOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  
  // Header Área (Scrollable)
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  createButton: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  createButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

  // Sticky Search Area
  stickySearchWrapper: {
    backgroundColor: COLORS.background, // IMPORTANTE: Fondo sólido para tapar el scroll
    paddingHorizontal: 24,
    paddingVertical: 12,
    zIndex: 100, // Asegura que esté encima
    // Sombra sutil opcional para separar visualmente cuando pega
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 2,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 16,
    height: 48,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 16,
    color: COLORS.textDark,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  // List Content
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Cards
  card: {
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: '#F9FAFB',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF', // Blue 50
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  groupDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  codeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
});