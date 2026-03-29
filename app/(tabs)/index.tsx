import React from "react";
import { View, StyleSheet, Dimensions, TouchableOpacity, FlatListProps, Image } from "react-native";
import { Text, ActivityIndicator } from 'react-native-paper';
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  FadeInUp
} from "react-native-reanimated";
import { Leaf, Droplets, Coffee, ArrowRight } from "lucide-react-native";
import { productsApi } from "@/src/lib/api";
import { ProductResponseDTO } from "@/src/types";
import { formatCurrency } from "@/src/lib/format";
import { FlatList } from "react-native-gesture-handler";
import { Footer } from "@/src/components/Footer";

const { width, height } = Dimensions.get("window");
const AnimatedFlatList = Animated.createAnimatedComponent<FlatListProps<ProductResponseDTO>>(FlatList);
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

export default function Home() {
  const router = useRouter();

  const { data: products, isLoading } = useQuery<ProductResponseDTO[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await productsApi.getAll();
      const data = response.data as any;
      return data.content || data;
    },
  });

  const featuredProducts = products?.slice(0, 4) || [];

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: scrollY.value * 0.4 }],
      opacity: interpolate(scrollY.value, [0, height * 0.5], [1, 0], Extrapolation.CLAMP),
    };
  });

  const featuresAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: interpolate(scrollY.value, [0, 250], [40, 0], Extrapolation.CLAMP) }],
      opacity: interpolate(scrollY.value, [0, 200], [0.6, 1], Extrapolation.CLAMP),
    };
  });

  const productsHeaderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: interpolate(scrollY.value, [200, 500], [30, 0], Extrapolation.CLAMP) }],
      opacity: interpolate(scrollY.value, [200, 450], [0.3, 1], Extrapolation.CLAMP),
    };
  });

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* HERO */}
      <View style={styles.heroWrapper}>
        <Animated.Image
          source={{ uri: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=2000' }}
          style={[styles.heroImage, heroAnimatedStyle]}
        />
        <View style={styles.heroOverlay}>
          <Animated.View entering={FadeInUp.duration(1000).delay(200)} style={styles.heroContent}>
            <Text style={styles.heroLabel}>QUALIDADE EXCEPCIONAL</Text>
            <Text style={styles.heroTitle}>O Grande Mestre</Text>
            <Text style={styles.heroTitleItalic}>de Torra.</Text>

            <Text style={styles.heroSubtitle}>
              Experimente café de origem ética, meticulosamente torrado, entregue diretamente na sua porta. Um ritual que vale a pena acordar para.
            </Text>

            <View style={styles.heroButtonsRow}>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => router.push("/products")}
              >
                <Text style={styles.btnPrimaryText}>Coleção de Produtos</Text>
                <ArrowRight size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => router.push("/our-story")} 
                style={styles.btnGhost}
              >
                <Text style={styles.btnGhostText}>Nossa História</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* FEATURES */}
      <Animated.View style={[styles.featuresSection, featuresAnimatedStyle]}>
        {[
          {
            icon: Leaf,
            title: "De Origem Ética",
            desc: "Relações comerciais diretas com agricultores garantindo salários justos e práticas sustentáveis."
          },
          {
            icon: Droplets,
            title: "Torrado em Pequenos Lotes",
            desc: "Torrado semanalmente sob encomenda para garantir frescor e sabor máximos."
          },
          {
            icon: Coffee,
            title: "Perfeitamente Feito",
            desc: "Perfis curados projetados para destacar o terroir único de cada grão."
          },
        ].map((feature, index) => (
          <Animated.View
            key={index}
            entering={FadeInUp.duration(800).delay(400 + (index * 150))}
            style={styles.featureBlock}
          >
            <View style={styles.featureIconBox}>
              <feature.icon size={28} color={COLORS.brandBrown} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDesc}>{feature.desc}</Text>
          </Animated.View>
        ))}
      </Animated.View>

      {/* PRODUCTS HEADER */}
      <Animated.View style={[styles.productsHeader, productsHeaderStyle]}>
        <View>
          <Text style={styles.sectionLabel}>OFERTAS FRESCAS</Text>
          <Text style={styles.sectionTitle}>Torrados em Destaque</Text>
        </View>
      </Animated.View>
    </View>
  );

  const renderProduct = ({ item, index }: { item: ProductResponseDTO, index: number }) => (
    <Animated.View entering={FadeInUp.duration(800).delay(index * 150)}>
      <TouchableOpacity 
        style={styles.cardContainer} 
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: "/product-detail", params: { id: item.id } })}
      >
        <View style={styles.imageWrapper}>
          {item.category && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.category.name}</Text>
            </View>
          )}
          <Image
            source={{ uri: item.imageUrl || 'https://via.placeholder.com/300x400' }}
            style={styles.productImage}
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.productPrice}>
            {formatCurrency(item.price)}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator animating={true} color={COLORS.brandBrown} style={styles.loader} />
      ) : (
        <AnimatedFlatList
          data={featuredProducts}
          renderItem={renderProduct}
          keyExtractor={(item: any) => item.id.toString()}
          numColumns={2}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={<Footer />}
          contentContainerStyle={styles.listPadding}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center' },
  listPadding: { paddingBottom: 0 },
  headerContainer: { backgroundColor: COLORS.background },

  heroWrapper: { height: height * 0.85, overflow: 'hidden', position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover', position: 'absolute' },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 24 },
  heroContent: { alignItems: 'center', marginTop: 40 },

  heroLabel: { color: COLORS.brandBrown, fontSize: 11, fontWeight: 'bold', letterSpacing: 2, marginBottom: 16 },
  heroTitle: { fontFamily: 'serif', fontSize: 46, fontWeight: 'bold', color: '#fff', textAlign: 'center', lineHeight: 52 },
  heroTitleItalic: { fontFamily: 'serif', fontSize: 46, fontStyle: 'italic', color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 20 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontSize: 16, lineHeight: 26, marginBottom: 36, paddingHorizontal: 10 },

  heroButtonsRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  btnPrimary: { backgroundColor: COLORS.brandBrown, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 26, paddingVertical: 16, borderRadius: 12, gap: 8 },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnGhost: { paddingHorizontal: 24, paddingVertical: 16 },
  btnGhostText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  featuresSection: { padding: 24, paddingTop: 60, paddingBottom: 40, gap: 40, backgroundColor: COLORS.background },
  featureBlock: { alignItems: 'center' },
  featureIconBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.badgeBg, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  featureTitle: { fontFamily: 'serif', fontSize: 22, fontWeight: 'bold', color: COLORS.primaryText, marginBottom: 10 },
  featureDesc: { textAlign: 'center', color: COLORS.mutedText, fontSize: 15, lineHeight: 24, paddingHorizontal: 20 },

  productsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, marginTop: 20, marginBottom: 32 },
  sectionLabel: { color: COLORS.brandBrown, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 6 },
  sectionTitle: { fontFamily: 'serif', fontSize: 32, fontWeight: 'bold', color: COLORS.primaryText },

  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 16 },
  cardContainer: { width: CARD_WIDTH, marginBottom: 32, backgroundColor: COLORS.background },
  imageWrapper: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16, overflow: 'hidden', marginBottom: 16, backgroundColor: COLORS.border },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  badge: { position: 'absolute', top: 12, left: 12, backgroundColor: COLORS.badgeBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, zIndex: 10 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: COLORS.primaryText, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardContent: { paddingHorizontal: 4 },
  productName: { fontFamily: 'serif', fontSize: 18, fontWeight: 'bold', color: COLORS.primaryText, marginBottom: 6 },
  productDescription: { fontSize: 13, color: COLORS.mutedText, lineHeight: 18, marginBottom: 10 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.brandBrown },
});