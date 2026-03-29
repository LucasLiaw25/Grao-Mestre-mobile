import React, { useState, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, ViewStyle, KeyboardAvoidingView, Platform } from "react-native";
import { Text, TextInput, Button, HelperText } from "react-native-paper";
import { useRouter } from "expo-router";
import Animated, { FadeInUp, FadeIn, Layout, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { usersApi } from "@/src/lib/api";
import { useToast } from "@/src/hooks/usetoast";
import { UserRegisterRequestDTO } from "@/src/types";

export default function Register() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "Vazio", color: "#e7e5e4", width: "0%" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { score: 1, label: "Muito Fraca", color: "#ef4444", width: "25%" },
      { score: 2, label: "Fraca", color: "#f97316", width: "50%" },
      { score: 3, label: "Média", color: "#eab308", width: "75%" },
      { score: 4, label: "Forte", color: "#22c55e", width: "100%" },
    ];
    return levels[score - 1] || levels[0];
  }, [password]);

  const animatedStrengthStyle = useAnimatedStyle((): ViewStyle => {
    return {
      width: withTiming(passwordStrength.width as any), // O 'as any' aqui evita o conflito de DimensionValue
      backgroundColor: withTiming(passwordStrength.color),
    };
  });

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");

    const limited = cleaned.slice(0, 11);

    if (limited.length <= 2) return limited;
    if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    if (limited.length <= 10) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  };

  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const limited = cleaned.slice(0, 11);

    if (limited.length <= 3) return limited;
    if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
  };

  const isValidPhone = (phoneValue: string) => {
    const cleaned = phoneValue.replace(/\D/g, "");
    return cleaned.length === 11; 
  };

  const isValidCpf = (cpfValue: string) => {
    const cleaned = cpfValue.replace(/\D/g, "");
    if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(10, 11))) return false;

    return true;
  };
  
  const passwordsMatch = confirmPassword === "" || password === confirmPassword;

  const handleRegister = async () => {
    if (!email || !name || !phone || !cpf || !password) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }

    if (!isValidCpf(cpf)) {
      toast({ title: "Erro", description: "CPF inválido.", variant: "destructive" });
      return;
    }

    if (!isValidPhone(phone)) {
      toast({ title: "Erro", description: "Telefone inválido. Insira DDD + 9 dígitos.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }

    if (passwordStrength.score < 3) {
      toast({ title: "Senha Fraca", description: "Aumente a segurança da sua senha.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const cleanCpf = cpf.replace(/\D/g, "");

      const userData: UserRegisterRequestDTO = { 
        email, 
        name, 
        phone: cleanPhone, 
        cpf: cleanCpf,     
        password 
      };

      await usersApi.create(userData);

      toast({
        title: "Conta criada!",
        description: "Um código de ativação foi enviado para seu e-mail."
      });

      router.replace("/registrationSuccess");
    } catch (error: any) {
      toast({
        title: "Erro no Cadastro",
        description: error.response?.data?.message || "Tente novamente.",
        variant: "destructive"
      });
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
            <Text variant="headlineSmall" style={styles.title}>Criar Conta</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>Junte-se à nossa experiência de cafés especiais</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                mode="outlined"
                placeholder="Ex: João Silva"
                value={name}
                onChangeText={setName}
                outlineStyle={styles.inputOutline}
                style={styles.input}
                activeOutlineColor="#292524"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                mode="outlined"
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                outlineStyle={styles.inputOutline}
                style={styles.input}
                activeOutlineColor="#292524"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CPF</Text>
              <TextInput
                mode="outlined"
                placeholder="000.000.000-00"
                value={cpf}
                onChangeText={(text) => setCpf(formatCpf(text))}
                keyboardType="numeric"
                outlineStyle={styles.inputOutline}
                style={styles.input}
                activeOutlineColor="#292524"
                returnKeyType="done"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone</Text>
              <TextInput
                mode="outlined"
                placeholder="(11) 99999-9999"
                value={phone}
                onChangeText={(text) => setPhone(formatPhone(text))}
                keyboardType="phone-pad"
                outlineStyle={styles.inputOutline}
                style={styles.input}
                activeOutlineColor="#292524"
                returnKeyType="done"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                mode="outlined"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                outlineStyle={styles.inputOutline}
                style={styles.input}
                activeOutlineColor="#292524"
                right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
              />
              {password.length > 0 && (
                <Animated.View layout={Layout} style={styles.strengthWrapper}>
                  <View style={styles.strengthBarBackground}>
                    <Animated.View
                      style={[styles.strengthBarInside, animatedStrengthStyle]}
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
                </Animated.View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Senhas</Text>
              <TextInput
                mode="outlined"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={!passwordsMatch}
                outlineStyle={styles.inputOutline}
                style={styles.input}
                activeOutlineColor={passwordsMatch ? "#292524" : "#ef4444"}
              />
              {!passwordsMatch && (
                <HelperText type="error" visible={!passwordsMatch}>As senhas não coincidem</HelperText>
              )}
            </View>

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading || !passwordsMatch}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {isLoading ? "Criando..." : "Criar Conta"}
            </Button>
          </View>

          <Animated.View entering={FadeIn.delay(400)} style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta?</Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.linkText}>Faça login</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#ffffff", padding: 24, paddingTop: 60 },
  cardContainer: { width: "100%", maxWidth: 400, alignSelf: "center" },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { fontFamily: 'serif', fontSize: 32, fontWeight: "bold", color: "#1c1917", marginBottom: 8 },
  title: { fontWeight: "bold", color: "#1c1917" },
  subtitle: { color: "#78716c", textAlign: "center", marginTop: 4 },
  form: { gap: 18 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: "#44403c", marginLeft: 4 },
  input: { backgroundColor: "#ffffff" },
  inputOutline: { borderRadius: 12 },
  button: { marginTop: 12, borderRadius: 12, backgroundColor: "#292524" },
  buttonContent: { height: 52 },
  buttonLabel: { fontSize: 16, fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 30, gap: 6 },
  footerText: { color: "#78716c", fontSize: 14 },
  linkText: { color: "#1c1917", fontWeight: "bold", textDecorationLine: "underline" },
  strengthWrapper: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  strengthBarBackground: { flex: 1, backgroundColor: '#e7e5e4', borderRadius: 2, height: 4, overflow: 'hidden' },
  strengthBarInside: { height: '100%' },
  strengthText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', width: 80, textAlign: 'right' }
});