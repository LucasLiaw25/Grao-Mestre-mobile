import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from "react-native";
import {
  ShoppingBag,
  Clock,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  CheckCircle2,
  Circle,
  AlertCircle,
  Truck,
  Ban,
  RefreshCw,
  DollarSign,
  Tag,
  SlidersHorizontal,
  Coffee,
} from "lucide-react-native"; // Usando lucide-react-native
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios"; // Assumindo que ordersApi é um wrapper para axios

// Mock de useToast e formatCurrency para React Native
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
    console.log(`Toast: ${title} - ${description} (Variant: ${variant})`);
    // Implementar um toast nativo aqui, como ToastAndroid ou um componente customizado
  },
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Mock de cn e OrderDetailsModal
const cn = (...args: any[]) => args.filter(Boolean).join(" "); // Simplesmente junta classes
const OrderDetailsModal: React.FC<any> = ({ isOpen, onClose, order, onUpdateStatus, isUpdatingStatus }) => {
  if (!isOpen) return null;
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Detalhes do Pedido #{String(order.id).padStart(4, "0")}</Text>
        <Text style={styles.modalText}>Cliente: {order.userEmail}</Text>
        <Text style={styles.modalText}>Total: {formatCurrency(order.totalPrice)}</Text>
        <Text style={styles.modalText}>Status: {STATUS_CONFIG[order.orderStatus].label}</Text>
        <View style={styles.modalItemsContainer}>
          {order.items.map((item: any) => (
            <Text key={item.id} style={styles.modalItemText}>
              - {item.productName} (x{item.quantity})
            </Text>
          ))}
        </View>
        <View style={styles.modalActions}>
          <TouchableOpacity
            onPress={() => onUpdateStatus({ orderId: order.id, newStatus: OrderStatus.COMPLETED })}
            style={[styles.modalButton, isUpdatingStatus && styles.modalButtonDisabled]}
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.modalButtonText}>Concluir Pedido</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={[styles.modalButton, styles.modalButtonSecondary]}>
            <Text style={styles.modalButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Habilitar LayoutAnimation para Android
if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Tipos
enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PAID = "PAID",
  SENDED = "SENDED",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
  RECUSE = "RECUSE",
}

interface OrderItemDTO {
  id: number;
  productName: string;
  quantity: number;
}

interface OrderResponseDTO {
  id: number;
  userEmail: string;
  items: OrderItemDTO[];
  orderDate: string;
  totalPrice: number;
  orderStatus: OrderStatus;
}

interface PageableResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // current page
  size: number; // page size
}

