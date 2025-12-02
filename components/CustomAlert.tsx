import React from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-react-native";

export type AlertType = "success" | "error" | "warning" | "info";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  onClose: () => void;
  buttonText?: string;
}

export default function CustomAlert({
  visible,
  title,
  message,
  type = "info",
  onClose,
  buttonText = "Entendido"
}: CustomAlertProps) {
  
  // Configuración de colores e iconos según el tipo
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-100",
      iconColor: "#16A34A", // green-600
      btnColor: "bg-green-600",
    },
    error: {
      icon: XCircle,
      bgColor: "bg-red-100",
      iconColor: "#DC2626", // red-600
      btnColor: "bg-red-600",
    },
    warning: {
      icon: AlertCircle,
      bgColor: "bg-orange-100",
      iconColor: "#EA580C", // orange-600
      btnColor: "bg-orange-500",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-100",
      iconColor: "#2563EB", // blue-600
      btnColor: "bg-blue-600",
    },
  };

  const Style = config[type];
  const Icon = Style.icon;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <View className="bg-white w-full max-w-sm rounded-3xl p-6 items-center shadow-xl">
          
          {/* Icono */}
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${Style.bgColor}`}>
            <Icon size={32} color={Style.iconColor} />
          </View>

          {/* Textos */}
          <Text className="text-xl font-bold text-slate-900 text-center mb-2">
            {title}
          </Text>
          <Text className="text-base text-slate-500 text-center mb-6 leading-6">
            {message}
          </Text>

          {/* Botón */}
          <Pressable
            onPress={onClose}
            className={`w-full py-3.5 rounded-2xl items-center active:opacity-90 ${Style.btnColor}`}
          >
            <Text className="text-white font-bold text-base">{buttonText}</Text>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
}