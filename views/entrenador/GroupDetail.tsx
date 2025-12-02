import React, { useState } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StatusBar,
  Modal,
  TextInput,
  StyleSheet,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";
import CustomAlert, { AlertType } from "../../components/CustomAlert"; 

type Props = NativeStackScreenProps<EntrenadorStackParamList, "GroupDetail">;

// --- DATOS MOCK ---
const mockDatabaseAthletes = [
  { document: '1001', name: 'Carlos "La Roca" Perez', level: 'Avanzado' },
  { document: '1002', name: 'Ana Maria Polo', level: 'Principiante' },
  { document: '12345678', name: 'Jhoan Montes', level: 'Elite' },
];

const initialGroupMembers = [
  { id: 1, name: 'Alex Johnson', level: 'Avanzado', status: 'Activo' },
  { id: 2, name: 'Maria García', level: 'Intermedio', status: 'Activo' },
  { id: 4, name: 'Sarah Miller', level: 'Avanzado', status: 'Pendiente' },
  { id: 5, name: 'John Smith', level: 'Intermedio', status: 'Activo' },
  { id: 6, name: 'Emma Wilson', level: 'Avanzado', status: 'Activo' },
];

export default function GroupDetail({ navigation, route }: Props) {
  const { group } = route.params || {};
  
  // Estados
  const [groupName, setGroupName] = useState(group?.name || 'Fuerza Avanzada');
  const [members, setMembers] = useState(initialGroupMembers);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  // Modales
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Búsqueda
  const [searchDoc, setSearchDoc] = useState('');
  const [foundAthlete, setFoundAthlete] = useState<{document: string, name: string, level: string} | null>(null);
  const [searchError, setSearchError] = useState('');

  // Alerta
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as AlertType,
    onConfirm: undefined as (() => void) | undefined
  });

  const showAlert = (title: string, message: string, type: AlertType = "info", onConfirm?: () => void) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  // --- FUNCIONES ---
  const handleRemoveSelected = () => {
    if (selectedMembers.length === 0) return;
    showAlert(
        "¿Eliminar Atletas?", 
        `Estás a punto de sacar a ${selectedMembers.length} atletas.`, 
        "error",
        () => {
            const remainingMembers = members.filter(m => !selectedMembers.includes(m.id));
            setMembers(remainingMembers);
            setSelectedMembers([]);
            showAlert("Eliminados", "Los atletas han sido removidos.", "success");
        }
    );
  };

  const toggleMember = (memberId: number) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleDeleteGroup = () => {
    setShowOptionsModal(false);
    showAlert("¿Eliminar Grupo?", "Esta acción es permanente.", "error", () => navigation.goBack());
  };

  const handleUpdateGroupName = () => {
    if (groupName.trim() === "") return;
    setShowEditNameModal(false);
    showAlert("Éxito", "Nombre actualizado.", "success");
  };

  const handleSearchAthlete = () => {
    setSearchError('');
    setFoundAthlete(null);
    if (!searchDoc) return;
    const athlete = mockDatabaseAthletes.find(a => a.document === searchDoc);
    if (athlete) {
        const exists = members.find(m => m.name === athlete.name);
        exists ? setSearchError('Ya está en el grupo.') : setFoundAthlete(athlete);
    } else {
        setSearchError('No encontrado.');
    }
  };

  const handleAddFoundAthlete = () => {
    if (foundAthlete) {
        const newMember = { id: Math.random(), name: foundAthlete.name, level: foundAthlete.level, status: 'Activo' };
        setMembers([...members, newMember]);
        setShowAddMemberModal(false);
        setSearchDoc('');
        setFoundAthlete(null);
        showAlert("Añadido", `${foundAthlete.name} agregado.`, "success");
    }
  };

  return (
    <View className="flex-1 bg-[#F5F5F7]">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
        onConfirm={alertConfig.onConfirm}
      />

       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* --- HEADER ESTILIZADO (SIN BORDES) --- */}
        <View className="bg-white px-5 py-4 flex-row items-center justify-between z-10">
            <View className="flex-row items-center flex-1">
                <Pressable onPress={() => navigation.goBack()} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center mr-4 active:bg-slate-100">
                    <Ionicons name="arrow-back" size={22} color="#1E293B" />
                </Pressable>
                
                {/* Nombre Estilizado y Código como Badge */}
                <View className="flex-1">
                    <Text className="text-xl font-extrabold text-slate-900" numberOfLines={1}>
                        {groupName}
                    </Text>
                    <View className="flex-row mt-1">
                        <View className="bg-blue-50 px-2 py-0.5 rounded-md">
                            <Text className="text-[10px] text-blue-700 font-bold tracking-wider">
                                COD: {group?.code || 'FZ-992'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <Pressable onPress={() => setShowOptionsModal(true)} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center active:bg-slate-100">
                <Ionicons name="ellipsis-vertical" size={20} color="#1E293B" />
            </Pressable>
        </View>

        {/* --- CONTENIDO --- */}
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* DESCRIPCIÓN (Seamless con el header) */}
          <View className="bg-white px-6 pb-6 rounded-b-[32px] mb-2 shadow-sm shadow-slate-200/50">
            <View className="flex-row items-start pt-2">
                <View className="w-14 h-14 bg-indigo-50 rounded-2xl items-center justify-center mr-4 border border-indigo-100">
                   <Ionicons name="people" size={28} color="#4F46E5" />
                </View>
                <View className="flex-1">
                    <Text className="text-slate-500 leading-relaxed text-sm font-medium">
                        {group?.description || 'Este grupo está enfocado en el desarrollo integral del atleta, mejorando fuerza y resistencia.'}
                    </Text>
                </View>
            </View>
          </View>

          {/* ACCIONES RÁPIDAS */}
          <View className="px-6 mt-4">
            <Text className="text-slate-900 font-bold text-base mb-3 ml-1">Acciones Rápidas</Text>
            <View className="flex-row gap-3">
                <Pressable 
                  onPress={() => navigation.navigate('AssignTestStep1')}
                  className="flex-1 bg-blue-600 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 active:scale-[0.98]"
                >
                  <Ionicons name="paper-plane-outline" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-bold text-sm">Asignar a Todos</Text>
                </Pressable>

                <Pressable 
                   onPress={() => setShowAddMemberModal(true)}
                   className="flex-1 bg-white border border-slate-200 h-14 rounded-2xl flex-row items-center justify-center active:bg-slate-50"
                >
                   <Ionicons name="person-add-outline" size={20} color="#334155" style={{ marginRight: 8 }} />
                   <Text className="text-slate-700 font-bold text-sm">Añadir Atleta</Text>
                </Pressable>
            </View>
          </View>

          {/* BARRA DE ELIMINACIÓN */}
          {selectedMembers.length > 0 && (
            <View className="px-6 mt-6">
              <View className="bg-red-50 border border-red-100 rounded-2xl p-4 flex-row justify-between items-center shadow-sm">
                <View className="flex-row items-center">
                  <View className="bg-red-100 p-2 rounded-full mr-3">
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </View>
                  <View>
                    <Text className="text-red-900 text-xs font-bold uppercase">Eliminar</Text>
                    <Text className="text-red-700 text-base font-bold">{selectedMembers.length} seleccionados</Text>
                  </View>
                </View>
                <Pressable 
                  onPress={handleRemoveSelected}
                  className="bg-red-600 px-4 py-2 rounded-xl active:bg-red-700"
                >
                  <Text className="text-white font-bold text-xs">Confirmar</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* LISTA DE MIEMBROS */}
          <View className="px-6 mt-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-slate-900 font-bold text-lg ml-1">Miembros ({members.length})</Text>
              {selectedMembers.length === 0 && (
                  <Text className="text-slate-400 text-xs font-medium">Mantén presionado para editar</Text>
              )}
            </View>

            <View className="space-y-3">
              {members.map((member) => {
                const isSelected = selectedMembers.includes(member.id);
                return (
                  <Pressable
                    key={member.id}
                    onPress={() => toggleMember(member.id)}
                    className={`bg-white p-4 rounded-2xl border flex-row items-center justify-between ${
                      isSelected ? 'border-red-300 bg-red-50/50' : 'border-slate-100'
                    }`}
                  >
                    <View className="flex-row items-center gap-4">
                        <View className={`w-10 h-10 rounded-full items-center justify-center ${isSelected ? 'bg-red-100' : 'bg-slate-100'}`}>
                            <Ionicons 
                                name={isSelected ? "trash-outline" : "person"} 
                                size={18} 
                                color={isSelected ? '#DC2626' : '#94A3B8'} 
                            />
                        </View>
                        <View>
                            <Text className={`font-bold text-base ${isSelected ? 'text-red-900' : 'text-slate-900'}`}>{member.name}</Text>
                            <Text className="text-slate-500 text-xs font-medium">{member.level} • {member.status}</Text>
                        </View>
                    </View>

                    <View className={`w-6 h-6 rounded-full border items-center justify-center ${
                      isSelected ? 'bg-red-600 border-red-600' : 'border-slate-200 bg-white'
                    }`}>
                      {isSelected && <Ionicons name="close" size={14} color="white" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* --- MODALES --- */}
      
      {/* 1. OPCIONES */}
      <Modal visible={showOptionsModal} transparent animationType="fade" onRequestClose={() => setShowOptionsModal(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowOptionsModal(false)}>
            <View className="bg-white rounded-t-3xl p-6 pb-10">
                <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mb-6" />
                <Text className="text-xl font-bold text-slate-900 mb-6 text-center">Opciones del Grupo</Text>
                
                <Pressable 
                    onPress={() => { setShowOptionsModal(false); setShowEditNameModal(true); }}
                    className="flex-row items-center p-4 bg-slate-50 rounded-2xl mb-3 border border-slate-100 active:bg-slate-100"
                >
                    <Ionicons name="pencil" size={22} color="#475569" style={{marginRight: 12}} />
                    <Text className="text-base font-bold text-slate-700">Editar Nombre</Text>
                </Pressable>

                <Pressable 
                    onPress={handleDeleteGroup}
                    className="flex-row items-center p-4 bg-red-50 rounded-2xl border border-red-100 active:bg-red-100"
                >
                    <Ionicons name="trash" size={22} color="#DC2626" style={{marginRight: 12}} />
                    <Text className="text-base font-bold text-red-600">Eliminar Grupo</Text>
                </Pressable>
            </View>
        </Pressable>
      </Modal>

      {/* 2. EDITAR NOMBRE */}
      <Modal visible={showEditNameModal} transparent animationType="fade" onRequestClose={() => setShowEditNameModal(false)}>
        <View className="flex-1 bg-black/50 justify-center px-6">
            <View className="bg-white rounded-3xl p-6 shadow-xl">
                <Text className="text-lg font-bold text-slate-900 mb-4 text-center">Editar Nombre</Text>
                <TextInput 
                    value={groupName}
                    onChangeText={setGroupName}
                    style={styles.safeInput}
                    placeholder="Nombre del grupo"
                />
                <View className="flex-row gap-3 mt-6">
                    <Pressable onPress={() => setShowEditNameModal(false)} className="flex-1 h-12 justify-center items-center rounded-xl border border-slate-200">
                        <Text className="font-bold text-slate-600">Cancelar</Text>
                    </Pressable>
                    <Pressable onPress={handleUpdateGroupName} className="flex-1 h-12 justify-center items-center rounded-xl bg-blue-600">
                        <Text className="font-bold text-white">Guardar</Text>
                    </Pressable>
                </View>
            </View>
        </View>
      </Modal>

      {/* 3. AÑADIR ATLETA */}
      <Modal visible={showAddMemberModal} transparent animationType="slide" onRequestClose={() => setShowAddMemberModal(false)}>
        <View className="flex-1 bg-white mt-20 rounded-t-3xl shadow-2xl border-t border-slate-100">
            <View className="p-6">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-2xl font-bold text-slate-900">Añadir Atleta</Text>
                    <Pressable onPress={() => setShowAddMemberModal(false)} className="p-2 bg-slate-100 rounded-full">
                        <Ionicons name="close" size={24} color="#64748B" />
                    </Pressable>
                </View>
                <Text className="text-slate-500 mb-2 font-medium ml-1">Buscar por Documento</Text>
                <View className="flex-row gap-3 mb-6">
                    <TextInput 
                        value={searchDoc}
                        onChangeText={setSearchDoc}
                        placeholder="Ej. 1001"
                        keyboardType="numeric"
                        style={[styles.safeInput, { flex: 1, marginBottom: 0 }]}
                    />
                    <Pressable onPress={handleSearchAthlete} className="bg-blue-600 w-14 rounded-xl items-center justify-center">
                        <Ionicons name="search" size={24} color="white" />
                    </Pressable>
                </View>

                {searchError ? (
                    <View className="bg-red-50 p-4 rounded-xl flex-row items-center mb-4">
                        <Ionicons name="alert-circle" size={20} color="#DC2626" style={{marginRight: 8}} />
                        <Text className="text-red-600 font-medium flex-1">{searchError}</Text>
                    </View>
                ) : null}

                {foundAthlete && (
                    <View className="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
                        <View className="flex-row items-center mb-4">
                            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                                <Ionicons name="person" size={24} color="#2563EB" />
                            </View>
                            <View>
                                <Text className="text-lg font-bold text-slate-900">{foundAthlete.name}</Text>
                                <Text className="text-slate-500 font-medium">Nivel: {foundAthlete.level}</Text>
                            </View>
                        </View>
                        <Pressable 
                            onPress={handleAddFoundAthlete}
                            className="bg-blue-600 h-12 rounded-xl flex-row items-center justify-center active:bg-blue-700"
                        >
                            <Ionicons name="add-circle-outline" size={20} color="white" style={{marginRight: 8}} />
                            <Text className="text-white font-bold text-base">Agregar al Grupo</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  safeInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 0
  }
});