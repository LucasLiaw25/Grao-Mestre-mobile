import React, { useState, useEffect } from "react"
import { View, ScrollView, StyleSheet, TouchableOpacity, Platform } from "react-native"
import {
  Text,
  Surface,
  Avatar,
  Button,
  Card,
  IconButton,
  Portal,
  Modal,
  TextInput,
  Switch,
  Divider,
  ActivityIndicator
} from "react-native-paper"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import {
  MapPin,
  Pencil,
  Plus,
  Trash2,
  LogOut,
  ShieldCheck,
  X
} from "lucide-react-native"
import { useAuth } from "@/src/hooks/use-auth"
import { usersApi, addressesApi } from "@/src/lib/api"
import {
  UserResponseDTO,
  AddressResponseDTO,
  UserRequestDTO,
  AddressRequestDTO
} from "@/src/types"

const COLORS = {
  primary: "#1c1917",
  secondary: "#292524",
  bg: "#fafaf9",
  card: "#ffffff",
  border: "#e7e5e4",
  muted: "#78716c"
}

export default function AccountScreen() {
  const { user: authUser, logout } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const id = authUser?.id

  const [editProfile, setEditProfile] = useState(false)
  const [profileData, setProfileData] = useState<UserRequestDTO>({
    name: "",
    email: "",
    phone: ""
  })
  const [addrModal, setAddrModal] = useState(false)
  const [addrEditing, setAddrEditing] = useState<AddressResponseDTO | null>(null)
  const [addrData, setAddrData] = useState<AddressRequestDTO>({
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    cep: "",
    isDefault: false,
    userId: id ?? 0
  })

  const { data: user, isLoading: loadingUser } = useQuery<UserResponseDTO>({
    queryKey: ["user", id],
    queryFn: async () => (await usersApi.getById(id!)).data,
    enabled: !!id
  })

  useEffect(() => {
    if (user) setProfileData({ name: user.name, email: user.email, phone: user.phone })
  }, [user])

  const { data: addresses, isLoading: loadingAddr } = useQuery<AddressResponseDTO[]>({
    queryKey: ["addresses", id],
    queryFn: async () => (await addressesApi.getByUserId(id!)).data,
    enabled: !!id
  })

  const updateUser = useMutation({
    mutationFn: (d: UserRequestDTO) => usersApi.update(id!, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user", id] })
      setEditProfile(false)
    }
  })

  const saveProfile = () => updateUser.mutate(profileData)

  const saveAddress = () => {
    if (addrEditing) {
      updateAddr.mutate({ id: addrEditing.id, data: addrData })
    } else {
      createAddr.mutate(addrData)
    }
  }

  const createAddr = useMutation({
    mutationFn: (d: AddressRequestDTO) => addressesApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses", id] })
      setAddrModal(false)
    }
  })

  const updateAddr = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AddressRequestDTO }) =>
      addressesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses", id] })
      setAddrModal(false)
    }
  })

  const deleteAddr = useMutation({
    mutationFn: (addrId: number) => addressesApi.delete(addrId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses", id] })
  })

  if (loadingUser || loadingAddr) {
    return <ActivityIndicator animating style={{ flex: 1, alignSelf: "center", marginTop: 100 }} color={COLORS.secondary} />
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} showsVerticalScrollIndicator={false}>
      <Surface style={styles.header} elevation={1}>
        <Avatar.Text label={user?.name.substring(0, 2).toUpperCase() ?? ""} size={90} style={{ backgroundColor: COLORS.secondary }} />
        <Text variant="headlineMedium" style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {authUser?.scopes.some(s => s.name.includes("ADMIN")) && (
          <View style={styles.adminChip}>
            <ShieldCheck size={12} color={COLORS.primary} />
            <Text style={styles.adminText}>ADMIN</Text>
          </View>
        )}
      </Surface>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Perfil</Text>
          <IconButton icon={editProfile ? "close" : "pencil"} size={20} onPress={() => setEditProfile(p => !p)} />
        </View>
        {editProfile ? (
          <View style={{ gap: 16 }}>
            <TextInput
              mode="outlined"
              label="Nome"
              value={profileData.name}
              onChangeText={t => setProfileData({ ...profileData, name: t })}
              style={styles.input}
              activeOutlineColor={COLORS.secondary}
            />
            <TextInput
              mode="outlined"
              label="Telefone"
              value={profileData.phone}
              onChangeText={t => setProfileData({ ...profileData, phone: t })}
              style={styles.input}
              activeOutlineColor={COLORS.secondary}
            />
            <Button mode="contained" onPress={saveProfile} loading={updateUser.isPending} disabled={updateUser.isPending} style={styles.saveBtn}>
              Salvar
            </Button>
          </View>
        ) : (
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <View style={styles.row}>
                <Text style={styles.label}>Nome Completo</Text>
                <Text style={styles.value}>{user?.name}</Text>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>Telefone</Text>
                <Text style={styles.value}>{user?.phone || "—"}</Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Endereços</Text>
          <IconButton icon="plus" size={20} onPress={() => { setAddrEditing(null); setAddrData({ ...addrData, userId: id! }); setAddrModal(true) }} />
        </View>
        {addresses && addresses.length > 0 ? (
          addresses.map(a => (
            <Card key={a.id} style={styles.addrCard} mode="outlined">
              <Card.Content style={{ flexDirection: "row", alignItems: "center" }}>
                <MapPin size={22} color={COLORS.secondary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.addrMain}>{a.street}, {a.number}</Text>
                  <Text style={styles.addrSub}>{a.city} - {a.state}</Text>
                </View>
                <IconButton icon="pencil" size={18} onPress={() => { setAddrEditing(a); setAddrData({ ...a, userId: id! }); setAddrModal(true) }} />
                <IconButton icon="trash-can" size={18} iconColor="#b91c1c" onPress={() => deleteAddr.mutate(a.id)} />
              </Card.Content>
            </Card>
          ))
        ) : (
          <Text style={styles.muted}>Nenhum endereço cadastrado.</Text>
        )}
      </View>

      <Button mode="contained" buttonColor="#ef4444" icon="logout" style={styles.logout} onPress={logout}>
        Sair
      </Button>

      <Portal>
        <Modal visible={addrModal} onDismiss={() => setAddrModal(false)} contentContainerStyle={styles.modal}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text variant="titleMedium" style={{ fontFamily: "serif", fontWeight: "bold", color: COLORS.primary }}>
              {addrEditing ? "Editar Endereço" : "Novo Endereço"}
            </Text>
            <TouchableOpacity onPress={() => setAddrModal(false)}>
              <X size={22} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ gap: 12 }}>
            <TextInput mode="outlined" label="Rua" value={addrData.street} onChangeText={t => setAddrData({ ...addrData, street: t })} style={styles.input} activeOutlineColor={COLORS.secondary} />
            <TextInput mode="outlined" label="Número" value={addrData.number} onChangeText={t => setAddrData({ ...addrData, number: t })} style={styles.input} activeOutlineColor={COLORS.secondary} />
            <TextInput mode="outlined" label="Complemento" value={addrData.complement} onChangeText={t => setAddrData({ ...addrData, complement: t })} style={styles.input} activeOutlineColor={COLORS.secondary} />
            <TextInput mode="outlined" label="Cidade" value={addrData.city} onChangeText={t => setAddrData({ ...addrData, city: t })} style={styles.input} activeOutlineColor={COLORS.secondary} />
            <TextInput mode="outlined" label="Estado" value={addrData.state} onChangeText={t => setAddrData({ ...addrData, state: t })} style={styles.input} activeOutlineColor={COLORS.secondary} />
            <TextInput mode="outlined" label="CEP" value={addrData.cep} onChangeText={t => setAddrData({ ...addrData, cep: t })} style={styles.input} activeOutlineColor={COLORS.secondary} />
            <View style={styles.switchRow}>
              <Text style={styles.label}>Endereço padrão</Text>
              <Switch value={addrData.isDefault} onValueChange={v => setAddrData({ ...addrData, isDefault: v })} />
            </View>
            <Button mode="contained" style={styles.saveBtn} onPress={saveAddress} loading={createAddr.isPending || updateAddr.isPending}>
              Salvar Endereço
            </Button>
          </ScrollView>
        </Modal>
      </Portal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32
  },
  name: { marginTop: 12, fontFamily: "serif", fontWeight: "bold", color: COLORS.primary },
  email: { color: COLORS.muted },
  adminChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f5f5f4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8
  },
  adminText: { fontSize: 12, fontWeight: "bold", color: COLORS.primary },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontFamily: "serif", fontSize: 20, fontWeight: "bold", color: COLORS.primary },
  card: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 14 },
  label: { color: COLORS.muted, fontSize: 12, textTransform: "uppercase", fontWeight: "bold" },
  value: { color: COLORS.primary, fontWeight: "600" },
  divider: { backgroundColor: COLORS.border, height: 1 },
  input: { backgroundColor: COLORS.card },
  saveBtn: { marginTop: 12, borderRadius: 12, backgroundColor: COLORS.secondary },
  addrCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  addrMain: { fontWeight: "bold", color: COLORS.primary },
  addrSub: { color: COLORS.muted },
  muted: { color: COLORS.muted, textAlign: "center", marginTop: 10 },
  logout: { margin: 24, borderRadius: 12 },
  modal: { backgroundColor: COLORS.card, margin: 20, borderRadius: 24, padding: 20 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }
})