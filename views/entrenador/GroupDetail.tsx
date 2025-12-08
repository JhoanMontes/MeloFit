import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, StatusBar, Modal, TextInput, StyleSheet, ActivityIndicator, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";
import CustomAlert, { AlertType } from "../../components/CustomAlert";
import { supabase } from "../../lib/supabase";
import { useFocusEffect } from "@react-navigation/native";

const CustomAlertAny = CustomAlert as any;

type Props = NativeStackScreenProps<EntrenadorStackParamList, "GroupDetail">;

interface AthleteUser {
  no_documento: number;
  nombre_completo: string;
  rol: string;
}

const mockGroupTests = {
  active: [
    { id: 1, name: 'Test de Cooper', deadline: 'Hoy', completedCount: 5 },
    { id: 2, name: 'Sentadilla Max', deadline: 'Mañana', completedCount: 2 },
  ],
  history: [
    { id: 3, name: 'Velocidad 100m', date: '20 Nov', completedCount: 12, totalCount: 12 },
    { id: 4, name: 'Flexiones', date: '15 Nov', completedCount: 10, totalCount: 12 },
  ]
};

export default function GroupDetail({ navigation, route }: Props) {
  const { group } = route.params || {};
  const [activeTab, setActiveTab] = useState<'members' | 'tests'>('members');
  const [groupName, setGroupName] = useState(group?.nombre || 'Sin Nombre');
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchDoc, setSearchDoc] = useState('');
  const [foundAthlete, setFoundAthlete] = useState<AthleteUser | null>(null);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "info" as AlertType, onConfirm: undefined as (() => void) | undefined });

  const showAlert = (title: string, message: string, type: AlertType = "info", onConfirm?: () => void) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const fetchGroupMembers = useCallback(async () => {
    if (!group?.codigo) return;
    try {
      setLoadingMembers(true);
      const { data, error } = await supabase
        .from('atleta_has_grupo')
        .select(`atleta_no_documento, atleta:atleta_no_documento (usuario!atleta_no_documento_fkey (nombre_completo, rol))`)
        .eq('grupo_codigo', group.codigo);
      if (error) throw error;
      const formattedMembers = data.map((item: any) => ({
        id: item.atleta_no_documento,
        name: item.atleta?.usuario?.nombre_completo || 'Usuario Desconocido',
        level: 'Atleta', status: 'Activo'
      }));
      setMembers(formattedMembers);
    } catch (error: any) { console.error("Error cargando miembros:", error.message); }
    finally { setLoadingMembers(false); }
  }, [group?.codigo]);

  useFocusEffect(useCallback(() => { fetchGroupMembers(); }, [fetchGroupMembers]));

  const handleSearchAthlete = async () => {
    setSearchError(''); setFoundAthlete(null);
    if (!searchDoc.trim()) return;
    try {
      setSearching(true);
      const { data, error } = await supabase.from('usuario').select('nombre_completo, no_documento, rol').eq('no_documento', parseInt(searchDoc)).maybeSingle();
      if (error) throw error;
      if (data) {
        const exists = members.find(m => m.id === data.no_documento);
        exists ? setSearchError('Este atleta ya pertenece al grupo.') : setFoundAthlete(data);
      } else { setSearchError('No se encontró información.'); }
    } catch (e: any) { setSearchError('Error al buscar usuario.'); } finally { setSearching(false); }
  };

  const handleAddFoundAthlete = async () => {
    if (!foundAthlete || !group?.codigo) return;
    try {
      setLoadingAction(true);
      const { error: linkError } = await supabase.from('atleta_has_grupo').insert({ grupo_codigo: group.codigo, atleta_no_documento: foundAthlete.no_documento });
      if (linkError) { if (linkError.code === '23505') throw new Error("El atleta ya está en este grupo."); throw linkError; }
      showAlert("Añadido", `${foundAthlete.nombre_completo} ha sido agregado.`, "success");
      setShowAddMemberModal(false); setSearchDoc(''); setFoundAthlete(null); fetchGroupMembers();
    } catch (error: any) { Alert.alert("Error", error.message); } finally { setLoadingAction(false); }
  };

  const handleRemoveSelected = () => {
    if (selectedMembers.length === 0) return;
    showAlert("¿Eliminar Atletas?", `Se eliminarán ${selectedMembers.length} atletas.`, "error", async () => {
      try {
        setLoadingAction(true);
        const { error } = await supabase.from('atleta_has_grupo').delete().eq('grupo_codigo', group.codigo).in('atleta_no_documento', selectedMembers);
        if (error) throw error;
        showAlert("Eliminados", "Atletas removidos correctamente.", "success"); setSelectedMembers([]); fetchGroupMembers();
      } catch (error: any) { Alert.alert("Error", error.message); } finally { setLoadingAction(false); }
    });
  };

  const handleDeleteGroup = async () => {
    setShowOptionsModal(false);
    showAlert("¿Eliminar Grupo?", "Esta acción es permanente.", "error", async () => {
      try {
        setLoadingAction(true);
        const { error } = await supabase.from('grupo').delete().eq('codigo', group.codigo);
        if (error) throw error; navigation.goBack();
      } catch (error: any) { Alert.alert("Error", error.message); } finally { setLoadingAction(false); }
    });
  };

  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) return;
    try {
      setLoadingAction(true);
      const { error } = await supabase.from('grupo').update({ nombre: groupName }).eq('codigo', group.codigo);
      if (error) throw error; setShowEditNameModal(false); showAlert("Éxito", "Nombre actualizado.", "success");
    } catch (error: any) { Alert.alert("Error", error.message); } finally { setLoadingAction(false); }
  };

  const toggleMember = (memberId: number) => {
    if (selectedMembers.includes(memberId)) setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    else setSelectedMembers([...selectedMembers, memberId]);
  };

  const handleAssignTest = () => {
    if (!group) return;
    navigation.navigate('AssignTestStep1', { targetGroup: { codigo: group.codigo, nombre: group.nombre } });
  };

  return (
    <View className="flex-1 bg-[#F5F5F7]">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <CustomAlertAny visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} onConfirm={alertConfig.onConfirm} />
      {loadingAction && <View className="absolute inset-0 bg-black/20 z-50 items-center justify-center"><ActivityIndicator size="large" color="#2563EB" /></View>}

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={() => navigation.goBack()} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 active:bg-gray-50"><Ionicons name="arrow-back" size={20} color="#111827" /></Pressable>
            <Pressable onPress={() => setShowOptionsModal(true)} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 active:bg-gray-50"><Ionicons name="ellipsis-horizontal" size={20} color="#111827" /></Pressable>
          </View>
          <Text className="text-gray-900 text-3xl font-bold mb-1">{groupName}</Text>
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-gray-500 text-base font-medium">Detalle del equipo</Text>
            <View className="bg-blue-100 px-2 py-0.5 rounded-md"><Text className="text-blue-700 text-xs font-bold tracking-widest">{group?.codigo || 'COD'}</Text></View>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 100 }}>
          <Text className="text-gray-400 text-sm mb-6 leading-relaxed">{group?.descripcion || 'Sin descripción disponible.'}</Text>

          <View className="flex-row bg-white p-1 rounded-2xl mb-6 border border-gray-100 shadow-sm">
            <Pressable onPress={() => setActiveTab('members')} className={`flex-1 py-3 rounded-xl items-center justify-center ${activeTab === 'members' ? 'bg-blue-50' : 'bg-transparent'}`}><Text className={`font-bold text-sm ${activeTab === 'members' ? 'text-blue-700' : 'text-gray-500'}`}>Atletas ({members.length})</Text></Pressable>
            <Pressable onPress={() => setActiveTab('tests')} className={`flex-1 py-3 rounded-xl items-center justify-center ${activeTab === 'tests' ? 'bg-blue-50' : 'bg-transparent'}`}><Text className={`font-bold text-sm ${activeTab === 'tests' ? 'text-blue-700' : 'text-gray-500'}`}>Evaluaciones</Text></Pressable>
          </View>

          {activeTab === 'members' && (
            <>
              <View className="flex-row gap-3 mb-6">
                <Pressable onPress={() => setShowAddMemberModal(true)} className="flex-1 bg-blue-600 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 active:scale-[0.98]"><Ionicons name="person-add" size={20} color="white" style={{ marginRight: 8 }} /><Text className="text-white font-bold text-sm">Añadir Atleta</Text></Pressable>
              </View>
              {selectedMembers.length > 0 && (
                <View className="mb-6">
                  <View className="bg-red-50 border border-red-100 rounded-2xl p-4 flex-row justify-between items-center shadow-sm">
                    <View className="flex-row items-center">
                      <View className="bg-red-100 p-2 rounded-full mr-3"><Ionicons name="trash-outline" size={20} color="#DC2626" /></View>
                      <View><Text className="text-red-900 text-xs font-bold uppercase">Acción</Text><Text className="text-red-700 text-sm font-bold">Eliminar {selectedMembers.length} seleccionados</Text></View>
                    </View>
                    <Pressable onPress={handleRemoveSelected} className="bg-red-600 px-4 py-2 rounded-xl active:bg-red-700"><Text className="text-white font-bold text-xs">Confirmar</Text></Pressable>
                  </View>
                </View>
              )}
              {loadingMembers ? (<ActivityIndicator color="#2563EB" size="small" />) : members.length === 0 ? (
                <View className="bg-white p-6 rounded-2xl items-center justify-center border border-dashed border-gray-300"><Ionicons name="people-outline" size={40} color="#D1D5DB" /><Text className="text-gray-400 text-center mt-2">No hay atletas.</Text></View>
              ) : (
                <View className="space-y-3">
                  {members.map((member) => {
                    const isSelected = selectedMembers.includes(member.id);

                    return (
                      <Pressable
                        key={member.id}
                        onPress={() => navigation.navigate('AthleteDetail', { athlete: member })}
                        onLongPress={() => toggleMember(member.id)}
                        className={`
                    p-4 rounded-2xl flex-row items-center justify-between 
                    shadow-sm border my-2
                    ${isSelected ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}
                `}
                      >
                        {/* Left content */}
                        <View className="flex-row items-center flex-1 mr-4">
                          {/* Avatar */}
                          <View
                            className={`
                            w-11 h-11 rounded-full items-center justify-center mr-3 shadow-sm
                            ${isSelected ? 'bg-red-100' : 'bg-gray-100'}
                        `}
                          >
                            <Ionicons
                              name={isSelected ? 'trash-outline' : 'person-outline'}
                              size={20}
                              color={isSelected ? '#DC2626' : '#6B7280'}
                            />
                          </View>

                          {/* Member info */}
                          <View className="flex-1">
                            <Text
                              className={`font-semibold text-base ${isSelected ? 'text-red-900' : 'text-gray-900'
                                }`}
                            >
                              {member.name}
                            </Text>

                            <View className="flex-row items-center mt-1">
                              <Ionicons name="card-outline" size={12} color="#9CA3AF" />
                              <Text className="text-gray-400 text-xs ml-1">
                                Doc: {member.id}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Right icon */}
                        {isSelected ? (
                          <Ionicons name="close-circle" size={24} color="#DC2626" />
                        ) : (
                          <Ionicons name="chevron-forward" size={20} color="#E5E7EB" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

              )}
            </>
          )}

          {activeTab === 'tests' && (
            <>
              <View className="flex-row gap-3 mb-6">
                <Pressable onPress={handleAssignTest} className="flex-1 bg-blue-600 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200 active:scale-[0.98]"><Ionicons name="paper-plane" size={20} color="white" style={{ marginRight: 8 }} /><Text className="text-white font-bold text-sm">Asignar Nueva Prueba</Text></Pressable>
              </View>

              {/* ASIGNACIONES ACTIVAS - Llevan a TestAssignmentDetail (Pestaña FALTAN) */}
              <Text className="text-gray-900 font-bold text-lg mb-3 ml-1">En Curso</Text>
              <View className="space-y-3 mb-6">
                {mockGroupTests.active.map((test) => (
                  <Pressable
                    key={test.id}
                    onPress={() => navigation.navigate(
                      'TestAssignmentDetail',
                      { assignmentId: test.id, testName: test.name, groupName: groupName, initialTab: 'pending' }
                    )}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:bg-gray-50 my-2"
                  >
                    <View className="flex-row justify-between items-center mb-2">
                      <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 bg-orange-50 rounded-full items-center justify-center">
                          <Ionicons name="hourglass" size={20} color="#F97316" />
                        </View>

                        <View>
                          <Text className="font-bold text-slate-900">{test.name}</Text>
                          <Text className="text-xs text-slate-500">Vence: {test.deadline}</Text>
                        </View>
                      </View>

                      <Ionicons name="chevron-forward" size={20} color="#E5E7EB" />
                    </View>

                    <View>
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-[10px] text-slate-400 font-bold uppercase">Progreso</Text>
                        <Text className="text-[10px] text-blue-600 font-bold">
                          {test.completedCount}/{members.length > 0 ? members.length : 1} completados
                        </Text>
                      </View>

                      <View className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <View className="h-full bg-blue-500 w-[40%]" />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>


              {/* HISTORIAL COMPLETADO - Llevan a TestAssignmentDetail (Pestaña LISTOS) */}
              <Text className="text-gray-900 font-bold text-lg mb-3 ml-1">Historial Completado</Text>
              <View className="space-y-3">
                {mockGroupTests.history.map((test) => (
                  <Pressable
                    key={test.id}
                    onPress={() =>
                      navigation.navigate('TestAssignmentDetail', {
                        assignmentId: test.id,
                        testName: test.name,
                        groupName: groupName,
                        initialTab: 'completed',
                      })
                    }
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 opacity-80 flex-row justify-between items-center active:bg-gray-50 my-2"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center">
                        <Ionicons name="checkmark-done" size={20} color="#10B981" />
                      </View>

                      <View>
                        <Text className="font-bold text-slate-900">{test.name}</Text>
                        <Text className="text-xs text-slate-500">{test.date}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center">
                      <View className="items-end mr-2">
                        <Text className="text-emerald-700 font-bold text-sm">Completado</Text>
                        <Text className="text-xs text-slate-400">{test.completedCount} entregas</Text>
                      </View>

                      <Ionicons name="chevron-forward" size={20} color="#E5E7EB" />
                    </View>
                  </Pressable>
                ))}
              </View>

            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* MODALES CON INPUTS SEGUROS */}
      <Modal visible={showEditNameModal} transparent animationType="fade" onRequestClose={() => setShowEditNameModal(false)}>
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-[32px] p-6 shadow-xl">
            <Text className="text-lg font-bold text-slate-900 mb-4 text-center">Editar Nombre</Text>
            <TextInput value={groupName} onChangeText={setGroupName} style={styles.safeInput} />
            <View className="flex-row gap-3 mt-6">
              <Pressable onPress={() => setShowEditNameModal(false)} className="flex-1 h-12 justify-center items-center rounded-xl border border-slate-200"><Text className="font-bold text-slate-600">Cancelar</Text></Pressable>
              <Pressable onPress={handleUpdateGroupName} className="flex-1 h-12 justify-center items-center rounded-xl bg-blue-600"><Text className="font-bold text-white">Guardar</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showOptionsModal} transparent animationType="fade" onRequestClose={() => setShowOptionsModal(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowOptionsModal(false)}>
          <View className="bg-white rounded-t-[32px] p-6 pb-10">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mb-6" />
            <Text className="text-xl font-bold text-slate-900 mb-6 text-center">Opciones del Grupo</Text>
            <Pressable onPress={() => { setShowOptionsModal(false); setShowEditNameModal(true); }} className="flex-row items-center p-4 bg-slate-50 rounded-2xl mb-3 border border-slate-100"><Ionicons name="pencil" size={22} color="#475569" style={{ marginRight: 12 }} /><Text className="text-base font-bold text-slate-700">Editar Nombre</Text></Pressable>
            <Pressable onPress={handleDeleteGroup} className="flex-row items-center p-4 bg-red-50 rounded-2xl border border-red-100"><Ionicons name="trash" size={22} color="#DC2626" style={{ marginRight: 12 }} /><Text className="text-base font-bold text-red-600">Eliminar Grupo</Text></Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showAddMemberModal} transparent animationType="slide" onRequestClose={() => setShowAddMemberModal(false)}>
        <View className="flex-1 bg-white mt-20 rounded-t-[32px] shadow-2xl border-t border-slate-100">
          <View className="p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-slate-900">Añadir Atleta</Text>
              <Pressable onPress={() => setShowAddMemberModal(false)} className="p-2 bg-slate-100 rounded-full"><Ionicons name="close" size={24} color="#64748B" /></Pressable>
            </View>
            <Text className="text-slate-500 mb-2 font-medium ml-1">Buscar por Documento</Text>
            <View className="flex-row gap-3 mb-6 my-2">
              <TextInput
                value={searchDoc}
                onChangeText={setSearchDoc}
                placeholder="Ej. 100123456"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
                style={[styles.safeInput, { flex: 1, marginBottom: 0 }]}
              />

              <Pressable
                onPress={handleSearchAthlete}
                className="bg-blue-600 w-14 rounded-xl items-center justify-center active:bg-blue-700 shadow-sm"
              >
                {searching ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Ionicons name="search" size={24} color="white" />
                )}
              </Pressable>
            </View>

            {searchError ? <View className="bg-red-50 p-4 rounded-xl flex-row items-center mb-4"><Ionicons name="alert-circle" size={20} color="#DC2626" style={{ marginRight: 8 }} /><Text className="text-red-600 font-medium flex-1">{searchError}</Text></View> : null}
            {foundAthlete && (
              <View className="bg-blue-50 border border-blue-100 p-5 rounded-2xl my-2 shadow-sm">
                {/* Header */}
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4 shadow-sm">
                    <Ionicons name="person" size={24} color="#2563EB" />
                  </View>

                  <View>
                    <Text className="text-lg font-bold text-slate-900">
                      {foundAthlete.nombre_completo}
                    </Text>
                    <Text className="text-slate-500 font-medium">
                      Doc: {foundAthlete.no_documento}
                    </Text>
                  </View>
                </View>

                {/* Button */}
                <Pressable
                  onPress={handleAddFoundAthlete}
                  className="bg-blue-600 h-12 rounded-xl flex-row items-center justify-center active:bg-blue-700 shadow-sm"
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-white font-bold text-base">
                    Agregar al Grupo
                  </Text>
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
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: '#111827',
    marginBottom: 0
  }
});