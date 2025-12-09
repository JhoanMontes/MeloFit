import React from "react";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-react-native";

export type AlertType = "success" | "error" | "warning" | "info";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  onClose: () => void;
  buttonText?: string;
  // Nuevas props para manejo de confirmación
  onConfirm?: () => void;
  cancelText?: string;
}

export default function CustomAlert({
  visible,
  title,
  message,
  type = "info",
  onClose,
  buttonText = "Entendido",
  onConfirm,
  cancelText = "Cancelar"
}: CustomAlertProps) {
  
  // Configuración de colores según el tipo
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: "#DCFCE7", // green-100
      iconColor: "#16A34A", // green-600
      btnColor: "#16A34A",
    },
    error: {
      icon: XCircle,
      bgColor: "#FEE2E2", // red-100
      iconColor: "#DC2626", // red-600
      btnColor: "#DC2626",
    },
    warning: {
      icon: AlertCircle,
      bgColor: "#FFEDD5", // orange-100
      iconColor: "#ea470cff", // orange-600
      btnColor: "#F97316", // orange-500
    },
    info: {
      icon: Info,
      bgColor: "#DBEAFE", // blue-100
      iconColor: "#2563EB", // blue-600
      btnColor: "#2563EB",
    },
  };

  const Style = config[type];
  const Icon = Style.icon;

  const handleConfirm = () => {
    if (onConfirm) {
        onConfirm();
    }
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          
          {/* Icono */}
          <View style={[styles.iconWrapper, { backgroundColor: Style.bgColor }]}>
            <Icon size={32} color={Style.iconColor} />
          </View>

          {/* Textos */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Área de Botones */}
          <View style={styles.buttonRow}>
            
            {/* Botón Cancelar (Solo se muestra si hay onConfirm) */}
            {onConfirm && (
                <Pressable
                    onPress={onClose}
                    style={({pressed}) => [
                        styles.button, 
                        styles.cancelButton,
                        pressed && styles.buttonPressed
                    ]}
                >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </Pressable>
            )}

            {/* Botón Principal (Acción o Cerrar) */}
            <Pressable
                onPress={handleConfirm}
                style={({pressed}) => [
                    styles.button, 
                    { backgroundColor: Style.btnColor },
                    // Si hay dos botones, usamos flex:1, si no, width 100%
                    onConfirm ? { flex: 1 } : { width: '100%' },
                    pressed && styles.buttonPressed
                ]}
            >
                <Text style={styles.buttonText}>{buttonText}</Text>
            </Pressable>

          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    alertContainer: {
        backgroundColor: 'white',
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A', // slate-900
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 16,
        color: '#64748B', // slate-500
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    buttonRow: {
        width: '100%',
        flexDirection: 'row',
        gap: 12, // Espacio entre botones
        justifyContent: 'center',
    },
    button: {
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPressed: {
        opacity: 0.9, 
        transform: [{ scale: 0.98 }]
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F1F5F9', // Slate 100
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    cancelButtonText: {
        color: '#64748B', // Slate 500
        fontWeight: '700',
        fontSize: 16,
    }
});