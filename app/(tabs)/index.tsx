import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

import { Footer } from "@/src/components/Footer";
import { ProductCard } from "@/src/components/ProductCard";
import { productsApi } from "@/src/lib/api";
import { ProductResponseDTO } from "@/types";
import { ArrowRight, Coffee, Droplets, Leaf } from "@expo/vector-icons";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
} from "react-native-reanimated";

export default function Home() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const scrollRef = useSharedValue(0);
  const scrollHandler = useScrollViewOffset(scrollRef);

  const { data: products, isLoading } = useQuery<ProductResponseDTO[]>({
    queryKey: ["products"],
    queryFn: async () => (await productsApi.getAll()).data,
  });

  const heroAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollHandler.value,
      [0, 1000],
      [0, 400],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      scrollHandler.value,
      [0, 600],
      [1, 0],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const featuresBackgroundAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolate(
      scrollHandler.value,
      [300, 600, 900, 1200],
      [
        0.97, // hsl(30, 25%, 97%)
        0.95, // hsl(32, 28%, 95%)
        0.93, // hsl(28, 20%, 93%)
        0.97, // hsl(30, 25%, 97%)
      ],
      Extrapolate.CLAMP
    );

    return {
      backgroundColor: `hsl(30, 25%, ${Math.round(backgroundColor * 100)}%)`,
    };
  });

  const featuredProducts = products?.slice(0, 3) || [];

  return (
    <Animated.ScrollView
      style={styles.container}
      scrollEventThrottle={16}
      onScroll={scrollHandler}
      ref={scrollRef}
    >
      <View style={styles.heroSection}>
        <Animated.View style={[styles.heroBackground, heroAnimatedStyle]}>
          <View style={styles.heroOverlay} />
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=2000" }}
            style={styles.heroImage}
          />
        </Animated.View>

        <View style={styles.heroContent}>
          <Text style={styles.sectionLabel}>Exceptional Quality</Text>
          <Text style={styles.heroTitle}>
            The Grand Master
            {"\n"}
            <Text style={styles.heroTitleItalic}>of Roasting.</Text>
          </Text>
          <Text style={styles.heroDescription}>
            Experience ethically sourced, meticulously roasted coffee delivered straight to your door. A ritual worth waking up for.
          </Text>

          <View style={[styles.heroButtons, !isLargeScreen && styles.heroButtonsMobile]}>
            <Link href="/products" asChild>
              <TouchableOpacity style={styles.heroButtonPrimary}>
                <Text style={styles.heroButtonPrimaryText}>Shop Collection</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </Link>
            <Link href="/our-story" asChild>
              <TouchableOpacity style={styles.heroButtonGhost}>
                <Text style={styles.heroButtonGhostText}>Our Story</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View style={styles.scrollIndicator}>
          <Text style={styles.scrollText}>Scroll</Text>
          <View style={styles.scrollLine} />
        </View>
      </View>

      <Animated.View style={[styles.featuresSection, featuresBackgroundAnimatedStyle]}>
        <View style={styles.contentWrapper}>
          <View style={[styles.featuresGrid, !isLargeScreen && styles.featuresGridMobile]}>
            {[
              { icon: Leaf, title: "Ethically Sourced", desc: "Direct trade relationships with farmers ensuring fair wages and sustainable practices." },
              { icon: Droplets, title: "Small Batch Roasted", desc: "Roasted weekly to order in our local facility to guarantee peak freshness and flavor." },
              { icon: Coffee, title: "Perfectly Crafted", desc: "Curated profiles designed to highlight the unique terroir of every bean." },
            ].map((feature, i) => (
              <View key={i} style={styles.featureItem}>
                <View style={styles.featureIconWrapper}>
                  <feature.icon size={32} color="#6B4F4F" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      <View style={styles.featuredProductsSection}>
        <View style={styles.contentWrapper}>
          <View style={[styles.featuredProductsHeader, !isLargeScreen && styles.featuredProductsHeaderMobile]}>
            <View style={styles.featuredProductsHeaderTextContainer}>
              <Text style={styles.sectionLabel}>Fresh Offerings</Text>
              <Text style={styles.sectionTitle}>Featured Roasts</Text>
            </View>
            <Link href="/products" asChild>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllButtonText}>View All Coffee</Text>
                <ArrowRight size={20} color="#333333" />
              </TouchableOpacity>
            </Link>
          </View>

          {isLoading ? (
            <View style={[styles.productsGrid, !isLargeScreen && styles.productsGridMobile]}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.productCardPlaceholder} />
              ))}
            </View>
          ) : (
            <View style={[styles.productsGrid, !isLargeScreen && styles.productsGridMobile]}>
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))
              ) : (
                <View style={styles.noProductsMessage}>
                  <Coffee size={48} color="#9CA3AF" style={styles.noProductsIcon} />
                  <Text style={styles.noProductsText}>Our roasters are currently preparing the beans.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      <Footer />
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // bg-background
  },
  heroSection: {
    position: 'relative',
    height: 700, // h-[95vh] ajustado para um valor fixo ou calculado
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroBackground: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // from-foreground/60
    zIndex: 10,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
    textAlign: 'center',
    paddingHorizontal: 16,
    maxWidth: 900, // max-w-5xl
    marginTop: 64, // mt-16
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700', // text-primary
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 24, // mb-6
    backgroundColor: 'rgba(0,0,0,0.4)', // drop-shadow-md
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroTitle: {
    fontFamily: 'serif',
    fontSize: 48, // text-5xl md:text-7xl lg:text-8xl
    fontWeight: 'bold',
    color: '#FFFFFF', // text-primary-foreground
    marginBottom: 32, // mb-8
    lineHeight: 56, // leading-[1.1]
    textAlign: 'center',
  },
  heroTitleItalic: {
    color: 'rgba(255, 255, 255, 0.9)', // text-primary-foreground/90
    fontStyle: 'italic',
  },
  heroDescription: {
    fontSize: 18, // text-lg md:text-xl
    color: 'rgba(255, 255, 255, 0.8)', // text-primary-foreground/80
    maxWidth: 600, // max-w-2xl
    marginBottom: 48, // mb-12
    fontWeight: '300', // font-light
    lineHeight: 28, // leading-relaxed
    textAlign: 'center',
  },
  heroButtons: {
    flexDirection: 'column', // flex-col sm:flex-row
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16, // gap-4
  },
  heroButtonsMobile: {
    width: '100%',
  },
  heroButtonPrimary: {
    backgroundColor: '#6B4F4F', // btn-hero-primary
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200, // w-full sm:w-auto
  },
  heroButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  heroButtonGhost: {
    backgroundColor: 'transparent', // btn-hero-ghost
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    minWidth: 200, // w-full sm:w-auto
  },
  heroButtonGhostText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: 40, // bottom-10
    left: '50%',
    transform: [{ translateX: -25 }], // -translate-x-1/2
    zIndex: 10,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8, // gap-2
  },
  scrollText: {
    fontSize: 12, // text-xs
    textTransform: 'uppercase',
    letterSpacing: 2, // tracking-widest
    fontWeight: '600', // font-semibold
    color: 'rgba(255, 255, 255, 0.6)', // text-primary-foreground/60
  },
  scrollLine: {
    width: 1, // w-[1px]
    height: 48, // h-12
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // bg-gradient-to-b from-primary-foreground/60 to-transparent
  },
  featuresSection: {
    paddingVertical: 96, // py-24
    position: 'relative',
    zIndex: 20,
  },
  contentWrapper: {
    maxWidth: 1120, // max-w-7xl
    marginHorizontal: 'auto', // mx-auto
    paddingHorizontal: 16, // px-4 sm:px-6 lg:px-8
  },
  featuresGrid: {
    flexDirection: 'column', // grid grid-cols-1 md:grid-cols-3
    gap: 48, // gap-12
  },
  featuresGridMobile: {
    // Estilos específicos para mobile se necessário
  },
  featureItem: {
    textAlign: 'center',
    alignItems: 'center',
  },
  featureIconWrapper: {
    width: 64, // w-16
    height: 64, // h-16
    marginHorizontal: 'auto', // mx-auto
    marginBottom: 24, // mb-6
    backgroundColor: '#F0EAD6', // bg-accent
    borderRadius: 16, // rounded-2xl
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontFamily: 'serif',
    fontSize: 24, // text-2xl
    fontWeight: 'bold',
    marginBottom: 16, // mb-4
    color: '#333333',
  },
  featureDescription: {
    color: '#6B7280', // text-muted-foreground
    lineHeight: 24, // leading-relaxed
    textAlign: 'center',
  },
  featuredProductsSection: {
    paddingVertical: 96, // py-24
    backgroundColor: 'rgba(243, 244, 246, 0.3)', // bg-muted/30
    position: 'relative',
    zIndex: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)', // border-border/50
  },
  featuredProductsHeader: {
    flexDirection: 'row', // flex-col md:flex-row
    justifyContent: 'space-between',
    alignItems: 'flex-end', // items-end
    marginBottom: 64, // mb-16
    gap: 24, // gap-6
  },
  featuredProductsHeaderMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  featuredProductsHeaderTextContainer: {
    maxWidth: 800, // max-w-2xl
  },
  sectionTitle: {
    fontFamily: 'serif',
    fontSize: 36, // text-4xl md:text-5xl
    fontWeight: 'bold',
    color: '#333333', // text-foreground
    marginTop: 8, // mt-2
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap-2
    paddingBottom: 8, // pb-2
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  viewAllButtonText: {
    fontWeight: '600', // font-semibold
    color: '#333333', // text-foreground
    fontSize: 16,
  },
  productsGrid: {
    flexDirection: 'column', // grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
    gap: 32, // gap-8
  },
  productsGridMobile: {
    // Estilos específicos para mobile se necessário
  },
  productCardPlaceholder: {
    aspectRatio: 3 / 4, // aspect-[3/4]
    backgroundColor: '#E5E7EB', // bg-muted
    borderRadius: 16, // rounded-2xl
    opacity: 0.7, // animate-pulse
  },
  noProductsMessage: {
    flex: 1,
    paddingVertical: 80, // py-20
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // glass-card
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)', // border-dashed
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  noProductsIcon: {
    marginBottom: 16, // mb-4
    opacity: 0.5,
  },
  noProductsText: {
    fontSize: 20, // text-xl
    color: '#6B7280', // text-muted-foreground
    fontFamily: 'serif',
    textAlign: 'center',
  },
});