import React from "react";
import { View, Text, Pressable, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, Dumbbell, MessageSquare, CheckCircle, Calendar, TrendingUp } from "lucide-react-native";
import { AprendizStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AprendizStackParamList, "Notifications">;

// Mapeo de datos
const notifications = [
  {
    id: 1,
    Icon: Dumbbell,
    iconBg: 'bg-blue-50',
    iconColor: '#2563EB', // blue-600
    text: 'Tu entrenador te ha asignado una nueva prueba: Test de Cooper.',
    time: 'Hace 2 horas',
    unread: true
  },
  {
    id: 2,
    Icon: MessageSquare,
    iconBg: 'bg-purple-50',
    iconColor: '#9333EA', // purple-600
    text: 'Has recibido un nuevo feedback de tu entrenador.',
    time: 'Hace 5 horas',
    unread: true
  },
  {
    id: 3,
    Icon: CheckCircle,
    iconBg: 'bg-emerald-50',
    iconColor: '#059669', // emerald-600
    text: 'Tu resultado en la prueba "Sentadilla" ha sido registrado correctamente.',
    time: 'Hace 1 día',
    unread: false
  },
  {
    id: 4,
    Icon: Calendar,
    iconBg: 'bg-orange-50',
    iconColor: '#EA580C', // orange-600
    text: 'Recordatorio: Tienes una prueba programada para mañana a las 9:00 AM.',
    time: 'Hace 1 día',
    unread: false
  },
  {
    id: 5,
    Icon: TrendingUp,
    iconBg: 'bg-blue-50',
    iconColor: '#2563EB', // blue-600
    text: '¡Felicitaciones! Has alcanzado un nuevo récord personal en Test de Cooper.',
    time: 'Hace 2 días',
    unread: false
  }
];

export default function Notifications({ navigation }: Props) {
  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView className="flex-1" edges={['top']}>
        
        {/* --- HEADER --- */}
        <View className="px-6 pt-4 pb-4">
          <Pressable 
            onPress={() => navigation.goBack()} 
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-200 mb-6 active:bg-slate-50"
          >
            <ArrowLeft size={22} color="#334155" />
          </Pressable>
          <Text className="text-slate-900 text-3xl font-extrabold tracking-tight">Notificaciones</Text>
          <Text className="text-slate-500 text-base font-medium mt-1">Mantente al día con tus actividades</Text>
        </View>

        {/* --- LISTA DE NOTIFICACIONES --- */}
        <ScrollView 
          className="flex-1 px-6" 
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((notification) => (
            <Pressable
              key={notification.id}
              className={`flex-row p-5 mb-4 rounded-[24px] border items-start active:scale-[0.99] transition-all ${
                notification.unread 
                  ? 'bg-white border-blue-200 shadow-sm shadow-blue-100' // Estilo No Leído
                  : 'bg-white border-slate-100 shadow-sm shadow-slate-200/50' // Estilo Leído
              }`}
            >
              
              {/* Icono (Izquierda) */}
              <View className={`${notification.iconBg} w-12 h-12 rounded-2xl items-center justify-center mr-4`}>
                <notification.Icon size={22} color={notification.iconColor} />
              </View>

              {/* Contenido (Centro) */}
              <View className="flex-1">
                <Text 
                  className={`text-base leading-6 mb-1.5 ${
                    notification.unread ? 'text-slate-900 font-bold' : 'text-slate-600 font-medium'
                  }`}
                >
                  {notification.text}
                </Text>
                <Text className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                  {notification.time}
                </Text>
              </View>

              {/* Indicador de No Leído (Derecha) */}
              {notification.unread && (
                <View className="ml-2 mt-2">
                   <View className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-sm shadow-blue-500" />
                </View>
              )}
            </Pressable>
          ))}
          
          {/* Mensaje final de lista */}
          <View className="items-center mt-4 mb-8">
            <Text className="text-slate-400 text-xs font-medium">No tienes más notificaciones recientes</Text>
          </View>

        </ScrollView>

      </SafeAreaView>
    </View>
  );
}