import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { 
  ArrowLeft, 
  Bell, 
  MessageSquare, 
  ClipboardList, 
  Clock, 
  CheckCircle2,
  Calendar
} from "lucide-react-native";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { AprendizStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AprendizStackParamList, "Notifications">;

// --- COLORES ---
const COLORS = {
  primary: "#2563eb",
  primaryLight: "#eff6ff",
  background: "#f8fafc",
  white: "#ffffff",
  textDark: "#0f172a",
  textMuted: "#64748b",
  borderColor: "#e2e8f0",
  shadow: "#000000",
  newBadge: "#ef444498", // Rojo para "Nuevo"
};

interface NotificationItem {
  id: string;
  type: 'assignment' | 'feedback';
  title: string;
  message: string;
  date: string; // ISO date string
  read: boolean;
  relatedId?: number; // ID para navegar (ej. resultado_id)
}

export default function NotificationsScreen({ navigation }: Props) {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      // 1. Obtener ID del atleta
      const { data: userData } = await supabase.from('usuario').select('no_documento').eq('auth_id', user.id).single();
      if (!userData) return;
      const docId = userData.no_documento;

      // Calcular fecha de hace 7 días para filtrar "recientes"
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateLimit = sevenDaysAgo.toISOString().split('T')[0];

      // 2. Consultar Nuevas Asignaciones (Últimos 7 días)
      const { data: assignments, error: assignError } = await supabase
        .from('prueba_asignada_has_atleta')
        .select(`
          prueba_asignada!inner (
            id,
            fecha_asignacion,
            fecha_limite,
            prueba ( nombre )
          ),
          grupo ( nombre )
        `)
        .eq('atleta_no_documento', docId)
        .gte('prueba_asignada.fecha_asignacion', dateLimit);

      if (assignError) throw assignError;

      // 3. Consultar Nuevos Comentarios (Últimos 7 días)
      // Nota: Comentario -> Resultado -> Atleta
      const { data: comments, error: commentError } = await supabase
        .from('comentario')
        .select(`
          id,
          mensaje,
          fecha,
          resultado_prueba!inner (
            id,
            atleta_no_documento,
            prueba_asignada ( prueba ( nombre ) )
          )
        `)
        .eq('resultado_prueba.atleta_no_documento', docId)
        .gte('fecha', dateLimit);

      if (commentError) throw commentError;

      // 4. Unificar y Formatear
      const formattedNotifications: NotificationItem[] = [];

      // Procesar Asignaciones
      assignments?.forEach((item: any) => {
        formattedNotifications.push({
          id: `assign-${item.prueba_asignada.id}`,
          type: 'assignment',
          title: 'Nueva Prueba Asignada',
          message: `Tu entrenador asignó "${item.prueba_asignada.prueba.nombre}" en el grupo ${item.grupo?.nombre || 'General'}.`,
          date: item.prueba_asignada.fecha_asignacion,
          read: false, // Simulado
        });
      });

      // Procesar Comentarios
      comments?.forEach((item: any) => {
        formattedNotifications.push({
          id: `comment-${item.id}`,
          type: 'feedback',
          title: 'Nuevo Feedback Recibido',
          message: `Comentario en "${item.resultado_prueba?.prueba_asignada?.prueba?.nombre}": ${item.mensaje}`,
          date: item.fecha,
          read: false,
          relatedId: item.resultado_prueba.id
        });
      });

      // Ordenar por fecha descendente (lo más nuevo arriba)
      formattedNotifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setNotifications(formattedNotifications);

    } catch (err) {
      console.error("Error cargando notificaciones:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Renderizado de cada item
  const renderItem = ({ item }: { item: NotificationItem }) => {
    const isAssignment = item.type === 'assignment';
    
    return (
      <View style={[styles.card, !item.read && styles.cardUnread]}>
        <View style={styles.row}>
          
          {/* Icono */}
          <View style={[styles.iconBox, isAssignment ? styles.bgBlue : styles.bgOrange]}>
            {isAssignment ? (
              <ClipboardList size={20} color={isAssignment ? "#2563eb" : "#ea580c"} />
            ) : (
              <MessageSquare size={20} color={isAssignment ? "#2563eb" : "#ea580c"} />
            )}
          </View>

          {/* Contenido */}
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.date}>
                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <Text style={styles.message} numberOfLines={2}>
              {item.message}
            </Text>
          </View>

        </View>
        
        {/* Indicador de "Nuevo" (Punto rojo) */}
        {!item.read && <View style={styles.dot} />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.textDark} />
          </Pressable>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Lista */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Bell size={48} color={COLORS.borderColor} />
                <Text style={styles.emptyText}>No tienes notificaciones recientes.</Text>
              </View>
            }
          />
        )}

      </SafeAreaView>
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderColor },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },

  list: { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 10 },
  
  card: { backgroundColor: COLORS.white, padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderColor, shadowColor: COLORS.shadow, shadowOffset: {width:0, height:1}, shadowOpacity:0.03, shadowRadius:4, elevation:1 },
  cardUnread: { backgroundColor: '#ffffff', borderColor: '#bfdbfe' }, // Sutil borde azul si es nuevo
  
  row: { flexDirection: 'row', gap: 16 },
  
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  bgBlue: { backgroundColor: COLORS.primaryLight },
  bgOrange: { backgroundColor: '#fff7ed' }, // orange-50

  content: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  date: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  message: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },

  dot: { position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.newBadge },

  emptyState: { alignItems: 'center', marginTop: 100, opacity: 0.6 },
  emptyText: { marginTop: 16, fontSize: 16, color: COLORS.textMuted },
});