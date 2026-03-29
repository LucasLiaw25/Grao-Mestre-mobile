import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  FlatListProps,
} from "react-native";
import {
  Text,
  Surface,
  ActivityIndicator,
  Searchbar,
  IconButton,
  Divider,
  Portal,
  Modal,
  Button as PaperButton,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ShoppingBag, DollarSign, Clock, Coffee, CheckCircle2, RefreshCw, 
  Search, Calendar, Eye, X, Send, Ban, XCircle, Info, ChevronDown
} from "lucide-react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { MotiView, AnimatePresence } from "moti";

import { ordersApi } from "@/src/lib/api";
import { formatCurrency } from "@/src/lib/format";
import { OrderResponseDTO, OrderStatus } from "@/src/types";

const { width, height } = Dimensions.get("window");

// Componente FlatList animado
const AnimatedFlatList = Animated.createAnimatedComponent<FlatListProps<OrderResponseDTO>>(FlatList);

const COLORS = {
  primary: "#1c1917",
  secondary: "#292524",
  background: "#fafaf9",
  card: "#ffffff",
  textMuted: "#78716c",
  border: "#e7e5e4",
  accent: "#a8a29e",
  amber: { bg: "#fef3c7", text: "#b45309" },
  indigo: { bg: "#e0e7ff", text: "#3730a3" },
  emerald: { bg: "#d1fae5", text: "#047857" },
  teal: { bg: "#cffafe", text: "#0f766e" },
  red: { bg: "#fee2e2", text: "#b91c1c" },
};

