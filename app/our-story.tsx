import React from "react";
import { View, StyleSheet, Dimensions, Image } from "react-native";
import { Text, Surface } from 'react-native-paper';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolation,
  FadeInUp,
  FadeIn
} from "react-native-reanimated";
import { Scale, Compass, Target, Award, Handshake } from "lucide-react-native";
import { Footer } from "@/src/components/Footer";

const { width, height } = Dimensions.get("window");

const COLORS = {
  background: "#F7F5F2", 
  surface: "#F7F5F2",
  primaryText: "#292524", 
  mutedText: "#78716C", 
  accent: "#9A5B32", 
  iconBg: "#EAE4DD",
  border: "#E7E5E4",
};

export default function OurStory() {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          translateY: interpolate(scrollY.value, [0, height], [0, height * 0.4], Extrapolation.CLAMP) 
        }
      ],
      opacity: interpolate(scrollY.value, [0, height * 0.5], [1, 0], Extrapolation.CLAMP),
    };
  });

  return (
    <View style={styles.mainContainer}>
      <Animated.ScrollView 
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO SECTION */}
        <View style={styles.heroContainer}>
          <Animated.View style={[styles.heroImageWrapper, heroAnimatedStyle]}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?fm=jpg&q=60&w=3000&auto=format&fit=crop' }}
              style={styles.heroImage}
            />
            <View style={styles.heroOverlay} />
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(1000).delay(300)} style={styles.heroContent}>
            <Text style={styles.heroLabel}>Nossa Tradição</Text>
            <Text style={styles.heroTitle}>A Herança</Text>
            <Text style={styles.heroTitleItalic}>da Torra.</Text>
            <Text style={styles.heroSubtitle}>
              Um legado forjado na torra perfeita, onde cada grão conta uma história de artesanato e busca ética.
            </Text>
          </Animated.View>
        </View>

        <View style={styles.contentWrapper}>

          {/* JOURNEY SECTION */}
          <Animated.View entering={FadeInUp.duration(800).delay(200)} style={styles.section}>
            <Text style={styles.sectionLabel}>Uma Crônica do Café</Text>
            <Text style={styles.sectionTitle}>O Conto do Grande Mestre</Text>

            <Text style={styles.bodyText}>
              Fundado na crença de que o café é um ritual, não apenas uma bebida, o The Grand Master começou em um pequeno laboratório de torrefação dedicado. Nosso fundador, um mestre torrefador com décadas de experiência, buscava honrar a origem do grão acima de tudo.
            </Text>
            <Text style={[styles.bodyText, { marginTop: 16 }]}>
              Acreditamos que o torra perfeito é uma forma de arte—um equilíbrio meticuloso entre tradição e inovação. Desde a obtenção direta de fazendas de propriedade única até a personalização do perfil de cada lote, cada etapa é executada com precisão e respeito. Essa dedicação garante que o terroir único de cada grão seja celebrado em sua xícara.
            </Text>

            <Animated.Image
              entering={FadeIn.duration(1000).delay(400)}
              source={{ uri: 'https://plus.unsplash.com/premium_photo-1667621221108-d9ff42adee84?fm=jpg&q=60&w=800&auto=format&fit=crop' }}
              style={styles.journeyImage}
            />
          </Animated.View>

          {/* VALUES SECTION */}
          <Animated.View entering={FadeInUp.duration(800).delay(300)} style={styles.section}>
            <View style={styles.centerHeader}>
              <Text style={styles.sectionLabel}>Nossa Filosofia</Text>
              <Text style={styles.sectionTitle}>Os Pilares da Excelência</Text>
            </View>

            <View style={styles.valuesGrid}>
              {[
                { icon: Scale, title: "Integridade Inflexível", desc: "Nós aderimos aos mais altos padrões, desde a aquisição ética até práticas comerciais transparentes." },
                { icon: Compass, title: "Precisão Artesanal", desc: "Cada perfil de torra é meticulosamente elaborado para honrar a origem e o sabor únicos do grão." },
                { icon: Target, title: "Busca Sustentável", desc: "Nosso modelo de comércio direto garante salários justos para os agricultores e práticas ambientalmente conscientes." },
              ].map((value, i) => (
                <Surface key={i} style={styles.valueCard} elevation={0}>
                  <View style={styles.iconBox}>
                    <value.icon size={28} color={COLORS.accent} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.valueTitle}>{value.title}</Text>
                  <Text style={styles.valueDesc}>{value.desc}</Text>
                </Surface>
              ))}
            </View>
          </Animated.View>

          {/* MEET THE MASTERS SECTION */}
          <Animated.View entering={FadeInUp.duration(800).delay(400)} style={styles.section}>
            <Image
              source={{ uri: 'https://media.istockphoto.com/id/1263570103/pt/foto/barista-in-smokey-roastery-landscape.webp?a=1&b=1&s=612x612&w=0&k=20&c=oJFCVASnwgreu_ILl3pe_u4BA_0c6PrfP_O56RdwIVs=' }}
              style={styles.mastersImage}
            />
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Conheça os Artesãos</Text>
            <Text style={styles.sectionTitle}>Os Mestres da Torrefação</Text>
            <Text style={styles.bodyText}>
              Nossa equipe de torradores dedicados é mais do que técnicos; eles são artistas com um profundo entendimento da química do café. Cada lote é um testemunho de sua experiência e compromisso inabalável com a qualidade.
            </Text>

            <View style={styles.listContainer}>
              <View style={styles.listItem}>
                <Award size={24} color={COLORS.accent} style={styles.listIcon} />
                <View style={styles.listTextContainer}>
                  <Text style={styles.listTitle}>Especialização Premiada</Text>
                  <Text style={styles.listDesc}>Profissionais certificados em degustação e torra de perfil.</Text>
                </View>
              </View>
              <View style={styles.listItem}>
                <Handshake size={24} color={COLORS.accent} style={styles.listIcon} />
                <View style={styles.listTextContainer}>
                  <Text style={styles.listTitle}>Mestres do Comércio Direto</Text>
                  <Text style={styles.listDesc}>Construindo relacionamentos duradouros com fazendas de propriedade única premium.</Text>
                </View>
              </View>
            </View>
          </Animated.View>

        </View>

        <Footer />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroContainer: {
    height: height * 0.85,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroImageWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 25, 23, 0.5)',
  },
  heroContent: {
    zIndex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 40,
  },
  heroLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 24,
    opacity: 0.9,
  },
  heroTitle: {
    fontFamily: 'serif',
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 52,
  },
  heroTitleItalic: {
    fontFamily: 'serif',
    fontSize: 48,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 52,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  contentWrapper: {
    backgroundColor: COLORS.background,
    zIndex: 2,
    paddingTop: 40,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(231, 229, 228, 0.5)',
  },
  centerHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionLabel: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'serif',
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primaryText,
    marginBottom: 20,
    lineHeight: 38,
  },
  bodyText: {
    fontSize: 16,
    color: COLORS.mutedText,
    lineHeight: 26,
  },
  journeyImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    marginTop: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mastersImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  valuesGrid: {
    gap: 16,
  },
  valueCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(231, 229, 228, 0.6)',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.iconBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  valueTitle: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primaryText,
    marginBottom: 12,
    textAlign: 'center',
  },
  valueDesc: {
    fontSize: 14,
    color: COLORS.mutedText,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContainer: {
    marginTop: 24,
    gap: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listIcon: {
    marginTop: 2,
    marginRight: 16,
  },
  listTextContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primaryText,
    marginBottom: 4,
  },
  listDesc: {
    fontSize: 14,
    color: COLORS.mutedText,
    lineHeight: 20,
  },
});