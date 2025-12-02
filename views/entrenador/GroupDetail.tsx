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
const CustomAlertAny = CustomAlert as any;

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

  // --- LÓGICA DE GRUPO ---
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

  const handleAssignTest = () => {
    if (selectedMembers.length === 0) {
        // Si no hay nadie seleccionado, asumimos "Asignar a todos"
        navigation.navigate('AssignTestStep1');
    } else {
        // Lógica para asignar solo a seleccionados
        navigation.navigate('AssignTestStep1');
    }
  };

  return (
    <View className="flex-1 bg-[#F5F5F7]">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <CustomAlertAny 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
        onConfirm={alertConfig.onConfirm}
      />
      

       <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* --- HEADER (IGUAL A MANAGE TESTS) --- */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable 
              onPress={() => navigation.goBack()} 
              className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 active:bg-gray-50"
            >
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </Pressable>

            <Pressable 
              onPress={() => setShowOptionsModal(true)} 
              className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 active:bg-gray-50"
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#111827" />
            </Pressable>
          </View>
          
          <Text className="text-gray-900 text-3xl font-bold mb-1">{groupName}</Text>
          <View className="flex-row items-center gap-2 mb-2">
             <Text className="text-gray-500 text-base font-medium">Detalle del equipo</Text>
             <View className="bg-blue-100 px-2 py-0.5 rounded-md">
                <Text className="text-blue-700 text-xs font-bold tracking-widest">{group?.code || 'COD-000'}</Text>
             </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* DESCRIPCIÓN RÁPIDA */}
          <Text className="text-gray-400 text-sm mb-6 leading-relaxed">
            {group?.description || 'Sin descripción disponible para este grupo.'}
          </Text>

          {/* BOTONES DE ACCIÓN (ESTILO MANAGE TESTS) */}
          <View className="flex-row gap-3 mb-8">
             <Pressable 
                onPress={handleAssignTest}
                className="flex-1 bg-blue-600 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 active:scale-[0.98]"
             >
                <Ionicons name="paper-plane" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-sm">Asignar Prueba</Text>
             </Pressable>

             <Pressable 
                onPress={() => setShowAddMemberModal(true)}
                className="flex-1 bg-white h-14 rounded-2xl flex-row items-center justify-center shadow-sm border border-gray-200 active:bg-gray-50"
             >
                <Ionicons name="person-add" size={20} color="#374151" style={{ marginRight: 8 }} />
                <Text className="text-gray-700 font-bold text-sm">Añadir Atleta</Text>
             </Pressable>
          </View>

          {/* BARRA DE ELIMINACIÓN (CONTEXTUAL) */}
          {selectedMembers.length > 0 && (
            <View className="mb-6">
              <View className="bg-red-50 border border-red-100 rounded-2xl p-4 flex-row justify-between items-center shadow-sm">
                <View className="flex-row items-center">
                  <View className="bg-red-100 p-2 rounded-full mr-3">
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </View>
                  <View>
                    <Text className="text-red-900 text-xs font-bold uppercase">Acción</Text>
                    <Text className="text-red-700 text-sm font-bold">Eliminar {selectedMembers.length} atletas</Text>
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
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-900 font-bold text-xl">Atletas ({members.length})</Text>
            {selectedMembers.length === 0 && (
                <Text className="text-gray-400 text-xs font-medium">Mantén pulsado para editar</Text>
            )}
          </View>

          <View className="space-y-3">
            {members.map((member) => {
              const isSelected = selectedMembers.includes(member.id);
              return (
                <Pressable
                  key={member.id}
                  onPress={() => toggleMember(member.id)}
                  // TARJETA IDÉNTICA A MANAGE TESTS
                  className={`p-4 rounded-2xl flex-row items-center justify-between shadow-sm border ${
                    isSelected ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'
                  }`}
                >
                  <View className="flex-row items-center flex-1 mr-4">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                        isSelected ? 'bg-red-100' : 'bg-gray-50'
                    }`}>
                      <Ionicons 
                        name={isSelected ? "trash-outline" : "person-outline"} 
                        size={20} 
                        color={isSelected ? '#DC2626' : '#6B7280'} 
                      />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-bold text-base ${isSelected ? 'text-red-900' : 'text-gray-900'}`}>
                        {member.name}
                      </Text>
                      <View className="flex-row items-center mt-0.5">
                        <Ionicons name="fitness-outline" size={12} color="#9CA3AF" />
                        <Text className="text-gray-400 text-xs ml-1">{member.level}</Text>
                      </View>
                    </View>
                  </View>
                  
                  {isSelected ? (
                     <Ionicons name="close-circle" size={24} color="#DC2626" />
                  ) : (
                     <Ionicons name="chevron-forward" size={20} color="#E5E7EB" />
                  )}
                </Pressable>
              );
            })}
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* --- MODALES --- */}
      {/* IMPORTANTE: Los Inputs aquí usan styles.safeInput para evitar el crash */}
      
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
                {/* FIX CRASH: style nativo */}
                <TextInput 
                    value={groupName}
                    onChangeText={setGroupName}
                    style={styles.safeInput}
                    placeholder="Nombre del grupo"
                    placeholderTextColor="#9CA3AF"
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
                    {/* FIX CRASH: style nativo */}
                    <TextInput 
                        value={searchDoc}
                        onChangeText={setSearchDoc}
                        placeholder="Ej. 100123456"
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
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

// ESTILOS SEGUROS
const styles = StyleSheet.create({
  safeInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: '#111827',
    marginBottom: 0
  }
});