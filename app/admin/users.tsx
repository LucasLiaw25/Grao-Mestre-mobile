import React, { useState, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal as RNModal,
} from "react-native";
import {
  Text,
  TextInput,
  Switch,
  ActivityIndicator,
  Divider,
  IconButton,
} from "react-native-paper";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Users,
  CheckCircle,
  XCircle,
  MapPin,
  ShieldCheck,
  Edit,
  Trash2,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Home,
  RefreshCw,
  Clock,
} from "lucide-react-native";
import { MotiView } from "moti";

import { usersApi, scopesApi, addressesApi } from "@/src/lib/api";
import type {
  UserResponseDTO,
  UserRequestDTO,
  ScopeResponseDTO,
  AddressResponseDTO,
  AddressRequestDTO,
  UserRegisterRequestDTO,
} from "@/src/types";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type ScopeFilter = "ALL" | string;

const COLORS = {
  primary: "#1c1917",
  secondary: "#292524",
  textHeader: "#1c1917",
  textMuted: "#78716c",
  background: "#fafaf9",
  cardBg: "#ffffff",
  border: "#e7e5e4",
  surfaceMuted: "#f5f5f4",
  amberBg: "#fefce8",
  amberText: "#b45309",
  amberBorder: "#fef08a",
  blueBg: "#eff6ff",
  blueText: "#0b297d",
  blueBorder: "#bfdbfe",
  emeraldBg: "#ecfdf5",
  emeraldText: "#024935",
  emeraldBorder: "#a7f3d0",
  redBg: "#fef2f2",
  redText: "#a01111",
  redBorder: "#fecaca",
  indigoBg: "#e0e7ff",
  indigoText: "#3730a3",
  indigoBorder: "#c7d2fe",
};

const getAvatarColors = (name: string) => {
  const options = [
    { bg: "#e7e5e4", text: "#44403c" },
    { bg: "#f5f5f4", text: "#57534e" },
    { bg: "#d6d3d1", text: "#292524" },
  ];
  return options[name.charCodeAt(0) % options.length];
};

