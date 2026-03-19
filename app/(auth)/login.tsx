import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient"; // Para o efeito glass-card

const useAuth = () => ({
  login: async ({ email, password }: any) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === "admin@graomestre.com" && password === "password") {
          resolve({ success: true });
        } else {
          reject(new Error("Invalid credentials"));
        }
      }, 1500);
    });
  },
});

const useToast = () => ({
  toast: ({ title, description, variant }: any) => {
    Alert.alert(title, description); // Usando Alert como fallback simples para toast
  },
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation();
  const { toast } = useToast();

  // Animação para o card de login
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);

  React.useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 500 });
    cardTranslateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) });
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{ translateY: cardTranslateY.value }],
    };
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await login({ email, password });
      toast({ title: "Bem-vindo de volta!", description: "Você entrou com sucesso." });
      navigation.navigate("AdminDashboard" as never); // Redireciona para o dashboard
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Email ou senha inválidos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <Animated.View style={[styles.cardWrapper, animatedCardStyle]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.navigate("Home" as never)}>
                <Text style={styles.logoText}>Grão Mestre.</Text>
              </TouchableOpacity>
              <Text style={styles.subtitle}>Entre na sua conta</Text>
            </View>

            <LinearGradient
              colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.glassCard}
            >
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                   
                    value={email}
                    onChangeText={setEmail}
                    placeholder="seu@email.com"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Senha</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.footerTextContainer}>
              <Text style={styles.footerText}>
                Não tem uma conta?{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => navigation.navigate("Register" as never)} // Assumindo uma rota de registro
                >
                  Crie uma
                </Text>
              </Text>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F8F8", // Cor de fundo suave
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 380,
  },
  header: {
    textAlign: "center",
    marginBottom: 40,
    alignItems: "center",
  },
  logoText: {
    fontFamily: "serif", // Usando uma fonte serif para o toque old money
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    fontStyle: "italic",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
    fontFamily: "sans-serif",
  },
  glassCard: {
    borderRadius: 16,
    padding: 30,
    backgroundColor: "rgba(255, 255, 255, 0.15)", // Fundo semi-transparente
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)", // Borda mais clara
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    backdropFilter: "blur(10px)", // Efeito de blur para o glassmorphism (requer polyfill ou expo-blur)
    overflow: "hidden", // Garante que o gradiente não vaze
  },
  form: {
    width: "100%",
    gap: 20,
  },
  inputGroup: {
    width: "100%",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
    fontFamily: "sans-serif",
  },
  input: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FDFDFD",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    fontSize: 16,
    color: "#333",
    fontFamily: "sans-serif",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: "#007AFF", // Cor primária
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#A0C8FF", // Cor mais clara para desabilitado
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "sans-serif",
  },
  footerTextContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "sans-serif",
  },
  linkText: {
    color: "#007AFF",
    fontWeight: "600",
    fontFamily: "sans-serif",
  },
});