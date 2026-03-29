import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Text, Surface } from "react-native-paper";
import Animated, {
  FadeInUp,
  FadeIn,
  createAnimatedComponent,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { usersApi } from "@/src/lib/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, Lock } from "lucide-react-native";

const { width } = Dimensions.get("window");
const AnimatedTextInput = createAnimatedComponent(TextInput);

const COLORS = {
  background: "#F7F5F2",
  surface: "#F7F5F2",
  primaryText: "#292524",
  mutedText: "#78716C",
  accent: "#9A5B32",
  border: "#E7E5E4",
  white: "#FFFFFF",
  error: "#EF4444",
};

const STRENGTH_COLORS = {
  0: COLORS.border,
  1: "#EF4444", 
  2: "#F97316", 
  3: "#EAB308", 
  4: "#22C55E",
};

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();

  const token = route.params?.token;

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      Alert.alert("Erro", "Token de redefinição de senha não encontrado.");
    }
  }, [token]);

  const passwordStrength = useMemo(() => {
    if (!newPassword) {
      return { score: 0, label: "Vazio", color: STRENGTH_COLORS[0], width: 0 };
    }

    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    const levels = [
      { score: 1, label: "Muito Fraca", color: STRENGTH_COLORS[1], width: 25 },
      { score: 2, label: "Fraca", color: STRENGTH_COLORS[2], width: 50 },
      { score: 3, label: "Média", color: STRENGTH_COLORS[3], width: 75 },
      { score: 4, label: "Forte", color: STRENGTH_COLORS[4], width: 100 },
    ];

    return levels[score - 1] || levels[0];
  }, [newPassword]);

  const strengthBarStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(`${passwordStrength.width}%`, { duration: 500 }),
      backgroundColor: withTiming(passwordStrength.color, { duration: 500 }),
    };
  });

  const handleSubmit = async () => {
    if (!isTokenValid || !token) {
      Alert.alert("Erro", "Token inválido ou ausente.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert("Atenção", "As senhas não coincidem.");
      return;
    }

    if (passwordStrength.score < 3) {
      Alert.alert(
        "Senha fraca",
        "A senha deve ter 8+ caracteres, uma letra maiúscula, um número e um caractere especial."
      );
      return;
    }

    setIsLoading(true);
    try {
      await usersApi.updatePasswordWithToken(token, newPassword);
      Alert.alert(
        "Sucesso!",
        "Sua senha foi redefinida com sucesso. Faça login com a nova senha."
      );
      navigation.navigate("Login" as never);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Não foi possível redefinir sua senha. O link pode ter expirado ou ser inválido.";
      Alert.alert("Erro", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isTokenValid) {
    return (
      <View style={styles.mainContainer}>
        <View style={styles.innerContainer}>
          <Text style={styles.brandTitle}>Link Inválido</Text>
          <Text style={styles.infoText}>
            Por favor, solicite um novo link de redefinição de senha.
          </Text>
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={() => navigation.navigate("ForgotPassword" as never)}
          >
            <Text style={styles.buttonText}>SOLICITAR NOVA SENHA</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.mainContainer}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft size={24} color={COLORS.primaryText} />
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInUp.duration(1000).springify()}
          style={styles.headerContainer}
        >
          <Text style={styles.brandTitle}>Grão Mestre.</Text>
          <View style={styles.labelDivider} />
          <Text style={styles.subtitle}>NOVA SENHA</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(1000).delay(200).springify()}
          style={styles.cardContainer}
        >
          <Surface style={styles.glassCard} elevation={1}>

            {/* Campo Nova Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nova Senha</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.iconInside}>
                  <Lock size={18} color={COLORS.accent} />
                </View>
                <AnimatedTextInput
                  entering={FadeIn.delay(400)}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.mutedText}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  editable={!isLoading}
                />
              </View>

              {/* Barra de Força da Senha */}
              {newPassword.length > 0 && (
                <Animated.View entering={FadeIn} style={styles.strengthContainer}>
                  <View style={styles.strengthHeader}>
                    <Text style={styles.strengthLabelText}>FORÇA</Text>
                    <Text style={[styles.strengthValueText, { color: passwordStrength.color }]}>
                      {passwordStrength.label}
                    </Text>
                  </View>
                  <View style={styles.strengthBarBackground}>
                    <Animated.View style={[styles.strengthBarFill, strengthBarStyle]} />
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Campo Confirmar Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Nova Senha</Text>
              <View style={[
                styles.inputWrapper, 
                confirmNewPassword && newPassword !== confirmNewPassword ? styles.inputError : null
              ]}>
                <View style={styles.iconInside}>
                  <Lock size={18} color={COLORS.accent} />
                </View>
                <AnimatedTextInput
                  entering={FadeIn.delay(500)}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.mutedText}
                  secureTextEntry
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  editable={!isLoading}
                />
              </View>
              {confirmNewPassword.length > 0 && newPassword !== confirmNewPassword && (
                <Animated.Text entering={FadeIn} style={styles.errorText}>
                  As senhas precisam ser iguais
                </Animated.Text>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.buttonPrimary, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "REDEFININDO..." : "REDEFINIR SENHA"}
              </Text>
            </TouchableOpacity>

          </Surface>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 60,
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    alignItems: "center",
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
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
    textAlign: "center",
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
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primaryText,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.error,
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
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  strengthContainer: {
    marginTop: 12,
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  strengthLabelText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.mutedText,
    letterSpacing: 1,
  },
  strengthValueText: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  strengthBarBackground: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 2,
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
    marginTop: 8,
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
});