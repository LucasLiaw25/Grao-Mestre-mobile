import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, Surface } from "react-native-paper";
import Animated, { 
  FadeInUp, 
  FadeIn, 
  createAnimatedComponent 
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Mail } from "lucide-react-native";
import { usersApi } from "@/src/lib/api";

const { width, height } = Dimensions.get("window");
const AnimatedTextInput = createAnimatedComponent(TextInput);

const COLORS = {
  background: "#F7F5F2",
  surface: "#F7F5F2",
  primaryText: "#292524",
  mutedText: "#78716C",
  accent: "#9A5B32",
  border: "#E7E5E4",
  white: "#FFFFFF",
};

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Atenção", "Por favor, insira seu e-mail.");
      return;
    }

    setIsLoading(true);
    try {
      await usersApi.requestPasswordReset(email);
      Alert.alert(
        "Link enviado!",
        "Se este e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha."
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um problema ao processar sua solicitação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.mainContainer}
    >
      {/* Botão de Voltar Minimalista */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft size={24} color={COLORS.primaryText} />
      </TouchableOpacity>

      <View style={styles.innerContainer}>
        {/* Header com animação fluida */}
        <Animated.View 
          entering={FadeInUp.duration(1000).springify()} 
          style={styles.headerContainer}
        >
          <Text style={styles.brandTitle}>Grão Mestre.</Text>
          <View style={styles.labelDivider} />
          <Text style={styles.subtitle}>REDEFINIR SENHA</Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.duration(1000).delay(200).springify()}
          style={styles.cardContainer}
        >
          <Surface style={styles.glassCard} elevation={1}>
            <Text style={styles.infoText}>
              Digite seu e-mail abaixo. Enviaremos um link exclusivo para você retomar seu acesso à nossa herança.
            </Text>

            <View style={styles.inputWrapper}>
              <View style={styles.iconInside}>
                <Mail size={18} color={COLORS.accent} />
              </View>
              <AnimatedTextInput
                entering={FadeIn.delay(400)}
                style={styles.input}
                placeholder="Ex: mestre@tradicao.com"
                placeholderTextColor={COLORS.mutedText}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.buttonPrimary, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "PROCESSANDO..." : "SOLICITAR ACESSO"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                Lembrou sua senha? <Text style={styles.linkHighlight}>Acessar conta</Text>
              </Text>
            </TouchableOpacity>
          </Surface>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  brandTitle: {
    fontFamily: Platform.OS === 'ios' ? "Georgia" : "serif",
    fontSize: 42,
    fontWeight: "700",
    color: COLORS.primaryText,
    letterSpacing: -1,
  },
  labelDivider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.accent,
    marginVertical: 12,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accent,
    letterSpacing: 3,
  },
  cardContainer: {
    width: "100%",
  },
  glassCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primaryText,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    fontStyle: 'italic',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  iconInside: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.primaryText,
  },
  buttonPrimary: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: COLORS.mutedText,
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  linkContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  linkText: {
    color: COLORS.mutedText,
    fontSize: 14,
  },
  linkHighlight: {
    color: COLORS.accent,
    fontWeight: "700",
    textDecorationLine: 'underline',
  },
});