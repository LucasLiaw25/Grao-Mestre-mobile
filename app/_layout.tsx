// app/_layout.tsx
import { AuthProvider } from "@/src/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack>
            {/* Rotas principais */}
            <Stack.Screen name="index" options={{ headerShown: false, title: 'Home' }} />
            <Stack.Screen name="login" options={{ headerShown: false, title: 'Login' }} />
            <Stack.Screen name="account" options={{ title: 'Minha Conta' }} />
            <Stack.Screen name="orders" options={{ title: 'Meus Pedidos' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="register" options={{ title: 'Criar Conta' }} />
            <Stack.Screen name="products" options={{ title: 'Produtos' }} />
            <Stack.Screen name="our-story" options={{ title: 'Nossa História' }} />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}