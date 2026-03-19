// app/products.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Coffee } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withDelay,
} from "react-native-reanimated";
import { categoriesApi, productsApi } from "@/src/lib/api";
import { CategoryResponseDTO, ProductResponseDTO } from "@/src/types";
import { ProductCard } from "@/src/components/ProductCard";
import { Footer } from "@/src/components/Footer";


export default function Products() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { data: products, isLoading } = useQuery<ProductResponseDTO[]>({
    queryKey: ["products"],
    queryFn: async () => (await productsApi.getAll()).data,
  });

  const { data: categories } = useQuery<CategoryResponseDTO[]>({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesApi.getAll()).data,
  });

  const filtered = products?.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || p.category?.id === selectedCategory;
    return matchesSearch && matchesCategory && p.active;
  });

  // Animações para o header e produtos
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(20);
  const productsOpacity = useSharedValue(0);
  const productsTranslateY = useSharedValue(20);

  React.useEffect(() => {
    // Animação do cabeçalho (sem delay inicial)
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) });

    // Animação dos produtos (com delay de 200ms)
    productsOpacity.value = withDelay(
      200, // Atraso de 200ms
      withTiming(1, { duration: 600 })
    );
    productsTranslateY.value = withDelay(
      200, // Atraso de 200ms
      withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) })
    );
  }, []); // Dependência vazia para rodar apenas uma vez ao montar o componente

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: headerTranslateY.value }],
    };
  });

  const animatedProductsStyle = useAnimatedStyle(() => {
    return {
      opacity: productsOpacity.value,
      transform: [{ translateY: productsTranslateY.value }],
    };
  });

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.contentWrapper}>
          <Animated.View style={animatedHeaderStyle}>
            <Text style={styles.sectionLabel}>Our Collection</Text>
            <Text style={styles.sectionTitle}>Shop Coffee</Text>
          </Animated.View>

          {/* Search & Filters */}
          <Animated.View
            style={[
              styles.searchFilterContainer,
              animatedHeaderStyle, // Reutilizando a animação para aparecer junto
            ]}
          >
            <View style={styles.searchInputWrapper}>
              <Search size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search coffees..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryButtonsScroll}
            >
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                style={[
                  styles.categoryButton,
                  !selectedCategory && styles.categoryButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    !selectedCategory && styles.categoryButtonTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {categories?.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() =>
                    setSelectedCategory(cat.id === selectedCategory ? null : cat.id)
                  }
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat.id && styles.categoryButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory === cat.id && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </View>

      {/* Products Grid */}
      <View style={styles.productsSection}>
        <View style={styles.contentWrapper}>
          {isLoading ? (
            <View
              style={[
                styles.productsGrid,
                isLargeScreen && styles.productsGridLarge,
              ]}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={styles.productCardPlaceholder} />
              ))}
            </View>
          ) : filtered && filtered.length > 0 ? (
            <Animated.View
              style={[
                styles.productsGrid,
                isLargeScreen && styles.productsGridLarge,
                animatedProductsStyle,
              ]}
            >
              {filtered.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </Animated.View>
          ) : (
            <View style={styles.noProductsMessage}>
              <Coffee size={48} color="#9CA3AF" style={styles.noProductsIcon} />
              <Text style={styles.noProductsText}>
                No coffees found matching your criteria.
              </Text>
            </View>
          )}
        </View>
      </View>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // bg-background
  },
  contentWrapper: {
    maxWidth: 1120, // max-w-7xl
    marginHorizontal: "auto", // mx-auto
    paddingHorizontal: 16, // px-4 sm:px-6 lg:px-8
  },
  headerSection: {
    paddingTop: Platform.OS === "ios" ? 120 : 90, // Ajuste para navbar fixa
    paddingBottom: 24, // pb-12
    backgroundColor: "rgba(243, 244, 246, 0.3)", // bg-muted/30
    borderBottomWidth: 1,
    borderBottomColor: "rgba(229, 231, 235, 0.5)", // border-border/50
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B4F4F", // text-primary
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8, // mb-2
  },
  sectionTitle: {
    fontFamily: "serif",
    fontSize: 36, // text-4xl md:text-5xl
    fontWeight: "bold",
    color: "#333333", // text-foreground
    marginBottom: 24, // mb-8
  },
  searchFilterContainer: {
    flexDirection: "column", // flex-col sm:flex-row
    gap: 16, // gap-4
  },
  searchInputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  searchIcon: {
    position: "absolute",
    left: 16, // left-4
  },
  searchInput: {
    flex: 1,
    paddingLeft: 48, // pl-12
    paddingRight: 16, // pr-4
    paddingVertical: 12, // py-3
    backgroundColor: "#FFFFFF", // bg-background
    borderWidth: 1,
    borderColor: "#E5E7EB", // border-border
    borderRadius: 12, // rounded-xl
    fontSize: 16,
    color: "#333333", // text-foreground
  },
  categoryButtonsScroll: {
    flexDirection: "row",
    gap: 8, // gap-2
    paddingVertical: 4, // Para dar um respiro ao scroll horizontal
  },
  categoryButton: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 12, // py-3
    borderRadius: 12, // rounded-xl
    borderWidth: 1,
    borderColor: "#E5E7EB", // border-border
    backgroundColor: "#FFFFFF", // bg-background
  },
  categoryButtonActive: {
    backgroundColor: "#6B4F4F", // bg-primary
    borderColor: "#6B4F4F",
  },
  categoryButtonText: {
    fontSize: 14, // text-sm
    fontWeight: "500", // font-medium
    color: "#6B7280", // text-muted-foreground
  },
  categoryButtonTextActive: {
    color: "#FFFFFF", // text-primary-foreground
  },
  productsSection: {
    paddingVertical: 64, // py-16
  },
  productsGrid: {
    flexDirection: "column", // grid grid-cols-1
    gap: 24, // gap-8
  },
  productsGridLarge: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // Ajuste para 2 ou 3 colunas
  },
  productCardPlaceholder: {
    aspectRatio: 3 / 4, // aspect-[3/4]
    backgroundColor: "#E5E7EB", // bg-muted
    borderRadius: 16, // rounded-2xl
    opacity: 0.7, // animate-pulse
    width: "100%", // Para mobile, 100% da largura
  },
  noProductsMessage: {
    paddingVertical: 80, // py-20
    backgroundColor: "rgba(255, 255, 255, 0.8)", // glass-card
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.5)", // border-dashed
    borderStyle: "dashed",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
  },
  noProductsIcon: {
    marginBottom: 16, // mb-4
    opacity: 0.5,
  },
  noProductsText: {
    fontSize: 20, // text-xl
    color: "#6B7280", // text-muted-foreground
    fontFamily: "serif",
    textAlign: "center",
  },
});