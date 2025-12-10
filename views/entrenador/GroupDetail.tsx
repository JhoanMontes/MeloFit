import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
  Modal,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  Platform,
  KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { EntrenadorStackParamList } from "../../navigation/types";
import CustomAlert, { AlertType } from "../../components/CustomAlert";
import { supabase } from "../../lib/supabase";
import { useFocusEffect } from "@react-navigation/native";

// --- CONSTANTES DE DISEÑO ---
const COLORS = {
  primary: "#2563EB",
  secondary: "#3B82F6",
  background: "#F8FAFC",
  cardBg: "#FFFFFF",
  textDark: "#0F172A",
  textMuted: "#64748B",
  borderColor: "#E2E8F0",
  danger: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
  inputBg: "#F1F5F9",
};

type Props = NativeStackScreenProps<EntrenadorStackParamList, "GroupDetail">;

interface Member {
  id: number;
  name: string;
  role: string;
}

interface TestAssignment {
  id: number;
  testName: string;
  deadline: string | null;
  createdAt: string;
}

export default function GroupDetail({ navigation, route }: Props) {
  const { group } = route.params || {};

  // --- ESTADOS DE DATOS ---
  const [groupName, setGroupName] = useState(group?.nombre || 'Sin Nombre');
  const [members, setMembers] = useState<Member[]>([]);
  const [tests, setTests] = useState<TestAssignment[]>([]);

  // --- ESTADOS DE UI ---
  const [activeTab, setActiveTab] = useState<'members' | 'tests'>('members');
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);

  // --- ESTADOS DE BÚSQUEDA ---
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // --- ESTADOS DE SELECCIÓN ---
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  // --- ESTADOS DE ALERTA ---
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    onConfirm?: () => void;
    buttonText?: string;
    cancelText?: string;
  }>({ visible: false, title: "", message: "", type: "info" });

  const showAlert = (
    title: string, 
    message: string, 
    type: AlertType = "info", 
    onConfirm?: () => void,
    buttonText: string = "Entendido",
    cancelText: string = "Cancelar"
  ) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm, buttonText, cancelText });
  };

  const closeAlert = () => setAlertConfig({ ...alertConfig, visible: false });

  // ----------------------------------------------------------------------
  // 1. CARGA DE DATOS
  // ----------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    if (!group?.codigo) return;

    // A. Cargar Miembros
    try {
      setLoadingMembers(true);
      const { data: membersData, error: membersError } = await supabase
        .from('atleta_has_grupo')
        .select(`
          atleta_no_documento,
          atleta:atleta_no_documento (
            usuario (
              no_documento,
              nombre_completo,
              rol
            )
          )
        `)
        .eq('grupo_codigo', group.codigo);

      if (membersError) throw membersError;

      const formattedMembers = membersData.map((item: any) => {
        const userData = item.atleta?.usuario;
        return {
          id: userData?.no_documento || item.atleta_no_documento,
          name: userData?.nombre_completo || 'Desconocido',
          role: userData?.rol || 'Atleta'
        };
      });
      setMembers(formattedMembers);
    } catch (e) {
      console.error("Error members:", e);
    }
    finally { setLoadingMembers(false); }

    // B. Cargar Pruebas
    try {
      setLoadingTests(true);
      const { data: testsData, error: testsError } = await supabase
        .from('prueba_asignada_has_atleta')
        .select(`
                prueba_asignada:prueba_asignada_id (
                    id,
                    fecha_limite,
                    fecha_asignacion,
                    prueba:prueba_id ( nombre )
                )
            `)
        .eq('grupo_codigo', group.codigo);

      if (testsError) throw testsError;

      const uniqueTestsMap = new Map();
      testsData.forEach((t: any) => {
        const pa = t.prueba_asignada;
        if (pa && !uniqueTestsMap.has(pa.id)) {
          uniqueTestsMap.set(pa.id, {
            id: pa.id,
            testName: pa.prueba?.nombre || 'Prueba',
            deadline: pa.fecha_limite,
            createdAt: pa.fecha_asignacion
          });
        }
      });

      setTests(Array.from(uniqueTestsMap.values()));

    } catch (e) {
      console.error("Error tests:", e);
    }
    finally { setLoadingTests(false); }

  }, [group?.codigo]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // ----------------------------------------------------------------------
  // 2. LÓGICA DE BÚSQUEDA
  // ----------------------------------------------------------------------
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async () => {
    setSearching(true);
    try {
      const isNumeric = /^\d+$/.test(searchQuery);
      let query = supabase
        .from('usuario')
        .select('no_documento, nombre_completo, rol')
        .eq('rol', 'atleta')
        .limit(10);

      if (isNumeric) {
        query = query.or(`no_documento.eq.${searchQuery},nombre_completo.ilike.%${searchQuery}%`);
      } else {
        query = query.ilike('nombre_completo', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const resultsWithStatus = data.map((user: any) => ({
        ...user,
        isAdded: members.some(m => m.id === user.no_documento)
      }));

      setSearchResults(resultsWithStatus);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddAthlete = async (athlete: any) => {
    try {
      const { error } = await supabase
        .from('atleta_has_grupo')
        .insert({
          grupo_codigo: group.codigo,
          atleta_no_documento: athlete.no_documento
        });

      if (error) throw error;

      setSearchResults(prev => prev.map(p =>
        p.no_documento === athlete.no_documento ? { ...p, isAdded: true } : p
      ));
      fetchData();
    } catch (error: any) {
      showAlert("Error", "No se pudo agregar al atleta.", "error");
    }
  };

  // ----------------------------------------------------------------------
  // 3. ACCIONES DEL GRUPO (SOFT DELETE & EDIT)
  // ----------------------------------------------------------------------

  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) return;
    try {
      setLoadingAction(true);
      const { error } = await supabase.from('grupo').update({ nombre: groupName }).eq('codigo', group.codigo);
      if (error) throw error;
      setShowEditNameModal(false);
      showAlert("Éxito", "Nombre actualizado.", "success");
    } catch (error: any) { showAlert("Error", error.message, "error"); }
    finally { setLoadingAction(false); }
  };

  // --- LÓGICA DE SOFT DELETE (ARCHIVAR) ---
  const handleDeleteGroup = () => {
    setShowOptionsModal(false);
    
    showAlert(
      "¿Archivar Grupo?",
      "El grupo se ocultará de tu lista, pero el historial de los atletas se conservará. ¿Deseas continuar?",
      "warning",
      async () => {
        try {
          setLoadingAction(true);
          
          // INTENTO 1: SOFT DELETE (Recomendado)
          // Asumimos que ya creaste la columna 'activo' en la BD
          const { error } = await supabase
            .from('grupo')
            .update({ activo: false })
            .eq('codigo', group.codigo);

          if (error) {
             // Si falla (ej: columna no existe), intentamos HARD DELETE y capturamos el constraint
             if (error.code === 'PGRST204' || error.message.includes('column')) {
                 throw new Error("Columna 'activo' no configurada en DB. Contacta soporte.");
             }
             throw error;
          }

          navigation.goBack();

        } catch (error: any) {
          console.error(error);
          
          // Manejo específico del error de Foreign Key (Constraint)
          if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
             showAlert(
               "No se puede eliminar", 
               "Este grupo tiene historial de pruebas vinculado. No se puede eliminar permanentemente para proteger los datos de los atletas.", 
               "error"
             );
          } else {
             showAlert("Error", error.message || "No se pudo archivar el grupo.", "error");
          }
        }
        finally { setLoadingAction(false); }
      },
      "Sí, Archivar"
    );
  };

  const handleRemoveSelectedMembers = () => {
    if (selectedMembers.length === 0) return;
    showAlert("Eliminar Atletas", `¿Sacar a ${selectedMembers.length} atletas del grupo?`, "warning", async () => {
      try {
        setLoadingAction(true);
        const { error } = await supabase
          .from('atleta_has_grupo')
          .delete()
          .eq('grupo_codigo', group.codigo)
          .in('atleta_no_documento', selectedMembers);

        if (error) throw error;

        setSelectedMembers([]);
        fetchData();
        showAlert("Listo", "Atletas removidos.", "success");
      } catch (e: any) { showAlert("Error", e.message, "error"); }
      finally { setLoadingAction(false); }
    }, "Eliminar");
  };

  const toggleMemberSelection = (id: number) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(prev => prev.filter(mId => mId !== id));
    } else {
      setSelectedMembers(prev => [...prev, id]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {loadingAction && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {/* --- CUSTOM ALERT --- */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={closeAlert}
        onConfirm={alertConfig.onConfirm}
        buttonText={alertConfig.buttonText}
        cancelText={alertConfig.cancelText}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.navBar}>
            <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
            </Pressable>
            <Pressable onPress={() => setShowOptionsModal(true)} style={styles.iconButton}>
              <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textDark} />
            </Pressable>
          </View>

          <Text style={styles.groupTitle}>{groupName}</Text>

          <View style={styles.groupMetaRow}>
            <Text style={styles.groupMetaLabel}>Código de acceso:</Text>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{group?.codigo || '---'}</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Text style={styles.description}>
            {group?.descripcion || 'Sin descripción disponible para este grupo.'}
          </Text>

          {/* TABS */}
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => setActiveTab('members')}
              style={[styles.tab, activeTab === 'members' && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
                Atletas ({members.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('tests')}
              style={[styles.tab, activeTab === 'tests' && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === 'tests' && styles.activeTabText]}>
                Evaluaciones
              </Text>
            </Pressable>
          </View>

          {/* CONTENIDO TABS */}
          {activeTab === 'members' ? (
            <View>
              {/* Botón Añadir */}
              <Pressable onPress={() => setShowAddMemberModal(true)} style={styles.primaryButton}>
                <Ionicons name="person-add" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Añadir Atleta</Text>
              </Pressable>

              {/* Barra de acción múltiple */}
              {selectedMembers.length > 0 && (
                <View style={styles.selectionBar}>
                  <Text style={styles.selectionText}>{selectedMembers.length} seleccionados</Text>
                  <Pressable onPress={handleRemoveSelectedMembers} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </Pressable>
                </View>
              )}

              {/* Lista de Miembros */}
              {loadingMembers ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primary} />
              ) : members.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color={COLORS.borderColor} />
                  <Text style={styles.emptyText}>No hay atletas en este grupo</Text>
                </View>
              ) : (
                members.map((member) => {
                  const isSelected = selectedMembers.includes(member.id);
                  return (
                    <Pressable
                      key={member.id}
                      onLongPress={() => toggleMemberSelection(member.id)}
                      onPress={() => {
                        if (selectedMembers.length > 0) toggleMemberSelection(member.id);
                        else navigation.navigate('AthleteDetail', { athlete: member });
                      }}
                      style={[styles.card, isSelected && styles.cardSelected]}
                    >
                      <View style={styles.cardContent}>
                        <View style={[styles.avatar, isSelected && { backgroundColor: '#FEE2E2' }]}>
                          <Ionicons
                            name={isSelected ? "checkmark" : "person"}
                            size={20}
                            color={isSelected ? COLORS.danger : COLORS.primary}
                          />
                        </View>
                        <View>
                          <Text style={[styles.cardTitle, isSelected && { color: COLORS.danger }]}>{member.name}</Text>
                          <Text style={styles.cardSubtitle}>Doc: {member.id}</Text>
                        </View>
                      </View>
                      {!isSelected && <Ionicons name="chevron-forward" size={20} color={COLORS.borderColor} />}
                    </Pressable>
                  )
                })
              )}
            </View>
          ) : (
            <View>
              {/* Botón Asignar Prueba */}
              <Pressable onPress={() => navigation.navigate('AssignTestStep1', { targetGroup: { codigo: group.codigo, nombre: group.nombre } })} style={styles.primaryButton}>
                <Ionicons name="clipboard" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Asignar Nueva Prueba</Text>
              </Pressable>

              <Text style={styles.sectionHeader}>Historial de Asignaciones</Text>

              {loadingTests ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primary} />
              ) : tests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={48} color={COLORS.borderColor} />
                  <Text style={styles.emptyText}>No se han asignado pruebas aún</Text>
                </View>
              ) : (
                tests.map((test) => (
                  <Pressable
                    key={test.id}
                    onPress={() => navigation.navigate('TestAssignmentDetail', {
                      assignmentId: test.id,
                      testName: test.testName,
                      groupName: groupName,
                      initialTab: 'pending'
                    })}
                    style={styles.card}
                  >
                    <View style={styles.cardContent}>
                      <View style={[styles.avatar, { backgroundColor: '#FFEDD5' }]}>
                        <Ionicons name="timer-outline" size={20} color={COLORS.warning} />
                      </View>
                      <View>
                        <Text style={styles.cardTitle}>{test.testName}</Text>
                        <Text style={styles.cardSubtitle}>
                          Asignada: {new Date(test.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    {test.deadline && (
                      <View style={styles.deadlineBadge}>
                        <Text style={styles.deadlineText}>Vence: {new Date(test.deadline).toLocaleDateString()}</Text>
                      </View>
                    )}
                  </Pressable>
                ))
              )}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>

      {/* --- MODAL 1: BÚSQUEDA --- */}
      <Modal visible={showAddMemberModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddMemberModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.cardBg }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Añadir Atletas</Text>
            <Pressable onPress={() => setShowAddMemberModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.textDark} />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color={COLORS.textMuted} />
              <TextInput
                placeholder="Buscar por nombre o documento..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                autoFocus
              />
              {searching && <ActivityIndicator size="small" color={COLORS.primary} />}
            </View>

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.no_documento.toString()}
              contentContainerStyle={{ paddingTop: 16 }}
              ListEmptyComponent={
                searchQuery.length > 2 && !searching ? (
                  <Text style={styles.emptyText}>No se encontraron atletas.</Text>
                ) : null
              }
              renderItem={({ item }) => (
                <View style={styles.searchResultItem}>
                  <View style={styles.resultInfo}>
                    <View style={[styles.avatar, { width: 36, height: 36, marginRight: 12 }]}>
                      <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>
                        {item.nombre_completo.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.resultName}>{item.nombre_completo}</Text>
                      <Text style={styles.resultDoc}>{item.no_documento}</Text>
                    </View>
                  </View>

                  {item.isAdded ? (
                    <View style={styles.addedBadge}>
                      <Text style={styles.addedText}>Añadido</Text>
                    </View>
                  ) : (
                    <Pressable onPress={() => handleAddAthlete(item)} style={styles.addButton}>
                      <Ionicons name="add" size={20} color="white" />
                    </Pressable>
                  )}
                </View>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* --- MODAL 2: EDITAR NOMBRE --- */}
      <Modal visible={showEditNameModal} transparent animationType="fade" onRequestClose={() => setShowEditNameModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Editar Nombre</Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              style={styles.alertInput}
            />
            <View style={styles.alertActions}>
              <Pressable onPress={() => setShowEditNameModal(false)} style={styles.alertButtonCancel}>
                <Text style={styles.alertButtonTextCancel}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleUpdateGroupName} style={styles.alertButtonConfirm}>
                <Text style={styles.alertButtonTextConfirm}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- MODAL 3: OPCIONES (Archivar en vez de eliminar) --- */}
      <Modal visible={showOptionsModal} transparent animationType="fade" onRequestClose={() => setShowOptionsModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowOptionsModal(false)}>
          <View style={styles.actionSheet}>
            <View style={styles.dragHandle} />
            <Text style={styles.sheetTitle}>Opciones del Grupo</Text>

            <Pressable onPress={() => { setShowOptionsModal(false); setShowEditNameModal(true); }} style={styles.sheetOption}>
              <Ionicons name="pencil-outline" size={22} color={COLORS.textDark} />
              <Text style={styles.sheetOptionText}>Editar Nombre</Text>
            </Pressable>

            {/* OPCIÓN CAMBIADA VISUALMENTE A ARCHIVAR/ELIMINAR */}
            <Pressable onPress={handleDeleteGroup} style={[styles.sheetOption, { borderBottomWidth: 0 }]}>
              <Ionicons name="archive-outline" size={22} color={COLORS.danger} />
              <Text style={[styles.sheetOptionText, { color: COLORS.danger }]}>Archivar Grupo</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  groupTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  groupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupMetaLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginRight: 8,
  },
  codeBadge: {
    backgroundColor: '#DBEAFE', // Blue 100
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Content
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  description: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#EFF6FF', // Blue 50
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Actions
  primaryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 12,
    marginTop: 8,
  },

  // Cards & Lists
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  cardSelected: {
    backgroundColor: '#FEF2F2', // Red 50
    borderColor: '#FECACA', // Red 200
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  deadlineBadge: {
    backgroundColor: '#FFF7ED', // Orange 50
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  deadlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C', // Orange 600
  },

  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },

  // Selection Bar
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  selectionText: {
    color: '#B91C1C',
    fontWeight: '700',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Modal Search
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 24,
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.textDark,
    height: '100%',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBg,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  resultDoc: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },

  // Modal Alert/Options
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  alertBox: {
    backgroundColor: 'white',
    margin: 32,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  alertInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    marginBottom: 20,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
  },
  alertButtonCancel: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
  },
  alertButtonConfirm: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  alertButtonTextCancel: { fontWeight: '600', color: COLORS.textMuted },
  alertButtonTextConfirm: { fontWeight: '600', color: 'white' },

  actionSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBg,
  },
  sheetOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textDark,
    marginLeft: 12,
  },
});