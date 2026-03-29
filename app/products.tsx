import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Coffee } from "lucide-react-native";
import { productsApi, categoriesApi } from "@/src/lib/api";
import { ProductResponseDTO, CategoryResponseDTO } from "@/src/types";
import { formatCurrency } from "@/src/lib/format";
import { Footer } from "@/src/components/Footer";
import { MotiView, MotiText, AnimatePresence } from "moti";
import { Skeleton } from "moti/skeleton";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width / 2) - 24;

const COLORS = {
  background: "#F7F5F2",
  surface: "#FFFFFF",
  primaryText: "#2C2826",
  brandBrown: "#9A5B32",
  mutedText: "#8A847D",
  border: "#E5E0D8",
  badgeBg: "#EFEFEF",
};

// Componente de Skeleton para o Estilo Old Money
const ProductSkeleton = () => (
  <View style={styles.cardContainer}>
    <Skeleton colorMode="light" width={CARD_WIDTH} height={CARD_WIDTH * 1.33} radius={16} />
    <View style={{ marginTop: 12 }}>
      <Skeleton colorMode="light" width={CARD_WIDTH * 0.8} height={20} />
      <View style={{ height: 8 }} />
      <Skeleton colorMode="light" width={CARD_WIDTH * 0.5} height={16} />
    </View>
  </View>
);

export default function ProductsScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { data: products, isLoading: isLoadingProducts } = useQuery<ProductResponseDTO[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await productsApi.getAll();
      const data = response.data as any;
      return data.content || data;
    },
  });

  const { data: categories } = useQuery<CategoryResponseDTO[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoriesApi.getAll();
      const data = response.data as any;
      return data.content || data;
    },
  });

  const filteredProducts = products?.filter((p) => {
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || p.category?.id === selectedCategory;
    return matchesSearch && matchesCategory && p.active;
  });

  const renderHeader = () => (
    <MotiView 
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600 }}
      style={styles.headerContainer}
    >
      <Text style={styles.sectionLabel}>NOSSA COLEÇÃO</Text>
      <Text style={styles.sectionTitle}>Shop Café</Text>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.mutedText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Procure cafés..."
          placeholderTextColor={COLORS.mutedText}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
        <TouchableOpacity
          style={[styles.categoryPill, !selectedCategory && styles.categoryPillActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.categoryPillText, !selectedCategory && styles.categoryPillTextActive]}>All</Text>
        </TouchableOpacity>
        {categories?.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryPill, selectedCategory === cat.id && styles.categoryPillActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
          >
            <Text style={[styles.categoryPillText, selectedCategory === cat.id && styles.categoryPillTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </MotiView>
  );

  const renderProductCard = ({ item, index }: { item: ProductResponseDTO, index: number }) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 0 }}
      animate={{ opacity: 1, scale: 1, translateY: 20 }}
      transition={{ 
        type: 'spring', 
        delay: index * 10, 
        damping: 60 
      }}
    >
      <TouchableOpacity 
        style={styles.cardContainer} 
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: "/product-detail", params: { id: item.id } })}
      >
        <View style={styles.imageWrapper}>
          {item.category && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.category.name}</Text>
            </View>
          )}
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <AnimatePresence>
        {isLoadingProducts ? (
          <View style={styles.loaderGrid}>
            {[1, 2, 3, 4].map((i) => <ProductSkeleton key={i} />)}
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProductCard}
            numColumns={2}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            ListFooterComponent={<Footer />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.emptyState}>
                <Coffee size={48} color={COLORS.border} />
                <Text style={styles.emptyStateText}>No coffees found.</Text>
              </MotiView>
            }
          />
        )}
      </AnimatePresence>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 16, paddingTop: 100 },
  listContent: { paddingTop: 20, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 16 },
  headerContainer: { paddingHorizontal: 16, marginBottom: 24, paddingTop: 40 },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.brandBrown, letterSpacing: 1.5, marginBottom: 8 },
  sectionTitle: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 36, fontWeight: 'bold', color: COLORS.primaryText, marginBottom: 24 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, height: 50, marginBottom: 16 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.primaryText },
  categoriesScroll: { gap: 10 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  categoryPillActive: { backgroundColor: COLORS.brandBrown, borderColor: COLORS.brandBrown },
  categoryPillText: { fontSize: 14, color: COLORS.mutedText, fontWeight: '500' },
  categoryPillTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  cardContainer: { width: CARD_WIDTH, marginBottom: 24 },
  imageWrapper: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16, overflow: 'hidden', marginBottom: 12, backgroundColor: COLORS.border },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  badge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, zIndex: 10 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: COLORS.primaryText, textTransform: 'uppercase' },
  cardContent: { paddingHorizontal: 4 },
  productName: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 18, fontWeight: 'bold', color: COLORS.primaryText, marginBottom: 6 },
  productDescription: { fontSize: 13, color: COLORS.mutedText, lineHeight: 18, marginBottom: 10 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.brandBrown },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateText: { fontFamily: 'serif', fontSize: 18, color: COLORS.mutedText, marginTop: 16 }
});