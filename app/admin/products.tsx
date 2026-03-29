import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  LayoutAnimation,
  UIManager,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { Text, ActivityIndicator, TextInput, Switch } from "react-native-paper";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import {
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Tag,
  DollarSign,
  Layers,
  Archive,
  Plus,
  Edit3,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  X,
} from "lucide-react-native";

import { productsApi, categoriesApi } from "@/src/lib/api";
import { ProductResponseDTO, CategoryResponseDTO, ProductRequestDTO } from "@/src/types";
import { formatCurrency } from "@/src/lib/format";

// Habilita animações de layout no Android (Accordion)
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Paleta de Cores "Old Money" ───────────────────────────────────────────────
const COLORS = {
  background: "#fafaf9",
  card: "#ffffff",
  textPrimary: "#1c1917",
  textSecondary: "#78716c",
  border: "#e7e5e4",
  surface: "#f5f5f4",
  primary: "#292524",
  // Status Colors
  emeraldBg: "#d1fae5", emeraldText: "#047857",
  redBg: "#fee2e2", redText: "#b91c1c",
  amberBg: "#fef3c7", amberText: "#b45309",
  tealBg: "#ccfbf1", tealText: "#0f766e",
};

// ── Configurações de Filtros ──────────────────────────────────────────────────
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type StockFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
type PriceFilter = "ALL" | "UNDER_50" | "50_200" | "200_500" | "OVER_500";

const STATUS_CFG = [
  { v: "ALL", label: "Todos", icon: Package },
  { v: "ACTIVE", label: "Ativos", icon: CheckCircle2 },
  { v: "INACTIVE", label: "Inativos", icon: XCircle },
] as const;

const STOCK_CFG = [
  { v: "ALL", label: "Todo Estoque", matcher: () => true },
  { v: "IN_STOCK", label: "Disponível", matcher: (n: number) => n > 10 },
  { v: "LOW_STOCK", label: "Estoque Baixo", matcher: (n: number) => n > 0 && n <= 10 },
  { v: "OUT_OF_STOCK", label: "Esgotado", matcher: (n: number) => n === 0 },
] as const;

const PRICE_CFG = [
  { v: "ALL", label: "Qualquer Preço", matcher: () => true },
  { v: "UNDER_50", label: "Até R$ 50", matcher: (p: number) => p < 50 },
  { v: "50_200", label: "R$ 50 – 200", matcher: (p: number) => p >= 50 && p <= 200 },
  { v: "200_500", label: "R$ 200 – 500", matcher: (p: number) => p > 200 && p <= 500 },
  { v: "OVER_500", label: "Acima de R$ 500", matcher: (p: number) => p > 500 },
] as const;

