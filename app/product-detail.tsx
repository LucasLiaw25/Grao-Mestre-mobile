import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  Layout,
} from "react-native-reanimated"; // Usando reanimated para animações
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, ordersApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import {
  type ProductResponseDTO,
  type PaymentMethod,
  type OrderResponseDTO,
  type OrderItemRequestDTO,
  OrderStatus,
} from "@/types";
import AntDesign from "react-native-vector-icons/AntDesign"; // Exemplo de ícones

// Cores e fontes baseadas no estilo "old money"
const Colors = {
  primary: "#4A4A4A", // Um cinza escuro sofisticado
  secondary: "#D4AF37", // Dourado sutil
  background: "#F5F5DC", // Bege claro (creme)
  foreground: "#333333", // Texto principal
  mutedForeground: "#6B7280", // Texto secundário
  border: "#D1D5DB", // Borda sutil
  muted: "#E5E7EB", // Fundo para elementos mutados
  destructive: "#EF4444", // Vermelho para erros
};

const Fonts = {
  serif: "Georgia", // Exemplo de fonte serifada
  sans: "Helvetica Neue", // Exemplo de fonte sans-serif
};

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id: string };
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const productId = parseInt(id || "0");

  const showToast = (title: string, description: string, variant?: string) => {
    Alert.alert(title, description); // Usando Alert para simular toast
  };

  // Fetch Product Details
  const {
    data: product,
    isLoading,
    error,
  } = useQuery<ProductResponseDTO>({
    queryKey: ["products", productId],
    queryFn: async () => (await productsApi.getById(productId)).data,
    enabled: !!productId,
  });

  // Fetch User's Pending Order (Cart)
  const { data: pendingOrder, isLoading: isLoadingPendingOrder } = useQuery<
    OrderResponseDTO | undefined
  >({
    queryKey: ["pendingOrder", user?.id],
    queryFn: async () => {
      if (!user?.id) return undefined;
      const response = await ordersApi.filter({
        userId: user.id,
        status: OrderStatus.PENDING,
      });
      return response.data?.content?.[0] || undefined;
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Mutation para criar um novo pedido (se não houver um PENDING)
  const createOrderMutation = useMutation({
    mutationFn: async (item: OrderItemRequestDTO) => {
      const response = await ordersApi.create({
        paymentMethod: "PIX" as PaymentMethod,
        items: [item],
      });
      return response.data;
    },
    onSuccess: (newOrder) => {
      showToast("Product added!", "A new order has been started.");
      queryClient.invalidateQueries({ queryKey: ["pendingOrder", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setIsAddingToCart(false);
    },
    onError: (err) => {
      console.error("Error creating order:", err);
      showToast(
        "Error",
        "Failed to start new order. Please try again.",
        "destructive"
      );
      setIsAddingToCart(false);
    },
  });

  // Mutation para adicionar/atualizar item em um pedido existente
  const addItemToExistingOrderMutation = useMutation({
    mutationFn: async (data: { orderId: number; item: OrderItemRequestDTO }) => {
      const response = await ordersApi.addItemToOrder(data.orderId, data.item);
      return response.data;
    },
    onSuccess: (updatedOrder) => {
      showToast("Product added!", "Item added to your existing order.");
      queryClient.invalidateQueries({ queryKey: ["pendingOrder", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setIsAddingToCart(false);
    },
    onError: (err) => {
      console.error("Error adding item to order:", err);
      showToast(
        "Error",
        "Failed to add item to order. Please try again.",
        "destructive"
      );
      setIsAddingToCart(false);
    },
  });

  const handleAddToCart = async () => {
    if (!product || !isAuthenticated || !user?.id) {
      showToast(
        "Error",
        "Please log in to add products to your cart.",
        "destructive"
      );
      navigation.navigate("Login"); // Assumindo que você tem uma rota 'Login'
      return;
    }

    setIsAddingToCart(true);

    const orderItem: OrderItemRequestDTO = {
      productId: productId,
      quantity: quantity,
    };

    if (pendingOrder) {
      addItemToExistingOrderMutation.mutate({
        orderId: pendingOrder.id,
        item: orderItem,
      });
    } else {
      createOrderMutation.mutate(orderItem);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Product not found</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Products")}
          style={styles.errorButton}
        >
          <AntDesign name="left" size={16} color={Colors.foreground} />
          <Text style={styles.errorButtonText}>Back to Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Animated.View entering={FadeIn.delay(100).duration(500)}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <AntDesign name="left" size={20} color={Colors.mutedForeground} />
          <Text style={styles.backButtonText}>Back to Products</Text>
        </TouchableOpacity>
      </Animated.View>

      {isLoading || isLoadingPendingOrder ? (
        <View style={styles.loadingContainer}>
          <View style={styles.imagePlaceholder} />
          <View style={styles.detailsPlaceholder}>
            <View style={styles.titlePlaceholder} />
            <View style={styles.pricePlaceholder} />
            <View style={styles.descriptionPlaceholder} />
            <View style={styles.descriptionPlaceholder} />
          </View>
        </View>
      ) : product ? (
        <View style={styles.productDetailContent}>
          <Animated.View
            entering={FadeIn.delay(200).duration(600)}
            style={styles.imageWrapper}
          >
            {product.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {product.category.name}
                </Text>
              </View>
            )}
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(300).duration(700)}
            style={styles.detailsWrapper}
          >
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>
              {formatCurrency(product.price)}
            </Text>

            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.productDescription}>
                {product.description}
              </Text>
            </View>

            <View style={styles.infoGrid}>
              <View>
                <Text style={styles.infoGridLabel}>In Stock</Text>
                <Text style={styles.infoGridValue}>
                  {product.storage > 0 ? product.storage : "Out of stock"}
                </Text>
              </View>
              <View>
                <Text style={styles.infoGridLabel}>Added</Text>
                <Text style={styles.infoGridValue}>
                  {new Date(product.registerDate).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <View style={styles.quantityControl}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                <View style={styles.quantityButtons}>
                  <TouchableOpacity
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    style={[
                      styles.quantityButton,
                      quantity <= 1 && styles.disabledButton,
                    ]}
                  >
                    <AntDesign name="minus" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    onPress={() => setQuantity(quantity + 1)}
                    disabled={quantity >= product.storage}
                    style={[
                      styles.quantityButton,
                      quantity >= product.storage && styles.disabledButton,
                    ]}
                  >
                    <AntDesign name="plus" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleAddToCart}
                disabled={product.storage <= 0 || isAddingToCart}
                style={[
                  styles.addToCartButton,
                  (product.storage <= 0 || isAddingToCart) &&
                    styles.disabledAddToCartButton,
                ]}
              >
                {isAddingToCart ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <AntDesign name="shoppingcart" size={20} color="#FFFFFF" />
                    <Text style={styles.addToCartButtonText}>Add to Cart</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.stockMessage}>
                {product.storage > 0
                  ? `${product.storage} items available`
                  : "Out of stock"}
              </Text>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.mutedForeground,
  },
  loadingContainer: {
    flexDirection: "column",
    gap: 24,
  },
  imagePlaceholder: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: Colors.muted,
    borderRadius: 16,
  },
  detailsPlaceholder: {
    gap: 16,
  },
  titlePlaceholder: {
    height: 32,
    backgroundColor: Colors.muted,
    borderRadius: 4,
    width: "75%",
  },
  pricePlaceholder: {
    height: 24,
    backgroundColor: Colors.muted,
    borderRadius: 4,
    width: "30%",
  },
  descriptionPlaceholder: {
    height: 16,
    backgroundColor: Colors.muted,
    borderRadius: 4,
    width: "100%",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.foreground,
    marginBottom: 16,
    textAlign: "center",
  },
  errorButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "transparent",
  },
  errorButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.foreground,
    marginLeft: 8,
  },
  productDetailContent: {
    gap: 24,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(245, 245, 220, 0.8)", // background com opacidade
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  categoryBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.foreground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  detailsWrapper: {
    gap: 16,
  },
  productName: {
    fontFamily: Fonts.serif,
    fontSize: 40,
    fontWeight: "bold",
    color: Colors.foreground,
    marginBottom: 8,
  },
  productPrice: {
    fontFamily: Fonts.sans,
    fontSize: 28,
    fontWeight: "600",
    color: Colors.secondary,
    marginBottom: 16,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.foreground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  productDescription: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.mutedForeground,
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  infoGridLabel: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    fontWeight: "500",
    color: Colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoGridValue: {
    fontFamily: Fonts.sans,
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.foreground,
  },
  actionsContainer: {
    marginTop: 24,
    gap: 24,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quantityLabel: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.foreground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quantityButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 8,
  },
  quantityButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: "transparent",
  },
  disabledButton: {
    opacity: 0.5,
  },
  quantityText: {
    fontFamily: Fonts.sans,
    width: 32,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
    color: Colors.foreground,
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledAddToCartButton: {
    backgroundColor: Colors.mutedForeground,
    opacity: 0.7,
  },
  addToCartButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  stockMessage: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.mutedForeground,
    textAlign: "center",
  },
});