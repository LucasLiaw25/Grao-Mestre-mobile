import { Navbar } from "@/src/components/Navbar";
import { AuthProvider, useAuth } from "@/src/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from "react-native-paper";

const queryClient = new QueryClient();

// Lista de rotas públicas que não exigem autenticação
const PUBLIC_ROUTES = [
  "index",
  "our-story",
  "products", // Assumindo que a lista de produtos é pública
  "login",
  "register",
  "forgotPassword",
  "registrationSuccess",
];

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const currentSegment = segments[0];
    const currentRouteName = segments[segments.length - 1];
    const isPublicRoute = PUBLIC_ROUTES.includes(currentRouteName);

    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/login");
    }
    else if (isAuthenticated && (currentRouteName === "login" || currentRouteName === "register" || currentRouteName === "forgotPassword" || currentRouteName === "registrationSuccess")) {
      router.replace("/(tabs)");
    }


  }, [isAuthenticated, segments, isLoading, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#292524" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* A Navbar só deve aparecer em rotas que não são de autenticação */}
      {isAuthenticated || PUBLIC_ROUTES.includes(segments[segments.length - 1]) ? <Navbar /> : null}

      <View style={styles.content}>
        <Stack screenOptions={{
          headerShown: false,
          headerTitleStyle: { fontFamily: 'serif' }
        }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="registrationSuccess" />
          <Stack.Screen name="forgotPassword" />
          <Stack.Screen name="changePassword" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="admin" />
          <Stack.Screen name="orders" />
          <Stack.Screen name="our-story" />
          <Stack.Screen name="product-detail" />
          <Stack.Screen name="products" />
          <Stack.Screen name="account" />
          <Stack.Screen name="checkout-webview" />
          <Stack.Screen name="payment-status" />
        </Stack>
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PaperProvider>
            <RootLayoutNav />
          </PaperProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});