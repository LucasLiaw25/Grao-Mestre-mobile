import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Eye,
  Edit,
  Filter,
  Loader2,
  FileText,
  ShoppingBag,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Ban,
  X,
  TrendingUp,
  Package,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, {
  Layout,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"; // Assumindo que você tem um componente de Dialog adaptado para RN
import { Switch } from "@/components/ui/switch"; // Assumindo que você tem um componente de Switch adaptado para RN
import { useToast } from "@/hooks/use-toast"; // Assumindo que você tem um hook de toast adaptado para RN
import { ordersApi, usersApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format"; // Adapte para RN se necessário
import type {
  OrderResponseDTO,
  OrderStatus,
  TimePeriod,
  PaymentMethod,
  PageableResponse,
  UserResponseDTO,
} from "@/types";
import { Pagination } from "@/components/Pagination"; // Adapte para RN se necessário
import OrderDetailsModal from "@/components/OrderDetailModal"; // Adapte para RN se necessário

type StatusFilter = "ALL" | OrderStatus;

const STATUS_FILTER_CONFIG: {
  value: StatusFilter;
  label: string;
  activeClass: string;
  icon: React.ReactNode;
  badgeClass: string;
}[] = [
  {
    value: "ALL",
    label: "Todos",
    activeClass: "bg-stone-800 text-amber-50 border-stone-800",
    icon: <Package size={14} color="#a8a29e" />,
    badgeClass: "bg-stone-200 text-stone-700",
  },
  {
    value: OrderStatus.PENDING,
    label: "Pendente",
    activeClass: "bg-amber-700 text-amber-50 border-amber-700",
    icon: <Clock size={14} color="#f59e0b" />,
    badgeClass: "bg-amber-100 text-amber-800",
  },
  {
    value: OrderStatus.PROCESSING,
    label: "Processando",
    activeClass: "bg-indigo-700 text-indigo-50 border-indigo-700",
    icon: <RefreshCw size={14} color="#4f46e5" />,
    badgeClass: "bg-indigo-100 text-indigo-800",
  },
  {
    value: OrderStatus.PAID,
    label: "Pago",
    activeClass: "bg-emerald-700 text-emerald-50 border-emerald-700",
    icon: <CheckCircle2 size={14} color="#10b981" />,
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  {
    value: OrderStatus.COMPLETED,
    label: "Concluído",
    activeClass: "bg-teal-700 text-teal-50 border-teal-700",
    icon: <CheckCircle2 size={14} color="#14b8a6" />,
    badgeClass: "bg-teal-100 text-teal-800",
  },
  {
    value: OrderStatus.SENDED,
    label: "Enviado",
    activeClass: "bg-blue-700 text-blue-50 border-blue-700",
    icon: <Send size={14} color="#3b82f6" />,
    badgeClass: "bg-blue-100 text-blue-800",
  },
  {
    value: OrderStatus.CANCELED,
    label: "Cancelado",
    activeClass: "bg-red-800 text-red-50 border-red-800",
    icon: <XCircle size={14} color="#ef4444" />,
    badgeClass: "bg-red-100 text-red-800",
  },
  {
    value: OrderStatus.RECUSE,
    label: "Recusado",
    activeClass: "bg-rose-800 text-rose-50 border-rose-800",
    icon: <Ban size={14} color="#e11d48" />,
    badgeClass: "bg-rose-100 text-rose-800",
  },
];

const TIME_PERIOD_CONFIG: {
  value: TimePeriod | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "Todo período" },
  { value: TimePeriod.TODAY, label: "Hoje" },
  { value: TimePeriod.YESTERDAY, label: "Ontem" },
  { value: TimePeriod.THIS_WEEK, label: "Esta semana" },
  { value: TimePeriod.LAST_WEEK, label: "Semana passada" },
  { value: TimePeriod.THIS_MONTH, label: "Este mês" },
  { value: TimePeriod.LAST_MONTH, label: "Mês passado" },
  { value: TimePeriod.CUSTOM, label: "Personalizado" },
];

const STATUS_STYLE_MAP: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "bg-amber-50 text-amber-800 border border-amber-200",
  [OrderStatus.PROCESSING]: "bg-indigo-50 text-indigo-800 border border-indigo-200",
  [OrderStatus.PAID]: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  [OrderStatus.COMPLETED]: "bg-teal-50 text-teal-800 border border-teal-200",
  [OrderStatus.SENDED]: "bg-blue-50 text-blue-800 border border-blue-200",
  [OrderStatus.CANCELED]: "bg-red-50 text-red-800 border border-red-200",
  [OrderStatus.RECUSE]: "bg-rose-50 text-rose-800 border border-rose-200",
};

const METRIC_CONFIG = [
  {
    status: OrderStatus.PENDING,
    label: "Pendentes",
    icon: <Clock size={16} color="#f59e0b" />,
    colorClass: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-100",
    iconBg: "bg-amber-100",
  },
  {
    status: OrderStatus.PROCESSING,
    label: "Processando",
    icon: <RefreshCw size={16} color="#4f46e5" />,
    colorClass: "text-indigo-700",
    bgClass: "bg-indigo-50 border-indigo-100",
    iconBg: "bg-indigo-100",
  },
  {
    status: OrderStatus.COMPLETED,
    label: "Concluídos",
    icon: <CheckCircle2 size={16} color="#14b8a6" />,
    colorClass: "text-teal-700",
    bgClass: "bg-teal-50 border-teal-100",
    iconBg: "bg-teal-100",
  },
  {
    status: OrderStatus.CANCELED,
    label: "Cancelados",
    icon: <XCircle size={16} color="#dc2626" />,
    colorClass: "text-red-700",
    bgClass: "bg-red-50 border-red-100",
    iconBg: "bg-red-100",
  },
];

const getTailwindStyles = (tailwindString: string) => {
  const styles: any = {};
  const parts = tailwindString.split(" ");

  parts.forEach((part) => {
    if (part.startsWith("bg-")) {
      const color = part.replace("bg-", "");
      if (color === "stone-800") styles.backgroundColor = "#292524";
      else if (color === "stone-900") styles.backgroundColor = "#1c1917";
      else if (color === "amber-50") styles.backgroundColor = "#fffbeb";
      else if (color === "emerald-700") styles.backgroundColor = "#047857";
      else if (color === "emerald-50") styles.backgroundColor = "#ecfdf5";
      else if (color === "red-800") styles.backgroundColor = "#991b1b";
      else if (color === "red-50") styles.backgroundColor = "#fef2f2";
      else if (color === "stone-200") styles.backgroundColor = "#e7e5e4";
      else if (color === "emerald-100") styles.backgroundColor = "#d1fae5";
      else if (color === "red-100") styles.backgroundColor = "#fee2e2";
      else if (color === "stone-50") styles.backgroundColor = "#fafaf9";
      else if (color === "indigo-50") styles.backgroundColor = "#eef2ff";
      else if (color === "blue-50") styles.backgroundColor = "#eff6ff";
      else if (color === "teal-50") styles.backgroundColor = "#f0fdfa";
      else if (color === "white/20") styles.backgroundColor = "rgba(255,255,255,0.2)";
      else if (color === "stone-100") styles.backgroundColor = "#f5f5f4";
      else if (color === "background") styles.backgroundColor = "#ffffff"; // Default background
      else if (color === "card") styles.backgroundColor = "#ffffff"; // Default card background
      else if (color === "amber-700") styles.backgroundColor = "#b45309";
      else if (color === "indigo-700") styles.backgroundColor = "#4338ca";
      else if (color === "teal-700") styles.backgroundColor = "#0f766e";
      else if (color === "blue-700") styles.backgroundColor = "#1d4ed8";
      else if (color === "rose-800") styles.backgroundColor = "#9f1239";
      else if (color === "rose-50") styles.backgroundColor = "#fff1f2";
      else if (color === "rose-100") styles.backgroundColor = "#ffe4e6";
      else if (color === "amber-200") styles.backgroundColor = "#fde68a";
      else if (color === "indigo-200") styles.backgroundColor = "#c7d2fe";
      else if (color === "emerald-200") styles.backgroundColor = "#a7f3d0";
      else if (color === "teal-200") styles.backgroundColor = "#99f6e4";
      else if (color === "blue-200") styles.backgroundColor = "#bfdbfe";
      else if (color === "red-200") styles.backgroundColor = "#fecaca";
      else if (color === "rose-200") styles.backgroundColor = "#fbcfe8";
    } else if (part.startsWith("text-")) {
      const color = part.replace("text-", "");
      if (color === "amber-50") styles.color = "#fffbeb";
      else if (color === "stone-700") styles.color = "#44403c";
      else if (color === "emerald-50") styles.color = "#ecfdf5";
      else if (color === "emerald-800") styles.color = "#065f46";
      else if (color === "red-50") styles.color = "#fef2f2";
      else if (color === "red-800") styles.color = "#991b1b";
      else if (color === "indigo-700") styles.color = "#4338ca";
      else if (color === "blue-700") styles.color = "#1d4ed8";
      else if (color === "teal-700") styles.color = "#0f766e";
      else if (color === "stone-500") styles.color = "#78716c";
      else if (color === "amber-700") styles.color = "#b45309";
      else if (color === "foreground") styles.color = "#0c0a09"; // Default foreground
      else if (color === "stone-600") styles.color = "#57534e";
      else if (color === "red-600") styles.color = "#dc2626";
      else if (color === "stone-400") styles.color = "#a8a29e";
      else if (color === "amber-800") styles.color = "#92400e";
      else if (color === "indigo-800") styles.color = "#3730a3";
      else if (color === "teal-800") styles.color = "#065f46";
      else if (color === "blue-800") styles.color = "#1e40af";
      else if (color === "rose-800") styles.color = "#9f1239";
      else if (color === "red-700") styles.color = "#b91c1c";
      else if (color === "stone-300") styles.color = "#d6d3d1";
    } else if (part.startsWith("border-")) {
      const color = part.replace("border-", "");
      if (color === "stone-800") styles.borderColor = "#292524";
      else if (color === "stone-200") styles.borderColor = "#e7e5e4";
      else if (color === "emerald-700") styles.borderColor = "#047857";
      else if (color === "emerald-100") styles.borderColor = "#d1fae5";
      else if (color === "red-100") styles.borderColor = "#fee2e2";
      else if (color === "stone-100") styles.borderColor = "#f5f5f4";
      else if (color === "indigo-100") styles.borderColor = "#e0e7ff";
      else if (color === "blue-100") styles.borderColor = "#dbeafe";
      else if (color === "teal-100") styles.borderColor = "#ccfbf1";
      else if (color === "border/60") styles.borderColor = "rgba(229,231,235,0.6)"; // Assuming border is stone-200
      else if (color === "border/50") styles.borderColor = "rgba(229,231,235,0.5)";
      else if (color === "dashed") styles.borderStyle = "dashed";
      else if (color === "amber-100") styles.borderColor = "#fde68a";
      else if (color === "amber-700") styles.borderColor = "#b45309";
      else if (color === "indigo-700") styles.borderColor = "#4338ca";
      else if (color === "teal-700") styles.borderColor = "#0f766e";
      else if (color === "blue-700") styles.borderColor = "#1d4ed8";
      else if (color === "rose-800") styles.borderColor = "#9f1239";
      else if (color === "amber-200") styles.borderColor = "#fde68a";
      else if (color === "indigo-200") styles.borderColor = "#c7d2fe";
      else if (color === "emerald-200") styles.borderColor = "#a7f3d0";
      else if (color === "teal-200") styles.borderColor = "#99f6e4";
      else if (color === "blue-200") styles.borderColor = "#bfdbfe";
      else if (color === "red-200") styles.borderColor = "#fecaca";
      else if (color === "rose-200") styles.borderColor = "#fbcfe8";
      else if (color === "stone-300") styles.borderColor = "#d6d3d1";
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
    } else if (part.startsWith("pl-")) {
      styles.paddingLeft = parseInt(part.replace("pl-", "")) * 4;
    } else if (part.startsWith("pr-")) {
      styles.paddingRight = parseInt(part.replace("pr-", "")) * 4;
    } else if (part.startsWith("m-")) {
      styles.margin = parseInt(part.replace("m-", "")) * 4;
    } else if (part.startsWith("mt-")) {
      styles.marginTop = parseInt(part.replace("mt-", "")) * 4;
    } else if (part.startsWith("mb-")) {
      styles.marginBottom = parseInt(part.replace("mb-", "")) * 4;
    } else if (part.startsWith("ml-")) {
      styles.marginLeft = parseInt(part.replace("ml-", "")) * 4;
    } else if (part.startsWith("mr-")) {
      styles.marginRight = parseInt(part.replace("mr-", "")) * 4;
    } else if (part.startsWith("gap-")) {
      styles.gap = parseInt(part.replace("gap-", "")) * 4;
    } else if (part.startsWith("w-")) {
      styles.width = parseInt(part.replace("w-", "")) * 4;
    } else if (part.startsWith("h-")) {
      styles.height = parseInt(part.replace("h-", "")) * 4;
    } else if (part.startsWith("min-w-")) {
      styles.minWidth = parseInt(part.replace("min-w-", "")) * 4;
    } else if (part.startsWith("rounded-")) {
      if (part === "rounded-full") styles.borderRadius = 9999;
      else if (part === "rounded-xl") styles.borderRadius = 12;
      else if (part === "rounded-2xl") styles.borderRadius = 16;
      else if (part === "rounded-lg") styles.borderRadius = 8;
    } else if (part === "flex") styles.display = "flex";
    else if (part === "flex-col") styles.flexDirection = "column";
    else if (part === "flex-row") styles.flexDirection = "row";
    else if (part === "items-center") styles.alignItems = "center";
    else if (part === "justify-center") styles.justifyContent = "center";
    else if (part === "justify-between") styles.justifyContent = "space-between";
    else if (part === "flex-wrap") styles.flexWrap = "wrap";
    else if (part === "flex-1") styles.flex = 1;
    else if (part === "shrink-0") styles.flexShrink = 0;
    else if (part === "min-h-screen") styles.minHeight = "100%";
    else if (part === "text-sm") styles.fontSize = 14;
    else if (part === "text-xs") styles.fontSize = 12;
    else if (part === "text-[10px]") styles.fontSize = 10;
    else if (part === "text-lg") styles.fontSize = 18;
    else if (part === "text-xl") styles.fontSize = 20;
    else if (part === "text-2xl") styles.fontSize = 24;
    else if (part === "text-4xl") styles.fontSize = 36;
    else if (part === "font-bold") styles.fontWeight = "700";
    else if (part === "font-black") styles.fontWeight = "900";
    else if (part === "font-semibold") styles.fontWeight = "600";
    else if (part === "font-medium") styles.fontWeight = "500";
    else if (part === "uppercase") styles.textTransform = "uppercase";
    else if (part === "tracking-tight") styles.letterSpacing = -0.5;
    else if (part === "tracking-wider") styles.letterSpacing = 0.5;
    else if (part === "tracking-widest") styles.letterSpacing = 1;
    else if (part === "text-left") styles.textAlign = "left";
    else if (part === "text-right") styles.textAlign = "right";
    else if (part === "text-center") styles.textAlign = "center";
    else if (part === "relative") styles.position = "relative";
    else if (part === "absolute") styles.position = "absolute";
    else if (part === "top-1/2") styles.top = "50%";
    else if (part === "-translate-y-1/2") styles.transform = [{ translateY: -50 }];
    else if (part === "outline-none") styles.outlineWidth = 0;
    else if (part === "shadow-sm") styles.shadowColor = "#000";
    else if (part === "shadow-sm") styles.shadowOffset = { width: 0, height: 1 };
    else if (part === "shadow-sm") styles.shadowOpacity = 0.05;
    else if (part === "shadow-sm") styles.shadowRadius = 2;
    else if (part === "elevation-1") styles.elevation = 1; // Android shadow
    else if (part === "transition-all") styles.transitionProperty = "all";
    else if (part === "hover:bg-stone-900") styles.hoverBgStone900 = "#1c1917";
    else if (part === "hover:bg-stone-50") styles.hoverBgStone50 = "#fafaf9";
    else if (part === "hover:border-stone-400") styles.hoverBorderStone400 = "#a8a29e";
    else if (part === "hover:text-red-600") styles.hoverTextRed600 = "#dc2626";
    else if (part === "hover:bg-stone-100") styles.hoverBgStone100 = "#f5f5f4";
    else if (part === "hover:text-stone-700") styles.hoverTextStone700 = "#44403c";
    else if (part === "hover:bg-red-50") styles.hoverBgRed50 = "#fef2f2";
    else if (part === "hover:bg-red-100") styles.hoverBgRed100 = "#fee2e2";
    else if (part === "hover:bg-stone-200") styles.hoverBgStone200 = "#e7e5e4";
    else if (part === "hover:border-stone-300") styles.hoverBorderStone300 = "#d6d3d1";
    else if (part === "hover:bg-red-50") styles.hoverBgRed50 = "#fef2f2";
    else if (part === "hover:border-red-200") styles.hoverBorderRed200 = "#fecaca";
    else if (part === "hover:text-red-700") styles.hoverTextRed700 = "#b91c1c";
    else if (part === "disabled:opacity-50") styles.disabledOpacity50 = 0.5;
    else if (part === "opacity-80") styles.opacity = 0.8;
    else if (part === "opacity-50") styles.opacity = 0.5;
    else if (part === "overflow-hidden") styles.overflow = "hidden";
    else if (part === "overflow-x-auto") styles.overflowX = "scroll";
    else if (part === "overflow-y-auto") styles.overflowY = "scroll";
    else if (part === "divide-y") styles.borderBottomWidth = 1;
    else if (part === "divide-border/50") styles.borderBottomColor = "rgba(229,231,235,0.5)";
    else if (part === "whitespace-nowrap") styles.whiteSpace = "nowrap";
    else if (part === "truncate") styles.overflow = "hidden";
    else if (part === "truncate") styles.whiteSpace = "nowrap";
    else if (part === "truncate") styles.textOverflow = "ellipsis";
    else if (part === "underline") styles.textDecorationLine = "underline";
    else if (part === "underline-offset-2") styles.textUnderlineOffset = 2;
    else if (part === "border") styles.borderWidth = 1;
    else if (part === "inset-0") styles.position = "absolute";
    else if (part === "inset-0") styles.top = 0;
    else if (part === "inset-0") styles.bottom = 0;
    else if (part === "inset-0") styles.left = 0;
    else if (part === "inset-0") styles.right = 0;
    else if (part === "z-50") styles.zIndex = 50;
    else if (part === "max-w-7xl") styles.maxWidth = 1280;
    else if (part === "mx-auto") styles.marginHorizontal = "auto";
    else if (part === "sm:px-6") styles.paddingHorizontalSm = 24;
    else if (part === "lg:px-8") styles.paddingHorizontalLg = 32;
    else if (part === "sm:flex-row") styles.flexDirectionSm = "row";
    else if (part === "sm:items-center") styles.alignItemsSm = "center";
    else if (part === "sm:justify-between") styles.justifyContentSm = "space-between";
    else if (part === "sm:w-72") styles.widthSm = 288;
    else if (part === "ring-2") styles.borderWidth = 2;
    else if (part === "ring-offset-1") styles.borderOffset = 4; // Not directly translatable, adjust as needed
    else if (part === "ring-stone-400") styles.borderColor = "#a8a29e"; // Simulate ring color
    else if (part === "max-h-[70vh]") styles.maxHeight = "70%";
  });

  return styles;
};

const cn = (...args: (string | undefined | null | false | { [key: string]: boolean })[]) => {
  const classNames = args.filter(Boolean).map(arg => {
    if (typeof arg === 'object') {
      return Object.keys(arg).filter(key => arg[key]).join(' ');
    }
    return arg;
  }).join(" ");
  return getTailwindStyles(classNames);
};

const OrderManagement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDTO | null>(null);

  const [filterStatus, setFilterStatus] = useState<StatusFilter>("ALL");
  const [filterTimePeriod, setFilterTimePeriod] = useState<TimePeriod | "ALL">("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [filterUserId, setFilterUserId] = useState<string>("ALL");
  const [filterOrderId, setFilterOrderId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [sort] = useState("orderDate,desc");

  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  const { data: users, isLoading: isLoadingUsers } = useQuery<UserResponseDTO[], Error>({
    queryKey: ["users"],
    queryFn: async () => (await usersApi.getAll()).data,
    staleTime: 5 * 60 * 1000,
  });

  const filterParams = useMemo(() => {
    const params: Record<string, unknown> = { page, size, sort };

    if (filterStatus !== "ALL") params.status = filterStatus;
    if (filterUserId !== "ALL" && !isNaN(parseInt(filterUserId)))
      params.userId = parseInt(filterUserId);
    if (filterOrderId) params.orderId = parseInt(filterOrderId);
    if (filterTimePeriod !== "ALL") {
      params.period = filterTimePeriod;
      if (filterTimePeriod === TimePeriod.CUSTOM) {
        if (customStartDate) params.startDate = customStartDate;
        if (customEndDate) params.endDate = customEndDate;
      }
    }

    return params;
  }, [filterStatus, filterTimePeriod, customStartDate, customEndDate, filterUserId, filterOrderId, page, size, sort]);

  const {
    data: ordersPage,
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useQuery<PageableResponse<OrderResponseDTO>, Error>({
    queryKey: ["orders", filterParams],
    queryFn: async () => (await ordersApi.filter(filterParams)).data,
    placeholderData: (prev) => prev,
  });

  const orders = ordersPage?.content ?? [];
  const totalPages = ordersPage?.totalPages ?? 0;
  const totalElements = ordersPage?.totalElements ?? 0;

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o.userEmail?.toLowerCase().includes(term) ||
        o.id?.toString().includes(term)
    );
  }, [orders, searchTerm]);

  const countByStatus = (status: OrderStatus) =>
    orders.filter((o) => o.orderStatus === status).length;

  const hasActiveFilters =
    filterStatus !== "ALL" ||
    filterTimePeriod !== "ALL" ||
    filterUserId !== "ALL" ||
    !!filterOrderId ||
    !!searchTerm;

  const clearAllFilters = () => {
    setFilterStatus("ALL");
    setFilterTimePeriod("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
    setFilterUserId("ALL");
    setFilterOrderId("");
    setSearchTerm("");
    setPage(0);
  };

  const openDetailsModal = (order: OrderResponseDTO) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedOrder(null);
  };

  const updateOrderStatusMutation = useMutation({
    mutationFn: (data: { orderId: number; newStatus: OrderStatus }) =>
      ordersApi.updateOrderStatus(data.orderId, data.newStatus),
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Status do pedido atualizado." });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      closeDetailsModal();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status.",
        variant: "destructive",
      });
    },
  });

  if (isLoadingOrders || isLoadingUsers) {
    return (
      <SafeAreaView style={cn("min-h-screen bg-background flex items-center justify-center")}>
        <View style={cn("flex flex-col items-center gap-3")}>
          <ActivityIndicator size="large" color="#a8a29e" />
          <Text style={cn("text-stone-500 text-sm font-medium")}>
            Carregando pedidos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (ordersError) {
    return (
      <SafeAreaView style={cn("min-h-screen bg-background flex items-center justify-center")}>
        <View style={cn("text-center space-y-2")}>
          <AlertCircle size={40} color="#dc2626" style={cn("mx-auto")} />
          <Text style={cn("text-xl font-serif font-bold text-red-700")}>
            Erro ao carregar pedidos
          </Text>
          <Text style={cn("text-stone-500 text-sm")}>Tente novamente mais tarde.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={cn("min-h-screen bg-background")}>
      <ScrollView contentContainerStyle={cn("pt-6 pb-6")} style={cn("flex-1")}>
        <View style={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8")}>
          <Animated.View
            entering={FadeIn.duration(400).delay(0)}
            style={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4")}
          >
            <View>
              <Text style={cn("font-serif text-4xl font-bold text-foreground tracking-tight")}>
                Gestão de Pedidos
              </Text>
              <Text style={cn("text-stone-500 text-sm mt-1")}>
                {totalElements > 0
                  ? `${totalElements} pedidos encontrados`
                  : "Nenhum pedido no período"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert("Relatório de Vendas", "Funcionalidade de relatório de vendas.")}
              style={cn("inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-background px-5 py-2.5 text-sm font-semibold text-stone-700", { hoverBgStone50: true })}
            >
              <FileText size={16} color="#44403c" />
              <Text style={cn("text-stone-700 text-sm font-semibold")}>Relatório de Vendas</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(50)}
            style={cn("grid grid-cols-2 lg:grid-cols-4 gap-3")}
          >
            {METRIC_CONFIG.map((m) => (
              <TouchableOpacity
                key={m.status}
                onPress={() =>
                  setFilterStatus(
                    filterStatus === m.status ? "ALL" : m.status
                  )
                }
                style={cn(
                  "rounded-2xl border p-4 flex flex-col gap-2 text-left transition-all",
                  m.bgClass,
                  filterStatus === m.status && "border-2 border-stone-400" // Simulate ring
                )}
                activeOpacity={0.7}
              >
                <View style={cn("w-8 h-8 rounded-xl flex items-center justify-center", m.iconBg)}>
                  <Text style={cn(m.colorClass)}>{m.icon}</Text>
                </View>
                <View>
                  <Text style={cn("text-2xl font-black", m.colorClass)}>
                    {countByStatus(m.status)}
                  </Text>
                  <Text style={cn("text-xs font-semibold mt-0.5 opacity-80", m.colorClass)}>
                    {m.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(100)}
            style={cn("bg-card rounded-2xl border border-border/60 p-5 sm:p-6 space-y-4 shadow-sm")}
          >
            <View style={cn("flex items-center gap-2")}>
              <View style={cn("bg-stone-100 p-1.5 rounded-lg")}>
                <Calendar size={16} color="#57534e" />
              </View>
              <Text style={cn("text-xs font-black uppercase tracking-widest text-stone-500")}>
                Período
              </Text>
            </View>

            <View style={cn("flex flex-wrap gap-2")}>
              {TIME_PERIOD_CONFIG.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => {
                    setFilterTimePeriod(p.value);
                    setPage(0);
                  }}
                  style={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border",
                    filterTimePeriod === p.value
                      ? "bg-stone-800 text-amber-50 border-stone-800 shadow-sm"
                      : "bg-background border-stone-200 text-stone-600",
                    filterTimePeriod === p.value ? {} : { hoverBgStone50: true, hoverBorderStone300: true }
                  )}
                >
                  <Text style={cn(filterTimePeriod === p.value ? "text-amber-50" : "text-stone-600", "text-xs font-bold")}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filterTimePeriod === TimePeriod.CUSTOM && (
              <Animated.View
                entering={SlideInDown.duration(200)}
                exiting={SlideOutDown.duration(200)}
                style={cn("grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1")}
              >
                <View style={cn("space-y-1.5")}>
                  <Text style={cn("text-xs font-bold uppercase text-stone-500")}>
                    Data inicial
                  </Text>
                  <TextInput
                    value={customStartDate}
                    onChangeText={(text) => setCustomStartDate(text)}
                    placeholder="YYYY-MM-DD"
                    style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={cn("space-y-1.5")}>
                  <Text style={cn("text-xs font-bold uppercase text-stone-500")}>
                    Data final
                  </Text>
                  <TextInput
                    value={customEndDate}
                    onChangeText={(text) => setCustomEndDate(text)}
                    placeholder="YYYY-MM-DD"
                    style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                    keyboardType="number-pad"
                  />
                </View>
              </Animated.View>
            )}
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(150)}
            style={cn("space-y-4")}
          >
            <View style={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between")}>
              <View style={cn("space-y-2")}>
                <Text style={cn("text-xs font-black uppercase tracking-widest text-stone-500")}>
                  Status do Pedido
                </Text>
                <View style={cn("flex flex-wrap gap-2")}>
                  {STATUS_FILTER_CONFIG.map((f) => {
                    const isActive = filterStatus === f.value;
                    const count =
                      f.value === "ALL"
                        ? orders.length
                        : countByStatus(f.value as OrderStatus);
                    return (
                      <TouchableOpacity
                        key={f.value}
                        onPress={() => {
                          setFilterStatus(f.value);
                          setPage(0);
                        }}
                        style={cn(
                          "flex flex-row items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold border transition-all",
                          isActive
                            ? f.activeClass + " shadow-sm"
                            : "bg-background border-stone-200 text-stone-600",
                          isActive ? {} : { hoverBorderStone400: true, hoverBgStone50: true }
                        )}
                      >
                        {React.cloneElement(f.icon as React.ReactElement, {
                          color: isActive ? "#fffbeb" : "#a8a29e",
                        })}
                        <Text style={cn(isActive ? "text-amber-50" : "text-stone-600", "text-sm font-semibold")}>
                          {f.label}
                        </Text>
                        <Text
                          style={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                            isActive
                              ? "bg-white/20 text-white"
                              : f.badgeClass
                          )}
                        >
                          {count}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={cn("relative shrink-0")}>
                <Search size={16} color="#a8a29e" style={cn("absolute left-3 top-1/2 -translate-y-1/2")} />
                <TextInput
                  placeholder="Buscar por e-mail ou ID..."
                  value={searchTerm}
                  onChangeText={(text) => setSearchTerm(text)}
                  style={cn("w-full sm:w-72 pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-background text-sm text-foreground outline-none", { placeholderTextColor: "#a8a29e" })}
                />
              </View>
            </View>

            <View style={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3")}>
              <View style={cn("space-y-1.5")}>
                <Text style={cn("text-xs font-bold uppercase text-stone-500 flex flex-row items-center gap-1")}>
                  <Users size={12} color="#78716c" /> Filtrar por Usuário
                </Text>
                {/* Para Select, você precisaria de um componente de picker customizado ou de uma biblioteca */}
                <TouchableOpacity
                  onPress={() => Alert.alert("Seleção de Usuário", "Implementar um Picker para usuários.")}
                  style={cn("rounded-xl border-stone-200 bg-background px-3 py-2 flex flex-row items-center justify-between")}
                >
                  <Text style={cn("text-foreground")}>
                    {filterUserId === "ALL" ? "Todos os usuários" : users?.find(u => String(u.id) === filterUserId)?.name ?? "Usuário"}
                  </Text>
                  <ChevronDown size={16} color="#a8a29e" />
                </TouchableOpacity>
              </View>

              <View style={cn("space-y-1.5")}>
                <Text style={cn("text-xs font-bold uppercase text-stone-500 flex flex-row items-center gap-1")}>
                  <TrendingUp size={12} color="#78716c" /> Buscar por ID do Pedido
                </Text>
                <TextInput
                  value={filterOrderId}
                  onChangeText={(text) => { setFilterOrderId(text); setPage(0); }}
                  placeholder="Ex: 1042"
                  style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                  keyboardType="numeric"
                />
              </View>

              {hasActiveFilters && (
                <View style={cn("flex items-end")}>
                  <TouchableOpacity
                    onPress={clearAllFilters}
                    style={cn("w-full flex flex-row items-center justify-center gap-2 rounded-xl border border-stone-200 bg-background px-4 py-2.5 text-sm font-semibold text-stone-600", { hoverBgRed50: true, hoverBorderRed200: true, hoverTextRed700: true })}
                  >
                    <X size={16} color="#57534e" />
                    <Text style={cn("text-stone-600 text-sm font-semibold")}>Limpar Filtros</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {hasActiveFilters && (
              <Animated.View
                entering={FadeIn.duration(200).delay(0)}
                exiting={FadeOut.duration(200)}
                style={cn("flex flex-wrap items-center gap-2")}
              >
                <Text style={cn("text-xs text-stone-500 font-medium")}>
                  Mostrando{" "}
                  <Text style={cn("font-black text-foreground")}>
                    {filteredOrders.length}
                  </Text>{" "}
                  {filteredOrders.length === 1 ? "pedido" : "pedidos"}
                </Text>

                {filterStatus !== "ALL" && (
                  <View style={cn("inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold")}>
                    <Text style={cn("text-stone-700 text-xs font-bold")}>
                      {STATUS_FILTER_CONFIG.find((f) => f.value === filterStatus)?.label}
                    </Text>
                    <TouchableOpacity onPress={() => setFilterStatus("ALL")} style={cn({ hoverTextRed600: true })}>
                      <X size={12} color="#78716c" />
                    </TouchableOpacity>
                  </View>
                )}

                {filterTimePeriod !== "ALL" && (
                  <View style={cn("inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold")}>
                    <Text style={cn("text-stone-700 text-xs font-bold")}>
                      {TIME_PERIOD_CONFIG.find((p) => p.value === filterTimePeriod)?.label}
                    </Text>
                    <TouchableOpacity onPress={() => setFilterTimePeriod("ALL")} style={cn({ hoverTextRed600: true })}>
                      <X size={12} color="#78716c" />
                    </TouchableOpacity>
                  </View>
                )}

                {filterUserId !== "ALL" && (
                  <View style={cn("inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold")}>
                    <Text style={cn("text-stone-700 text-xs font-bold")}>
                      {users?.find((u) => String(u.id) === filterUserId)?.name ?? "Usuário"}
                    </Text>
                    <TouchableOpacity onPress={() => setFilterUserId("ALL")} style={cn({ hoverTextRed600: true })}>
                      <X size={12} color="#78716c" />
                    </TouchableOpacity>
                  </View>
                )}

                {filterOrderId && (
                  <View style={cn("inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold")}>
                    <Text style={cn("text-stone-700 text-xs font-bold")}>
                      Pedido #{filterOrderId}
                    </Text>
                    <TouchableOpacity onPress={() => setFilterOrderId("")} style={cn({ hoverTextRed600: true })}>
                      <X size={12} color="#78716c" />
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            )}
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(200)}
            style={cn("bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden")}
          >
            {filteredOrders.length > 0 ? (
              <View style={cn("sm:hidden divide-y divide-border/50")}>
                {filteredOrders.map((order) => {
                  const isExpanded = expandedCardId === order.id;
                  return (
                    <Animated.View
                      key={order.id}
                      layout={Layout.springify()}
                      entering={FadeIn}
                      exiting={FadeOut}
                      style={cn("p-4")}
                    >
                      <TouchableOpacity
                        onPress={() => setExpandedCardId(isExpanded ? null : order.id)}
                        style={cn("flex flex-row items-start justify-between gap-2")}
                        activeOpacity={0.7}
                      >
                        <View>
                          <Text style={cn("text-xs font-black text-stone-500")}>
                            #{order.id}
                          </Text>
                          <Text style={cn("font-semibold text-foreground text-sm mt-0.5")}>
                            {order.userEmail}
                          </Text>
                          <Text style={cn("text-xs text-stone-400 mt-0.5")}>
                            {new Date(order.orderDate).toLocaleString("pt-BR")}
                          </Text>
                        </View>
                        <View style={cn("flex flex-row items-center gap-2")}>
                          <View
                            style={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shrink-0",
                              STATUS_STYLE_MAP[order.orderStatus]
                            )}
                          >
                            <Text style={cn(STATUS_STYLE_MAP[order.orderStatus].split(" ").find(c => c.startsWith("text-")) || "text-foreground", "text-xs font-bold")}>
                              {order.orderStatus.replace(/_/g, " ")}
                            </Text>
                          </View>
                          <View style={cn("shrink-0 text-stone-400")}>
                            {isExpanded ? (
                              <ChevronUp size={16} color="#a8a29e" />
                            ) : (
                              <ChevronDown size={16} color="#a8a29e" />
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>

                      {isExpanded ? (
                        <Animated.View
                          entering={SlideInDown.duration(200)}
                          exiting={SlideOutDown.duration(200)}
                          style={cn("overflow-hidden")}
                        >
                          <View style={cn("pt-4 space-y-3")}>
                            <View style={cn("grid grid-cols-2 gap-2")}>
                              <View style={cn("rounded-xl bg-stone-50 border border-stone-100 p-3")}>
                                <Text style={cn("text-[9px] uppercase font-black text-stone-400 mb-1")}>Total</Text>
                                <Text style={cn("text-sm font-black text-foreground")}>
                                  {formatCurrency(order.totalPrice)}
                                </Text>
                              </View>
                              <View style={cn("rounded-xl bg-stone-50 border border-stone-100 p-3")}>
                                <Text style={cn("text-[9px] uppercase font-black text-stone-400 mb-1")}>Pagamento</Text>
                                <Text style={cn("text-xs font-semibold text-foreground")}>
                                  {order.paymentMethod === PaymentMethod.PIX
                                    ? "PIX"
                                    : order.paymentMethod === PaymentMethod.CREDIT_CARD
                                    ? "Cartão de Crédito"
                                    : "Cartão de Débito"}
                                </Text>
                              </View>
                            </View>

                            <View style={cn("flex flex-row gap-2 pt-1")}>
                              <TouchableOpacity
                                onPress={() => openDetailsModal(order)}
                                style={cn("flex-1 flex flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-200 bg-background text-stone-700 text-xs font-bold", { hoverBgStone50: true })}
                              >
                                <Eye size={14} color="#44403c" />
                                <Text style={cn("text-stone-700 text-xs font-bold")}>Visualizar</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => openDetailsModal(order)}
                                style={cn("flex-1 flex flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-200 bg-background text-stone-700 text-xs font-bold", { hoverBgStone50: true })}
                              >
                                <Edit size={14} color="#44403c" />
                                <Text style={cn("text-stone-700 text-xs font-bold")}>Editar</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </Animated.View>
                      ) : null}
                    </Animated.View>
                  );
                })}
              </View>
            ) : (
              <View style={cn("py-20 text-center")}>
                <View style={cn("flex flex-col items-center gap-3 text-stone-400")}>
                  <View style={cn("w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center")}>
                    <ShoppingBag size={24} color="#a8a29e" style={cn("opacity-50")} />
                  </View>
                  <Text style={cn("font-serif text-lg font-semibold text-stone-500")}>
                    Nenhum pedido encontrado
                  </Text>
                  <Text style={cn("text-xs")}>
                    {hasActiveFilters
                      ? "Tente remover ou combinar filtros diferentes."
                      : "Não há pedidos para o período selecionado."}
                  </Text>
                  {hasActiveFilters && (
                    <TouchableOpacity
                      onPress={clearAllFilters}
                      style={cn("mt-1 text-xs font-bold text-stone-600 underline underline-offset-2", { hoverTextRed600: true })}
                    >
                      <Text style={cn("text-xs font-bold text-stone-600 underline")}>
                        Limpar todos os filtros
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {totalPages > 1 && (
              <View style={cn("px-6 py-4 border-t border-border/50 flex flex-row items-center justify-between")}>
                <Text style={cn("text-xs text-stone-500")}>
                  Página <Text style={cn("font-bold")}>{page + 1}</Text> de{" "}
                  <Text style={cn("font-bold")}>{totalPages}</Text>
                </Text>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={closeDetailsModal}
          order={selectedOrder}
          onUpdateStatus={updateOrderStatusMutation.mutate}
          isUpdatingStatus={updateOrderStatusMutation.isPending}
        />
      )}
    </SafeAreaView>
  );
};

export default OrderManagement;