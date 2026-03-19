import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Package,
  Clock,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  CheckCircle,
  Loader2,
} from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, {
  Layout,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { ordersApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format"; // Adapte para RN se necessário
import { OrderResponseDTO, OrderStatus } from "@/types";
import { useToast } from "@/hooks/use-toast"; // Assumindo que você tem um hook de toast adaptado para RN
import { useNavigation } from "@react-navigation/native"; // Para navegação em React Native

const getTailwindStyles = (tailwindString: string) => {
  const styles: any = {};
  const parts = tailwindString.split(" ");

  parts.forEach((part) => {
    if (part.startsWith("bg-")) {
      const color = part.replace("bg-", "");
      if (color === "background") styles.backgroundColor = "#ffffff";
      else if (color === "muted/30") styles.backgroundColor = "rgba(245,245,244,0.3)"; // Assuming muted is stone-100
      else if (color === "primary") styles.backgroundColor = "#292524"; // stone-800
      else if (color === "yellow-100") styles.backgroundColor = "#fefce8";
      else if (color === "yellow-800") styles.backgroundColor = "#92400e";
      else if (color === "blue-100") styles.backgroundColor = "#dbeafe";
      else if (color === "blue-800") styles.backgroundColor = "#1e40af";
      else if (color === "green-100") styles.backgroundColor = "#d1fae5";
      else if (color === "green-800") styles.backgroundColor = "#065f46";
      else if (color === "indigo-100") styles.backgroundColor = "#e0e7ff";
      else if (color === "indigo-800") styles.backgroundColor = "#3730a3";
      else if (color === "red-100") styles.backgroundColor = "#fee2e2";
      else if (color === "red-800") styles.backgroundColor = "#991b1b";
      else if (color === "muted") styles.backgroundColor = "#f5f5f4";
      else if (color === "destructive/10") styles.backgroundColor = "rgba(239,68,68,0.1)";
    } else if (part.startsWith("text-")) {
      const color = part.replace("text-", "");
      if (color === "foreground") styles.color = "#0c0a09"; // stone-950
      else if (color === "muted-foreground") styles.color = "#78716c"; // stone-500
      else if (color === "primary") styles.color = "#292524";
      else if (color === "yellow-800") styles.color = "#92400e";
      else if (color === "blue-800") styles.color = "#1e40af";
      else if (color === "green-800") styles.color = "#065f46";
      else if (color === "indigo-800") styles.color = "#3730a3";
      else if (color === "red-800") styles.color = "#991b1b";
      else if (color === "destructive") styles.color = "#ef4444";
    } else if (part.startsWith("border-")) {
      const color = part.replace("border-", "");
      if (color === "border/50") styles.borderColor = "rgba(229,231,235,0.5)"; // Assuming border is stone-200
      else if (color === "border/30") styles.borderColor = "rgba(229,231,235,0.3)";
    } else if (part.startsWith("px-")) {
      styles.paddingHorizontal = parseInt(part.replace("px-", "")) * 4;
    } else if (part.startsWith("py-")) {
      styles.paddingVertical = parseInt(part.replace("py-", "")) * 4;
    } else if (part.startsWith("p-")) {
      styles.padding = parseInt(part.replace("p-", "")) * 4;
    } else if (part.startsWith("pt-")) {
      styles.paddingTop = parseInt(part.replace("pt-", "")) * 4;
    } else if (part.startsWith("pb-")) {
      styles.paddingBottom = parseInt(part.replace("pb-", "")) * 4;
    } else if (part.startsWith("mb-")) {
      styles.marginBottom = parseInt(part.replace("mb-", "")) * 4;
    } else if (part.startsWith("mt-")) {
      styles.marginTop = parseInt(part.replace("mt-", "")) * 4;
    } else if (part.startsWith("gap-")) {
      styles.gap = parseInt(part.replace("gap-", "")) * 4;
    } else if (part.startsWith("w-")) {
      styles.width = parseInt(part.replace("w-", "")) * 4;
    } else if (part.startsWith("h-")) {
      styles.height = parseInt(part.replace("h-", "")) * 4;
    } else if (part.startsWith("rounded-")) {
      if (part === "rounded-xl") styles.borderRadius = 12;
      else if (part === "rounded-full") styles.borderRadius = 9999;
    } else if (part === "flex") styles.display = "flex";
    else if (part === "flex-col") styles.flexDirection = "column";
    else if (part === "flex-row") styles.flexDirection = "row";
    else if (part === "items-center") styles.alignItems = "center";
    else if (part === "items-start") styles.alignItems = "flex-start";
    else if (part === "justify-between") styles.justifyContent = "space-between";
    else if (part === "justify-center") styles.justifyContent = "center";
    else if (part === "flex-1") styles.flex = 1;
    else if (part === "text-center") styles.textAlign = "center";
    else if (part === "text-sm") styles.fontSize = 14;
    else if (part === "text-xs") styles.fontSize = 12;
    else if (part === "text-lg") styles.fontSize = 18;
    else if (part === "text-xl") styles.fontSize = 20;
    else if (part === "text-2xl") styles.fontSize = 24;
    else if (part === "font-bold") styles.fontWeight = "700";
    else if (part === "font-semibold") styles.fontWeight = "600";
    else if (part === "font-medium") styles.fontWeight = "500";
    else if (part === "font-serif") styles.fontFamily = Platform.OS === "ios" ? "Georgia" : "serif";
    else if (part === "opacity-50") styles.opacity = 0.5;
    else if (part === "last:border-b-0") styles.lastBorderB0 = {}; // Not directly translatable, needs custom logic
    else if (part === "last:pb-0") styles.lastPb0 = {}; // Not directly translatable
    else if (part === "disabled:opacity-50") styles.disabledOpacity50 = { opacity: 0.5 };
    else if (part === "disabled:cursor-not-allowed") styles.disabledCursorNotAllowed = {}; // Not directly translatable
    else if (part === "hover:bg-muted") styles.hoverBgMuted = { backgroundColor: "#f5f5f4" };
    else if (part === "hover:bg-destructive/10") styles.hoverBgDestructive10 = { backgroundColor: "rgba(239,68,68,0.1)" };
    else if (part === "section-label") styles.sectionLabel = { fontSize: 12, fontWeight: "600", color: "#78716c", textTransform: "uppercase", letterSpacing: 1 };
    else if (part === "section-title") styles.sectionTitle = { fontSize: 30, fontWeight: "700", fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", color: "#0c0a09", marginTop: 4 };
    else if (part === "glass-card") styles.glassCard = {
      backgroundColor: "rgba(255,255,255,0.6)",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(229,231,235,0.5)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 4,
    };
  });

  return StyleSheet.create(styles);
};

export default function Orders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigation = useNavigation();

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
    COMPLETED: "bg-green-100 text-green-800",
    SENDED: "bg-indigo-100 text-indigo-800",
    CANCELED: "bg-red-100 text-red-800",
    RECUSE: "bg-red-100 text-red-800",
  };

  const { data: pendingOrder, isLoading: isLoadingPendingOrder } = useQuery<OrderResponseDTO | undefined>({
    queryKey: ["pendingOrder"],
    queryFn: async () => {
      const response = await ordersApi.getMyOrdersByStatus("PENDING" as OrderStatus);
      return response.data.length > 0 ? response.data[0] : undefined;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: orderHistory, isLoading: isLoadingOrderHistory } = useQuery<OrderResponseDTO[]>({
    queryKey: ["orderHistory"],
    queryFn: async () => {
      const response = await ordersApi.getMyOrderHistory();
      const allOrders = response.data;
      return allOrders.filter(order => order.orderStatus !== "PENDING");
    },
    staleTime: 5 * 60 * 1000,
  });

  const removeItemMutation = useMutation({
    mutationFn: ({ orderId, orderItemId }: { orderId: number; orderItemId: number }) =>
      ordersApi.removeItemFromOrder(orderId, orderItemId),
    onSuccess: () => {
      toast({ title: "Item Removido", description: "Produto removido do seu carrinho." });
      queryClient.invalidateQueries({ queryKey: ["pendingOrder"] });
      queryClient.invalidateQueries({ queryKey: ["orderHistory"] });
    },
    onError: (err) => {
      console.error("Erro ao remover item:", err);
      toast({ title: "Erro", description: "Falha ao remover item. Tente novamente.", variant: "destructive" });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ orderId, orderItemId, quantity }: { orderId: number; orderItemId: number; quantity: number }) =>
      ordersApi.updateOrderItemQuantity(orderId, orderItemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingOrder"] });
    },
    onError: (err) => {
      console.error("Erro ao atualizar quantidade:", err);
      toast({ title: "Erro", description: "Falha ao atualizar quantidade. Tente novamente.", variant: "destructive" });
    },
  });

  const finalizeOrderMutation = useMutation({
    mutationFn: (orderId: number) =>
      ordersApi.updateOrderStatus(orderId, OrderStatus.PROCESSING),
    onSuccess: () => {
      toast({ title: "Pedido Realizado!", description: "Seu pedido foi realizado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["pendingOrder"] });
      queryClient.invalidateQueries({ queryKey: ["orderHistory"] });
      navigation.navigate("Orders");
    },
    onError: (err) => {
      console.error("Erro ao finalizar pedido:", err);
      toast({ title: "Erro", description: "Falha ao finalizar pedido. Tente novamente.", variant: "destructive" });
    },
  });

  const handleRemoveItem = (orderId: number, orderItemId: number) => {
    removeItemMutation.mutate({ orderId, orderItemId });
  };

  const handleUpdateQuantity = (orderId: number, orderItemId: number, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) {
      handleRemoveItem(orderId, orderItemId);
    } else {
      updateQuantityMutation.mutate({ orderId, orderItemId, quantity: newQuantity });
    }
  };

  const handleFinalizeOrder = () => {
    if (pendingOrder && pendingOrder.id) {
      finalizeOrderMutation.mutate(pendingOrder.id);
    } else {
      toast({ title: "Erro", description: "Nenhum item no seu carrinho para finalizar.", variant: "destructive" });
    }
  };

  const isLoadingAny = isLoadingPendingOrder || isLoadingOrderHistory;

  return (
    <SafeAreaView style={getTailwindStyles("min-h-screen bg-background").minHScreen}>
      <ScrollView>
        <View style={getTailwindStyles("pt-28 pb-12 bg-muted/30 border-b border-border/50").pt28}>
          <View style={getTailwindStyles("max-w-4xl mx-auto px-4 sm:px-6 lg:px-8").px4}>
            <Animated.View entering={FadeIn.duration(400).delay(0)}>
              <Text style={getTailwindStyles("section-label").sectionLabel}>Minha Conta</Text>
              <Text style={getTailwindStyles("section-title").sectionTitle}>Meus Pedidos</Text>
            </Animated.View>
          </View>
        </View>

        <View style={getTailwindStyles("py-16").py16}>
          <View style={getTailwindStyles("max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12").px4}>
            <Animated.View
              entering={FadeIn.duration(400).delay(100)}
              style={getTailwindStyles("glass-card p-6").glassCard}
            >
              <Text style={getTailwindStyles("font-serif text-2xl font-bold text-foreground mb-6 flex flex-row items-center gap-2").fontSerif}>
                <ShoppingBag size={24} color={getTailwindStyles("", "text-primary").color} /> Seu Carrinho
              </Text>

              {isLoadingPendingOrder ? (
                <View style={getTailwindStyles("h-24 bg-muted animate-pulse rounded-xl").h24} />
              ) : pendingOrder && pendingOrder.items && pendingOrder.items.length > 0 ? (
                <View style={getTailwindStyles("space-y-4").spaceY4}>
                  {pendingOrder.items.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        getTailwindStyles("flex flex-row items-center justify-between pb-4").flex,
                        index < pendingOrder.items.length - 1 && getTailwindStyles("border-b border-border/50").borderB,
                        index === pendingOrder.items.length - 1 && getTailwindStyles("last:border-b-0 last:pb-0").lastBorderB0,
                      ]}
                    >
                      <View style={getTailwindStyles("flex-1").flex1}>
                        <Text style={getTailwindStyles("font-medium text-foreground").fontMedium}>{item.productName}</Text>
                        <Text style={getTailwindStyles("text-sm text-muted-foreground").textSm}>{formatCurrency(item.priceAtTime)} cada</Text>
                      </View>
                      <View style={getTailwindStyles("flex flex-row items-center gap-3").flex}>
                        <TouchableOpacity
                          onPress={() => handleUpdateQuantity(pendingOrder.id, item.id, item.quantity, -1)}
                          disabled={removeItemMutation.isPending || updateQuantityMutation.isPending}
                          style={getTailwindStyles("p-1 rounded transition-colors disabled:opacity-50").p1}
                        >
                          <Minus size={16} color={getTailwindStyles("", "text-foreground").color} />
                        </TouchableOpacity>
                        <Text style={getTailwindStyles("w-8 text-center font-semibold text-foreground").w8}>{item.quantity}</Text>
                        <TouchableOpacity
                          onPress={() => handleUpdateQuantity(pendingOrder.id, item.id, item.quantity, 1)}
                          disabled={removeItemMutation.isPending || updateQuantityMutation.isPending}
                          style={getTailwindStyles("p-1 rounded transition-colors disabled:opacity-50").p1}
                        >
                          <Plus size={16} color={getTailwindStyles("", "text-foreground").color} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRemoveItem(pendingOrder.id, item.id)}
                          disabled={removeItemMutation.isPending || updateQuantityMutation.isPending}
                          style={getTailwindStyles("p-1 rounded text-destructive hover:bg-destructive/10").p1}
                        >
                          <Trash2 size={16} color={getTailwindStyles("", "text-destructive").color} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  <View style={getTailwindStyles("flex flex-row justify-between items-center pt-4 border-t border-border/50").flex}>
                    <Text style={getTailwindStyles("text-lg font-bold text-foreground").textLg}>Total:</Text>
                    <Text style={getTailwindStyles("text-2xl font-bold text-primary").text2xl}>{formatCurrency(pendingOrder.totalPrice)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleFinalizeOrder}
                    disabled={finalizeOrderMutation.isPending || pendingOrder.items.length === 0}
                    style={getTailwindStyles("w-full mt-6 gap-2 flex flex-row items-center justify-center p-4 rounded-xl bg-primary disabled:opacity-50").wFull}
                  >
                    {finalizeOrderMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <CheckCircle size={20} color="#fff" />
                        <Text style={getTailwindStyles("text-white text-lg font-bold").textWhite}>Finalizar Pedido</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={getTailwindStyles("text-center py-10").textCenter}>
                  <ShoppingBag size={64} color={getTailwindStyles("", "text-muted-foreground").color} style={getTailwindStyles("mx-auto mb-6 opacity-50").mxAuto} />
                  <Text style={getTailwindStyles("text-xl text-muted-foreground font-serif").textXl}>Seu carrinho está vazio.</Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Products")} style={getTailwindStyles("mt-6 p-4 rounded-xl bg-primary").mt6}>
                    <Text style={getTailwindStyles("text-white text-lg font-bold").textWhite}>Começar a Comprar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>

            <Animated.View
              entering={FadeIn.duration(400).delay(200)}
              style={getTailwindStyles("glass-card p-6").glassCard}
            >
              <Text style={getTailwindStyles("font-serif text-2xl font-bold text-foreground mb-6 flex flex-row items-center gap-2").fontSerif}>
                <Clock size={24} color={getTailwindStyles("", "text-muted-foreground").color} /> Histórico de Pedidos
              </Text>

              {isLoadingOrderHistory ? (
                [1, 2].map((i) => (
                  <View key={i} style={getTailwindStyles("h-32 bg-muted animate-pulse rounded-xl mb-4").h32} />
                ))
              ) : orderHistory && orderHistory.length > 0 ? (
                <View style={getTailwindStyles("space-y-6").spaceY6}>
                  {orderHistory.map((order, i) => (
                    <Animated.View
                      key={order.id}
                      entering={FadeIn.duration(400).delay(i * 50)}
                      layout={Layout.springify()}
                      style={getTailwindStyles("border border-border/50 rounded-xl p-4 bg-background").border}
                    >
                      <View style={getTailwindStyles("flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3").flex}>
                        <View>
                          <Text style={getTailwindStyles("text-sm text-muted-foreground").textSm}>Pedido #{order.id}</Text>
                          <Text style={getTailwindStyles("text-xs text-muted-foreground flex flex-row items-center gap-1 mt-1").textXs}>
                            <Clock size={12} color={getTailwindStyles("", "text-muted-foreground").color} />
                            {new Date(order.orderDate).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={getTailwindStyles("flex flex-row items-center gap-3").flex}>
                          <Text style={getTailwindStyles(`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[order.orderStatus] || "bg-muted text-muted-foreground"}`).px3}>
                            {order.orderStatus}
                          </Text>
                          <Text style={getTailwindStyles("text-lg font-bold text-foreground").textLg}>{formatCurrency(order.totalPrice)}</Text>
                        </View>
                      </View>
                      <View style={getTailwindStyles("border-t border-border/30 pt-3 space-y-1").borderT}>
                        {order.items.map((item) => (
                          <View key={item.id} style={getTailwindStyles("flex flex-row justify-between text-sm").flex}>
                            <Text style={getTailwindStyles("text-foreground").textForeground}>{item.productName} × {item.quantity}</Text>
                            <Text style={getTailwindStyles("text-muted-foreground").textMutedForeground}>{formatCurrency(item.subtotal)}</Text>
                          </View>
                        ))}
                      </View>
                    </Animated.View>
                  ))}
                </View>
              ) : (
                <View style={getTailwindStyles("text-center py-10").textCenter}>
                  <Package size={64} color={getTailwindStyles("", "text-muted-foreground").color} style={getTailwindStyles("mx-auto mb-6 opacity-50").mxAuto} />
                  <Text style={getTailwindStyles("text-xl text-muted-foreground font-serif").textXl}>Nenhum pedido anterior encontrado.</Text>
                </View>
              )}
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}