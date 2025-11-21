import React from "react";
import { View, Text, Pressable, SafeAreaView, StatusBar } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Dumbbell } from "lucide-react-native";

import { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-between px-6 py-6">

          {/* --- SECCIÓN SUPERIOR --- */}
          <View className="flex-1 justify-center items-center">
            <View className="bg-blue-50 w-36 h-36 rounded-full justify-center items-center mb-8 border border-blue-100 shadow-sm">
              <View className="bg-blue-600 p-6 rounded-[28px] shadow-lg shadow-blue-600/40 transform rotate-3">
                <Dumbbell size={48} color="white" strokeWidth={2.5} />
              </View>
            </View>

            <Text className="text-slate-900 mb-3 text-center text-4xl font-extrabold tracking-tight leading-tight">
              Bienvenido a <Text className="text-blue-600">MeloFit</Text>
            </Text>

            <View className="max-w-[300px]">
              <Text className="text-slate-500 text-center leading-relaxed text-base font-medium">
                Tu plataforma personal de entrenamiento fitness.
              </Text>
            </View>
          </View>

          {/* --- SECCIÓN INFERIOR (Botones Corregidos) --- */}
          <View className="w-full space-y-4 pb-2">
            
            {/* SOLUCIÓN: Usamos clases 'active:' en lugar de la función.
                active:opacity-90 -> Cambia opacidad al presionar
                active:scale-[0.98] -> Reduce tamaño al presionar
            */}
            <Pressable
              onPress={() => navigation.navigate("RegistrationStep1")}
              className="w-full bg-blue-600 rounded-2xl h-14 justify-center items-center shadow-lg  active:opacity-90 active:scale-[0.98]"
            >
              <Text className="text-white text-lg font-bold tracking-wide">
                Comenzar
              </Text>
            </Pressable>

            {/* Botón Secundario */}
            <Pressable
              onPress={() => navigation.navigate("Login")}
              className="w-full bg-white border border-slate-200 rounded-2xl h-14 justify-center items-center active:bg-slate-50 active:border-slate-300 mt-4"
            >
              <Text className="text-slate-700 text-lg font-bold">
                Ya Tengo una Cuenta
              </Text>
            </Pressable>

          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}