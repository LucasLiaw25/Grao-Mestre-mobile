// app/our-story.tsx
import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useScrollViewOffset,
  interpolate,
  Extrapolate,
  withTiming,
  Easing,
  withDelay,
  useAnimatedRef, // Importar useAnimatedRef
} from "react-native-reanimated";
import {
  Scale,
  Heart,
  Compass,
  Target,
  Clock4,
  Award,
  Handshake,
} from "lucide-react-native";
import { Footer } from "@/src/components/Footer";

export default function OurStory() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const scrollRef = useAnimatedRef<Animated.ScrollView>(); // Usar useAnimatedRef
  const scrollHandler = useScrollViewOffset(scrollRef);

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

  const dynamicBackground = useSharedValue(0);
  useEffect(() => {
  }, []);

  const createFadeInAnimation = (delay = 0, duration = 600, translateY = 20) => {
    const opacity = useSharedValue(0);
    const y = useSharedValue(translateY);

    useEffect(() => {
      opacity.value = withDelay(delay, withTiming(1, { duration }));
      y.value = withDelay(delay, withTiming(0, { duration, easing: Easing.out(Easing.ease) }));
    }, []);

    return useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: y.value }],
    }));
  };

  const heroLabelAnim = createFadeInAnimation(200);
  const heroTitleAnim = createFadeInAnimation(400, 1000, 30);
  const heroDescriptionAnim = createFadeInAnimation(800, 1000, 0);
  const heroScrollIndicatorAnim = createFadeInAnimation(2000, 1000, 0);

  const section1Anim = createFadeInAnimation(1000);
  const section2Anim = createFadeInAnimation(1400);
  const section3Anim = createFadeInAnimation(1800);
  const section4Anim = createFadeInAnimation(2200);

  return (
    <Animated.ScrollView
      style={styles.container}
      scrollEventThrottle={16}
      ref={scrollRef}
    >
      <View style={styles.heroSection}>
        <Animated.View style={[styles.heroBackground, heroAnimatedStyle]}>
          <View style={styles.heroOverlay} />
          <Image
            source={{
              uri: "https://plus.unsplash.com/premium_photo-1668472274328-cd239ae3586f?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjR8fGNhZmV0ZXJpYXxlbnwwfHwwfHx8MA%3D%3D",
            }}
            style={styles.heroImage}
          />
        </Animated.View>

        <View style={styles.heroContent}>
          <Animated.View style={heroLabelAnim}>
            <Text style={styles.sectionLabel}>Our Tradition</Text>
          </Animated.View>

          <Animated.View style={heroTitleAnim}>
            <Text style={styles.heroTitle}>
              The Heritage
              {"\n"}
              <Text style={styles.heroTitleItalic}>of Taste.</Text>
            </Text>
          </Animated.View>

          <Animated.View style={heroDescriptionAnim}>
            <Text style={styles.heroDescription}>
              A legacy forged in the perfect roast, where every bean tells a story of craftsmanship and ethical pursuit.
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.scrollIndicator, heroScrollIndicatorAnim]}>
          <Text style={styles.scrollText}>Our Story</Text>
          <View style={styles.scrollLine} />
        </Animated.View>
      </View>

      <View style={styles.mainContent}>
        <Animated.View style={[styles.section, styles.borderBottom, section1Anim]}>
          <View style={styles.contentWrapper}>
            <View style={[styles.gridContainer, isLargeScreen && styles.gridContainerLarge]}>
              <View style={styles.spaceY6}>
                <Text style={styles.sectionLabel}>A Chronicle of Coffee</Text>
                <Text style={styles.sectionTitle}>The Grand Master’s Tale</Text>
                <Text style={styles.textLgMuted}>
                  Founded on the belief that coffee is a ritual, not just a drink, The Grand Master began in a small, dedicated roasting lab. Our founder, a master roaster with decades of experience, sought to honor the bean’s origin above all else.
                </Text>
                <Text style={styles.textLgMuted}>
                  We believe the perfect roast is an art form—a meticulous balance between tradition and innovation. From sourcing directly from single-estate farms to custom-profiling each batch, every step is executed with precision and respect. This dedication ensures that the unique terroir of every bean is celebrated in your cup.
                </Text>
              </View>
              <View style={styles.imageContainer}>
                <Image
                  source={{
                    uri: "https://plus.unsplash.com/premium_photo-1667621221108-d9ff42adee84?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y29mZmVlJTIwZXF1aXBhbWVudHxlbnwwfHwwfHx8MA%3D%3D",
                  }}
                  style={styles.image}
                />
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, styles.borderBottom, section2Anim]}>
          <View style={[styles.contentWrapper, styles.textCenter, styles.mb16]}>
            <Text style={styles.sectionLabel}>Our Philosophy</Text>
            <Text style={styles.sectionTitle}>The Pillars of Excellence</Text>
          </View>
          <View style={[styles.contentWrapper, styles.gridContainer, isLargeScreen && styles.gridContainer3Cols]}>
            {[
              { icon: Scale, title: "Uncompromising Integrity", desc: "We adhere to the highest standards, from ethical sourcing to transparent business practices." },
              { icon: Compass, title: "Artisanal Precision", desc: "Every roast profile is meticulously crafted to honor the bean’s unique origin and flavor." },
              { icon: Target, title: "Sustainable Pursuit", desc: "Our direct-trade model ensures fair wages for farmers and environmentally conscious practices." },
            ].map((value, i) => (
              <View key={i} style={styles.valueCard}>
                <View style={styles.valueIconWrapper}>
                  <value.icon size={32} color="#6B4F4F" />
                </View>
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueDescription}>{value.desc}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, styles.borderBottom, section3Anim]}>
          <View style={[styles.contentWrapper, styles.gridContainer, isLargeScreen && styles.gridContainerLarge]}>
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: "https://media.istockphoto.com/id/1263570103/pt/foto/barista-in-smokey-roastery-landscape.webp?a=1&b=1&s=612x612&w=0&k=20&c=oJFCVASnwgreu_IL3pe_u4BA_0c6PrfP_O56RdwIVs=",
                }}
                style={styles.image}
              />
            </View>
            <View style={styles.spaceY6}>
              <Text style={styles.sectionLabel}>Meet the Artisans</Text>
              <Text style={styles.sectionTitle}>The Roasting Maestros</Text>
              <Text style={styles.textLgMuted}>
                Our team of dedicated roasters are more than technicians; they are artists with a profound understanding of coffee chemistry. Each batch is a testament to their expertise and unwavering commitment to quality.
              </Text>
              <View style={[styles.gridContainer, styles.gridContainer2Cols, styles.pt6]}>
                <View style={styles.flexStartGap3}>
                  <Award size={24} color="#6B4F4F" style={styles.mt1} />
                  <View>
                    <Text style={styles.h4semibold}>Award-Winning Expertise</Text>
                    <Text style={styles.textSmMuted}>Certified professionals in cupping and profile roasting.</Text>
                  </View>
                </View>
                <View style={styles.flexStartGap3}>
                  <Handshake size={24} color="#6B4F4F" style={styles.mt1} />
                  <View>
                    <Text style={styles.h4semibold}>Direct Trade Masters</Text>
                    <Text style={styles.textSmMuted}>Building lasting relationships with premium single-estate farms.</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, styles.bgMuted30, styles.borderBottom, section4Anim]}>
          <View style={[styles.contentWrapper, styles.textCenter, styles.mb16]}>
            <Text style={styles.sectionLabel}>Our Commitments</Text>
            <Text style={styles.sectionTitle}>Beyond the Bean</Text>
          </View>
          <View style={[styles.contentWrapper, styles.gridContainer, isLargeScreen && styles.gridContainer2Cols]}>
            {[
              { title: "Direct Trade Sustainability", desc: "By bypassing traditional intermediaries, we ensure farmers are paid a premium price, fostering sustainable agricultural practices and vibrant coffee communities.", image: "https://images.unsplash.com/photo-1596707328221-50e5616b3f71?auto=format&fit=crop&q=80&w=800" },
              { title: "Artisanal Freshness", desc: "Every order is small-batch roasted and shipped weekly, guaranteeing the peak freshness and complex flavor profiles of the original bean.", image: "https://images.unsplash.com/photo-1579737402927-995f50f75c6d?auto=format&fit=crop&q=80&w=800" },
            ].map((commitment, i) => (
              <View key={i} style={styles.commitmentCard}>
                <View style={styles.commitmentImageWrapper}>
                  <Image source={{ uri: commitment.image }} style={styles.commitmentImage} />
                </View>
                <View style={styles.commitmentTextContent}>
                  <Text style={styles.commitmentTitle}>{commitment.title}</Text>
                  <Text style={styles.commitmentDescription}>{commitment.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      <Footer />
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  contentWrapper: {
    maxWidth: 1120,
    marginHorizontal: "auto",
    paddingHorizontal: 16,
  },
  heroSection: {
    position: "relative",
    height: 700,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  heroBackground: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 10,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroContent: {
    position: "relative",
    zIndex: 10,
    textAlign: "center",
    paddingHorizontal: 16,
    maxWidth: 900,
    marginTop: 64,
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFD700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 24,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 32,
    lineHeight: 56,
    textAlign: "center",
  },
  heroTitleItalic: {
    color: "rgba(255, 255, 255, 0.9)",
    fontStyle: "italic",
  },
  heroDescription: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    maxWidth: 600,
    marginBottom: 48,
    fontWeight: "300",
    lineHeight: 28,
    textAlign: "center",
  },
  scrollIndicator: {
    position: "absolute",
    bottom: 40,
    left: "50%",
    transform: [{ translateX: -25 }],
    zIndex: 10,
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  scrollText: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
  },
  scrollLine: {
    width: 1,
    height: 48,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  mainContent: {
    position: "relative",
    zIndex: 20,
    backgroundColor: "#F9FAFB",
  },
  section: {
    paddingVertical: 96,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(229, 231, 235, 0.5)",
  },
  gridContainer: {
    flexDirection: "column",
    gap: 64,
    alignItems: "center",
  },
  gridContainerLarge: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridContainer3Cols: {
    flexDirection: "column",
    gap: 48,
  },
  gridContainer2Cols: {
    flexDirection: "column",
    gap: 24,
  },
  spaceY6: {
    gap: 24,
  },
  sectionTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 36,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 16,
  },
  textLgMuted: {
    fontSize: 18,
    color: "#6B7280",
    lineHeight: 28,
  },
  imageContainer: {
    position: "relative",
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  textCenter: {
    textAlign: "center",
    alignItems: "center",
  },
  mb16: {
    marginBottom: 64,
  },
  valueCard: {
    textAlign: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.5)",
    padding: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  valueIconWrapper: {
    width: 64,
    height: 64,
    marginBottom: 24,
    backgroundColor: "#F0EAD6",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  valueTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333333",
  },
  valueDescription: {
    color: "#6B7280",
    lineHeight: 24,
  },
  pt6: {
    paddingTop: 24,
  },
  flexStartGap3: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  mt1: {
    marginTop: 4,
  },
  h4semibold: {
    fontWeight: "600",
    color: "#333333",
  },
  textSmMuted: {
    fontSize: 14,
    color: "#6B7280",
  },
  bgMuted30: {
    backgroundColor: "rgba(243, 244, 246, 0.3)",
  },
  commitmentCard: {
    flexDirection: "column",
    gap: 32,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.5)",
    borderStyle: "dashed",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  commitmentImageWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexShrink: 0,
  },
  commitmentImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  commitmentTextContent: {
    gap: 12,
    textAlign: "center",
  },
  commitmentTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  commitmentDescription: {
    color: "#6B7280",
    lineHeight: 24,
  },
});