// Mock da API de pedidos
const ordersApi = {
  filter: async (params: any) => {
    console.log("Fetching orders with params:", params);
    // Simula um delay de rede
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockOrders: OrderResponseDTO[] = [
      {
        id: 1,
        userEmail: "joao.silva@example.com",
        items: [
          { id: 101, productName: "Café Expresso", quantity: 2 },
          { id: 102, productName: "Pão de Queijo", quantity: 1 },
        ],
        orderDate: "2026-03-19T10:30:00",
        totalPrice: 25.5,
        orderStatus: OrderStatus.PENDING,
      },
      {
        id: 2,
        userEmail: "maria.souza@example.com",
        items: [
          { id: 201, productName: "Cappuccino", quantity: 1 },
          { id: 202, productName: "Bolo de Cenoura", quantity: 1 },
          { id: 203, productName: "Suco de Laranja", quantity: 1 },
        ],
        orderDate: "2026-03-19T11:05:00",
        totalPrice: 42.0,
        orderStatus: OrderStatus.PROCESSING,
      },
      {
        id: 3,
        userEmail: "carlos.santos@example.com",
        items: [{ id: 301, productName: "Sanduíche Natural", quantity: 1 }],
        orderDate: "2026-03-19T09:45:00",
        totalPrice: 30.0,
        orderStatus: OrderStatus.COMPLETED,
      },
      {
        id: 4,
        userEmail: "ana.pereira@example.com",
        items: [
          { id: 401, productName: "Chá Gelado", quantity: 2 },
          { id: 402, productName: "Muffin", quantity: 1 },
        ],
        orderDate: "2026-03-19T10:15:00",
        totalPrice: 28.0,
        orderStatus: OrderStatus.PAID,
      },
      {
        id: 5,
        userEmail: "pedro.lima@example.com",
        items: [{ id: 501, productName: "Salada de Frutas", quantity: 1 }],
        orderDate: "2026-03-19T11:30:00",
        totalPrice: 22.0,
        orderStatus: OrderStatus.PENDING,
      },
      {
        id: 6,
        userEmail: "sofia.rocha@example.com",
        items: [
          { id: 601, productName: "Croissant", quantity: 2 },
          { id: 602, productName: "Chocolate Quente", quantity: 1 },
        ],
        orderDate: "2026-03-19T08:50:00",
        totalPrice: 35.0,
        orderStatus: OrderStatus.CANCELED,
      },
      {
        id: 7,
        userEmail: "gabriel.ferreira@example.com",
        items: [{ id: 701, productName: "Smoothie", quantity: 1 }],
        orderDate: "2026-03-19T12:00:00",
        totalPrice: 27.0,
        orderStatus: OrderStatus.PENDING,
      },
      {
        id: 8,
        userEmail: "laura.gomes@example.com",
        items: [
          { id: 801, productName: "Torta de Limão", quantity: 1 },
          { id: 802, productName: "Café com Leite", quantity: 1 },
        ],
        orderDate: "2026-03-19T09:10:00",
        totalPrice: 38.0,
        orderStatus: OrderStatus.SENDED,
      },
      {
        id: 9,
        userEmail: "rafael.costa@example.com",
        items: [{ id: 901, productName: "Wrap de Frango", quantity: 1 }],
        orderDate: "2026-03-19T10:40:00",
        totalPrice: 33.0,
        orderStatus: OrderStatus.PROCESSING,
      },
      {
        id: 10,
        userEmail: "julia.martins@example.com",
        items: [
          { id: 1001, productName: "Biscoito Amanteigado", quantity: 3 },
          { id: 1002, productName: "Chá Verde", quantity: 1 },
        ],
        orderDate: "2026-03-19T11:15:00",
        totalPrice: 20.0,
        orderStatus: OrderStatus.PAID,
      },
    ];

    const filteredByStatus =
      params.status && params.status !== "ALL"
        ? mockOrders.filter((order) => order.orderStatus === params.status)
        : mockOrders;

    const sortedOrders = filteredByStatus.sort((a, b) => {
      const aValue = a[params.sort.split(",")[0] as keyof OrderResponseDTO];
      const bValue = b[params.sort.split(",")[0] as keyof OrderResponseDTO];

      if (params.sort.includes("orderDate")) {
        const dateA = new Date(aValue as string).getTime();
        const dateB = new Date(bValue as string).getTime();
        return params.sort.includes("desc") ? dateB - dateA : dateA - dateB;
      } else if (params.sort.includes("totalPrice")) {
        return params.sort.includes("desc") ? (bValue as number) - (aValue as number) : (aValue as number) - (bValue as number);
      }
      return 0;
    });

    const start = params.page * params.size;
    const end = start + params.size;
    const paginatedOrders = sortedOrders.slice(start, end);

    return {
      data: {
        content: paginatedOrders,
        totalPages: Math.ceil(filteredByStatus.length / params.size),
        totalElements: filteredByStatus.length,
        number: params.page,
        size: params.size,
      },
    };
  },
  updateOrderStatus: async (orderId: number, newStatus: OrderStatus) => {
    console.log(`Updating order ${orderId} to status ${newStatus}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { data: { id: orderId, status: newStatus } };
  },
};

// Helpers de data
function getTodayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`;
}

function getTodayEnd(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59:59`;
}

function getElapsed(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400)
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}min atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

function getElapsedSeconds(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
}

function getUrgencyLevel(seconds: number): "normal" | "warning" | "critical" {
  if (seconds > 3600) return "critical";
  if (seconds > 1800) return "warning";
  return "normal";
}

// Configurações de Status
const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    icon: React.ElementType;
    badgeClass: any; // StyleSheet.NamedStyles
    rowAccent: any;
    dotClass: any;
  }
> = {
  [OrderStatus.PENDING]: {
    label: "Pendente",
    icon: Circle,
    badgeClass: styles.badgeAmber,
    rowAccent: styles.borderLAmber,
    dotClass: styles.dotAmber,
  },
  [OrderStatus.PROCESSING]: {
    label: "Em Preparo",
    icon: Coffee,
    badgeClass: styles.badgeBlue,
    rowAccent: styles.borderLBlue,
    dotClass: styles.dotBlue,
  },
  [OrderStatus.PAID]: {
    label: "Pago",
    icon: DollarSign,
    badgeClass: styles.badgeEmerald,
    rowAccent: styles.borderLEmerald,
    dotClass: styles.dotEmerald,
  },
  [OrderStatus.SENDED]: {
    label: "Enviado",
    icon: Truck,
    badgeClass: styles.badgeIndigo,
    rowAccent: styles.borderLIndigo,
    dotClass: styles.dotIndigo,
  },
  [OrderStatus.COMPLETED]: {
    label: "Concluído",
    icon: CheckCircle2,
    badgeClass: styles.badgeGreen,
    rowAccent: styles.borderLGreen,
    dotClass: styles.dotGreen,
  },
  [OrderStatus.CANCELED]: {
    label: "Cancelado",
    icon: Ban,
    badgeClass: styles.badgeRed,
    rowAccent: styles.borderLRed,
    dotClass: styles.dotRed,
  },
  [OrderStatus.RECUSE]: {
    label: "Recusado",
    icon: AlertCircle,
    badgeClass: styles.badgeRose,
    rowAccent: styles.borderLRose,
    dotClass: styles.dotRose,
  },
};

// Sub-componentes
const StatusBadge: React.FC<{ status: OrderStatus; showDot?: boolean }> = ({
  status,
  showDot = true,
}) => {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <View style={[styles.badgeBase, cfg.badgeClass]}>
      {showDot ? (
        <View style={[styles.dotBase, cfg.dotClass]} />
      ) : (
        <Icon size={12} color={StyleSheet.flatten(cfg.badgeClass).color} />
      )}
      <Text style={[styles.badgeText, { color: StyleSheet.flatten(cfg.badgeClass).color }]}>
        {cfg.label}
      </Text>
    </View>
  );
};

const ElapsedTimer: React.FC<{ dateStr: string }> = ({ dateStr }) => {
  const [label, setLabel] = useState(() => getElapsed(dateStr));
  const [secs, setSecs] = useState(() => getElapsedSeconds(dateStr));

  useEffect(() => {
    const id = setInterval(() => {
      setLabel(getElapsed(dateStr));
      setSecs(getElapsedSeconds(dateStr));
    }, 30_000);
    return () => clearInterval(id);
  }, [dateStr]);

  const urgency = getUrgencyLevel(secs);

  return (
    <View
      style={[
        styles.elapsedTimerBase,
        urgency === "critical" && styles.elapsedTimerCritical,
        urgency === "warning" && styles.elapsedTimerWarning,
        urgency === "normal" && styles.elapsedTimerNormal,
      ]}
    >
      <Clock size={12} color={StyleSheet.flatten(
        urgency === "critical" ? styles.elapsedTimerCritical :
        urgency === "warning" ? styles.elapsedTimerWarning :
        styles.elapsedTimerNormal
      ).color} />
      <Text style={[styles.elapsedTimerText, { color: StyleSheet.flatten(
        urgency === "critical" ? styles.elapsedTimerCritical :
        urgency === "warning" ? styles.elapsedTimerWarning :
        styles.elapsedTimerNormal
      ).color }]}>
        {label}
      </Text>
    </View>
  );
};

const SummaryCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: any;
  index: number;
}> = ({ label, value, sub, icon: Icon, accent, index }) => {
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(16), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View
      style={[
        styles.summaryCardBase,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.summaryCardIconContainer, accent]}>
        <Icon size={20} color={StyleSheet.flatten(accent).color} />
      </View>
      <View style={styles.summaryCardTextContent}>
        <Text style={styles.summaryCardLabel}>{label}</Text>
        <Text style={styles.summaryCardValue}>{value}</Text>
        {sub && <Text style={styles.summaryCardSub}>{sub}</Text>}
      </View>
    </Animated.View>
  );
};

// Cartão de Pedido (Mobile)
const OrderCard: React.FC<{
  order: OrderResponseDTO;
  onView: (o: OrderResponseDTO) => void;
  index: number;
}> = ({ order, onView, index }) => {
  const cfg = STATUS_CONFIG[order.orderStatus];
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(12), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View
      style={[
        styles.orderCardBase,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.orderCardAccentBar, cfg.dotClass]} />
      <View style={styles.orderCardContent}>
        <View style={styles.orderCardHeader}>
          <View>
            <Text style={styles.orderCardId}>
              #{String(order.id).padStart(4, "0")}
            </Text>
            <Text style={styles.orderCardEmail}>{order.userEmail}</Text>
          </View>
          <StatusBadge status={order.orderStatus} showDot={false} />
        </View>
        <View style={styles.orderCardItemsContainer}>
          {order.items.slice(0, 4).map((item) => (
            <View key={item.id} style={styles.orderCardItemBadge}>
              <Text style={styles.orderCardItemText}>
                {item.productName} ×{item.quantity}
              </Text>
            </View>
          ))}
          {order.items.length > 4 && (
            <Text style={styles.orderCardMoreItemsText}>
              +{order.items.length - 4}
            </Text>
          )}
        </View>
        <View style={styles.orderCardFooter}>
          <View style={styles.orderCardFooterLeft}>
            <ElapsedTimer dateStr={order.orderDate} />
            <Text style={styles.orderCardTotalPrice}>
              {formatCurrency(order.totalPrice)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onView(order)}
            style={styles.orderCardDetailsButton}
          >
            <Eye size={14} color={styles.orderCardDetailsButtonText.color} />
            <Text style={styles.orderCardDetailsButtonText}>Detalhes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// Componente principal
export default function DailyOrderMonitor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const todayStart = useMemo(() => getTodayStart(), []);
  const todayEnd = useMemo(() => getTodayEnd(), []);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDTO | null>(null);

  const [filterStatus, setFilterStatus] = useState<OrderStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"orderDate" | "totalPrice">("orderDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(0);
  const size = 10;

  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filterParams = useMemo(() => {
    const params: {
      startDate: string;
      endDate: string;
      status?: OrderStatus;
      page: number;
      size: number;
      sort: string;
    } = {
      startDate: todayStart,
      endDate: todayEnd,
      page,
      size,
      sort: `${sortField},${sortDir}`,
    };

    if (filterStatus !== "ALL") {
      params.status = filterStatus;
    }

    return params;
  }, [filterStatus, page, sortField, sortDir, todayStart, todayEnd]);

  const {
    data: ordersPage,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<PageableResponse<OrderResponseDTO>, Error>({
    queryKey: ["orders", "daily-monitor", filterParams],
    queryFn: async () => (await ordersApi.filter(filterParams)).data,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const allOrders = ordersPage?.content ?? [];
  const totalPages = ordersPage?.totalPages ?? 0;
  const totalElements = ordersPage?.totalElements ?? 0;

  const orders = useMemo(() => {
    if (!searchTerm.trim()) return allOrders;
    const q = searchTerm.toLowerCase();
    return allOrders.filter(
      (o) =>
        o.userEmail.toLowerCase().includes(q) ||
        String(o.id).includes(q) ||
        o.items.some((i) => i.productName.toLowerCase().includes(q))
    );
  }, [allOrders, searchTerm]);

  const metrics = useMemo(() => {
    const revenue = allOrders.reduce((acc, o) => acc + o.totalPrice, 0);
    const pending = allOrders.filter((o) => o.orderStatus === OrderStatus.PENDING).length;
    const processing = allOrders.filter((o) => o.orderStatus === OrderStatus.PROCESSING).length;
    const completed = allOrders.filter((o) => o.orderStatus === OrderStatus.COMPLETED).length;
    return { revenue, pending, processing, completed };
  }, [allOrders]);

  const updateStatusMutation = useMutation({
    mutationFn: (data: { orderId: number; newStatus: OrderStatus }) =>
      ordersApi.updateOrderStatus(data.orderId, data.newStatus),
    onSuccess: () => {
      toast({ title: "Status atualizado", description: "Pedido atualizado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["orders", "daily-monitor"] });
      setIsDetailsModalOpen(false);
      setSelectedOrder(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    },
  });

  const openDetails = (order: OrderResponseDTO) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };
  const closeDetails = () => {
    setIsDetailsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setLastRefreshed(new Date());
    setIsRefreshing(false);
  }, [refetch]);

  const toggleSort = (field: "orderDate" | "totalPrice") => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(0);
  };

  const clearFilters = () => {
    setFilterStatus("ALL");
    setSearchTerm("");
    setPage(0);
  };

  const hasActiveFilters = filterStatus !== "ALL" || searchTerm.trim() !== "";

  const toggleFiltersVisibility = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((v) => !v);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <OrderCard order={item} onView={openDetails} index={index} />
        )}
        ListHeaderComponent={
          <>
            {/* Cabeçalho */}
            <View style={styles.headerContainer}>
              <View>
                <Text style={styles.headerSubtitle}>Painel Administrativo</Text>
                <Text style={styles.headerTitle}>Monitor de Pedidos</Text>
                <Text style={styles.headerDate}>
                  {new Date().toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>

              <View style={styles.refreshContainer}>
                <Text style={styles.refreshText}>
                  Atualizado às{" "}
                  {lastRefreshed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </Text>
                <TouchableOpacity
                  onPress={handleRefresh}
                  disabled={isRefreshing || isFetching}
                  style={styles.refreshButton}
                >
                  <RefreshCw
                    size={16}
                    color={styles.refreshButtonText.color}
                    style={(isRefreshing || isFetching) && styles.spinner}
                  />
                  <Text style={styles.refreshButtonText}>Atualizar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cards de Métricas */}
            <View style={styles.metricsGrid}>
              <SummaryCard
                label="Pedidos Hoje"
                value={isLoading ? "—" : totalElements}
                icon={ShoppingBag}
                accent={styles.accentPrimary}
                index={0}
              />
              <SummaryCard
                label="Receita"
                value={isLoading ? "—" : formatCurrency(metrics.revenue)}
                icon={DollarSign}
                accent={styles.accentEmerald}
                index={1}
              />
              <SummaryCard
                label="Pendentes"
                value={isLoading ? "—" : metrics.pending}
                sub="aguardando ação"
                icon={Circle}
                accent={styles.accentAmber}
                index={2}
              />
              <SummaryCard
                label="Em Preparo"
                value={isLoading ? "—" : metrics.processing}
                icon={Coffee}
                accent={styles.accentBlue}
                index={3}
              />
              <SummaryCard
                label="Concluídos"
                value={isLoading ? "—" : metrics.completed}
                icon={CheckCircle2}
                accent={styles.accentGreen}
                index={4}
              />
            </View>

            {/* Filtros */}
            <View style={styles.filtersContainer}>
              <View style={styles.searchFilterRow}>
                <View style={styles.searchInputWrapper}>
                  <Search size={16} color={styles.searchInputIcon.color} style={styles.searchInputIcon} />
                  <TextInput
                    placeholder="Buscar por e-mail, ID ou produto…"
                    value={searchTerm}
                    onChangeText={(text) => {
                      setSearchTerm(text);
                      setPage(0);
                    }}
                    style={styles.searchInput}
                    placeholderTextColor={styles.searchInputPlaceholder.color}
                  />
                  {searchTerm.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchTerm("")} style={styles.clearSearchButton}>
                      <X size={16} color={styles.clearSearchButtonIcon.color} />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={toggleFiltersVisibility}
                  style={[
                    styles.filterToggleButton,
                    showFilters && styles.filterToggleButtonActive,
                  ]}
                >
                  <SlidersHorizontal size={16} color={showFilters ? styles.filterToggleButtonActiveText.color : styles.filterToggleButtonText.color} />
                  <Text style={showFilters ? styles.filterToggleButtonActiveText : styles.filterToggleButtonText}>
                    Filtros
                  </Text>
                  {hasActiveFilters && <View style={styles.activeFilterDot} />}
                  {showFilters ? (
                    <ChevronUp size={14} color={showFilters ? styles.filterToggleButtonActiveText.color : styles.filterToggleButtonText.color} />
                  ) : (
                    <ChevronDown size={14} color={showFilters ? styles.filterToggleButtonActiveText.color : styles.filterToggleButtonText.color} />
                  )}
                </TouchableOpacity>
              </View>

              {showFilters && (
                <View style={styles.expandedFilters}>
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Status do Pedido</Text>
                    <View style={styles.statusFilterButtons}>
                      <TouchableOpacity
                        onPress={() => {
                          setFilterStatus("ALL");
                          setPage(0);
                        }}
                        style={[
                          styles.statusFilterButton,
                          filterStatus === "ALL" && styles.statusFilterButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusFilterButtonText,
                            filterStatus === "ALL" && styles.statusFilterButtonActiveText,
                          ]}
                        >
                          Todos
                        </Text>
                      </TouchableOpacity>
                      {Object.values(OrderStatus).map((status) => {
                        const cfg = STATUS_CONFIG[status];
                        return (
                          <TouchableOpacity
                            key={status}
                            onPress={() => {
                              setFilterStatus(status);
                              setPage(0);
                            }}
                            style={[
                              styles.statusFilterButton,
                              filterStatus === status && cfg.badgeClass,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusFilterButtonText,
                                filterStatus === status && { color: StyleSheet.flatten(cfg.badgeClass).color },
                              ]}
                            >
                              {cfg.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {hasActiveFilters && (
                    <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                      <X size={14} color={styles.clearFiltersButtonText.color} />
                      <Text style={styles.clearFiltersButtonText}>Limpar filtros</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {hasActiveFilters && (
                <View style={styles.activeFiltersDisplay}>
                  <Text style={styles.activeFiltersLabel}>Filtros ativos:</Text>
                  {filterStatus !== "ALL" && (
                    <View style={styles.activeFilterBadge}>
                      <Text style={styles.activeFilterBadgeText}>
                        {STATUS_CONFIG[filterStatus].label}
                      </Text>
                      <TouchableOpacity onPress={() => setFilterStatus("ALL")} style={styles.removeFilterButton}>
                        <X size={12} color={styles.removeFilterButtonIcon.color} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {searchTerm.length > 0 && (
                    <View style={styles.activeFilterBadge}>
                      <Text style={styles.activeFilterBadgeText}>"{searchTerm}"</Text>
                      <TouchableOpacity onPress={() => setSearchTerm("")} style={styles.removeFilterButton}>
                        <X size={12} color={styles.removeFilterButtonIcon.color} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Tabela / Lista de Pedidos Header */}
            <View style={styles.ordersListHeader}>
              <View style={styles.ordersListHeaderLeft}>
                <ShoppingBag size={20} color={styles.ordersListHeaderIcon.color} />
                <Text style={styles.ordersListHeaderTitle}>Pedidos de Hoje</Text>
                {!isLoading && (
                  <View style={styles.ordersCountBadge}>
                    <Text style={styles.ordersCountText}>
                      {orders.length} de {totalElements}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.sortOptionsContainer}>
                <Text style={styles.sortOptionsLabel}>Ordenar:</Text>
                {(["orderDate", "totalPrice"] as const).map((field) => (
                  <TouchableOpacity
                    key={field}
                    onPress={() => toggleSort(field)}
                    style={[
                      styles.sortOptionButton,
                      sortField === field && styles.sortOptionButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortOptionButtonText,
                        sortField === field && styles.sortOptionButtonActiveText,
                      ]}
                    >
                      {field === "orderDate" ? "Hora" : "Valor"}{" "}
                      {sortField === field && (sortDir === "desc" ? "↓" : "↑")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Loading / Empty State */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={styles.spinner.color} />
                <Text style={styles.loadingText}>Carregando pedidos de hoje…</Text>
              </View>
            ) : orders.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateIconWrapper}>
                  <ShoppingBag size={32} color={styles.emptyStateIcon.color} />
                </View>
                <Text style={styles.emptyStateTitle}>Nenhum pedido encontrado</Text>
                <Text style={styles.emptyStateDescription}>
                  {hasActiveFilters
                    ? "Tente ajustar os filtros aplicados."
                    : "Nenhum pedido registrado hoje."}
                </Text>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={clearFilters} style={styles.emptyStateClearFiltersButton}>
                    <Text style={styles.emptyStateClearFiltersButtonText}>Limpar filtros</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
          </>
        }
        ListFooterComponent={
          <>
            {/* Paginação */}
            {!isLoading && totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <Text style={styles.paginationText}>
                  Página {page + 1} de {totalPages} · {totalElements} pedidos hoje
                </Text>
                <View style={styles.paginationButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      setPage((prev) => Math.max(0, prev - 1));
                      // Scroll to top of the list on page change
                      // flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                    }}
                    disabled={page === 0}
                    style={[styles.paginationButton, page === 0 && styles.paginationButtonDisabled]}
                  >
                    <Text style={styles.paginationButtonText}>Anterior</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setPage((prev) => Math.min(totalPages - 1, prev + 1));
                      // flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                    }}
                    disabled={page === totalPages - 1}
                    style={[styles.paginationButton, page === totalPages - 1 && styles.paginationButtonDisabled]}
                  >
                    <Text style={styles.paginationButtonText}>Próxima</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Fetch silencioso */}
            {isFetching && !isLoading && (
              <View style={styles.silentFetchContainer}>
                <Loader2 size={12} color={styles.silentFetchText.color} style={styles.spinner} />
                <Text style={styles.silentFetchText}>Atualizando…</Text>
              </View>
            )}
          </>
        }
        contentContainerStyle={styles.flatListContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={styles.spinner.color}
          />
        }
      />

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={closeDetails}
          order={selectedOrder}
          onUpdateStatus={updateStatusMutation.mutate}
          isUpdatingStatus={updateStatusMutation.isPending}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F0E9", // bg-background
  },
  flatListContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
  },

  // Cabeçalho
  headerContainer: {
    marginBottom: 32,
    flexDirection: "column",
    gap: 16,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#736C63", // text-muted-foreground
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: "serif", // Placeholder, use a custom font if available
    fontSize: 32,
    fontWeight: "bold",
    color: "#2C1B10", // text-foreground
    lineHeight: 36,
  },
  headerDate: {
    fontSize: 14,
    color: "#736C63", // text-muted-foreground
    marginTop: 6,
  },
  refreshContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  refreshText: {
    fontSize: 12,
    color: "#736C63", // text-muted-foreground
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderColor: "#D4C7B8", // border-border/60
    borderWidth: 1,
    backgroundColor: "#FFFFFF", // bg-card
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2C1B10", // text-foreground
  },
  spinner: {
    // This will be animated in the component
  },

  // Cards de Métricas
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 32,
  },
  summaryCardBase: {
    backgroundColor: "#FFFFFF", // bg-card
    borderColor: "#D4C7B8", // border-border/60
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    width: "48%", // Aproximadamente 2 colunas
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryCardIconContainer: {
    padding: 10,
    borderRadius: 12,
    flexShrink: 0,
  },
  summaryCardTextContent: {
    flexShrink: 1,
  },
  summaryCardLabel: {
    fontSize: 10,
    color: "#736C63", // text-muted-foreground
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "serif", // Placeholder
    color: "#2C1B10", // text-foreground
    lineHeight: 28,
  },
  summaryCardSub: {
    fontSize: 12,
    color: "#736C63", // text-muted-foreground
    marginTop: 4,
  },
  accentPrimary: {
    backgroundColor: "rgba(139, 94, 60, 0.1)", // bg-primary/10
    color: "#8B5E3C", // text-primary
  },
  accentEmerald: {
    backgroundColor: "rgba(16, 185, 129, 0.1)", // bg-emerald-500/10
    color: "#10B981", // text-emerald-600
  },
  accentAmber: {
    backgroundColor: "rgba(245, 158, 11, 0.1)", // bg-amber-500/10
    color: "#F59E0B", // text-amber-600
  },
  accentBlue: {
    backgroundColor: "rgba(59, 130, 246, 0.1)", // bg-blue-500/10
    color: "#3B82F6", // text-blue-600
  },
  accentGreen: {
    backgroundColor: "rgba(34, 197, 94, 0.1)", // bg-green-500/10
    color: "#22C55E", // text-green-600
  },

  // Filtros
  filtersContainer: {
    backgroundColor: "#FFFFFF", // bg-card
    borderColor: "#D4C7B8", // border-border/60
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  searchFilterRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  searchInputWrapper: {
    flex: 1,
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputIcon: {
    position: "absolute",
    left: 12,
    color: "#736C63", // text-muted-foreground
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: "#F5F0E9", // bg-background
    borderRadius: 12,
    fontSize: 14,
    color: "#2C1B10", // text-foreground
  },
  searchInputPlaceholder: {
    color: "#A19B93", // text-muted-foreground
  },
  clearSearchButton: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  clearSearchButtonIcon: {
    color: "#736C63", // text-muted-foreground
  },
  filterToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderColor: "#D4C7B8", // border-border/60
    borderWidth: 1,
    backgroundColor: "#FFFFFF", // bg-card
    flexShrink: 0,
  },
  filterToggleButtonActive: {
    borderColor: "rgba(139, 94, 60, 0.4)", // border-primary/40
    backgroundColor: "rgba(139, 94, 60, 0.05)", // bg-primary/5
  },
  filterToggleButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#736C63", // text-muted-foreground
  },
  filterToggleButtonActiveText: {
    color: "#8B5E3C", // text-primary
  },
  activeFilterDot: {
    marginLeft: 2,
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "#8B5E3C", // bg-primary
  },
  expandedFilters: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: "rgba(212, 199, 184, 0.4)", // border-border/40
    marginTop: 12,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#736C63", // text-muted-foreground
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  statusFilterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D4C7B8", // border-border/60
    backgroundColor: "#FFFFFF", // bg-card
  },
  statusFilterButtonActive: {
    backgroundColor: "#2C1B10", // bg-foreground
    borderColor: "#2C1B10", // border-foreground
  },
  statusFilterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#736C63", // text-muted-foreground
  },
  statusFilterButtonActiveText: {
    color: "#FFFFFF", // text-background
  },
  clearFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  clearFiltersButtonText: {
    fontSize: 12,
    color: "#736C63", // text-muted-foreground
  },
  activeFiltersDisplay: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "rgba(212, 199, 184, 0.4)", // border-border/40
    marginTop: 12,
  },
  activeFiltersLabel: {
    fontSize: 12,
    color: "#736C63", // text-muted-foreground
  },
  activeFilterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F5F0E9", // bg-muted
    borderColor: "#D4C7B8", // border-border/60
    borderWidth: 1,
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeFilterBadgeText: {
    fontSize: 12,
    color: "#2C1B10", // text-foreground
  },
  removeFilterButton: {
    marginLeft: 2,
  },
  removeFilterButtonIcon: {
    color: "#EF4444", // hover:text-red-500
  },

  // Lista de Pedidos Header
  ordersListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(212, 199, 184, 0.5)", // border-border/50
    backgroundColor: "#FFFFFF", // bg-card
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 24,
  },
  ordersListHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ordersListHeaderIcon: {
    color: "#8B5E3C", // text-primary
  },
  ordersListHeaderTitle: {
    fontFamily: "serif", // Placeholder
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C1B10", // text-foreground
  },
  ordersCountBadge: {
    backgroundColor: "#F5F0E9", // bg-muted
    borderColor: "#D4C7B8", // border-border/60
    borderWidth: 1,
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ordersCountText: {
    fontSize: 12,
    color: "#736C63", // text-muted-foreground
  },
  sortOptionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sortOptionsLabel: {
    fontSize: 12,
    color: "#736C63", // text-muted-foreground
  },
  sortOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D4C7B8", // border-border/60
  },
  sortOptionButtonActive: {
    borderColor: "rgba(139, 94, 60, 0.4)", // border-primary/40
    backgroundColor: "rgba(139, 94, 60, 0.05)", // bg-primary/5
  },
  sortOptionButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#736C63", // text-muted-foreground
  },
  sortOptionButtonActiveText: {
    color: "#8B5E3C", // text-primary
  },

  // Loading / Empty State
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    backgroundColor: "#FFFFFF", // bg-card
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#736C63", // text-muted-foreground
    marginTop: 12,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    backgroundColor: "#FFFFFF", // bg-card
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
  },
  emptyStateIconWrapper: {
    height: 64,
    width: 64,
    borderRadius: 16,
    backgroundColor: "#F5F0E9", // bg-muted
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateIcon: {
    color: "rgba(115, 108, 99, 0.5)", // text-muted-foreground/50
  },
  emptyStateTitle: {
    fontFamily: "serif", // Placeholder
    fontSize: 18,
    fontWeight: "600",
    color: "#2C1B10", // text-foreground
    marginBottom: 4,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#736C63", // text-muted-foreground
    textAlign: "center",
    marginBottom: 16,
  },
  emptyStateClearFiltersButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D4C7B8", // border-border/60
    backgroundColor: "#FFFFFF", // bg-card
  },
  emptyStateClearFiltersButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2C1B10", // text-foreground
  },

  // Order Card (Mobile)
  orderCardBase: {
    backgroundColor: "#FFFFFF", // bg-card
    borderColor: "#D4C7B8", // border-border/60
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 12,
  },
  orderCardAccentBar: {
    height: 4,
    width: "100%",
  },
  orderCardContent: {
    padding: 16,
    gap: 12,
  },
  orderCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  orderCardId: {
    fontFamily: "monospace", // font-mono
    fontSize: 14,
    fontWeight: "bold",
    color: "#2C1B10", // text-foreground
  },
  orderCardEmail: {
    fontSize: 12,
    color: "#736C63", // text-muted-foreground
    maxWidth: 180,
  },
  orderCardItemsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  orderCardItemBadge: {
    backgroundColor: "#F5F0E9", // bg-muted
    borderColor: "#D4C7B8", // border-border/60
    borderWidth: 1,
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  orderCardItemText: {
    fontSize: 11,
    color: "#736C63", // text-muted-foreground
  },
  orderCardMoreItemsText: {
    fontSize: 11,
    color: "#736C63", // text-muted-foreground
  },
  orderCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "rgba(212, 199, 184, 0.4)", // border-border/40
  },
  orderCardFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  orderCardTotalPrice: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace", // font-mono
    color: "#2C1B10", // text-foreground
  },
  orderCardDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D4C7B8", // border-border/60
    backgroundColor: "rgba(245, 240, 233, 0.3)", // bg-muted/30
  },
  orderCardDetailsButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#736C63", // text-muted-foreground
  },

  // Paginação
  paginationContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: "rgba(212, 199, 184, 0.5)", // border-border/50
    backgroundColor: "#FFFFFF", // bg-card
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    gap: 12,
  },
  paginationText: {
    fontSize: 12,
    color: "#736C63", // text-muted-foreground
  },
  paginationButtons: {
    flexDirection: "row",
    gap: 8,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D4C7B8", // border-border/60
    backgroundColor: "#FFFFFF", // bg-card
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2C1B10", // text-foreground
  },

  // Fetch silencioso
  silentFetchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "rgba(212, 199, 184, 0.3)", // border-border/30
    backgroundColor: "#FFFFFF", // bg-card
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginTop: -1, // Overlap with pagination border
  },
  silentFetchText: {
    fontSize: 12,
    color: "#736C63", // text-muted-foreground
  },

  // Status Badges
  badgeBase: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999, // rounded-full
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dotBase: {
    height: 6,
    width: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  badgeAmber: {
    backgroundColor: "rgba(255, 247, 237, 0.8)", // bg-amber-50
    borderColor: "rgba(254, 243, 199, 0.8)", // border-amber-200
    color: "#B45309", // text-amber-700
  },
  dotAmber: { backgroundColor: "#FBBF24" }, // bg-amber-400
  badgeBlue: {
    backgroundColor: "rgba(239, 246, 255, 0.8)", // bg-blue-50
    borderColor: "rgba(191, 219, 254, 0.8)", // border-blue-200
    color: "#1D4ED8", // text-blue-700
  },
  dotBlue: { backgroundColor: "#60A5FA" }, // bg-blue-400 animate-pulse
  badgeEmerald: {
    backgroundColor: "rgba(236, 253, 245, 0.8)", // bg-emerald-50
    borderColor: "rgba(209, 250, 229, 0.8)", // border-emerald-200
    color: "#047857", // text-emerald-700
  },
  dotEmerald: { backgroundColor: "#34D399" }, // bg-emerald-400
  badgeIndigo: {
    backgroundColor: "rgba(238, 242, 255, 0.8)", // bg-indigo-50
    borderColor: "rgba(199, 210, 254, 0.8)", // border-indigo-200
    color: "#4338CA", // text-indigo-700
  },
  dotIndigo: { backgroundColor: "#818CF8" }, // bg-indigo-400
  badgeGreen: {
    backgroundColor: "rgba(240, 253, 244, 0.8)", // bg-green-50
    borderColor: "rgba(220, 252, 231, 0.8)", // border-green-200
    color: "#15803D", // text-green-700
  },
  dotGreen: { backgroundColor: "#22C55E" }, // bg-green-500
  badgeRed: {
    backgroundColor: "rgba(254, 242, 242, 0.8)", // bg-red-50
    borderColor: "rgba(254, 202, 202, 0.8)", // border-red-200
    color: "#B91C1C", // text-red-700
  },
  dotRed: { backgroundColor: "#EF4444" }, // bg-red-400
  badgeRose: {
    backgroundColor: "rgba(255, 241, 242, 0.8)", // bg-rose-50
    borderColor: "rgba(255, 205, 210, 0.8)", // border-rose-200
    color: "#E11D48", // text-rose-700
  },
  dotRose: { backgroundColor: "#FB7185" }, // bg-rose-400

  // Elapsed Timer
  elapsedTimerBase: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  elapsedTimerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  elapsedTimerCritical: { color: "#EF4444" }, // text-red-500
  elapsedTimerWarning: { color: "#F59E0B" }, // text-amber-500
  elapsedTimerNormal: { color: "#736C63" }, // text-muted-foreground

  // Modal Styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: "serif",
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C1B10",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: "#5A4A3B",
    marginBottom: 8,
  },
  modalItemsContainer: {
    marginTop: 12,
    marginBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#E5E0D9",
  },
  modalItemText: {
    fontSize: 14,
    color: "#5A4A3B",
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    backgroundColor: "#8B5E3C",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonSecondary: {
    backgroundColor: "#D4C7B8",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonDisabled: {
    opacity: 0.7,
  },
});