// ── Componente Principal ──────────────────────────────────────────────────────
export default function ProductsScreen() {
  const qc = useQueryClient();

  // Estados de Filtro
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState<StatusFilter>("ALL");
  const [stockF, setStockF] = useState<StockFilter>("ALL");
  const [priceF, setPriceF] = useState<PriceFilter>("ALL");
  const [catF, setCatF] = useState<number | "ALL">("ALL");

  // Estados de UI
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductResponseDTO | null>(null);
  const [form, setForm] = useState<Partial<ProductRequestDTO>>({});
  const [img, setImg] = useState<ImagePicker.ImagePickerAsset | null>(null);

  // Queries
  const { data: categories } = useQuery<CategoryResponseDTO[]>({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesApi.getAll()).data,
  });

  const { data: products, isFetching } = useQuery<ProductResponseDTO[]>({
    queryKey: ["products-all"],
    queryFn: async () => {
      const res = await productsApi.getAll();
      const d: any = res.data;
      return d.content ?? d;
    },
  });

  // Métricas
  const metrics = useMemo(() => ({
    total: products?.length ?? 0,
    active: products?.filter((p) => p.active).length ?? 0,
    lowStock: products?.filter((p) => p.storage > 0 && p.storage <= 10).length ?? 0,
    outOfStock: products?.filter((p) => p.storage === 0).length ?? 0,
  }), [products]);

  // Filtragem
  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const txt = `${p.name} ${p.description}`.toLowerCase();
      const matchesSearch = txt.includes(search.toLowerCase());
      const matchesStatus = statusF === "ALL" || (statusF === "ACTIVE" && p.active) || (statusF === "INACTIVE" && !p.active);
      const matchesStock = STOCK_CFG.find((c) => c.v === stockF)!.matcher(p.storage);
      const matchesPrice = PRICE_CFG.find((c) => c.v === priceF)!.matcher(p.price);
      const matchesCat = catF === "ALL" || p.category.id === catF;

      return matchesSearch && matchesStatus && matchesStock && matchesPrice && matchesCat;
    });
  }, [products, search, statusF, stockF, priceF, catF]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (d: { product: ProductRequestDTO; img?: ImagePicker.ImagePickerAsset }) =>
      productsApi.create(d.product, d.img && { uri: d.img.uri, name: d.img.fileName ?? "photo.jpg", type: d.img.mimeType ?? "image/jpeg" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products-all"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: (d: { id: number; product: ProductRequestDTO; img?: ImagePicker.ImagePickerAsset }) =>
      productsApi.update(d.id, d.product, d.img && { uri: d.img.uri, name: d.img.fileName ?? "photo.jpg", type: d.img.mimeType ?? "image/jpeg" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products-all"] }); setShowForm(false); },
    onError: (error) => {
    console.error("Erro ao atualizar produto:", error);
  },
  });

  const toggleMutation = useMutation({
    mutationFn: (p: ProductResponseDTO) => p.active ? productsApi.deactivate(p.id) : productsApi.activate(p.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products-all"] }),
  });

  // Handlers
  const toggleExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", storage: 0, price: 0, active: true, categoryId: categories?.[0]?.id });
    setImg(null);
    setShowForm(true);
  };

  const openEdit = (p: ProductResponseDTO) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, storage: p.storage, price: p.price, active: p.active, categoryId: p.category.id });
    setImg(null);
    setShowForm(true);
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: 'images', 
      quality: 0.7,
      allowsEditing: true,
    });

    if (!res.canceled) {
      setImg(res.assets[0]);
    }
  };

  const submit = () => {
    if (!form.name?.trim() || !form.categoryId) return;
    const imageToUpload = img ?? undefined;
    if (editing) {
      updateMutation.mutate({ id: editing.id, product: form as ProductRequestDTO, img: imageToUpload });
    } else {
      createMutation.mutate({ product: form as ProductRequestDTO, img: imageToUpload });
    }
  };

  // Helpers de UI
  const getStockBadge = (stock: number) => {
    if (stock === 0) return { bg: COLORS.redBg, text: COLORS.redText, icon: XCircle, label: "Esgotado" };
    if (stock <= 10) return { bg: COLORS.amberBg, text: COLORS.amberText, icon: AlertTriangle, label: `${stock} un.` };
    return { bg: COLORS.tealBg, text: COLORS.tealText, icon: Archive, label: `${stock} un.` };
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Gestão de Produtos</Text>
          <Text style={styles.subtitle}>{filtered.length} produtos encontrados</Text>
        </View>

        {/* Métricas (Grid 2x2) */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: COLORS.surface }]}>
            <Package size={16} color={COLORS.textPrimary} />
            <Text style={[styles.metricValue, { color: COLORS.textPrimary }]}>{metrics.total}</Text>
            <Text style={styles.metricLabel}>Total</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: COLORS.emeraldBg }]}>
            <CheckCircle2 size={16} color={COLORS.emeraldText} />
            <Text style={[styles.metricValue, { color: COLORS.emeraldText }]}>{metrics.active}</Text>
            <Text style={[styles.metricLabel, { color: COLORS.emeraldText }]}>Ativos</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: COLORS.amberBg }]}>
            <AlertTriangle size={16} color={COLORS.amberText} />
            <Text style={[styles.metricValue, { color: COLORS.amberText }]}>{metrics.lowStock}</Text>
            <Text style={[styles.metricLabel, { color: COLORS.amberText }]}>Est. Baixo</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: COLORS.redBg }]}>
            <XCircle size={16} color={COLORS.redText} />
            <Text style={[styles.metricValue, { color: COLORS.redText }]}>{metrics.outOfStock}</Text>
            <Text style={[styles.metricLabel, { color: COLORS.redText }]}>Esgotados</Text>
          </View>
        </View>

        {/* Busca */}
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            mode="flat"
            placeholder="Buscar por nome ou descrição..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
        </View>

        {/* Filtros Horizontais */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filterTitle}>STATUS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {STATUS_CFG.map(c => (
              <TouchableOpacity key={c.v} style={[styles.chip, statusF === c.v && styles.chipActive]} onPress={() => setStatusF(c.v)}>
                <c.icon size={14} color={statusF === c.v ? "#fff" : COLORS.textSecondary} />
                <Text style={[styles.chipText, statusF === c.v && styles.chipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterTitle}>ESTOQUE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {STOCK_CFG.map(c => (
              <TouchableOpacity key={c.v} style={[styles.chip, stockF === c.v && styles.chipActive]} onPress={() => setStockF(c.v)}>
                <Text style={[styles.chipText, stockF === c.v && styles.chipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterTitle}>CATEGORIA</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            <TouchableOpacity style={[styles.chip, catF === "ALL" && styles.chipActive]} onPress={() => setCatF("ALL")}>
              <Text style={[styles.chipText, catF === "ALL" && styles.chipTextActive]}>Todas</Text>
            </TouchableOpacity>
            {categories?.map(c => (
              <TouchableOpacity key={c.id} style={[styles.chip, catF === c.id && styles.chipActive]} onPress={() => setCatF(c.id)}>
                <Text style={[styles.chipText, catF === c.id && styles.chipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de Produtos (Accordion) */}
        <View style={styles.listContainer}>
          {isFetching ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>Nenhum produto encontrado.</Text>
            </View>
          ) : (
            filtered.map((p) => {
              const isExpanded = expandedId === p.id;
              const stockBadge = getStockBadge(p.storage);

              return (
                <View key={p.id} style={styles.productCard}>
                  <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(p.id)} activeOpacity={0.7}>
                    {p.imageUrl ? (
                      <Image source={{ uri: p.imageUrl }} style={styles.productImage} />
                    ) : (
                      <View style={styles.productImagePlaceholder}><ImageIcon size={24} color={COLORS.textSecondary} /></View>
                    )}

                    <View style={styles.cardInfo}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: p.active ? COLORS.emeraldBg : COLORS.redBg }]}>
                          <Text style={[styles.statusBadgeText, { color: p.active ? COLORS.emeraldText : COLORS.redText }]}>
                            {p.active ? "Ativo" : "Inativo"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardSubRow}>
                        <Text style={styles.productPrice}>{formatCurrency(p.price)}</Text>
                        <View style={[styles.stockBadge, { backgroundColor: stockBadge.bg }]}>
                          <stockBadge.icon size={10} color={stockBadge.text} />
                          <Text style={[styles.stockBadgeText, { color: stockBadge.text }]}>{stockBadge.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.productCategory}>{p.category.name}</Text>
                    </View>

                    <View style={styles.chevron}>
                      {isExpanded ? <ChevronUp size={20} color={COLORS.textSecondary} /> : <ChevronDown size={20} color={COLORS.textSecondary} />}
                    </View>
                  </TouchableOpacity>

                  {/* Conteúdo Expandido (Estilo Web) */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <Text style={styles.productDescription}>{p.description}</Text>

                      <View style={styles.detailsGrid}>
                        <View style={styles.detailBox}>
                          <Text style={styles.detailLabel}>PREÇO</Text>
                          <Text style={styles.detailValue}>{formatCurrency(p.price)}</Text>
                        </View>
                        <View style={styles.detailBox}>
                          <Text style={styles.detailLabel}>ESTOQUE</Text>
                          <Text style={[styles.detailValue, { color: stockBadge.text }]}>{p.storage}</Text>
                        </View>
                        <View style={styles.detailBox}>
                          <Text style={styles.detailLabel}>CATEGORIA</Text>
                          <Text style={styles.detailValue} numberOfLines={1}>{p.category.name}</Text>
                        </View>
                      </View>

                      <View style={styles.actionButtons}>
                      
                        <TouchableOpacity 
                          style={[styles.btnToggle, { backgroundColor: p.active ? COLORS.redBg : COLORS.emeraldBg }]} 
                          onPress={() => toggleMutation.mutate(p)}
                        >
                          {p.active ? <XCircle size={16} color={COLORS.redText} /> : <CheckCircle2 size={16} color={COLORS.emeraldText} />}
                          <Text style={[styles.btnToggleText, { color: p.active ? COLORS.redText : COLORS.emeraldText }]}>
                            {p.active ? "Desativar" : "Ativar"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

    

      {/* Modal de Formulário (Slide Up) */}
      <Modal visible={showForm} animationType="slide" transparent={true} onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
            
              <TouchableOpacity onPress={() => setShowForm(false)} style={styles.closeBtn}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>

              {/* Image Picker */}
              <View style={styles.imagePickerContainer}>
                <TouchableOpacity style={styles.imagePreview} onPress={pickImage}>
                  {img ? (
                    <Image source={{ uri: img.uri }} style={styles.previewImg} />
                  ) : editing?.imageUrl ? (
                    <Image source={{ uri: editing.imageUrl }} style={styles.previewImg} />
                  ) : (
                    <ImageIcon size={32} color={COLORS.border} />
                  )}
                </TouchableOpacity>
                <View style={styles.imagePickerTexts}>
                  <Text style={styles.inputLabel}>IMAGEM DO PRODUTO</Text>
                  <TouchableOpacity style={styles.btnPickImage} onPress={pickImage}>
                    <Text style={styles.btnPickImageText}>Escolher arquivo</Text>
                  </TouchableOpacity>
                  <Text style={styles.imageHint}>PNG, JPG até 5MB</Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>NOME</Text>
              <TextInput mode="flat" value={form.name} onChangeText={t => setForm({ ...form, name: t })} style={styles.input} underlineColor="transparent" activeUnderlineColor="transparent" />

              <Text style={styles.inputLabel}>DESCRIÇÃO</Text>
              <TextInput mode="flat" value={form.description} onChangeText={t => setForm({ ...form, description: t })} style={[styles.input, { height: 80 }]} multiline underlineColor="transparent" activeUnderlineColor="transparent" />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>PREÇO (R$)</Text>
                  <TextInput mode="flat" keyboardType="numeric" value={String(form.price ?? "")} onChangeText={t => setForm({ ...form, price: parseFloat(t) || 0 })} style={styles.input} underlineColor="transparent" activeUnderlineColor="transparent" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>ESTOQUE</Text>
                  <TextInput mode="flat" keyboardType="numeric" value={String(form.storage ?? "")} onChangeText={t => setForm({ ...form, storage: parseInt(t) || 0 })} style={styles.input} underlineColor="transparent" activeUnderlineColor="transparent" />
                </View>
              </View>

              <Text style={styles.inputLabel}>CATEGORIA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPickerScroll}>
                {categories?.map(c => (
                  <TouchableOpacity key={c.id} style={[styles.chip, form.categoryId === c.id && styles.chipActive]} onPress={() => setForm({ ...form, categoryId: c.id })}>
                    <Text style={[styles.chipText, form.categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.switchContainer}>
                <View>
                  <Text style={styles.switchLabel}>Produto Ativo</Text>
                  <Text style={styles.switchSub}>Visível no catálogo para clientes</Text>
                </View>
                <Switch value={form.active} onValueChange={v => setForm({ ...form, active: v })} color={COLORS.amberText} />
              </View>

            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowForm(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.btnSave} 
                onPress={submit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnSaveText}>Salvar Alterações</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 100 },

  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  title: { fontFamily: "serif", fontSize: 32, fontWeight: "bold", color: COLORS.textPrimary },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  metricsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  metricCard: { flex: 1, minWidth: "45%", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  metricValue: { fontSize: 24, fontWeight: "900", marginTop: 8, marginBottom: 2 },
  metricLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },

  searchContainer: { marginHorizontal: 20, marginBottom: 24, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, backgroundColor: "transparent", height: 50, fontSize: 14 },

  filtersContainer: { paddingHorizontal: 20, marginBottom: 24 },
  filterTitle: { fontSize: 10, fontWeight: "900", color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  chipScroll: { gap: 8, paddingRight: 20 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: "bold", color: COLORS.textSecondary },
  chipTextActive: { color: "#fff" },

  listContainer: { paddingHorizontal: 20, gap: 12 },
  productCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  cardHeader: { flexDirection: "row", padding: 12, alignItems: "center" },
  productImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: COLORS.surface },
  productImagePlaceholder: { width: 56, height: 56, borderRadius: 12, backgroundColor: COLORS.surface, justifyContent: "center", alignItems: "center" },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  productName: { fontSize: 15, fontWeight: "bold", color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusBadgeText: { fontSize: 10, fontWeight: "bold" },
  cardSubRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  productPrice: { fontSize: 14, fontWeight: "900", color: COLORS.textPrimary },
  stockBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  stockBadgeText: { fontSize: 10, fontWeight: "bold" },
  productCategory: { fontSize: 12, color: COLORS.textSecondary },
  chevron: { padding: 8 },

  expandedContent: { padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: COLORS.surface, marginTop: 8 },
  productDescription: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 16, marginTop: 12 },
  detailsGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
  detailBox: { flex: 1, backgroundColor: COLORS.surface, padding: 12, borderRadius: 12, alignItems: "center" },
  detailLabel: { fontSize: 9, fontWeight: "900", color: COLORS.textSecondary, marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: "bold", color: COLORS.textPrimary },
  actionButtons: { flexDirection: "row", gap: 8 },
  btnEdit: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  btnEditText: { fontSize: 13, fontWeight: "bold", color: COLORS.textPrimary },
  btnToggle: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12 },
  btnToggleText: { fontSize: 13, fontWeight: "bold" },

  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary, fontWeight: "bold" },

  fab: { position: "absolute", bottom: 30, right: 20, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 100, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  fabText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 24, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  modalTitle: { fontFamily: "serif", fontSize: 24, fontWeight: "bold", color: COLORS.textPrimary },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  closeBtn: { padding: 4, backgroundColor: COLORS.surface, borderRadius: 100 },
  formScroll: { padding: 24, gap: 16 },

  imagePickerContainer: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 8 },
  imagePreview: { width: 80, height: 80, borderRadius: 16, backgroundColor: COLORS.surface, justifyContent: "center", alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: COLORS.border },
  previewImg: { width: "100%", height: "100%" },
  imagePickerTexts: { flex: 1 },
  btnPickImage: { alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 12, backgroundColor: COLORS.surface, borderRadius: 8, marginTop: 4, marginBottom: 4 },
  btnPickImageText: { fontSize: 12, fontWeight: "bold", color: COLORS.textPrimary },
  imageHint: { fontSize: 10, color: COLORS.textSecondary },

  inputLabel: { fontSize: 10, fontWeight: "900", color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 6 },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12, height: 50, fontSize: 14 },
  rowInputs: { flexDirection: "row", gap: 12 },
  categoryPickerScroll: { gap: 8, paddingBottom: 8 },

  switchContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginTop: 8 },
  switchLabel: { fontSize: 14, fontWeight: "bold", color: COLORS.textPrimary },
  switchSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  modalFooter: { flexDirection: "row", padding: 24, borderTopWidth: 1, borderTopColor: COLORS.surface, gap: 12 },
  btnCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: "center" },
  btnCancelText: { color: COLORS.textPrimary, fontWeight: "bold", fontSize: 14 },
  btnSave: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center" },
  btnSaveText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});