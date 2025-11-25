import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StatusBar
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Bell,
  User,
  TrendingUp,
  Plus,
  BarChart3,
  Calendar,
  X,
  LogOut,
  ChevronRight,
  Trophy,
  MapPin,
  ClipboardList // Usamos este icono que representa mejor "Mis Pruebas"
} from "lucide-react-native";

import { useAuth } from "../../context/AuthContext";
import { AprendizStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AprendizStackParamList, "Dashboard">;

export default function Dashboard({ navigation }: Props) {
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [showProfileModal, setShowProfileModal] = useState(false);

  // --- COMPONENTE: MODAL DE PERFIL (Igual que antes) ---
  const ProfileModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showProfileModal}
      onRequestClose={() => setShowProfileModal(false)}
    >
      <View className="flex-1 bg-slate-900/60 justify-end">
        <Pressable className="flex-1" onPress={() => setShowProfileModal(false)} />

        <View className="bg-white rounded-t-[40px] p-6 pb-10 shadow-2xl">

          {/* Handle */}
          <View className="items-center mb-4">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-2xl font-bold text-slate-900 tracking-tight">
              Tu Cuenta
            </Text>

            <Pressable
              onPress={() => setShowProfileModal(false)}
              className="p-2 bg-slate-100 rounded-full active:bg-slate-200"
            >
              <X size={20} color="#64748b" />
            </Pressable>
          </View>

          {/* User Info (Clickable) */}
          <Pressable
            onPress={() => {
              setShowProfileModal(false);
              navigation.navigate("Profile");
            }}
            className="flex-row items-center bg-slate-50 p-4 rounded-3xl mb-8 border border-slate-100 active:bg-slate-100"
          >
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4 border-2 border-white">
              <User size={30} color="#2563EB" />
            </View>

            <View>
              <Text className="text-xl font-bold text-slate-900">
                Alex Johnson
              </Text>
              <Text className="text-slate-500 font-medium mt-0.5">
                Atleta • Nivel Intermedio
              </Text>
            </View>
          </Pressable>

          {/* Logout */}
          <Pressable
            onPress={() => { setShowProfileModal(false); signOut(); }}
            className="w-full bg-red-50 py-4 rounded-2xl flex-row items-center justify-center space-x-2 active:bg-red-100"
          >
            <LogOut size={20} color="#DC2626" />
            <Text className="text-red-600 font-bold text-base">
              Cerrar Sesión
            </Text>
          </Pressable>

        </View>
      </View>


    </Modal>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ProfileModal />

      <SafeAreaView edges={['top']} className="flex-1">

        {/* --- HEADER --- */}
        <View className="px-6 pb-4 mt-3 flex-row items-center justify-between">
          <View>
            <Text className="text-slate-500 text-sm font-semibold mb-0.5">
              Bienvenido de nuevo,
            </Text>
            <Text className="text-slate-900 text-2xl font-extrabold tracking-tight">
              Alex Johnson
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => navigation.navigate('Notifications')}
              className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100"
            >
              <Bell size={22} color="#334155" />
              <View className="absolute top-3 right-3.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </Pressable>

            <Pressable
              onPress={() => setShowProfileModal(true)}
              className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center border border-blue-100"
            >
              <User size={22} color="#2563EB" />
            </Pressable>
          </View>
        </View>


        {/* --- SCROLL CONTENT --- */}
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* 1. HERO CARD */}
          <View className="mt-2 mb-6">
            <View className="bg-blue-600 rounded-[32px] p-6 shadow-xl shadow-blue-500/30 overflow-hidden relative">
              <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
              <View className="absolute bottom-0 left-10 w-24 h-24 bg-white/5 rounded-full" />
              <View className="flex-row items-start justify-between mb-6">
                <View>
                  <View className="flex-row items-center space-x-1 mb-1">
                    <Trophy size={14} color="#bfdbfe" />
                    <Text className="text-blue-200 text-xs font-bold uppercase tracking-wider">Último Logro</Text>
                  </View>
                  <Text className="text-white text-2xl font-bold">Test de Cooper</Text>
                  <Text className="text-blue-100 text-sm mt-1">Hoy, 10:30 AM</Text>
                </View>
                <View className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <TrendingUp size={24} color="white" />
                </View>
              </View>
              <View className="bg-black/10 rounded-3xl p-4 flex-row items-center justify-between border border-white/10">
                <View>
                  <Text className="text-blue-200 text-xs font-medium mb-1">Resultado</Text>
                  <View className="flex-row items-baseline space-x-1">
                    <Text className="text-white text-4xl font-extrabold tracking-tight">2,850</Text>
                    <Text className="text-blue-100 text-lg font-medium">m</Text>
                  </View>
                </View>
                <View className="h-8 w-[1px] bg-white/20 mx-2" />
                <View>
                  <Text className="text-blue-200 text-xs font-medium mb-1">Mejora</Text>
                  <Text className="text-emerald-300 text-lg font-bold">+150 m 🎉</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 2. NEXT TASK CARD */}
          <View className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 mb-6">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Siguiente Objetivo</Text>
                <Text className="text-slate-900 text-xl font-bold">Carrera 5km</Text>
              </View>
              <View className="bg-blue-50 p-2.5 rounded-xl">
                <Calendar size={22} color="#2563EB" />
              </View>
            </View>
            <View className="flex-row items-center space-x-2 mb-6 bg-slate-50 p-3 rounded-xl">
              <MapPin size={16} color="#64748b" />
              <Text className="text-slate-600 text-sm font-medium">Pista del Parque Central</Text>
            </View>
            <Pressable onPress={() => navigation.navigate('LogResult')} className="w-full bg-blue-600 rounded-2xl h-14 flex-row justify-center items-center shadow-lg shadow-blue-600/20 active:opacity-90 active:scale-[0.98]">
              <Plus size={20} color="white" style={{ marginRight: 8 }} strokeWidth={3} />
              <Text className="text-white font-bold text-base tracking-wide">Registrar Resultado</Text>
            </Pressable>
          </View>

          {/* 3. RECENT ACTIVITY LIST */}
          <View>
            <Text className="text-slate-900 text-lg font-bold mb-4 px-1">Historial Reciente</Text>
            <View className="bg-white rounded-[28px] p-2 shadow-sm border border-slate-100">
              {[
                { name: 'Sentadilla', value: '100 kg × 8', date: '7 Oct', icon: '🏋️' },
                { name: 'Dominadas', value: '15 reps', date: '6 Oct', icon: '💪' },
                { name: 'Peso muerto', value: '120 kg × 6', date: '5 Oct', icon: '🔥' }
              ].map((activity, index) => (
                <View key={index} className={`flex-row items-center justify-between p-4 ${index !== 2 ? 'border-b border-slate-50' : ''}`}>
                  <View className="flex-row items-center space-x-4">
                    <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                      <Text>{activity.icon}</Text>
                    </View>
                    <View>
                      <Text className="text-slate-900 font-bold text-base">{activity.name}</Text>
                      <Text className="text-sm text-slate-500 font-medium">{activity.value}</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-slate-400 font-semibold bg-slate-50 px-2 py-1 rounded-lg">{activity.date}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* --- BOTTOM NAVIGATION CORREGIDO (Estilo Estándar 4 Botones) --- */}
      <View
        className="absolute bottom-0 w-full bg-white border-t border-slate-100 flex-row justify-around items-center"
        style={{ paddingBottom: Math.max(insets.bottom, 20), paddingTop: 12 }}
      >

        {/* 1. Inicio (Activo) */}
        <Pressable className="items-center justify-center min-w-[64px]">
          <View className="bg-blue-50 px-5 py-1.5 rounded-full mb-1.5">
            <TrendingUp size={24} color="#2563EB" strokeWidth={2.5} />
          </View>
          <Text className="text-[10px] text-blue-600 font-bold">Inicio</Text>
        </Pressable>

        {/* 2. Estadísticas */}
        <Pressable
          onPress={() => navigation.navigate('Stats')}
          className="items-center justify-center min-w-[64px] opacity-60 active:opacity-100"
        >
          <View className="px-5 py-1.5 mb-1.5">
            <BarChart3 size={24} color="#64748b" strokeWidth={2.5} />
          </View>
          <Text className="text-[10px] text-slate-500 font-medium">Datos</Text>
        </Pressable>

        {/* 3. Pruebas (Nuevo diseño integrado) */}
        {/* Cambié el ícono 'Plus' por 'ClipboardList' porque "Mis Pruebas" suele ser una lista. 
            Si prefieres '+', solo cambia el icono aquí. */}
        <Pressable
          onPress={() => navigation.navigate('MisPruebas')}
          className="items-center justify-center min-w-[64px] opacity-60 active:opacity-100"
        >
          <View className="px-5 py-1.5 mb-1.5">
            <ClipboardList size={24} color="#64748b" strokeWidth={2.5} />
          </View>
          <Text className="text-[10px] text-slate-500 font-medium">Pruebas</Text>
        </Pressable>

        {/* 4. Perfil */}
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          className="items-center justify-center min-w-[64px] opacity-60 active:opacity-100"
        >
          <View className="px-5 py-1.5 mb-1.5">
            <User size={24} color="#64748b" strokeWidth={2.5} />
          </View>
          <Text className="text-[10px] text-slate-500 font-medium">Perfil</Text>
        </Pressable>
      </View>

    </View>
  );
}