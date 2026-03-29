import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { Sidebar } from "@/src/components/Sidebar";
import { useAuth } from "@/src/hooks/use-auth"; 

export default function AdminLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const isAdmin = user?.scopes?.some(s => s.name === "ADMIN");

  useEffect(() => {

    if (!isLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.replace("/login"); 
      }
    }
  }, [user, isLoading, isAuthenticated]);

  if (isLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c1917" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <View style={styles.container}>
          <Sidebar />
          <View style={styles.content}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="dashboard" options={{ title: "Visão Geral" }} />
              <Stack.Screen name="users" options={{ title: "Usuários" }} />
              <Stack.Screen name="categories" options={{ title: "Categorias" }} />
              <Stack.Screen name="products" options={{ title: "Produtos" }} />
              <Stack.Screen name="orders" options={{ title: "Pedidos Admin" }} />
              <Stack.Screen name="reports" options={{ title: "Relatórios" }} />
              <Stack.Screen name="expenses" options={{ title: "Despesas" }} />
            </Stack>
          </View>
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 90 : 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  }
});