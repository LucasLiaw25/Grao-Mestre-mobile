import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import {
  Text,
  Surface,
  ActivityIndicator,
  TextInput,
  Modal,
  Portal,
  Button,
  Divider,
} from "react-native-paper";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, formatISO } from "date-fns";
import {
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  Eye,
  Edit,
  User,
  Calendar,
  CreditCard,
  Package,
  X,
  Send,
  Ban,
} from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { MotiView } from "moti";

import { ordersApi, usersApi, financialReportsApi } from "@/src/lib/api";
import { formatCurrency } from "@/src/lib/format";
import {
  OrderStatus,
  TimePeriod,
  OrderResponseDTO,
  PageableResponse,
  UserResponseDTO,
} from "@/src/types";

const { width } = Dimensions.get("window");

const STATUS_CONFIG = {
  [OrderStatus.PENDING]: { label: "Pendente", bg: "#fef3c7", text: "#b45309", icon: Clock },
  [OrderStatus.PROCESSING]: { label: "Processando", bg: "#e0e7ff", text: "#3730a3", icon: RefreshCw },
  [OrderStatus.PAID]: { label: "Pago", bg: "#d1fae5", text: "#047857", icon: CheckCircle2 },
  [OrderStatus.COMPLETED]: { label: "Concluído", bg: "#dcfce7", text: "#15803d", icon: CheckCircle2 },
  [OrderStatus.SENDED]: { label: "Enviado", bg: "#cffafe", text: "#0f766e", icon: Send },
  [OrderStatus.CANCELED]: { label: "Cancelado", bg: "#fee2e2", text: "#b91c1c", icon: XCircle },
  [OrderStatus.RECUSE]: { label: "Recusado", bg: "#ffe4e6", text: "#be123c", icon: Ban },
};

const PERIODS = [
  { value: "ALL", label: "Todo período" },
  { value: TimePeriod.TODAY, label: "Hoje" },
  { value: TimePeriod.YESTERDAY, label: "Ontem" },
  { value: TimePeriod.THIS_WEEK, label: "Esta semana" },
  { value: TimePeriod.THIS_MONTH, label: "Este mês" },
  { value: "CUSTOM", label: "Personalizado" },
];

function getTodayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

function calculateDateRange(period: TimePeriod) {
  let start: Date | undefined;
  let end: Date | undefined;
  const now = new Date();

  switch (period) {
    case TimePeriod.TODAY:
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case TimePeriod.YESTERDAY:
      start = startOfDay(subDays(now, 1));
      end = endOfDay(subDays(now, 1));
      break;
    case TimePeriod.THIS_WEEK:
      start = startOfWeek(now, { weekStartsOn: 0 }); // 0 para Domingo, 1 para Segunda-feira
      end = endOfWeek(now, { weekStartsOn: 0 });
      break;
    case TimePeriod.THIS_MONTH:
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    // Adicione outros períodos conforme necessário
    default:
      break;
  }

  return {
    startDate: start ? formatISO(start) : undefined,
    endDate: end ? formatISO(end) : undefined,
  };
}