export default function UsersManagement() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("ALL");
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponseDTO | null>(null);
  const [editingAddress, setEditingAddress] = useState<AddressResponseDTO | null>(null);

  const [userForm, setUserForm] = useState<UserRequestDTO>({
    email: "", name: "", phone: "", active: true, scopeIds: [],
  });
  const [userPassword, setUserPassword] = useState("");
  const [addressForm, setAddressForm] = useState<AddressRequestDTO>({
    street: "", number: "", complement: "", state: "", city: "", cep: "", isDefault: false, userId: 0,
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<UserResponseDTO[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await usersApi.getAll();
      const data = res.data as any;
      return data.content || data;
    },
  });

  const { data: scopes } = useQuery<ScopeResponseDTO[]>({
    queryKey: ["scopes"],
    queryFn: async () => (await scopesApi.getAll()).data,
  });

  const { data: userAddresses, isLoading: isLoadingAddresses } = useQuery<AddressResponseDTO[]>({
    queryKey: ["userAddresses", editingUser?.id],
    queryFn: async () => {
      if (!editingUser?.id) return [];
      return (await addressesApi.getByUserId(editingUser.id)).data;
    },
    enabled: !!editingUser?.id,
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const matchesSearch = !searchTerm || u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" && u.active) || (statusFilter === "INACTIVE" && !u.active);
      const matchesScope = scopeFilter === "ALL" || u.scopes.some((s) => s.name.replace("SCOPE_", "") === scopeFilter);
      return matchesSearch && matchesStatus && matchesScope;
    });
  }, [users, searchTerm, statusFilter, scopeFilter]);

  const metrics = useMemo(() => ({
    total: users?.length ?? 0,
    active: users?.filter((u) => u.active).length ?? 0,
    inactive: users?.filter((u) => !u.active).length ?? 0,
    withAddress: users?.filter((u) => u.addresses && u.addresses.length > 0).length ?? 0,
  }), [users]);

  const createUserMutation = useMutation({
    mutationFn: (data: UserRegisterRequestDTO) => usersApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); setIsUserModalOpen(false); },
  });

  const updateUserMutation = useMutation({
    mutationFn: (d: { id: number; data: UserRequestDTO }) => usersApi.update(d.id, d.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["users"] }); setIsUserModalOpen(false); },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (d: { id: number; newPassword: string }) => usersApi.updatePassword(d.id, d.newPassword),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const createAddressMutation = useMutation({
    mutationFn: (data: AddressRequestDTO) => addressesApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["userAddresses"] }); setIsAddressModalOpen(false); },
  });

  const updateAddressMutation = useMutation({
    mutationFn: (d: { id: number; data: AddressRequestDTO }) => addressesApi.update(d.id, d.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["userAddresses"] }); setIsAddressModalOpen(false); },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: number) => addressesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userAddresses"] }),
  });

  const openEditUserModal = (user: UserResponseDTO) => {
    setEditingUser(user);
    setUserForm({ email: user.email, name: user.name, phone: user.phone, active: user.active, scopeIds: user.scopes.map(s => s.id) });
    setUserPassword("");
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async () => {
    if (editingUser) {
      await updateUserMutation.mutateAsync({ id: editingUser.id, data: userForm });
      if (userPassword) await updatePasswordMutation.mutateAsync({ id: editingUser.id, newPassword: userPassword });
    } else {
      if (!userPassword) return Alert.alert("Erro", "Senha obrigatória");
      await createUserMutation.mutateAsync({ ...userForm, password: userPassword } as any);
    }
  };

  const renderHeader = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500 }}
      style={styles.headerContainer}
    >
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.pageTitle}>Gestão de Usuários</Text>
          <Text style={styles.pageSubtitle}>{filteredUsers.length} usuários encontrados</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 0 }}
        >
          <View style={[styles.metricCard, { backgroundColor: COLORS.surfaceMuted, borderColor: COLORS.border }]}>
            <Users color={COLORS.secondary} size={16} />
            <Text style={[styles.metricLabel, { color: COLORS.secondary }]}>Total</Text>
            <Text style={[styles.metricValue, { color: COLORS.secondary }]}>{metrics.total}</Text>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 100 }}
        >
          <View style={[styles.metricCard, { backgroundColor: COLORS.emeraldBg, borderColor: COLORS.emeraldBorder }]}>
            <CheckCircle color={COLORS.emeraldText} size={16} />
            <Text style={[styles.metricLabel, { color: COLORS.emeraldText }]}>Ativos</Text>
            <Text style={[styles.metricValue, { color: COLORS.emeraldText }]}>{metrics.active}</Text>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 200 }}
        >
          <View style={[styles.metricCard, { backgroundColor: COLORS.redBg, borderColor: COLORS.redBorder }]}>
            <XCircle color={COLORS.redText} size={16} />
            <Text style={[styles.metricLabel, { color: COLORS.redText }]}>Inativos</Text>
            <Text style={[styles.metricValue, { color: COLORS.redText }]}>{metrics.inactive}</Text>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 300 }}
        >
          <View style={[styles.metricCard, { backgroundColor: COLORS.blueBg, borderColor: COLORS.blueBorder }]}>
            <MapPin color={COLORS.blueText} size={16} />
            <Text style={[styles.metricLabel, { color: COLORS.blueText }]}>Endereços</Text>
            <Text style={[styles.metricValue, { color: COLORS.blueText }]}>{metrics.withAddress}</Text>
          </View>
        </MotiView>
      </View>

      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500, delay: 400 }}
        style={styles.filterSection}
      >
        <View style={styles.searchWrapper}>
          <Search color={COLORS.textMuted} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
        </View>

        <Text style={styles.filterTitle}>STATUS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {(["ALL", "ACTIVE", "INACTIVE"] as StatusFilter[]).map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.chip, statusFilter === status && styles.chipActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.chipText, statusFilter === status && styles.chipTextActive]}>
                {status === "ALL" ? "Todos" : status === "ACTIVE" ? "Ativos" : "Inativos"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.filterTitle}>PERMISSÕES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, scopeFilter === "ALL" && styles.chipActive]}
            onPress={() => setScopeFilter("ALL")}
          >
            <Text style={[styles.chipText, scopeFilter === "ALL" && styles.chipTextActive]}>Todos</Text>
          </TouchableOpacity>
          {scopes?.map(scope => {
            const name = scope.name.replace("SCOPE_", "");
            const isActive = scopeFilter === name;
            return (
              <TouchableOpacity key={scope.id} style={[styles.chip, isActive && styles.chipActive]} onPress={() => setScopeFilter(name)}>
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </MotiView>
    </MotiView>
  );

  const renderUserCard = ({ item, index }: { item: UserResponseDTO; index: number }) => {
    const avatar = getAvatarColors(item.name);
    const isExpanded = expandedUserId === item.id;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 400, delay: 200 + index * 60 }}
      >
        <View style={styles.userCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfoLeft}>
              <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
                <Text style={[styles.avatarText, { color: avatar.text }]}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.active ? COLORS.emeraldBg : COLORS.redBg }]}>
              <Text style={[styles.statusTabText, { color: item.active ? COLORS.emeraldText : COLORS.redText }]}>
                {item.active ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>

          <View style={styles.scopeRow}>
            {item.scopes.map(s => (
              <View key={s.id} style={styles.scopeBadge}>
                <Text style={styles.scopeBadgeText}>{s.name.replace("SCOPE_", "")}</Text>
              </View>
            ))}
          </View>

          <Divider style={styles.divider} />

          {isExpanded && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ type: "timing", duration: 300 }}
              style={styles.accordionBody}
            >
              {item.addresses?.length ? (
                item.addresses.map(a => (
                  <View key={a.id} style={styles.addrItem}>
                    <Text style={styles.addrStreet}>{a.street}, {a.number}</Text>
                    <Text style={styles.addrCity}>{a.city} - {a.state}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyAddr}>Nenhum endereço.</Text>
              )}
            </MotiView>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.btnEditLite]} onPress={() => openEditUserModal(item)}>
              <Edit size={16} color={COLORS.blueText} />
              <Text style={[styles.actionBtnText, { color: COLORS.blueText }]}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.btnDeleteLite]} onPress={() => {
              Alert.alert("Excluir", "Deseja excluir este usuário?", [
                { text: "Não" },
                { text: "Sim", onPress: () => deleteUserMutation.mutate(item.id) }
              ]);
            }}>
              <Trash2 size={16} color={COLORS.redText} />
              <Text style={[styles.actionBtnText, { color: COLORS.redText }]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </MotiView>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUserCard}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
      />

      <RNModal visible={isUserModalOpen} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalFull}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingUser ? "Editar Usuário" : "Novo Usuário"}</Text>
            <TouchableOpacity onPress={() => setIsUserModalOpen(false)}><X size={24} color={COLORS.secondary} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <Text style={styles.label}>NOME COMPLETO</Text>
            <TextInput mode="outlined" style={styles.modalInput} outlineColor={COLORS.border} activeOutlineColor={COLORS.secondary} value={userForm.name} onChangeText={(t) => setUserForm({...userForm, name: t})} />

            <View style={styles.formRow}>
              <View style={{flex: 1, marginRight: 8}}>
                <Text style={styles.label}>TELEFONE</Text>
                <TextInput mode="outlined" style={styles.modalInput} outlineColor={COLORS.border} activeOutlineColor={COLORS.secondary} value={userForm.phone} onChangeText={(t) => setUserForm({...userForm, phone: t})} />
              </View>
              <View style={{flex: 1, marginLeft: 8}}>
                <Text style={styles.label}>E-MAIL</Text>
                <TextInput mode="outlined" style={styles.modalInput} outlineColor={COLORS.border} activeOutlineColor={COLORS.secondary} value={userForm.email} onChangeText={(t) => setUserForm({...userForm, email: t})} autoCapitalize="none" />
              </View>
            </View>

            <Text style={styles.label}>PERMISSÕES</Text>
            <View style={styles.chipRow}>
              {scopes?.map(s => {
                const selected = userForm.scopeIds?.includes(s.id);
                return (
                  <TouchableOpacity key={s.id} style={[styles.chip, selected && styles.chipActive]} onPress={() => {
                    const ids = userForm.scopeIds || [];
                    setUserForm({...userForm, scopeIds: selected ? ids.filter(i => i !== s.id) : [...ids, s.id]});
                  }}>
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>{s.name.replace("SCOPE_", "")}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.switchBox}>
              <View>
                <Text style={styles.switchLabel}>Usuário Ativo</Text>
                <Text style={styles.switchSub}>Define se pode acessar o sistema</Text>
              </View>
              <Switch value={userForm.active} onValueChange={(v) => setUserForm({...userForm, active: v})} color={COLORS.secondary} />
            </View>

            {editingUser && (
               <View style={styles.addressSection}>
                 <Text style={styles.modalSubHeader}>Endereços</Text>
                 {userAddresses?.map(a => (
                   <View key={a.id} style={styles.addrCard}>
                     <View>
                        <Text style={styles.addrTitle}>{a.street}, {a.number}</Text>
                        <Text style={styles.addrSub}>{a.city} - {a.state}</Text>
                     </View>
                     <IconButton icon="trash-can-outline" iconColor={COLORS.redText} onPress={() => deleteAddressMutation.mutate(a.id)} />
                   </View>
                 ))}
               </View>
            )}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.footBtnCancel} onPress={() => setIsUserModalOpen(false)}><Text style={styles.footBtnCancelText}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.footBtnSave} onPress={handleUserSubmit}><Text style={styles.footBtnSaveText}>Salvar</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </RNModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listPadding: { padding: 16, paddingBottom: 40 },
  headerContainer: { marginBottom: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: Platform.OS === 'ios' ? 20 : 10 },
  pageTitle: { fontFamily: 'serif', fontSize: 32, fontWeight: 'bold', color: COLORS.textHeader },
  pageSubtitle: { fontSize: 13, color: COLORS.textMuted },
  btnPrimary: { backgroundColor: COLORS.secondary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  metricCard: { width: (Dimensions.get("window").width - 54) / 2, padding: 16, borderRadius: 16, borderWidth: 1 },
  metricLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
  metricValue: { fontFamily: 'serif', fontSize: 26, fontWeight: 'bold' },

  filterSection: { backgroundColor: COLORS.cardBg, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceMuted, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
  searchInput: { flex: 1, height: 44, backgroundColor: 'transparent', fontSize: 14 },
  filterTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMuted, marginBottom: 10, letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surfaceMuted, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.secondary },
  chipTextActive: { color: '#fff' },

  userCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardInfoLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  userName: { fontSize: 15, fontWeight: 'bold', color: COLORS.textHeader },
  userEmail: { fontSize: 12, color: COLORS.textMuted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusTabText: { fontSize: 10, fontWeight: 'bold' },
  scopeRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  scopeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: COLORS.surfaceMuted, borderWidth: 1, borderColor: COLORS.border },
  scopeBadgeText: { fontSize: 9, fontWeight: 'bold', color: COLORS.textMuted },
  divider: { backgroundColor: COLORS.surfaceMuted, height: 1, marginBottom: 12 },

  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  accordionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accordionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  accordionBody: { backgroundColor: COLORS.background, padding: 10, borderRadius: 10, marginTop: 8 },
  addrItem: { marginBottom: 6 },
  addrStreet: { fontSize: 12, fontWeight: 'bold', color: COLORS.secondary },
  addrCity: { fontSize: 11, color: COLORS.textMuted },
  emptyAddr: { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic' },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  btnEditLite: { backgroundColor: COLORS.blueBg },
  btnDeleteLite: { backgroundColor: COLORS.redBg },
  actionBtnText: { fontWeight: 'bold', marginLeft: 6, fontSize: 13 },

  modalFull: { flex: 1, backgroundColor: COLORS.cardBg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceMuted },
  modalTitle: { fontFamily: 'serif', fontSize: 22, fontWeight: 'bold', color: COLORS.textHeader },
  modalScroll: { padding: 20 },
  label: { fontSize: 10, fontWeight: 'bold', color: COLORS.textMuted, marginBottom: 6, marginTop: 14 },
  modalInput: { backgroundColor: COLORS.cardBg, height: 46 },
  formRow: { flexDirection: 'row' },
  switchBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surfaceMuted, padding: 14, borderRadius: 14, marginTop: 20 },
  switchLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.textHeader },
  switchSub: { fontSize: 11, color: COLORS.textMuted },
  addressSection: { marginTop: 24, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  modalSubHeader: { fontSize: 15, fontWeight: 'bold', color: COLORS.textHeader, marginBottom: 12 },
  addrCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: COLORS.surfaceMuted, borderRadius: 12, marginBottom: 8 },
  addrTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.secondary },
  addrSub: { fontSize: 11, color: COLORS.textMuted },

  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: COLORS.surfaceMuted, gap: 10 },
  footBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.surfaceMuted, alignItems: 'center' },
  footBtnCancelText: { color: COLORS.textMuted, fontWeight: 'bold' },
  footBtnSave: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.secondary, alignItems: 'center' },
  footBtnSaveText: { color: '#fff', fontWeight: 'bold' },
});