const STATUS_MAP = {
  [OrderStatus.PENDING]: { label: "Pendente", color: COLORS.amber.text, bg: COLORS.amber.bg, icon: Clock },
  [OrderStatus.PROCESSING]: { label: "Em Preparo", color: COLORS.indigo.text, bg: COLORS.indigo.bg, icon: RefreshCw },
  [OrderStatus.PAID]: { label: "Pago", color: COLORS.emerald.text, bg: COLORS.emerald.bg, icon: DollarSign },
  [OrderStatus.SENDED]: { label: "Enviado", color: COLORS.teal.text, bg: COLORS.teal.bg, icon: Send },
  [OrderStatus.COMPLETED]: { label: "Concluído", color: COLORS.emerald.text, bg: COLORS.emerald.bg, icon: CheckCircle2 },
  [OrderStatus.CANCELED]: { label: "Cancelado", color: COLORS.red.text, bg: COLORS.red.bg, icon: XCircle },
  [OrderStatus.RECUSE]: { label: "Recusado", color: COLORS.red.text, bg: COLORS.red.bg, icon: Ban },
};

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDTO | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState<OrderStatus | "">("");

  const { data: orders, isLoading, refetch, isRefetching } = useQuery<OrderResponseDTO[]>({
    queryKey: ["admin-dashboard-today"],
    queryFn: async () => (await ordersApi.getOrdersForToday()).data,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => 
      ordersApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-today"] });
      setIsModalVisible(false);
    },
  });

  const metrics = useMemo(() => {
    if (!orders) return { total: 0, revenue: 0, pending: 0, processing: 0 };
    return {
      total: orders.length,
      revenue: orders.reduce((acc, o) => acc + o.totalPrice, 0),
      pending: orders.filter(o => o.orderStatus === OrderStatus.PENDING).length,
      processing: orders.filter(o => o.orderStatus === OrderStatus.PROCESSING).length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const matchesSearch = o.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) || o.id.toString().includes(searchQuery);
      const matchesStatus = statusFilter === "ALL" || o.orderStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleOpenDetails = (order: OrderResponseDTO) => {
    setSelectedOrder(order);
    setStatusToUpdate(order.orderStatus);
    setIsModalVisible(true);
  };

  const renderMetric = (label: string, value: string | number, Icon: any, color: string, index: number) => (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500, delay: index * 100 }}
      style={styles.metricCardWrapper}
    >
      <Surface style={styles.metricCard} elevation={0}>
        <View style={[styles.metricIcon, { backgroundColor: color + '15' }]}>
          <Icon size={18} color={color} />
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </Surface>
    </MotiView>
  );

  const renderOrderItem = ({ item, index }: { item: OrderResponseDTO; index: number }) => {
    const config = STATUS_MAP[item.orderStatus] || STATUS_MAP[OrderStatus.PENDING];
    const Icon = config.icon;
    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 300 + (index * 60) }}
      >
        <Surface style={styles.orderCard} elevation={0}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.orderId}>#{item.id}</Text>
              <Text style={styles.orderTime}>{new Date(item.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: config.bg }]}>
              <Icon size={12} color={config.color} style={{ marginRight: 4 }} />
              <Text style={[styles.statusTagText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>
          <Text style={styles.clientEmail} numberOfLines={1}>{item.userEmail}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.orderPrice}>{formatCurrency(item.totalPrice)}</Text>
            <TouchableOpacity style={styles.viewBtn} onPress={() => handleOpenDetails(item)}>
              <Eye size={18} color={COLORS.secondary} />
              <Text style={styles.viewBtnText}>Ver Detalhes</Text>
            </TouchableOpacity>
          </View>
        </Surface>
      </MotiView>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER FIXO - Animado na entrada */}
      <Animated.View style={styles.fixedHeader} entering={FadeInDown.duration(600)}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerLabel}>Monitoramento Diário</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
            <RefreshCw size={20} color={COLORS.secondary} style={isRefetching ? { transform: [{ rotate: '180deg' }] } : {}} />
          </TouchableOpacity>
        </View>

        <Searchbar
          placeholder="Buscar pedido ou email..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={COLORS.accent}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <TouchableOpacity 
            style={[styles.statusChip, statusFilter === "ALL" && styles.statusChipActive]}
            onPress={() => setStatusFilter("ALL")}
          >
            <Text style={[styles.statusChipText, statusFilter === "ALL" && styles.statusChipTextActive]}>Todos</Text>
          </TouchableOpacity>
          {Object.entries(STATUS_MAP).map(([key, cfg]) => (
            <TouchableOpacity 
              key={key} 
              style={[styles.statusChip, statusFilter === key && { backgroundColor: cfg.color, borderColor: cfg.color }]}
              onPress={() => setStatusFilter(key as OrderStatus)}
            >
              <cfg.icon size={14} color={statusFilter === key ? "#fff" : cfg.color} />
              <Text style={[styles.statusChipText, statusFilter === key && { color: "#fff" }, { marginLeft: 6 }]}>
                {cfg.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* CONTEÚDO SCROLLÁVEL */}
      <AnimatedFlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        entering={FadeIn.duration(600)}
        ListHeaderComponent={
          <View style={styles.metricsGrid}>
            {renderMetric("Receita Hoje", formatCurrency(metrics.revenue), DollarSign, "#059669", 0)}
            {renderMetric("Pendentes", metrics.pending, Clock, COLORS.amber.text, 1)}
            {renderMetric("Em Preparo", metrics.processing, Coffee, COLORS.indigo.text, 2)}
            {renderMetric("Total Pedidos", metrics.total, ShoppingBag, COLORS.secondary, 3)}
          </View>
        }
        ListEmptyComponent={
          isLoading ? <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.secondary} /> : 
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Text style={styles.emptyText}>Nenhum pedido encontrado para hoje.</Text>
          </MotiView>
        }
      />

      {/* MODAL DE DETALHES - Animado */}
      <Portal>
        <Modal visible={isModalVisible} onDismiss={() => setIsModalVisible(false)} contentContainerStyle={styles.modalScroll}>
          {selectedOrder && (
            <MotiView
              from={{ opacity: 0, scale: 0.95, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 0.95, translateY: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 150 }}
            >
              <Surface style={styles.modalCard} elevation={0}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Detalhes do Pedido <Text style={{ color: COLORS.accent }}>#{selectedOrder.id}</Text></Text>
                    <Text style={styles.modalSubtitle}>Visualize e gerencie os detalhes deste pedido.</Text>
                  </View>
                  <IconButton icon="close" onPress={() => setIsModalVisible(false)} />
                </View>

                <ScrollView style={{ maxHeight: height * 0.6 }} showsVerticalScrollIndicator={false}>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Email do Cliente</Text>
                      <Text style={styles.infoValue}>{selectedOrder.userEmail}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Data do Pedido</Text>
                      <Text style={styles.infoValue}>{new Date(selectedOrder.orderDate).toLocaleDateString()} {new Date(selectedOrder.orderDate).toLocaleTimeString()}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Valor Total</Text>
                      <Text style={[styles.infoValue, { color: COLORS.amber.text }]}>{formatCurrency(selectedOrder.totalPrice)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Método Pagamento</Text>
                      <Text style={styles.infoValue}>Cartão/Pix</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionDividerTitle}>Itens</Text>
                  <Surface style={styles.itemsTable} elevation={0}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderText, { flex: 2 }]}>PRODUTO</Text>
                      <Text style={[styles.tableHeaderText, { flex: 0.5, textAlign: 'center' }]}>QTD</Text>
                      <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>TOTAL</Text>
                    </View>
                    {selectedOrder.items.map((item, idx) => (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{item.productName}</Text>
                        <Text style={[styles.tableCell, { flex: 0.5, textAlign: 'center' }]}>{item.quantity}</Text>
                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>{formatCurrency(item.priceAtTime * item.quantity)}</Text>
                      </View>
                    ))}
                  </Surface>

                  <View style={styles.statusUpdateBox}>
                    <Text style={styles.infoLabel}>Atualizar Status</Text>
                    <View style={styles.pickerFake}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {Object.keys(STATUS_MAP).map((s) => (
                          <TouchableOpacity 
                            key={s} 
                            style={[styles.statusOption, statusToUpdate === s && styles.statusOptionActive]}
                            onPress={() => setStatusToUpdate(s as OrderStatus)}
                          >
                            <Text style={[styles.statusOptionText, statusToUpdate === s && styles.statusOptionTextActive]}>{STATUS_MAP[s as OrderStatus]?.label || s}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <PaperButton mode="outlined" onPress={() => setIsModalVisible(false)} style={styles.footerBtn} labelStyle={{ color: COLORS.secondary }}>Fechar</PaperButton>
                  <PaperButton 
                    mode="contained" 
                    onPress={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: statusToUpdate as OrderStatus })}
                    style={[styles.footerBtn, { backgroundColor: '#c29d84' }]}
                    loading={updateStatusMutation.isPending}
                  >Salvar Status</PaperButton>
                </View>
              </Surface>
            </MotiView>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  fixedHeader: { backgroundColor: COLORS.card, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, zIndex: 10 },
  headerTop: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLabel: { fontSize: 10, fontWeight: '900', color: COLORS.accent, letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle: { fontFamily: 'serif', fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },

  searchBar: { marginHorizontal: 20, height: 46, borderRadius: 12, backgroundColor: COLORS.background, elevation: 0, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { fontSize: 14 },
  chipRow: { paddingHorizontal: 20, marginTop: 16, gap: 8 },
  statusChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  statusChipActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  statusChipText: { fontSize: 12, fontWeight: 'bold', color: COLORS.textMuted },
  statusChipTextActive: { color: '#fff' },

  listContent: { padding: 20 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  metricCardWrapper: { width: (width - 50) / 2 },
  metricCard: { padding: 16, borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  metricIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  metricValue: { fontFamily: 'serif', fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  metricLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  orderCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId: { fontFamily: 'serif', fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  orderTime: { fontSize: 11, color: COLORS.accent },
  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusTagText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  clientEmail: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f5f5f4', paddingTop: 12 },
  orderPrice: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: COLORS.background },
  viewBtnText: { fontSize: 12, fontWeight: 'bold', color: COLORS.secondary },

  emptyText: { textAlign: 'center', color: COLORS.accent, marginTop: 40 },

  modalScroll: { margin: Platform.OS === 'ios' ? 12 : 20, justifyContent: 'center' },
  modalCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontFamily: 'serif', fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  modalSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  infoItem: { width: '47%' },
  infoLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.accent, textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { fontSize: 13, fontWeight: 'bold', color: COLORS.secondary },
  sectionDividerTitle: { fontFamily: 'serif', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  itemsTable: { backgroundColor: '#f9f8f7', borderRadius: 12, padding: 12, marginBottom: 24 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 8, marginBottom: 8 },
  tableHeaderText: { fontSize: 10, fontWeight: 'bold', color: COLORS.accent },
  tableRow: { flexDirection: 'row', paddingVertical: 6 },
  tableCell: { fontSize: 12, color: COLORS.secondary },

  statusUpdateBox: { marginTop: 8 },
  pickerFake: { marginTop: 8, paddingVertical: 4 },
  statusOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: '#fff' },
  statusOptionActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  statusOptionText: { fontSize: 12, fontWeight: 'bold', color: COLORS.textMuted },
  statusOptionTextActive: { color: '#fff' },

  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: COLORS.border },
  footerBtn: { flex: 1, borderRadius: 12 }
});