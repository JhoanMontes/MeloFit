import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<EntrenadorStackParamList, "SendFeedback">;

export default function SendFeedback({ navigation, route }: Props) {
  const { result } = route.params || {};
  
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    if (feedbackText.trim().length < 5) {
        Alert.alert("Feedback muy corto", "Por favor escribe un comentario más detallado para el atleta.");
        return;
    }
    Alert.alert("¡Enviado!", "El feedback ha sido enviado correctamente.", [
        { text: "Volver al Dashboard", onPress: () => navigation.navigate('Dashboard') }
    ]);
  };

  const athleteName = result?.athleteName || "Atleta";
  const testName = result?.test || "Prueba";
  const testResult = result?.result || "---";

  return (
    <View className="flex-1 bg-[#F5F5F7]">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          
          {/* --- HEADER (Estilo ManageTests) --- */}
          <View className="px-6 pt-4 pb-2">
            <Pressable 
              onPress={() => navigation.goBack()} 
              className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm mb-4 border border-gray-100 active:bg-gray-50"
            >
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </Pressable>
            
            <Text className="text-gray-900 text-3xl font-bold mb-1">Enviar Feedback</Text>
            <Text className="text-gray-500 text-base font-medium">
              Evaluando a <Text className="text-blue-600 font-bold">{athleteName}</Text>
            </Text>
          </View>

          <ScrollView 
            className="flex-1 px-6 pt-6" 
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            
            {/* TARJETA 1: RESUMEN DEL RESULTADO */}
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
                <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                            <Ionicons name="stopwatch-outline" size={20} color="#2563EB" />
                        </View>
                        <View>
                            <Text className="text-gray-900 font-bold text-base">{testName}</Text>
                            <Text className="text-gray-400 text-xs uppercase font-bold">Resultado</Text>
                        </View>
                    </View>
                    <Text className="text-2xl font-extrabold text-gray-900">{testResult}</Text>
                </View>
            </View>

            {/* TARJETA 2: CALIFICACIÓN */}
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
                <Text className="text-gray-900 font-bold text-base mb-4">Calificación del Desempeño</Text>
                <View className="flex-row justify-between px-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Pressable 
                            key={star} 
                            onPress={() => setRating(star)} 
                            className="p-2 active:opacity-50"
                        >
                            <Ionicons 
                                name={star <= rating ? "star" : "star-outline"} 
                                size={36} 
                                color={star <= rating ? "#F59E0B" : "#E5E7EB"} 
                            />
                        </Pressable>
                    ))}
                </View>
                <Text className="text-center text-gray-400 text-xs mt-3 font-medium">
                    {rating === 0 ? "Toca las estrellas para calificar" : 
                     rating === 5 ? "¡Excelente trabajo!" : 
                     rating >= 3 ? "Buen desempeño" : "Necesita mejorar"}
                </Text>
            </View>

            {/* TARJETA 3: COMENTARIOS (INPUT SEGURO) */}
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <Text className="text-gray-900 font-bold text-base mb-3">Comentarios Técnicos</Text>
                <View style={styles.inputContainer}>
                    <TextInput 
                        placeholder="Escribe aquí tus observaciones técnicas, correcciones o palabras de motivación..."
                        multiline
                        textAlignVertical="top"
                        value={feedbackText}
                        onChangeText={setFeedbackText}
                        // USAMOS STYLE NATIVO - EVITA EL BUG DE NATIVEWIND
                        style={styles.safeInput}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>

          </ScrollView>

          {/* FOOTER FIJO (Igual a AdminCreateTest) */}
          <View className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-6 pb-8 shadow-2xl">
            <Pressable 
                onPress={handleSubmit}
                className={`w-full h-14 rounded-2xl flex-row items-center justify-center shadow-lg active:scale-[0.98] transition-all ${
                    rating > 0 && feedbackText.length > 0 ? 'bg-blue-600 shadow-blue-200' : 'bg-gray-200 shadow-none'
                }`}
                disabled={rating === 0 || feedbackText.length === 0}
            >
                <Ionicons name="paper-plane" size={20} color={rating > 0 && feedbackText.length > 0 ? "white" : "#9CA3AF"} style={{ marginRight: 8 }} />
                <Text className={`font-bold text-lg ${rating > 0 && feedbackText.length > 0 ? "text-white" : "text-gray-400"}`}>
                    Enviar Feedback
                </Text>
            </Pressable>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    height: 160,
  },
  safeInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top', // Importante para multiline en Android
  }
});