import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from "react-native";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Tag,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios"; // Assumindo que categoriesApi é um wrapper para axios

// Mock de useToast para React Native
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
    console.log(`Toast: ${title} - ${description} (Variant: ${variant})`);
    // Implementar um toast nativo aqui, como ToastAndroid ou um componente customizado
  },
});

// Habilitar LayoutAnimation para Android
if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Tipos
interface CategoryRequestDTO {
  name: string;
  description?: string;
}

interface CategoryResponseDTO {
  id: number;
  name: string;
  description?: string;
}

// Mock da API de categorias
const categoriesApi = {
  getAll: async () => {
    console.log("Fetching all categories");
    await new Promise((resolve) => setTimeout(resolve, 800));
    const mockCategories: CategoryResponseDTO[] = [
      { id: 1, name: "Cafés Especiais", description: "Grãos selecionados e métodos de preparo únicos." },
      { id: 2, name: "Salgados Artesanais", description: "Opções frescas e feitas à mão para acompanhar seu café." },
      { id: 3, name: "Doces Finos", description: "Sobremesas delicadas e saborosas." },
      { id: 4, name: "Bebidas Geladas", description: "Refrescantes opções para os dias quentes." },
      { id: 5, name: "Chás e Infusões", description: "Variedade de chás quentes e gelados." },
      { id: 6, name: "Pães e Torradas", description: "Opções para o café da manhã ou lanche." },
    ];
    return { data: mockCategories };
  },
  create: async (newCategory: CategoryRequestDTO) => {
    console.log("Creating category:", newCategory);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { data: { id: Math.floor(Math.random() * 1000) + 100, ...newCategory } };
  },
  update: async (id: number, updatedCategory: CategoryRequestDTO) => {
    console.log(`Updating category ${id}:`, updatedCategory);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { data: { id, ...updatedCategory } };
  },
  delete: async (id: number) => {
    console.log(`Deleting category ${id}`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { data: null };
  },
};

// Componente de Card de Categoria
const CategoryCard: React.FC<{
  category: CategoryResponseDTO;
  onEdit: (category: CategoryResponseDTO) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  index: number;
}> = ({ category, onEdit, onDelete, isDeleting, index }) => {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(12);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View
      style={[
        styles.categoryCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.categoryCardContent}>
        <View style={styles.categoryCardHeader}>
          <Tag size={20} color={styles.categoryCardIcon.color} />
          <View style={styles.categoryCardTextGroup}>
            <Text style={styles.categoryCardName}>{category.name}</Text>
            <Text style={styles.categoryCardDescription} numberOfLines={2}>
              {category.description || "Sem descrição"}
            </Text>
          </View>
        </View>
        <View style={styles.categoryCardActions}>
          <TouchableOpacity
            onPress={() => onEdit(category)}
            style={styles.actionButton}
            disabled={isDeleting}
          >
            <Edit size={18} color={styles.actionButtonText.color} />
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(category.id)}
            style={[styles.actionButton, styles.deleteButton]}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={styles.deleteButtonText.color} />
            ) : (
              <Trash2 size={18} color={styles.deleteButtonText.color} />
            )}
            <Text style={styles.deleteButtonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// Componente principal
export default function CategoryManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponseDTO | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryRequestDTO>({
    name: "",
    description: "",
  });
  const [showDescription, setShowDescription] = useState(false);

  // Fetch Categories
  const {
    data: categories,
    isLoading: isLoadingCategories,
    error: categoriesError,
    refetch,
  } = useQuery<CategoryResponseDTO[], Error>({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesApi.getAll()).data,
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (newCategory: CategoryRequestDTO) => categoriesApi.create(newCategory),
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Categoria criada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeFormModal();
    },
    onError: (err) => {
      console.error("Erro ao criar categoria:", err);
      toast({
        title: "Erro",
        description: "Falha ao criar categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (updatedCategory: { id: number; data: CategoryRequestDTO }) =>
      categoriesApi.update(updatedCategory.id, updatedCategory.data),
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Categoria atualizada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeFormModal();
    },
    onError: (err) => {
      console.error("Erro ao atualizar categoria:", err);
      toast({
        title: "Erro",
        description: "Falha ao atualizar categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Categoria excluída com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => {
      console.error("Erro ao excluir categoria:", err);
      toast({
        title: "Erro",
        description: "Falha ao excluir categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // --- Form Handlers ---
  const handleInputChange = (name: string, value: string) => {
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      description: "",
    });
    setShowDescription(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (category: CategoryResponseDTO) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
    });
    setShowDescription(!!category.description);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      description: "",
    });
    setShowDescription(false);
  };

  const handleSubmit = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  const toggleDescriptionVisibility = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowDescription((prev) => !prev);
  };

  if (isLoadingCategories) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={styles.spinner.color} />
        <Text style={styles.loadingText}>Carregando categorias…</Text>
      </View>
    );
  }

  if (categoriesError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erro ao carregar dados</Text>
        <Text style={styles.errorDescription}>Por favor, tente novamente mais tarde.</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gerenciamento de Categorias</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Plus size={20} color={styles.addButtonText.color} />
          <Text style={styles.addButtonText}>Nova Categoria</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {categories && categories.length > 0 ? (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <CategoryCard
                category={item}
                onEdit={openEditModal}
                onDelete={deleteCategoryMutation.mutate}
                isDeleting={deleteCategoryMutation.isPending}
                index={index}
              />
            )}
            contentContainerStyle={styles.flatListContent}
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Tag size={64} color={styles.emptyStateIcon.color} style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateTitle}>Nenhuma categoria encontrada.</Text>
            <Text style={styles.emptyStateDescription}>Comece adicionando uma nova!</Text>
            <TouchableOpacity onPress={openCreateModal} style={styles.emptyStateButton}>
              <Text style={styles.emptyStateButtonText}>Adicionar Categoria</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Category Form Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isFormModalOpen}
        onRequestClose={closeFormModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? "Editar Categoria" : "Criar Nova Categoria"}
              </Text>
              <TouchableOpacity onPress={closeFormModal} style={styles.modalCloseButton}>
                <X size={24} color={styles.modalCloseButtonIcon.color} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nome</Text>
                <TextInput
                  style={styles.formInput}
                  value={categoryForm.name}
                  onChangeText={(text) => handleInputChange("name", text)}
                  placeholder="Nome da categoria"
                  placeholderTextColor={styles.formInputPlaceholder.color}
                  required
                />
              </View>

              <TouchableOpacity onPress={toggleDescriptionVisibility} style={styles.toggleDescriptionButton}>
                <Text style={styles.toggleDescriptionButtonText}>
                  {showDescription ? "Ocultar descrição" : "Adicionar descrição (opcional)"}
                </Text>
                {showDescription ? (
                  <ChevronUp size={16} color={styles.toggleDescriptionButtonText.color} />
                ) : (
                  <ChevronDown size={16} color={styles.toggleDescriptionButtonText.color} />
                )}
              </TouchableOpacity>

              {showDescription && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Descrição</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextarea]}
                    value={categoryForm.description}
                    onChangeText={(text) => handleInputChange("description", text)}
                    placeholder="Descrição detalhada da categoria"
                    placeholderTextColor={styles.formInputPlaceholder.color}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={closeFormModal} style={[styles.modalButton, styles.modalButtonSecondary]}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                style={styles.modalButton}
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending || updateCategoryMutation.isPending ? (
                  <ActivityIndicator size="small" color={styles.modalButtonText.color} />
                ) : (
                  <Text style={styles.modalButtonText}>
                    {editingCategory ? "Salvar Alterações" : "Criar Categoria"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F0E9", // bg-background
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F0E9",
  },
  spinner: {
    color: "#8B5E3C", // text-primary
  },
  loadingText: {
    fontSize: 16,
    color: "#736C63", // text-muted-foreground
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F0E9",
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: "serif",
    fontWeight: "bold",
    color: "#EF4444", // text-destructive
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 16,
    color: "#736C63", // text-muted-foreground
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#8B5E3C", // bg-primary
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF", // text-primary-foreground
    fontSize: 16,
    fontWeight: "600",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontFamily: "serif",
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C1B10", // text-foreground
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#8B5E3C", // bg-primary
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: "#FFFFFF", // text-primary-foreground
    fontSize: 16,
    fontWeight: "600",
  },

  // List
  listContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF", // bg-card
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D4C7B8", // border-border/50
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  flatListContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  // Category Card
  categoryCard: {
    backgroundColor: "#FFFFFF", // bg-card
    borderColor: "#E5E0D9", // border-border
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryCardContent: {
    padding: 16,
  },
  categoryCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  categoryCardIcon: {
    color: "#8B5E3C", // text-primary
    marginTop: 2,
  },
  categoryCardTextGroup: {
    flex: 1,
  },
  categoryCardName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C1B10", // text-foreground
    marginBottom: 4,
  },
  categoryCardDescription: {
    fontSize: 14,
    color: "#736C63", // text-muted-foreground
  },
  categoryCardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#E5E0D9", // border-border
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D4C7B8", // border-border/60
    backgroundColor: "#F5F0E9", // bg-muted/30
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#736C63", // text-muted-foreground
  },
  deleteButton: {
    borderColor: "#EF4444", // border-destructive
    backgroundColor: "rgba(239, 68, 68, 0.1)", // bg-destructive/10
  },
  deleteButtonText: {
    color: "#EF4444", // text-destructive
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateIcon: {
    color: "rgba(115, 108, 99, 0.5)", // text-muted-foreground/50
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontFamily: "serif",
    fontSize: 20,
    fontWeight: "600",
    color: "#2C1B10", // text-foreground
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 16,
    color: "#736C63", // text-muted-foreground
    textAlign: "center",
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: "#8B5E3C", // bg-primary
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: "#FFFFFF", // text-primary-foreground
    fontSize: 16,
    fontWeight: "600",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF", // bg-card
    borderRadius: 16,
    width: "90%",
    maxWidth: 450,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#E5E0D9", // border-border
  },
  modalTitle: {
    fontFamily: "serif",
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C1B10", // text-foreground
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseButtonIcon: {
    color: "#736C63", // text-muted-foreground
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C1B10", // text-foreground
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#F5F0E9", // bg-background
    borderColor: "#D4C7B8", // border-border
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2C1B10", // text-foreground
  },
  formInputPlaceholder: {
    color: "#A19B93", // text-muted-foreground
  },
  formTextarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  toggleDescriptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    marginBottom: 16,
  },
  toggleDescriptionButtonText: {
    fontSize: 14,
    color: "#8B5E3C", // text-primary
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#E5E0D9", // border-border
  },
  modalButton: {
    backgroundColor: "#8B5E3C", // bg-primary
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  modalButtonSecondary: {
    backgroundColor: "#D4C7B8", // bg-muted
  },
  modalButtonText: {
    color: "#FFFFFF", // text-primary-foreground
    fontSize: 16,
    fontWeight: "600",
  },
});