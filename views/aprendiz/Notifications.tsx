import React, { useState, useEffect } from "react";
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
  CheckCircle2
} from "lucide-react-native";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

// Ajusta según tus rutas reales
type Props = NativeStackScreenProps<any, "Notifications">;

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
  newBadge: "#ef4444",

  // Colores por tipo de notificación
  assignBg: "#eff6ff",    // Azul
  assignIcon: "#2563eb",

  feedbackBg: "#fff7ed",  // Naranja
  feedbackIcon: "#ea580c",

  resultBg: "#f0fdf4",    // Verde
  resultIcon: "#16a34a",
};

interface NotificationItem {
  id: string; // UUID
  title: string;
  message: string;
  type: string; // 'asignacion', 'resultado', 'feedback' (segun tu trigger)
  read: boolean;
  date: string;
  relatedId?: number;
}

export default function NotificationsScreen({ navigation }: Props) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userRole, setUserRole] = useState<'atleta' | 'entrenador' | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // 1. Obtener documento y rol del usuario actual
      const { data: userData, error: userError } = await supabase
        .from('usuario')
        .select('no_documento, rol')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) throw new Error("Usuario no encontrado");

      setUserRole(userData.rol as 'atleta' | 'entrenador');

      // 2. Consultar la tabla REAL de notificaciones
      const { data: notifData, error: notifError } = await supabase
        .from('notificacion')
        .select('*')
        .eq('usuario_no_documento', userData.no_documento)
        .order('fecha_creacion', { ascending: false }) // Las más recientes primero
        .limit(50); // Límite razonable

      if (notifError) throw notifError;

      if (notifData) {
        const mapped = notifData.map((n: any) => ({
          id: n.id,
          title: n.titulo,
          message: n.mensaje,
          type: n.tipo,
          read: n.leido,
          date: n.fecha_creacion,
          relatedId: n.referencia_id
        }));
        setNotifications(mapped);
      }

    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Acción al tocar: Marcar como leído y navegar
  const handlePressNotification = async (item: NotificationItem) => {
    // 1. Navegación Inteligente
    if (userRole === 'entrenador' && item.type === 'resultado') {
      // Ejemplo: Ir al detalle de esa asignación para ver el resultado
      // navigation.navigate('TestAssignmentDetail', { assignmentId: item.relatedId });
      console.log("Navegar a evaluar resultado ID:", item.relatedId);
    }
    else if (userRole === 'atleta') {
      if (item.type === 'asignacion') {
        navigation.navigate('MisPruebas');
      } else if (item.type === 'feedback') {
        // navigation.navigate('ResultDetail', { resultId: item.relatedId });
      }
    }

    // 2. Marcar como leído en BD (si no lo está)
    if (!item.read) {
      // Actualización optimista en UI
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));

      // Actualización en Background a Supabase
      await supabase
        .from('notificacion')
        .update({ leido: true })
        .eq('id', item.id);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    let icon;
    let bgIconColor;
    let iconColor;

    // Mapeo de tipos según tus triggers SQL ('asignacion', 'resultado')
    switch (item.type) {
      case 'asignacion':
        icon = <ClipboardList size={22} color={COLORS.assignIcon} />;
        bgIconColor = COLORS.assignBg;
        iconColor = COLORS.assignIcon;
        break;
      case 'feedback':
        icon = <MessageSquare size={22} color={COLORS.feedbackIcon} />;
        bgIconColor = COLORS.feedbackBg;
        iconColor = COLORS.feedbackIcon;
        break;
      case 'resultado': // Trigger: 'resultado'
        icon = <CheckCircle2 size={22} color={COLORS.resultIcon} />;
        bgIconColor = COLORS.resultBg;
        iconColor = COLORS.resultIcon;
        break;
      default:
        icon = <Bell size={22} color={COLORS.textMuted} />;
        bgIconColor = COLORS.background;
    }

    return (
      <Pressable
        style={[styles.card, !item.read && styles.cardUnread]}
        onPress={() => handlePressNotification(item)}
      >
        <View style={styles.row}>
          {/* Icono Temático */}
          <View style={[styles.iconBox, { backgroundColor: bgIconColor }]}>
            {icon}
          </View>

          {/* Textos */}
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, !item.read && styles.titleUnread]}>
                {item.title}
              </Text>
              <Text style={styles.date}>
                {/* Usamos split para evitar conversión UTC */}
                {item.date ? item.date.split('T')[0].split('-').reverse().join('/') : ''}
              </Text>
            </View>
            <Text style={styles.message} numberOfLines={2}>
              {item.message}
            </Text>
          </View>
        </View>

        {/* Punto indicador de no leído */}
        {!item.read && <View style={styles.dot} />}
      </Pressable>
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
          <View style={{ width: 44 }} />
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
                <View style={styles.emptyIconBg}>
                  <Bell size={32} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>Estás al día</Text>
                <Text style={styles.emptyText}>
                  No tienes notificaciones pendientes por leer.
                </Text>
              </View>
            }
          />
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark
  },

  list: { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 8 },

  card: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2
  },
  cardUnread: {
    backgroundColor: '#ffffff',
    borderColor: '#bfdbfe', // Azul muy claro
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary
  },

  row: { flexDirection: 'row', gap: 16, alignItems: 'center' },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },

  content: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  titleUnread: { fontWeight: '800', color: COLORS.primary },
  date: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  message: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, fontWeight: '500' },

  dot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.newBadge,
    borderWidth: 2,
    borderColor: COLORS.white
  },

  emptyState: { alignItems: 'center', marginTop: 120, paddingHorizontal: 40 },
  emptyIconBg: {
    width: 80, height: 80, backgroundColor: '#f1f5f9', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
});