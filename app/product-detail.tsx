import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Image, Dimensions } from "react-native";
import { 
  Text, 
  Button, 
  IconButton, 
  ActivityIndicator, 
  Divider,
  Surface
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, ordersApi } from "@/src/lib/api";
import { ProductResponseDTO, OrderItemRequestDTO, OrderStatus, PaymentMethod } from "@/src/types";
import { formatCurrency } from "@/src/lib/format";
import { useAuth } from "@/src/hooks/use-auth";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // 1. Busca o produto
  const { data: product, isLoading } = useQuery<ProductResponseDTO>({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await productsApi.getById(Number(id));
      return response.data;
    },
  });

  const { data: pendingOrder } = useQuery({
  queryKey: ["pendingOrder", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        const response = await ordersApi.filter({ 
          userId: user.id, 
          status: OrderStatus.PENDING 
        });
        
        return response.data?.content?.[0] || null; 
      } catch (error) {
        console.error("Erro ao buscar pedido pendente:", error);
        return null;
      }
    },
    enabled: isAuthenticated && !!user?.id,
  });

  // 3. Mutations para Carrinho
  const createOrderMutation = useMutation({
    mutationFn: async (item: OrderItemRequestDTO) => {
      return (await ordersApi.create({
        paymentMethod: "PIX" as PaymentMethod,
        items: [item],
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingOrder", user?.id] });
      setIsAddingToCart(false);
      router.push("/products");
    }
  });

  const addItemToExistingOrderMutation = useMutation({
    mutationFn: async (data: { orderId: number; item: OrderItemRequestDTO }) => {
      return (await ordersApi.addItemToOrder(data.orderId, data.item)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingOrder", user?.id] });
      setIsAddingToCart(false);
      router.navigate("/products");
    }
  });

  const handleAddToCart = async () => {
    if (!product || !isAuthenticated) {
      router.push("/login");
      return;
    }

    setIsAddingToCart(true);
    const orderItem: OrderItemRequestDTO = { productId: Number(id), quantity };

    if (pendingOrder) {
      addItemToExistingOrderMutation.mutate({ orderId: pendingOrder.id, item: orderItem });
    } else {
      createOrderMutation.mutate(orderItem);
    }
  };

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator animating={true} color="#9A5B32" size="large" />
      </View>
    );
  }

  if (!product) return null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={styles.imageContainer} elevation={0}>
          <Image 
            source={{ uri: product.imageUrl || 'https://via.placeholder.com/400' }} 
            style={styles.image}
            resizeMode="cover"
          />
          <IconButton
            icon="arrow-left"
            mode="contained"
            containerColor="rgba(255,255,255,0.9)"
            style={styles.backButton}
            onPress={() => router.back()}
          />
        </Surface>

        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text variant="headlineSmall" style={styles.title}>{product.name}</Text>
              <Text variant="labelMedium" style={styles.category}>{product.category?.name}</Text>
            </View>
            <Text variant="headlineSmall" style={styles.price}>
              {formatCurrency(product.price)}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <Text variant="bodyLarge" style={styles.description}>
            {product.description || "Este café especial do Grão Mestre traz notas únicas e um aroma inconfundível."}
          </Text>

          <View style={styles.quantitySection}>
            <Text variant="titleMedium" style={styles.serifText}>Quantidade</Text>
            <View style={styles.stepper}>
              <IconButton 
                icon="minus" 
                mode="outlined" 
                size={20} 
                onPress={handleDecrement}
                disabled={quantity <= 1 || isAddingToCart}
              />
              <Text variant="titleLarge" style={styles.quantityText}>{quantity}</Text>
              <IconButton 
                icon="plus" 
                mode="outlined" 
                size={20} 
                onPress={handleIncrement}
                disabled={isAddingToCart}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* RODAPÉ AJUSTADO: Subtotal e Botão mais elevados para Safe Area */}
      <Surface style={styles.footer} elevation={5}>
        <View style={styles.footerContent}>
          <View>
            <Text variant="labelSmall" style={styles.totalLabel}>Subtotal</Text>
            <Text variant="titleLarge" style={styles.totalValue}>
              {formatCurrency(product.price * quantity)}
            </Text>
          </View>
          <Button 
            mode="contained" 
            onPress={handleAddToCart} 
            loading={isAddingToCart}
            disabled={isAddingToCart}
            style={styles.buyButton}
            labelStyle={styles.buyButtonLabel}
            buttonColor="#2C2826"
            icon="shopping-outline"
          >
            {isAddingToCart ? "A adicionar..." : "Adicionar"}
          </Button>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5F2' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 140 }, // Aumentado para não cobrir conteúdo
  imageContainer: { width: width, height: width * 1.1, backgroundColor: '#E5E0D8' },
  image: { width: '100%', height: '100%' },
  backButton: { position: 'absolute', top: 50, left: 20 },
  infoContainer: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, backgroundColor: '#FFFFFF' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: 'serif', fontWeight: 'bold', color: '#2C2826' },
  category: { color: '#9A5B32', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4, fontWeight: '600' },
  price: { color: '#2C2826', fontWeight: 'bold' },
  divider: { marginVertical: 24, backgroundColor: '#F7F5F2' },
  description: { color: '#8A847D', lineHeight: 26, fontSize: 16 },
  quantitySection: { marginTop: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serifText: { fontFamily: 'serif', fontWeight: 'bold', color: '#2C2826' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  quantityText: { minWidth: 30, textAlign: 'center', fontWeight: 'bold', color: '#2C2826' },
  
  // AJUSTE DO RODAPÉ (UX/UI)
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    paddingHorizontal: 24, 
    paddingTop: 20,
    paddingBottom: 40, // Aumentado para elevar o botão acima da barra de navegação/gestos
    backgroundColor: '#FFFFFF', 
    borderTopWidth: 1, 
    borderTopColor: '#E5E0D8',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  footerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#8A847D', textTransform: 'uppercase', letterSpacing: 1 },
  totalValue: { fontWeight: 'bold', color: '#2C2826', fontSize: 22 },
  buyButton: { borderRadius: 14, paddingHorizontal: 8 },
  buyButtonLabel: { fontSize: 16, fontWeight: 'bold', paddingVertical: 6 }
});