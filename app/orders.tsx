import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Text, Surface, Divider } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ShoppingBag,
  Clock,
  Minus,
  Plus,
  Trash2,
  CheckCircle,
  CreditCard,
  QrCode,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";

import { formatCurrency } from "@/src/lib/format";
import { ordersApi } from "@/src/lib/api";
import { OrderStatus, PaymentMethod } from "@/src/types";

const COLORS = {
  background: "#fdfbf9",
  cardBackground: "#ffffff",
  primaryText: "#1c1917",
  mutedText: "#78716c",
  brandBrown: "#9a6333",
  border: "#e7e5e4",
  success: "#16a34a",
  danger: "#dc2626",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  COMPLETED: "Concluído",
  PROCESSING: "Processando",
  SENDED: "Enviado",
  CANCELED: "Cancelado",
};

export default function OrdersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);

  const { data: pendingOrders, isLoading: isLoadingPending } = useQuery({
    queryKey: ["pendingOrders"],
    queryFn: async () => {
      const res = await ordersApi.getMyOrdersByStatus(OrderStatus.PENDING);
      return res.data;
    },
  });

  const pendingOrder = useMemo(() => 
    pendingOrders && pendingOrders.length > 0 ? pendingOrders[0] : null
  , [pendingOrders]);

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["orderHistory", page],
    queryFn: async () => {
      const res = await ordersApi.getMyOrderHistory({ page, size: 5 });
      return res.data;
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ orderId, orderItemId, quantity }: { orderId: number; orderItemId: number; quantity: number }) =>
      ordersApi.updateOrderItemQuantity(orderId, orderItemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingOrders"] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: ({ orderId, orderItemId }: { orderId: number; orderItemId: number }) =>
      ordersApi.removeItemFromOrder(orderId, orderItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingOrders"] });
    },
  });

  const finalizePaymentMutation = useMutation({
    mutationFn: ({ orderId, paymentMethod }: { orderId: number; paymentMethod: PaymentMethod }) =>
      ordersApi.finalizePayment(orderId, paymentMethod),
    onSuccess: (response) => {
      const checkoutUrl = (response.data as any).payment?.paymentUrl;

      if (checkoutUrl) {
        router.push({
          pathname: "/checkout-webview",
          params: { url: checkoutUrl }
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["pendingOrders"] });
        queryClient.invalidateQueries({ queryKey: ["orderHistory"] });
        router.replace({ pathname: "/payment-status", params: { status: 'success' } });
      }
    },
    onError: () => Alert.alert("Erro", "Falha ao processar o checkout."),
  });

  const handleFinalize = () => {
    if (!pendingOrder) return;
    finalizePaymentMutation.mutate({
      orderId: pendingOrder.id,
      paymentMethod: selectedPaymentMethod
    });
  };

  const cartTotal = useMemo(() => {
    return pendingOrder?.items?.reduce((acc, item) => acc + item.subtotal, 0) ?? 0;
  }, [pendingOrder]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Pedidos</Text>
        <Text style={styles.headerSubtitle}>Gestão de Grãos & Torras</Text>
      </View>

      <Surface style={styles.card} elevation={1}>
        <View style={styles.sectionHeader}>
          <ShoppingBag size={20} color={COLORS.brandBrown} />
          <Text style={styles.sectionTitle}>Carrinho Atual</Text>
        </View>

        {isLoadingPending ? (
          <ActivityIndicator color={COLORS.brandBrown} style={{ margin: 30 }} />
        ) : (pendingOrder?.items?.length ?? 0) > 0 ? (
          <View>
            {pendingOrder?.items.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemPrice}>{formatCurrency(item.priceAtTime)}</Text>
                </View>
                <View style={styles.qtyContainer}>
                  <TouchableOpacity 
                    onPress={() => item.quantity > 1 
                      ? updateQuantityMutation.mutate({ orderId: pendingOrder.id, orderItemId: item.id, quantity: item.quantity - 1 })
                      : removeItemMutation.mutate({ orderId: pendingOrder.id, orderItemId: item.id })
                    }
                  >
                    {item.quantity > 1 ? <Minus size={18} color={COLORS.brandBrown} /> : <Trash2 size={18} color={COLORS.danger} />}
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity 
                    onPress={() => updateQuantityMutation.mutate({ orderId: pendingOrder.id, orderItemId: item.id, quantity: item.quantity + 1 })}
                  >
                    <Plus size={18} color={COLORS.brandBrown} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Divider style={styles.divider} />

            <Text style={styles.methodLabel}>Método de Pagamento</Text>
            <View style={styles.methodRow}>
              <TouchableOpacity 
                style={[styles.methodBtn, selectedPaymentMethod === PaymentMethod.PIX && styles.methodBtnActive]}
                onPress={() => setSelectedPaymentMethod(PaymentMethod.PIX)}
              >
                <QrCode size={18} color={selectedPaymentMethod === PaymentMethod.PIX ? "#fff" : COLORS.brandBrown} />
                <Text style={[styles.methodBtnText, selectedPaymentMethod === PaymentMethod.PIX && { color: '#fff' }]}>PIX</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.methodBtn, selectedPaymentMethod === PaymentMethod.CREDIT_CARD && styles.methodBtnActive]}
                onPress={() => setSelectedPaymentMethod(PaymentMethod.CREDIT_CARD)}
              >
                <CreditCard size={18} color={selectedPaymentMethod === PaymentMethod.CREDIT_CARD ? "#fff" : COLORS.brandBrown} />
                <Text style={[styles.methodBtnText, selectedPaymentMethod === PaymentMethod.CREDIT_CARD && { color: '#fff' }]}>Cartão</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{formatCurrency(cartTotal)}</Text>
            </View>

            <TouchableOpacity 
              style={styles.finalizeBtn} 
              onPress={handleFinalize}
              disabled={finalizePaymentMutation.isPending}
            >
              {finalizePaymentMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <CheckCircle size={20} color="#fff" />
                  <Text style={styles.finalizeBtnText}>Finalizar Pagamento</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <ShoppingBag size={40} color={COLORS.mutedText} opacity={0.3} />
            <Text style={styles.emptyText}>Seu carrinho está vazio.</Text>
          </View>
        )}
      </Surface>

      <View style={styles.historyContainer}>
        <View style={styles.sectionHeader}>
          <Clock size={20} color={COLORS.brandBrown} />
          <Text style={styles.sectionTitle}>Histórico de Pedidos</Text>
        </View>

        {isLoadingHistory ? (
          <ActivityIndicator color={COLORS.brandBrown} />
        ) : (
          <View style={{ gap: 12 }}>
            {historyData?.content.map((order) => (
              <Surface key={order.id} style={styles.historyCard} elevation={1}>
                {/* Cabeçalho do Card */}
                <View style={styles.historyHeader}>
                  <View>
                    <Text style={styles.orderNumber}>Pedido #{order.id}</Text>
                    <View style={styles.historyDateRow}>
                      <Clock size={14} color={COLORS.mutedText} />
                      <Text style={styles.historyDate}>
                        {new Date(order.orderDate).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: order.orderStatus === 'PAID' ? '#f0fdf4' : '#f8f8f8' }, { backgroundColor: order.orderStatus === 'COMPLETED' ? '#c5f6d4' : '#f8f8f8' }]}>
                    <Text style={[styles.statusBadgeText, { color: order.orderStatus === 'PAID' ? COLORS.success : COLORS.brandBrown }, { color: order.orderStatus === 'COMPLETED' ? COLORS.success : COLORS.brandBrown }]}>
                      {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                    </Text>
                  </View>
                </View>

                <Divider style={styles.historyDivider} />

                {/* LISTA DE PRODUTOS (O que você pediu) */}
                <View style={styles.historyItemsList}>
                  {order.items.map((item) => (
                    <View key={item.id} style={styles.historyItemRow}>
                      <Text style={styles.historyItemText}>
                        <Text style={styles.historyItemQty}>{item.quantity}x</Text> {item.productName}
                      </Text>
                      <Text style={styles.historyItemSubtotal}>{formatCurrency(item.subtotal)}</Text>
                    </View>
                  ))}
                </View>

                <Divider style={styles.historyDivider} />

                {/* Rodapé do Card */}
                <View style={styles.historyFooter}>
                  <Text style={styles.totalLabelSmall}>Valor Total</Text>
                  <Text style={styles.historyTotal}>{formatCurrency(order.totalPrice)}</Text>
                </View>
              </Surface>
            ))}

            {historyData && historyData.totalPages > 1 && (
              <View style={styles.pagination}>
                <TouchableOpacity 
                  disabled={page === 0} 
                  onPress={() => setPage(p => p - 1)}
                  style={[styles.pageBtn, page === 0 && { opacity: 0.3 }]}
                >
                  <ChevronLeft size={20} color={COLORS.primaryText} />
                </TouchableOpacity>
                <Text style={styles.pageIndicator}>{page + 1} de {historyData.totalPages}</Text>
                <TouchableOpacity 
                  disabled={page >= historyData.totalPages - 1} 
                  onPress={() => setPage(p => p + 1)}
                  style={[styles.pageBtn, page >= historyData.totalPages - 1 && { opacity: 0.3 }]}
                >
                  <ChevronRight size={20} color={COLORS.primaryText} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 24, paddingTop: 40 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.primaryText, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  headerSubtitle: { fontSize: 13, color: COLORS.mutedText, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  card: { 
  margin: 16, 
  backgroundColor: '#fff', 
  borderRadius: 16, 
  padding: 20, 
  borderWidth: 1, // Corrigido de borderSize para borderWidth
  borderColor: COLORS.border 
},
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryText },
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  itemName: { fontSize: 16, fontWeight: '600', color: COLORS.primaryText },
  itemPrice: { fontSize: 14, color: COLORS.brandBrown, marginTop: 2 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fcfaf8', borderRadius: 8, padding: 6, gap: 12 },
  qtyText: { fontSize: 15, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  divider: { marginVertical: 20, opacity: 0.5 },
  methodLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.mutedText, textTransform: 'uppercase', marginBottom: 12 },
  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  methodBtn: { flex: 1, height: 48, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  methodBtnActive: { backgroundColor: COLORS.brandBrown, borderColor: COLORS.brandBrown },
  methodBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primaryText },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 16, color: COLORS.mutedText },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: COLORS.primaryText },
  finalizeBtn: { height: 56, backgroundColor: COLORS.primaryText, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  finalizeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', padding: 30 },
  emptyText: { marginTop: 10, color: COLORS.mutedText, fontSize: 14 },
  historyContainer: { padding: 16 },
  historyCard: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  historyHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  historyDateRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    marginTop: 4 
  },
  historyDivider: { 
    marginVertical: 12, 
    opacity: 0.4 
  },
  historyItemsList: { 
    gap: 8 
  },
  historyItemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  historyItemText: { 
    fontSize: 14, 
    color: COLORS.primaryText, 
    flex: 1 
  },
  historyItemQty: { 
    fontWeight: 'bold', 
    color: COLORS.brandBrown 
  },
  historyItemSubtotal: { 
    fontSize: 14, 
    color: COLORS.mutedText 
  },
  historyFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  totalLabelSmall: { 
    fontSize: 12, 
    color: COLORS.mutedText, 
    textTransform: 'uppercase' 
  },
  historyTotal: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.primaryText 
  },
  orderNumber: { fontWeight: 'bold', fontSize: 14, color: COLORS.primaryText },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
  historyDate: { fontSize: 13, color: COLORS.mutedText },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 10 },
  pageBtn: { padding: 10, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  pageIndicator: { fontWeight: 'bold', color: COLORS.mutedText }
});