export default function AdminOrdersScreen() {
  const queryClient = useQueryClient();

  const [periodFilter, setPeriodFilter] = useState<TimePeriod | "ALL" | "CUSTOM">("ALL");
  const [customStart, setCustomStart] = useState(getTodayStr());
  const [customEnd, setCustomEnd] = useState(getTodayStr());
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [userIdFilter, setUserIdFilter] = useState<number | "ALL">("ALL");
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [page, setPage] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDTO | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const isCustom = periodFilter === "CUSTOM";
  const customPeriodStartDate = isCustom && customStart ? customStart : undefined;
  const customPeriodEndDate = isCustom && customEnd ? customEnd : undefined;

  const filterParams = useMemo(() => {
    const params: any = { page, size: 20, sort: "orderDate,desc" };
    if (statusFilter !== "ALL") params.status = statusFilter;
    if (userIdFilter !== "ALL") params.userId = userIdFilter;

    let currentStartDate = customPeriodStartDate;
    let currentEndDate = customPeriodEndDate;

    if (periodFilter !== "ALL" && periodFilter !== "CUSTOM") {
      const { startDate, endDate } = calculateDateRange(periodFilter as TimePeriod);
      currentStartDate = startDate;
      currentEndDate = endDate;
    }

    if (currentStartDate) params.startDate = currentStartDate;
    if (currentEndDate) params.endDate = currentEndDate;

    return params;
  }, [statusFilter, periodFilter, customPeriodStartDate, customPeriodEndDate, userIdFilter, page]);

  const { data: ordersPage, isLoading } = useQuery<PageableResponse<OrderResponseDTO>>({
    queryKey: ["admin-orders", filterParams],
    queryFn: async () => (await ordersApi.filter(filterParams)).data,
  });

  const { data: users } = useQuery<UserResponseDTO[]>({
    queryKey: ["users-list"],
    queryFn: async () => (await usersApi.getAll()).data,
  });

  const { data: metrics } = useQuery({
    queryKey: ["orders-metrics", periodFilter, customPeriodStartDate, customPeriodEndDate],
    queryFn: async () => {
      let start = customPeriodStartDate;
      let end = customPeriodEndDate;

      if (periodFilter !== "ALL" && periodFilter !== "CUSTOM") {
        const { startDate, endDate } = calculateDateRange(periodFilter as TimePeriod);
        start = startDate;
        end = endDate;
      }
      return (await financialReportsApi.getFinancialSummary(periodFilter as TimePeriod, start, end)).data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => ordersApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-metrics"] });
      setIsEditModalOpen(false);
    },
  });

  const filteredOrders = useMemo(() => {
    let list = ordersPage?.content || [];
    if (orderIdSearch.trim()) {
      list = list.filter(o => o.id.toString().includes(orderIdSearch.trim()));
    }
    return list;
  }, [ordersPage, orderIdSearch]);

  const clearFilters = () => {
    setPeriodFilter("ALL");
    setStatusFilter("ALL");
    setUserIdFilter("ALL");
    setOrderIdSearch("");
    setCustomStart(getTodayStr()); // Reset custom dates to today
    setCustomEnd(getTodayStr());   // Reset custom dates to today
    setPage(0);
  };

  const handleUpdateStatus = (status: OrderStatus) => {
    if (selectedOrder) {
      updateStatusMutation.mutate({ id: selectedOrder.id, status });
    }
  };

  const openView = (order: OrderResponseDTO) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const openEdit = (order: OrderResponseDTO) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const metricsData = [
    { key: 'pending', label: "Pendentes", value: metrics?.pendingOrders || 0, icon: Clock, color: "#b45309", bg: "#fefce8", border: "#fef08a" },
    { key: 'processing', label: "Processando", value: metrics?.processingOrders || 0, icon: RefreshCw, color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
    { key: 'completed', label: "Concluídos", value: metrics?.completedOrders || 0, icon: CheckCircle2, color: "#047857", bg: "#ecfdf5", border: "#a7f3d0" },
    { key: 'canceled', label: "Cancelados", value: metrics?.canceledOrders || 0, icon: XCircle, color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
  ];

  return (
    <View style={styles.container}>
      <Animated.ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} entering={FadeIn.duration(600)}>

        <Animated.View style={styles.header} entering={FadeInDown.duration(600)}>
          <Text style={styles.title}>Gestão de Pedidos</Text>
          <Text style={styles.subtitle}>{ordersPage?.totalElements || 0} pedidos encontrados</Text>
        </Animated.View>

        <View style={styles.metricsGrid}>
          {metricsData.map((m, i) => (
            <MotiView
              key={m.key}
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: i * 100 }}
              style={{ width: (width - 44) / 2 }}
            >
              <Surface style={[styles.metricCard, { backgroundColor: m.bg, borderColor: m.border, width: '100%' }]} elevation={0}>
                <View style={styles.metricHeader}>
                  <m.icon size={16} color={m.color} />
                  <Text style={[styles.metricLabel, { color: m.color }]}>{m.label}</Text>
                </View>
                <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
              </Surface>
            </MotiView>
          ))}
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 400 }}
        >
          <Surface style={styles.filterSection} elevation={0}>
            <Text style={styles.filterTitle}><Calendar size={14} color="#78716c" /> PERÍODO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {PERIODS.map(p => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.chip, periodFilter === p.value && styles.chipActive]}
                  onPress={() => { setPeriodFilter(p.value as any); setPage(0); }}
                >
                  <Text style={[styles.chipText, periodFilter === p.value && styles.chipTextActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isCustom && (
              <View style={styles.customDateRow}>
                <TextInput mode="outlined" label="Início (YYYY-MM-DD)" value={customStart} onChangeText={setCustomStart} style={styles.dateInput} activeOutlineColor="#292524" />
                <TextInput mode="outlined" label="Fim (YYYY-MM-DD)" value={customEnd} onChangeText={setCustomEnd} style={styles.dateInput} activeOutlineColor="#292524" />
              </View>
            )}

            <Divider style={styles.divider} />

            <Text style={styles.filterTitle}><Filter size={14} color="#78716c" /> STATUS DO PEDIDO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              <TouchableOpacity
                style={[styles.chip, statusFilter === "ALL" && styles.chipActive]}
                onPress={() => { setStatusFilter("ALL"); setPage(0); }}
              >
                <Text style={[styles.chipText, statusFilter === "ALL" && styles.chipTextActive]}>Todos</Text>
              </TouchableOpacity>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, statusFilter === key && styles.chipActive]}
                  onPress={() => { setStatusFilter(key as OrderStatus); setPage(0); }}
                >
                  <config.icon size={14} color={statusFilter === key ? "#ffffff" : config.text} />
                  <Text style={[styles.chipText, statusFilter === key && styles.chipTextActive]}>{config.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Divider style={styles.divider} />

            <View style={styles.searchRow}>
              <View style={styles.searchCol}>
                <Text style={styles.filterTitle}><User size={14} color="#78716c" /> FILTRAR POR USUÁRIO</Text>
                <TouchableOpacity style={styles.dropdownBtn} onPress={() => setIsUserModalOpen(true)}>
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>
                    {userIdFilter === "ALL" ? "Todos os usuários" : users?.find(u => u.id === userIdFilter)?.name || "Selecionado"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.searchCol}>
                <Text style={styles.filterTitle}><Search size={14} color="#78716c" /> BUSCAR POR ID</Text>
                <TextInput
                  mode="outlined"
                  placeholder="Ex: 1042"
                  value={orderIdSearch}
                  onChangeText={setOrderIdSearch}
                  style={styles.searchInput}
                  activeOutlineColor="#292524"
                  outlineStyle={{ borderRadius: 12 }}
                />
              </View>
            </View>

            {(statusFilter !== "ALL" || periodFilter !== "ALL" || userIdFilter !== "ALL" || orderIdSearch !== "") && (
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Limpar Filtros</Text>
              </TouchableOpacity>
            )}
          </Surface>
        </MotiView>

        {isLoading ? (
          <ActivityIndicator size="large" color="#292524" style={styles.loader} />
        ) : filteredOrders.length === 0 ? (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <View style={styles.emptyState}>
              <Package size={48} color="#d6d3d1" />
              <Text style={styles.emptyTitle}>Nenhum pedido encontrado</Text>
              <Text style={styles.emptySubtitle}>Tente ajustar os filtros acima.</Text>
            </View>
          </MotiView>
        ) : (
          <View style={styles.listContainer}>
            {filteredOrders.map((order, index) => {
              const statusConf = STATUS_CONFIG[order.orderStatus];
              return (
                <MotiView
                  key={order.id}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 400, delay: 300 + (index * 60) }}
                >
                  <Surface style={styles.orderCard} elevation={0}>
                    <View style={styles.cardHeader}>
                      <View style={styles.idRow}>
                        <Text style={styles.orderId}>#{order.id}</Text>
                        <View style={styles.paymentBadge}>
                          <CreditCard size={12} color="#44403c" />
                          <Text style={styles.paymentText}>{order.paymentMethod.replace('_', ' ')}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}>
                        <Text style={[styles.statusText, { color: statusConf.text }]}>{statusConf.label}</Text>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.clientName} numberOfLines={1}>{order.userEmail}</Text>
                      <Text style={styles.orderDate}>{format(new Date(order.orderDate), "dd/MM/yyyy 'às' HH:mm")}</Text>

                      <View style={styles.detailsGrid}>
                        <View style={styles.detailBox}>
                          <Text style={styles.detailLabel}>TOTAL DO PEDIDO</Text>
                          <Text style={styles.detailValue}>{formatCurrency(order.totalPrice)}</Text>
                        </View>
                        <View style={styles.detailBox}>
                          <Text style={styles.detailLabel}>QUANTIDADE</Text>
                          <Text style={styles.detailValue}>{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}>
                        <Text style={[styles.statusText, { color: statusConf.text }]}>{statusConf.label}</Text>
                      </View>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => openView(order)}>
                          <Eye size={20} color="#44403c" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(order)}>
                          <Edit size={20} color="#2563eb" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Surface>
                </MotiView>
              );
            })}
          </View>
        )}

        {ordersPage && ordersPage.totalPages > 1 && (
          <View style={styles.pagination}>
            <Button disabled={page === 0} onPress={() => setPage(p => p - 1)}>Anterior</Button>
            <Text style={styles.pageText}>{page + 1} de {ordersPage.totalPages}</Text>
            <Button disabled={page >= ordersPage.totalPages - 1} onPress={() => setPage(p => p + 1)}>Próxima</Button>
          </View>
        )}
      </Animated.ScrollView>

      <Portal>
        <Modal visible={isViewModalOpen} onDismiss={() => setIsViewModalOpen(false)} contentContainerStyle={styles.modalWrapper}>
          {selectedOrder && (
            <MotiView
              from={{ opacity: 0, scale: 0.95, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 0.95, translateY: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 150 }}
              style={styles.modalContainer}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Pedido #{selectedOrder.id}</Text>
                  <TouchableOpacity onPress={() => setIsViewModalOpen(false)}><X size={24} color="#44403c" /></TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  <Text style={styles.modalLabel}>Cliente</Text>
                  <Text style={styles.modalValue}>{selectedOrder.userEmail}</Text>

                  <Text style={styles.modalLabel}>Data</Text>
                  <Text style={styles.modalValue}>{format(new Date(selectedOrder.orderDate), "dd/MM/yyyy HH:mm")}</Text>

                  <Text style={styles.modalLabel}>Pagamento</Text>
                  <Text style={styles.modalValue}>{selectedOrder.paymentMethod} - {selectedOrder.payment.paymentStatus}</Text>

                  <Divider style={{ marginVertical: 16 }} />
                  <Text style={[styles.modalLabel, { marginBottom: 8 }]}>Itens do Pedido</Text>
                  {selectedOrder.items.map(item => (
                    <View key={item.id} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.quantity}x {item.productName}</Text>
                      <Text style={styles.itemPrice}>{formatCurrency(item.subtotal)}</Text>
                    </View>
                  ))}
                  <Divider style={{ marginVertical: 16 }} />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatCurrency(selectedOrder.totalPrice)}</Text>
                  </View>
                </View>
              </ScrollView>
            </MotiView>
          )}
        </Modal>

        <Modal visible={isEditModalOpen} onDismiss={() => setIsEditModalOpen(false)} contentContainerStyle={styles.modalWrapper}>
          <MotiView
            from={{ opacity: 0, scale: 0.95, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0.95, translateY: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
            style={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>Atualizar Status</Text>
            <Text style={styles.modalSubtitle}>Pedido #{selectedOrder?.id}</Text>
            <View style={styles.statusOptions}>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.statusOptionBtn, selectedOrder?.orderStatus === key && { borderColor: config.text, backgroundColor: config.bg }]}
                  onPress={() => handleUpdateStatus(key as OrderStatus)}
                  disabled={updateStatusMutation.isPending}
                >
                  <config.icon size={20} color={config.text} />
                  <Text style={[styles.statusOptionText, { color: config.text }]}>{config.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button mode="text" textColor="#78716c" onPress={() => setIsEditModalOpen(false)} style={{ marginTop: 16 }}>Cancelar</Button>
          </MotiView>
        </Modal>

        <Modal visible={isUserModalOpen} onDismiss={() => setIsUserModalOpen(false)} contentContainerStyle={styles.modalWrapper}>
          <MotiView
            from={{ opacity: 0, scale: 0.95, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0.95, translateY: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
            style={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>Selecionar Usuário</Text>
            <ScrollView style={{ maxHeight: 400, marginTop: 16 }}>
              <TouchableOpacity style={styles.userItem} onPress={() => { setUserIdFilter("ALL"); setIsUserModalOpen(false); setPage(0); }}>
                <Text style={styles.userItemText}>Todos os usuários</Text>
              </TouchableOpacity>
              {users?.map(u => (
                <TouchableOpacity key={u.id} style={styles.userItem} onPress={() => { setUserIdFilter(u.id); setIsUserModalOpen(false); setPage(0); }}>
                  <Text style={styles.userItemText}>{u.name} ({u.email})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </MotiView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f4" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20, marginTop: Platform.OS === "ios" ? 10 : 20 },
  title: { fontFamily: "serif", fontSize: 32, fontWeight: "bold", color: "#1c1917" },
  subtitle: { fontSize: 14, color: "#78716c", marginTop: 4 },

  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  metricCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  metricHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  metricLabel: { fontSize: 12, fontWeight: "bold", textTransform: "uppercase" },
  metricValue: { fontFamily: "serif", fontSize: 28, fontWeight: "bold" },

  filterSection: { backgroundColor: "#ffffff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#e7e5e4", marginBottom: 24 },
  filterTitle: { fontSize: 10, fontWeight: "bold", color: "#78716c", marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 4 },
  chipScroll: { gap: 8, paddingBottom: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f5f5f4", borderWidth: 1, borderColor: "#e7e5e4" },
  chipActive: { backgroundColor: "#292524", borderColor: "#292524" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#44403c" },
  chipTextActive: { color: "#ffffff" },
  customDateRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  dateInput: { flex: 1, backgroundColor: "#ffffff", height: 45 },
  divider: { marginVertical: 16, backgroundColor: "#e7e5e4" },

  searchRow: { flexDirection: "row", gap: 12 },
  searchCol: { flex: 1 },
  dropdownBtn: { height: 45, justifyContent: "center", paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e7e5e4", backgroundColor: "#ffffff" },
  dropdownBtnText: { fontSize: 14, color: "#1c1917" },
  searchInput: { height: 45, backgroundColor: "#ffffff" },
  clearBtn: { marginTop: 16, alignSelf: "flex-end" },
  clearBtnText: { fontSize: 12, fontWeight: "bold", color: "#ef4444", textDecorationLine: "underline" },

  listContainer: { gap: 16 },
  orderCard: { backgroundColor: "#ffffff", borderRadius: 20, borderWidth: 1, borderColor: "#e7e5e4", padding: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  idRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  orderId: { fontFamily: "serif", fontSize: 18, fontWeight: "bold", color: "#1c1917" },
  paymentBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f5f5f4", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  paymentText: { fontSize: 10, fontWeight: "bold", color: "#44403c", textTransform: "uppercase" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "bold" },

  cardBody: { marginBottom: 16 },
  clientName: { fontSize: 18, fontWeight: "bold", color: "#1c1917", marginBottom: 2 },
  orderDate: { fontSize: 13, color: "#78716c", marginBottom: 12 },
  detailsGrid: { flexDirection: "row", gap: 12 },
  detailBox: { flex: 1, backgroundColor: "#fafaf9", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#f5f5f4" },
  detailLabel: { fontSize: 10, fontWeight: "bold", color: "#a8a29e", marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: "bold", color: "#1c1917" },

  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTopWidth: 1, borderTopColor: "#f5f5f4" },
  actionButtons: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: "#f5f5f4" },

  loader: { marginVertical: 40 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontFamily: "serif", fontSize: 18, fontWeight: "bold", color: "#44403c", marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: "#a8a29e", marginTop: 4 },

  pagination: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24 },
  pageText: { fontSize: 14, fontWeight: "bold", color: "#78716c" },

  modalWrapper: { margin: 20, justifyContent: "center" },
  modalContainer: { backgroundColor: "#ffffff", borderRadius: 24, padding: 24, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "serif", fontSize: 22, fontWeight: "bold", color: "#1c1917" },
  modalSubtitle: { fontSize: 14, color: "#78716c", marginBottom: 20 },
  modalContent: { paddingBottom: 20 },
  modalLabel: { fontSize: 11, fontWeight: "bold", color: "#a8a29e", textTransform: "uppercase", marginBottom: 4 },
  modalValue: { fontSize: 16, fontWeight: "600", color: "#1c1917", marginBottom: 16 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  itemName: { fontSize: 14, color: "#44403c", flex: 1 },
  itemPrice: { fontSize: 14, fontWeight: "bold", color: "#1c1917" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16, fontWeight: "bold", color: "#1c1917" },
  totalValue: { fontFamily: "serif", fontSize: 24, fontWeight: "bold", color: "#1c1917" },

  statusOptions: { gap: 10 },
  statusOptionBtn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#e7e5e4", backgroundColor: "#fafaf9" },
  statusOptionText: { fontSize: 14, fontWeight: "bold" },

  userItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f5f5f4" },
  userItemText: { fontSize: 16, color: "#44403c" },
});
