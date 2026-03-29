// login.tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { useAuth } from "@/src/hooks/use-auth";
import { useToast } from "@/src/hooks/usetoast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { toast } = useToast();

  useEffect(() => {
  if (params.signedUp === 'true') {
    toast({
      title: "Verifique seu e-mail",
      description: "Enviamos um link de ativação para sua conta. Você precisa ativar antes de fazer login.",
      variant: "default",
    });

    router.setParams({ signedUp: undefined });
  }
}, [params.signedUp]);

  const handleSubmit = async () => {
    if (!email || !password) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
      router.replace("/(tabs)");
    } catch (error) {
      toast({ title: "Erro", description: "E-mail ou senha inválidos ou conta inativa.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(600)} style={styles.cardContainer}>
          <View style={styles.header}>
            <Text style={styles.logo}>Grão Mestre</Text>
            <Text variant="headlineSmall" style={styles.title}>Bem-vindo de volta</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Entre com suas credenciais para acessar sua conta
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                mode="outlined"
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                outlineStyle={styles.inputOutline}
                style={styles.input}
                outlineColor="#e7e5e4"
                activeOutlineColor="#292524"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                mode="outlined"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                outlineStyle={styles.inputOutline}
                style={styles.input}
                outlineColor="#e7e5e4"
                activeOutlineColor="#292524"
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
              {/* Adicionado: Esqueceu a senha? */}
              <TouchableOpacity onPress={() => router.push("/forgotPassword")} style={styles.forgotPasswordLink}>
                <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            </View>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </View>

          <Animated.View entering={FadeIn.delay(400)} style={styles.footer}>
            <Text style={styles.footerText}>Não tem uma conta?</Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={styles.linkText}>Crie uma</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    padding: 24,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    fontFamily: "serif",
    fontSize: 32,
    fontWeight: "bold",
    color: "#1c1917",
    marginBottom: 16,
  },
  title: {
    fontWeight: "bold",
    color: "#1c1917",
    marginBottom: 8,
  },
  subtitle: {
    color: "#78716c",
    textAlign: "center",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#44403c",
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#ffffff",
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1,
  },
  forgotPasswordLink: { // Novo estilo para o link "Esqueceu a senha?"
    alignSelf: 'flex-end',
    marginTop: -4, // Ajuste para posicionar mais perto do input de senha
    marginBottom: 8,
  },
  forgotPasswordText: { // Novo estilo para o texto "Esqueceu a senha?"
    color: "#44403c",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  button: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#292524",
  },
  buttonContent: {
    height: 52,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    gap: 6,
  },
  footerText: {
    color: "#78716c",
    fontSize: 14,
  },
  linkText: {
    color: "#1c1917",
    fontWeight: "bold",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});