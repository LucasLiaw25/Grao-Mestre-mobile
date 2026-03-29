import React, { useState, useMemo } from "react";
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  FlatListProps, 
  Alert 
} from "react-native";
import { 
  Text, 
  ActivityIndicator, 
  Portal, 
  Modal, 
  TextInput, 
  Button, 
  Searchbar 
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/src/lib/api";
import { CategoryResponseDTO, CategoryRequestDTO } from "@/src/types";
import Animated, { 
  FadeInUp, 
  Layout, 
  useSharedValue, 
  useAnimatedScrollHandler 
} from "react-native-reanimated";
import { Tag, Edit, Trash2, Plus, Search, X } from "lucide-react-native";
import { FlatList } from "react-native-gesture-handler";

const { width } = Dimensions.get("window");
const AnimatedFlatList = Animated.createAnimatedComponent<FlatListProps<CategoryResponseDTO>>(FlatList);

// Design System: Old Money / Stone Palette
const COLORS = {
  background: "#FAF9F6", // Creme suave
  surface: "#FFFFFF",
  primary: "#2C2826",    // Stone 900
  secondary: "#78716C",  // Stone 500
  accent: "#9A5B32",     // Marrom assinatura
  border: "#E7E5E4",     // Stone 200
  error: "#991B1B",
  inputBg: "#F5F5F4",
};

export default function CategoriesManagement() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponseDTO | null>(null);
  const [formData, setFormData] = useState<CategoryRequestDTO>({ name: '', description: '' });

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // API Integration (Mantida conforme solicitado)
  const { data: categories, isLoading } = useQuery<CategoryResponseDTO[]>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const response = await categoriesApi.getAll();
      const data = response.data as any;
      return data.content || data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: CategoryRequestDTO) => 
      editingCategory 
        ? categoriesApi.update(editingCategory.id, data) 
        : categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  // UX: Filtro derivado do "Painel" web
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const openModal = (category?: CategoryResponseDTO) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description || '' });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  const handleDelete = (id: number) => {
    Alert.alert("Excluir Categoria", "Deseja realmente remover esta categoria?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteMutation.mutate(id) }
    ]);
  };

  // Renderização do Card de Categoria (Referência ao estilo de Usuário/Produto)
  const renderCategoryCard = ({ item, index }: { item: CategoryResponseDTO, index: number }) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 100).duration(500)}
      layout={Layout.springify()}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Tag size={20} color={COLORS.accent} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryDescription} numberOfLines={2}>
            {item.description || "Sem descrição disponível."}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          onPress={() => openModal(item)}
          style={[styles.actionBtn, { borderColor: COLORS.border }]}
        >
          <Edit size={16} color={COLORS.secondary} />
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => handleDelete(item.id)}
          style={[styles.actionBtn, { borderColor: 'transparent' }]}
        >
          <Trash2 size={16} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header Estilo Old Money */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>GERENCIAMENTO</Text>
        <Text style={styles.headerTitle}>Categorias</Text>
        
        <View style={styles.filterContainer}>
          <Searchbar
            placeholder="Buscar categoria..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor={COLORS.secondary}
            inputStyle={styles.searchInput}
            placeholderTextColor={COLORS.secondary}
          />
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredCategories.length}</Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator animating color={COLORS.accent} style={styles.loader} />
      ) : (
        <AnimatedFlatList
          data={filteredCategories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma categoria encontrada.</Text>
          }
        />
      )}

      {/* FAB Sofisticado */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => openModal()}
        activeOpacity={0.8}
      >
        <Plus color="#FFF" size={24} />
      </TouchableOpacity>

      {/* Modal de Formulário (Adaptação da UI/UX Web para Mobile) */}
      <Portal>
        <Modal 
          visible={isModalVisible} 
          onDismiss={closeModal} 
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <X size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome da Categoria</Text>
              <TextInput
                mode="flat"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Ex: Cafés Especiais"
                style={styles.input}
                underlineColor="transparent"
                activeUnderlineColor={COLORS.accent}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                mode="flat"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Descreva o propósito desta categoria..."
                multiline
                numberOfLines={4}
                style={[styles.input, { height: 100, paddingTop: 10 }]}
                underlineColor="transparent"
                activeUnderlineColor={COLORS.accent}
              />
            </View>

            <Button 
              mode="contained" 
              onPress={() => saveMutation.mutate(formData)}
              loading={saveMutation.isPending}
              style={styles.saveBtn}
              buttonColor={COLORS.primary}
              labelStyle={styles.saveBtnLabel}
            >
              {editingCategory ? "Salvar Alterações" : "Criar Categoria"}
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 24, paddingTop: 60, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerSubtitle: { fontSize: 10, letterSpacing: 2, color: COLORS.accent, fontWeight: "bold", marginBottom: 4 },
  headerTitle: { fontSize: 32, fontFamily: 'serif', fontWeight: "bold", color: COLORS.primary },
  
  filterContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 12 },
  searchBar: { flex: 1, backgroundColor: COLORS.inputBg, borderRadius: 12, height: 45, elevation: 0 },
  searchInput: { fontSize: 14, minHeight: 0 },
  countBadge: { backgroundColor: COLORS.inputBg, paddingHorizontal: 12, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  countText: { fontWeight: 'bold', color: COLORS.primary },

  listContent: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  iconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  titleContainer: { flex: 1 },
  categoryName: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  categoryDescription: { fontSize: 14, color: COLORS.secondary, lineHeight: 20 },
  
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  actionText: { fontSize: 13, fontWeight: '600', color: COLORS.secondary },

  fab: { position: 'absolute', bottom: 30, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  
  modalContent: { backgroundColor: COLORS.surface, margin: 20, borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: 'serif', fontWeight: 'bold', color: COLORS.primary },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: 'bold', color: COLORS.secondary, letterSpacing: 0.5 },
  input: { backgroundColor: COLORS.inputBg, borderRadius: 12, fontSize: 15 },
  saveBtn: { borderRadius: 12, marginTop: 10, paddingVertical: 6 },
  saveBtnLabel: { fontSize: 16, fontWeight: 'bold' },
  
  loader: { flex: 1, justifyContent: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.secondary, fontStyle: 'italic' }
});