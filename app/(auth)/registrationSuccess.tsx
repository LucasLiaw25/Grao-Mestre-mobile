import React from "react";
import { View, StyleSheet, Dimensions, Image } from "react-native";
import { Text, Surface } from 'react-native-paper';
import Animated, {
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import { CheckCircle, Mail, ArrowRight } from "lucide-react-native";
import { Footer } from "@/src/components/Footer"; 
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");


const COLORS = {
  background: "#F7F5F2", 
  surface: "#F7F5F2",
  primaryText: "#292524", 
  mutedText: "#78716C", 
  accent: "#9A5B32", 
  iconBg: "#EAE4DD", 
  border: "#E7E5E4",
  white: "#FFFFFF",
};

export default function RegistrationSuccess() {
    const router = useRouter();
  return (
    <View style={styles.mainContainer}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- HEADER SECTION (Adaptado de Sucess.tsx) --- */}
        <View style={styles.headerSection}>
          <Animated.View
            entering={FadeInUp.duration(800).delay(100)}
            style={styles.headerContent}
          >
            <Text style={styles.headerLabel}>Confirmação</Text>
            <Text style={styles.headerTitle}>
              Registro Concluído.
            </Text>
          </Animated.View>
        </View>

        {/* --- MAIN CONTENT SECTION (Adaptado de Sucess.tsx) --- */}
        <View style={styles.contentWrapper}>
          <Animated.View
            entering={FadeInUp.duration(800).delay(300)}
            style={styles.glassCard}
          >
            {/* ÍCONE DE SUCESSO */}
            <Animated.View
              entering={FadeIn.duration(1000).delay(500)}
              style={styles.iconBoxSuccess}
            >
              <Mail size={40} color={COLORS.accent} strokeWidth={1.5} />
            </Animated.View>

            <Text style={styles.cardTitle}>
              Verifique seu e-mail.
            </Text>

            <Text style={styles.cardSubtitle}>
              Enviamos um link de verificação para o seu endereço de e-mail.
              Por favor, clique no link para ativar sua conta e começar a explorar.
            </Text>

            {/* AÇÕES */}
            <Animated.View
              entering={FadeInUp.duration(800).delay(700)}
              style={styles.actionsContainer}
            >
         
              <Surface style={styles.buttonSecondary} elevation={0}>
                <Text onPress={() => router.push("/login")} style={styles.buttonSecondaryText}>
                  Ir para Login
                </Text>
                <ArrowRight size={18} color={COLORS.primaryText} style={{ marginLeft: 8 }} />
              </Surface>
            </Animated.View>

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

  headerSection: {
    paddingTop: height * 0.1, 
    paddingBottom: 48,
    backgroundColor: COLORS.surface, 
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  headerContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerLabel: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
    opacity: 0.9,
  },
  headerTitle: {
    fontFamily: 'serif',
    fontSize: 38,
    fontWeight: 'bold',
    color: COLORS.primaryText,
    textAlign: 'center',
    lineHeight: 44,
  },

  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: COLORS.background,
  },
  glassCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(231, 229, 228, 0.6)', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    maxWidth: 400, 
    width: '100%',
  },
  iconBoxSuccess: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.iconBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(154, 91, 50, 0.2)',
  },
  cardTitle: {
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primaryText,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 34,
  },
  cardSubtitle: {
    fontSize: 16,
    color: COLORS.mutedText,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 300,
  },

  actionsContainer: {
    flexDirection: 'column', 
    gap: 16,
    width: '100%',
  },
  buttonPrimary: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPrimaryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonSecondaryText: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});