import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Package,
  Tag,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  DollarSign,
  Layers,
  Archive,
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
import { productsApi, categoriesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format"; // Adapte para RN se necessário
import type {
  ProductRequestDTO,
  ProductResponseDTO,
  CategoryResponseDTO,
} from "@/types";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type StockFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
type PriceFilter = "ALL" | "UNDER_50" | "50_200" | "200_500" | "OVER_500";

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
    value: "ACTIVE",
    label: "Ativos",
    activeClass: "bg-emerald-700 text-emerald-50 border-emerald-700",
    icon: <CheckCircle size={14} color="#10b981" />,
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  {
    value: "INACTIVE",
    label: "Inativos",
    activeClass: "bg-red-800 text-red-50 border-red-800",
    icon: <XCircle size={14} color="#ef4444" />,
    badgeClass: "bg-red-100 text-red-800",
  },
];

const STOCK_FILTER_CONFIG: {
  value: StockFilter;
  label: string;
  activeClass: string;
  icon: React.ReactNode;
  badgeClass: string;
  matcher: (stock: number) => boolean;
}[] = [
  {
    value: "ALL",
    label: "Todo Estoque",
    activeClass: "bg-stone-800 text-amber-50 border-stone-800",
    icon: <Layers size={14} color="#a8a29e" />,
    badgeClass: "bg-stone-200 text-stone-700",
    matcher: () => true,
  },
  {
    value: "IN_STOCK",
    label: "Disponível",
    activeClass: "bg-teal-700 text-teal-50 border-teal-700",
    icon: <Archive size={14} color="#14b8a6" />,
    badgeClass: "bg-teal-100 text-teal-800",
    matcher: (s) => s > 10,
  },
  {
    value: "LOW_STOCK",
    label: "Estoque Baixo",
    activeClass: "bg-amber-700 text-amber-50 border-amber-700",
    icon: <AlertTriangle size={14} color="#f59e0b" />,
    badgeClass: "bg-amber-100 text-amber-800",
    matcher: (s) => s > 0 && s <= 10,
  },
  {
    value: "OUT_OF_STOCK",
    label: "Esgotado",
    activeClass: "bg-red-800 text-red-50 border-red-800",
    icon: <XCircle size={14} color="#ef4444" />,
    badgeClass: "bg-red-100 text-red-800",
    matcher: (s) => s === 0,
  },
];

const PRICE_FILTER_CONFIG: {
  value: PriceFilter;
  label: string;
  matcher: (price: number) => boolean;
}[] = [
  { value: "ALL", label: "Qualquer Preço", matcher: () => true },
  { value: "UNDER_50", label: "Até R$ 50", matcher: (p) => p < 50 },
  { value: "50_200", label: "R$ 50 – 200", matcher: (p) => p >= 50 && p <= 200 },
  { value: "200_500", label: "R$ 200 – 500", matcher: (p) => p > 200 && p <= 500 },
  { value: "OVER_500", label: "Acima de R$ 500", matcher: (p) => p > 500 },
];

const METRIC_CONFIG = [
  {
    key: "total",
    label: "Total",
    icon: <Package size={16} color="#44403c" />,
    colorClass: "text-stone-700",
    bgClass: "bg-stone-50 border-stone-100",
    iconBg: "bg-stone-100",
  },
  {
    key: "active",
    label: "Ativos",
    icon: <CheckCircle size={16} color="#059669" />,
    colorClass: "text-emerald-700",
    bgClass: "bg-emerald-50 border-emerald-100",
    iconBg: "bg-emerald-100",
  },
  {
    key: "lowStock",
    label: "Est. Baixo",
    icon: <AlertTriangle size={16} color="#f59e0b" />,
    colorClass: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-100",
    iconBg: "bg-amber-100",
  },
  {
    key: "outOfStock",
    label: "Esgotados",
    icon: <XCircle size={16} color="#dc2626" />,
    colorClass: "text-red-700",
    bgClass: "bg-red-50 border-red-100",
    iconBg: "bg-red-100",
  },
];

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <View style={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100")}>
        <XCircle size={10} color="#dc2626" />
        <Text style={cn("text-red-700 text-[10px] font-bold")}>Esgotado</Text>
      </View>
    );
  if (stock <= 10)
    return (
      <View style={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100")}>
        <AlertTriangle size={10} color="#b45309" />
        <Text style={cn("text-amber-700 text-[10px] font-bold")}>{stock} un.</Text>
      </View>
    );
  return (
    <View style={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100")}>
      <Archive size={10} color="#0f766e" />
      <Text style={cn("text-teal-700 text-[10px] font-bold")}>{stock} un.</Text>
    </View>
  );
}

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
      else if (color === "teal-700") styles.backgroundColor = "#0f766e";
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
      else if (color === "amber-600") styles.color = "#d97706";
      else if (color === "teal-600") styles.color = "#0d9488";
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
      else if (color === "teal-700") styles.borderColor = "#0f766e";
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
    else if (part === "text-[9px]") styles.fontSize = 9;
    else if (part === "text-lg") styles.fontSize = 18;
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
    else if (part === "transition-colors") styles.transitionProperty = "color, background-color, border-color";
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
    else if (part === "hover:bg-emerald-50") styles.hoverBgEmerald50 = "#ecfdf5";
    else if (part === "hover:text-emerald-600") styles.hoverTextEmerald600 = "#059669";
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
    else if (part === "sm:max-w-[600px]") styles.maxWidthSm = 600;
    else if (part === "max-h-[70vh]") styles.maxHeight = "70%";
    else if (part === "leading-relaxed") styles.lineHeight = 24; // approx 1.5rem
    else if (part === "resize-none") styles.resize = "none";
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

const ProductManagement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponseDTO | null>(null);
  const [productForm, setProductForm] = useState<ProductRequestDTO>({
    name: "",
    description: "",
    storage: 0,
    price: 0,
    active: true,
    categoryId: 0,
  });
  const [imageFile, setImageFile] = useState<any | null>(null); // File object for web, or object for RN
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<number | "ALL">("ALL");

  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  const { data: products, isLoading: isLoadingProducts } = useQuery<ProductResponseDTO[]>({
    queryKey: ["products"],
    queryFn: async () => (await productsApi.getAll()).data,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<CategoryResponseDTO[]>({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesApi.getAll()).data,
  });

  const metrics = useMemo(() => ({
    total: products?.length ?? 0,
    active: products?.filter((p) => p.active).length ?? 0,
    lowStock: products?.filter((p) => p.storage > 0 && p.storage <= 10).length ?? 0,
    outOfStock: products?.filter((p) => p.storage === 0).length ?? 0,
  }), [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && p.active) ||
        (statusFilter === "INACTIVE" && !p.active);

      const matchesStock =
        STOCK_FILTER_CONFIG.find((f) => f.value === stockFilter)?.matcher(p.storage) ?? true;

      const matchesPrice =
        PRICE_FILTER_CONFIG.find((f) => f.value === priceFilter)?.matcher(p.price) ?? true;

      const matchesCategory =
        categoryFilter === "ALL" || p.category?.id === categoryFilter;

      return matchesSearch && matchesStatus && matchesStock && matchesPrice && matchesCategory;
    });
  }, [products, searchTerm, statusFilter, stockFilter, priceFilter, categoryFilter]);

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    stockFilter !== "ALL" ||
    priceFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    !!searchTerm;

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setStockFilter("ALL");
    setPriceFilter("ALL");
    setCategoryFilter("ALL");
  };

  const countByStatus = (s: StatusFilter) => {
    if (!products) return 0;
    if (s === "ALL") return products.length;
    if (s === "ACTIVE") return products.filter((p) => p.active).length;
    return products.filter((p) => !p.active).length;
  };

  const countByStock = (s: StockFilter) => {
    if (!products) return 0;
    const cfg = STOCK_FILTER_CONFIG.find((f) => f.value === s)!;
    return products.filter((p) => cfg.matcher(p.storage)).length;
  };

  const createProductMutation = useMutation({
    mutationFn: (d: { product: ProductRequestDTO; imageFile?: any }) =>
      productsApi.create(d.product, d.imageFile),
    onSuccess: () => {
      toast({ title: "Produto criado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeFormModal();
    },
    onError: () =>
      toast({ title: "Erro ao criar produto.", variant: "destructive" }),
  });

  const updateProductMutation = useMutation({
    mutationFn: (d: { id: number; product: ProductRequestDTO; imageFile?: any }) =>
      productsApi.update(d.id, d.product, d.imageFile),
    onSuccess: () => {
      toast({ title: "Produto atualizado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeFormModal();
    },
    onError: () =>
      toast({ title: "Erro ao atualizar produto.", variant: "destructive" }),
  });

  const deactivateProductMutation = useMutation({
    mutationFn: (id: number) => productsApi.deactivate(id),
    onSuccess: () => {
      toast({ title: "Produto desativado." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () =>
      toast({ title: "Erro ao desativar produto.", variant: "destructive" }),
  });

  const activateProductMutation = useMutation({
    mutationFn: (id: number) => productsApi.activate(id),
    onSuccess: () => {
      toast({ title: "Produto ativado." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () =>
      toast({ title: "Erro ao ativar produto.", variant: "destructive" }),
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      storage: 0,
      price: 0,
      active: true,
      categoryId: categories?.[0]?.id ?? 0,
    });
    setImageFile(null);
    setImagePreview(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (product: ProductResponseDTO) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      storage: product.storage,
      price: product.price,
      active: product.active,
      categoryId: product.category.id,
    });
    setImageFile(null);
    setImagePreview(product.imageUrl);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingProduct(null);
    setProductForm({ name: "", description: "", storage: 0, price: 0, active: true, categoryId: 0 });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({ id: editingProduct.id, product: productForm, imageFile: imageFile ?? undefined });
      } else {
        await createProductMutation.mutateAsync({ product: productForm, imageFile: imageFile ?? undefined });
      }
    } catch {
      // handled by mutations
    }
  };

  if (isLoadingProducts || isLoadingCategories) {
    return (
      <SafeAreaView style={cn("min-h-screen bg-background flex items-center justify-center")}>
        <View style={cn("flex flex-col items-center gap-3")}>
          <ActivityIndicator size="large" color="#a8a29e" />
          <Text style={cn("text-stone-500 text-sm font-medium")}>Carregando produtos...</Text>
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
                Gestão de Produtos
              </Text>
              <Text style={cn("text-stone-500 text-sm mt-1")}>
                {filteredProducts.length > 0
                  ? `${filteredProducts.length} produto${filteredProducts.length !== 1 ? "s" : ""} encontrado${filteredProducts.length !== 1 ? "s" : ""}`
                  : "Nenhum produto no catálogo"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={openCreateModal}
              style={cn(
                "inline-flex items-center gap-2 rounded-xl bg-stone-800 px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors",
                { hoverBgStone900: true }
              )}
            >
              <Plus size={16} color="#fffbeb" />
              <Text style={cn("text-amber-50 text-sm font-semibold")}>Novo Produto</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(50)}
            style={cn("grid grid-cols-2 lg:grid-cols-4 gap-3")}
          >
            {METRIC_CONFIG.map((m) => (
              <View
                key={m.key}
                style={cn(
                  "rounded-2xl border p-4 flex flex-col gap-2 transition-all",
                  m.bgClass
                )}
              >
                <View style={cn("w-8 h-8 rounded-xl flex items-center justify-center", m.iconBg)}>
                  <Text style={cn(m.colorClass)}>{m.icon}</Text>
                </View>
                <View>
                  <Text style={cn("text-2xl font-black", m.colorClass)}>
                    {metrics[m.key as keyof typeof metrics]}
                  </Text>
                  <Text style={cn("text-xs font-semibold mt-0.5 opacity-80", m.colorClass)}>
                    {m.label}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(100)}
            style={cn("space-y-4")}
          >
            <View style={cn("relative")}>
              <Search size={16} color="#a8a29e" style={cn("absolute left-3.5 top-1/2 -translate-y-1/2")} />
              <TextInput
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                style={cn(
                  "w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 bg-card text-foreground text-sm outline-none",
                  { placeholderTextColor: "#a8a29e" }
                )}
              />
              {searchTerm ? (
                <TouchableOpacity
                  onPress={() => setSearchTerm("")}
                  style={cn("absolute right-3.5 top-1/2 -translate-y-1/2")}
                >
                  <X size={16} color="#a8a29e" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={cn("bg-card rounded-2xl border border-border/60 p-5 sm:p-6 space-y-5 shadow-sm")}>
              <View style={cn("space-y-2")}>
                <Text style={cn("text-[10px] font-black uppercase tracking-widest text-stone-500")}>
                  Status
                </Text>
                <View style={cn("flex flex-wrap gap-2")}>
                  {STATUS_FILTER_CONFIG.map((f) => {
                    const isActive = statusFilter === f.value;
                    const count = countByStatus(f.value);
                    return (
                      <TouchableOpacity
                        key={f.value}
                        onPress={() => setStatusFilter(f.value)}
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
                            isActive ? "bg-white/20 text-white" : f.badgeClass
                          )}
                        >
                          {count}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={cn("space-y-2")}>
                <Text style={cn("text-[10px] font-black uppercase tracking-widest text-stone-500")}>
                  Estoque
                </Text>
                <View style={cn("flex flex-wrap gap-2")}>
                  {STOCK_FILTER_CONFIG.map((f) => {
                    const isActive = stockFilter === f.value;
                    const count = countByStock(f.value);
                    return (
                      <TouchableOpacity
                        key={f.value}
                        onPress={() => setStockFilter(f.value)}
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
                            isActive ? "bg-white/20 text-white" : f.badgeClass
                          )}
                        >
                          {count}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={cn("grid grid-cols-1 sm:grid-cols-2 gap-4")}>
                <View style={cn("space-y-2")}>
                  <Text style={cn("text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1")}>
                    <Tag size={12} color="#78716c" /> Categoria
                  </Text>
                  <View style={cn("flex flex-wrap gap-2")}>
                    <TouchableOpacity
                      onPress={() => setCategoryFilter("ALL")}
                      style={cn(
                        "rounded-xl px-3 py-1.5 text-xs font-bold border transition-all",
                        categoryFilter === "ALL"
                          ? "bg-stone-800 text-amber-50 border-stone-800"
                          : "bg-background border-stone-200 text-stone-600",
                        categoryFilter === "ALL" ? {} : { hoverBgStone50: true }
                      )}
                    >
                      <Text style={cn(categoryFilter === "ALL" ? "text-amber-50" : "text-stone-600", "text-xs font-bold")}>
                        Todas
                      </Text>
                    </TouchableOpacity>
                    {categories?.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setCategoryFilter(cat.id === categoryFilter ? "ALL" : cat.id)}
                        style={cn(
                          "rounded-xl px-3 py-1.5 text-xs font-bold border transition-all",
                          categoryFilter === cat.id
                            ? "bg-stone-800 text-amber-50 border-stone-800"
                            : "bg-background border-stone-200 text-stone-600",
                          categoryFilter === cat.id ? {} : { hoverBgStone50: true }
                        )}
                      >
                        <Text style={cn(categoryFilter === cat.id ? "text-amber-50" : "text-stone-600", "text-xs font-bold")}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={cn("space-y-2")}>
                  <Text style={cn("text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1")}>
                    <DollarSign size={12} color="#78716c" /> Faixa de Preço
                  </Text>
                  <View style={cn("flex flex-wrap gap-2")}>
                    {PRICE_FILTER_CONFIG.map((f) => (
                      <TouchableOpacity
                        key={f.value}
                        onPress={() => setPriceFilter(f.value)}
                        style={cn(
                          "rounded-xl px-3 py-1.5 text-xs font-bold border transition-all",
                          priceFilter === f.value
                            ? "bg-stone-800 text-amber-50 border-stone-800"
                            : "bg-background border-stone-200 text-stone-600",
                          priceFilter === f.value ? {} : { hoverBgStone50: true }
                        )}
                      >
                        <Text style={cn(priceFilter === f.value ? "text-amber-50" : "text-stone-600", "text-xs font-bold")}>
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {hasActiveFilters ? (
              <Animated.View
                entering={FadeIn.duration(200).delay(0)}
                exiting={FadeOut.duration(200)}
                style={cn("flex flex-wrap items-center gap-2")}
              >
                <Text style={cn("text-xs text-stone-500 font-medium")}>
                  Mostrando{" "}
                  <Text style={cn("font-black text-foreground")}>{filteredProducts.length}</Text>{" "}
                  {filteredProducts.length === 1 ? "produto" : "produtos"}
                </Text>

                {statusFilter !== "ALL" ? (
                  <View style={cn("inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold")}>
                    <Text style={cn("text-stone-700 text-xs font-bold")}>
                      {STATUS_FILTER_CONFIG.find((f) => f.value === statusFilter)?.label}
                    </Text>
                    <TouchableOpacity onPress={() => setStatusFilter("ALL")} style={cn({ hoverTextRed600: true })}>
                      <X size={12} color="#78716c" />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {stockFilter !== "ALL" ? (
                  <View style={cn("inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold")}>
                    <Text style={cn("text-stone-700 text-xs font-bold")}>
                      {STOCK_FILTER_CONFIG.find((f) => f.value === stockFilter)?.label}
                    </Text>
                    <TouchableOpacity onPress={() => setStockFilter("ALL")} style={cn({ hoverTextRed600: true })}>
                      <X size={12} color="#78716c" />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {priceFilter !== "ALL" ? (
                  <View style={cn("inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold")}>
                    <Text style={cn("text-stone-700 text-xs font-bold")}>
                      {PRICE_FILTER_CONFIG.find((f) => f.value === priceFilter)?.label}
                    </Text>
                    <TouchableOpacity onPress={() => setPriceFilter("ALL")} style={cn({ hoverTextRed600: true })}>
                      <X size={12} color="#78716c" />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {categoryFilter !== "ALL" ? (
                  <View style={cn("inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold")}>
                    <Text style={cn("text-stone-700 text-xs font-bold")}>
                      {categories?.find((c) => c.id === categoryFilter)?.name}
                    </Text>
                    <TouchableOpacity onPress={() => setCategoryFilter("ALL")} style={cn({ hoverTextRed600: true })}>
                      <X size={12} color="#78716c" />
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={clearAllFilters}
                  style={cn("mt-1 text-xs font-bold text-stone-500 underline underline-offset-2", { hoverTextRed600: true })}
                >
                  <Text style={cn("text-xs font-bold text-stone-500 underline")}>
                    Limpar tudo
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ) : null}
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(200)}
            style={cn("bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden")}
          >
            {filteredProducts.length > 0 ? (
              <View style={cn("sm:hidden divide-y divide-border/50")}>
                {filteredProducts.map((product) => {
                  const isExpanded = expandedCardId === product.id;
                  return (
                    <Animated.View
                      key={product.id}
                      layout={Layout.springify()}
                      entering={FadeIn}
                      exiting={FadeOut}
                      style={cn("p-4")}
                    >
                      <TouchableOpacity
                        onPress={() => setExpandedCardId(isExpanded ? null : product.id)}
                        style={cn("flex flex-row items-center gap-3")}
                        activeOpacity={0.7}
                      >
                        {product.imageUrl ? (
                          <Image
                            source={{ uri: product.imageUrl }}
                            alt={product.name}
                            style={cn("h-14 w-14 rounded-xl object-cover border border-stone-100 shrink-0")}
                          />
                        ) : (
                          <View style={cn("h-14 w-14 rounded-xl bg-stone-100 flex items-center justify-center shrink-0")}>
                            <ImageIcon size={24} color="#a8a29e" />
                          </View>
                        )}

                        <View style={cn("flex-1 min-w-0")}>
                          <View style={cn("flex flex-row items-center justify-between gap-2")}>
                            <Text style={cn("font-bold text-foreground truncate")}>{product.name}</Text>
                            <View style={cn(
                              "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              product.active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-red-50 text-red-700 border-red-100"
                            )}>
                              <Text style={cn(product.active ? "text-emerald-700" : "text-red-700", "text-[10px] font-bold")}>
                                {product.active ? "Ativo" : "Inativo"}
                              </Text>
                            </View>
                          </View>
                          <View style={cn("flex flex-row items-center gap-2 mt-1 flex-wrap")}>
                            <Text style={cn("text-xs font-black text-foreground")}>
                              {formatCurrency(product.price)}
                            </Text>
                            <StockBadge stock={product.storage} />
                          </View>
                          <Text style={cn("text-xs text-stone-400 mt-0.5 truncate")}>
                            {product.category?.name}
                          </Text>
                        </View>

                        <View style={cn("shrink-0 text-stone-400")}>
                          {isExpanded ? (
                            <ChevronUp size={16} color="#a8a29e" />
                          ) : (
                            <ChevronDown size={16} color="#a8a29e" />
                          )}
                        </View>
                      </TouchableOpacity>

                      {isExpanded ? (
                        <Animated.View
                          entering={SlideInDown.duration(200)}
                          exiting={SlideOutDown.duration(200)}
                          style={cn("overflow-hidden")}
                        >
                          <View style={cn("pt-4 space-y-3")}>
                            <Text style={cn("text-xs text-stone-500 leading-relaxed")}>
                              {product.description}
                            </Text>

                            <View style={cn("grid grid-cols-3 gap-2")}>
                              <View style={cn("rounded-xl bg-stone-50 border border-stone-100 p-3 text-center")}>
                                <Text style={cn("text-[9px] uppercase font-black text-stone-400 mb-1")}>Preço</Text>
                                <Text style={cn("text-sm font-black text-foreground")}>
                                  {formatCurrency(product.price)}
                                </Text>
                              </View>
                              <View style={cn("rounded-xl bg-stone-50 border border-stone-100 p-3 text-center")}>
                                <Text style={cn("text-[9px] uppercase font-black text-stone-400 mb-1")}>Estoque</Text>
                                <Text style={cn(
                                  "text-sm font-black",
                                  product.storage === 0 ? "text-red-600" :
                                  product.storage <= 10 ? "text-amber-600" : "text-teal-600"
                                )}>
                                  {product.storage}
                                </Text>
                              </View>
                              <View style={cn("rounded-xl bg-stone-50 border border-stone-100 p-3 text-center")}>
                                <Text style={cn("text-[9px] uppercase font-black text-stone-400 mb-1")}>Categoria</Text>
                                <Text style={cn("text-[10px] font-bold text-foreground truncate")}>
                                  {product.category?.name ?? "—"}
                                </Text>
                              </View>
                            </View>

                            <View style={cn("flex flex-row gap-2 pt-1")}>
                              <TouchableOpacity
                                onPress={() => openEditModal(product)}
                                style={cn(
                                  "flex-1 flex flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-200 bg-background text-stone-700 text-xs font-bold",
                                  { hoverBgStone50: true }
                                )}
                              >
                                <Edit size={14} color="#44403c" />
                                <Text style={cn("text-stone-700 text-xs font-bold")}>Editar</Text>
                              </TouchableOpacity>
                              {product.active ? (
                                <TouchableOpacity
                                  onPress={() => {
                                    Alert.alert(
                                      "Confirmar desativação",
                                      "Deseja realmente desativar este produto?",
                                      [
                                        { text: "Cancelar", style: "cancel" },
                                        { text: "Desativar", onPress: () => deactivateProductMutation.mutate(product.id) },
                                      ]
                                    );
                                  }}
                                  disabled={deactivateProductMutation.isPending}
                                  style={cn(
                                    "flex-1 flex flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-700 text-xs font-bold",
                                    { hoverBgRed100: true, disabledOpacity50: deactivateProductMutation.isPending }
                                  )}
                                >
                                  {deactivateProductMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#dc2626" />
                                  ) : (
                                    <XCircle size={14} color="#dc2626" />
                                  )}
                                  <Text style={cn("text-red-700 text-xs font-bold")}>Desativar</Text>
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  onPress={() => {
                                    Alert.alert(
                                      "Confirmar ativação",
                                      "Deseja realmente ativar este produto?",
                                      [
                                        { text: "Cancelar", style: "cancel" },
                                        { text: "Ativar", onPress: () => activateProductMutation.mutate(product.id) },
                                      ]
                                    );
                                  }}
                                  disabled={activateProductMutation.isPending}
                                  style={cn(
                                    "flex-1 flex flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 text-xs font-bold",
                                    { hoverBgEmerald50: true, disabledOpacity50: activateProductMutation.isPending }
                                  )}
                                >
                                  {activateProductMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#059669" />
                                  ) : (
                                    <CheckCircle size={14} color="#059669" />
                                  )}
                                  <Text style={cn("text-emerald-700 text-xs font-bold")}>Ativar</Text>
                                </TouchableOpacity>
                              )}
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
                    <Package size={24} color="#a8a29e" style={cn("opacity-50")} />
                  </View>
                  <Text style={cn("font-serif text-lg font-semibold text-stone-500")}>
                    Nenhum produto encontrado
                  </Text>
                  <Text style={cn("text-xs")}>
                    {hasActiveFilters
                      ? "Tente remover ou combinar filtros diferentes."
                      : "Adicione um novo produto ao catálogo."}
                  </Text>
                  {hasActiveFilters ? (
                    <TouchableOpacity
                      onPress={clearAllFilters}
                      style={cn("mt-1 text-xs font-bold text-stone-600 underline underline-offset-2", { hoverTextRed600: true })}
                    >
                      <Text style={cn("text-xs font-bold text-stone-600 underline")}>
                        Limpar todos os filtros
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent style={cn("sm:max-w-[600px] bg-card text-foreground rounded-2xl p-0 overflow-hidden")}>
          <View style={cn("px-6 pt-6 pb-4 border-b border-border/50 bg-stone-50/80")}>
            <DialogHeader>
              <DialogTitle style={cn("font-serif text-2xl font-bold text-foreground")}>
                <Text style={cn("text-foreground text-2xl font-bold")}>
                  {editingProduct ? "Editar Produto" : "Novo Produto"}
                </Text>
              </DialogTitle>
              <DialogDescription style={cn("text-stone-500 text-sm")}>
                {editingProduct
                  ? "Atualize as informações do produto."
                  : "Preencha os dados para adicionar ao catálogo."}
              </DialogDescription>
            </DialogHeader>
          </View>

          <ScrollView style={cn("px-6 py-5 max-h-[70vh]")} contentContainerStyle={cn("space-y-5")}>
            <View style={cn("flex flex-row items-center gap-4")}>
              <View style={cn("shrink-0")}>
                {imagePreview ? (
                  <Image
                    source={{ uri: imagePreview }}
                    alt="Preview"
                    style={cn("h-20 w-20 rounded-2xl object-cover border border-stone-200")}
                  />
                ) : (
                  <View style={cn("h-20 w-20 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center")}>
                    <ImageIcon size={32} color="#a8a29e" />
                  </View>
                )}
              </View>
              <View style={cn("flex-1 space-y-1.5")}>
                <Text style={cn("text-xs font-black uppercase text-stone-500")}>
                  Imagem do Produto
                </Text>
                {/* Em React Native, você usaria um ImagePicker aqui */}
                <TouchableOpacity
                  onPress={() => Alert.alert("Funcionalidade de upload de imagem", "Implementar ImagePicker para selecionar imagem.")}
                  style={cn("bg-background border border-stone-200 rounded-xl px-3 py-2 flex items-center justify-center")}
                >
                  <Text style={cn("text-stone-700 text-sm font-semibold")}>Selecionar Imagem</Text>
                </TouchableOpacity>
                <Text style={cn("text-[10px] text-stone-400")}>PNG, JPG até 5MB</Text>
              </View>
            </View>

            <View style={cn("space-y-1.5")}>
              <Text style={cn("text-xs font-black uppercase text-stone-500")}>Nome</Text>
              <TextInput
                value={productForm.name}
                onChangeText={(text) => setProductForm((p) => ({ ...p, name: text }))}
                placeholder="Ex: Café Especial Etiópia"
                style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                required
              />
            </View>

            <View style={cn("space-y-1.5")}>
              <Text style={cn("text-xs font-black uppercase text-stone-500")}>Descrição</Text>
              <TextInput
                value={productForm.description}
                onChangeText={(text) => setProductForm((p) => ({ ...p, description: text }))}
                placeholder="Descreva o produto..."
                multiline
                numberOfLines={4}
                style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground min-h-[80px] resize-none")}
                required
              />
            </View>

            <View style={cn("grid grid-cols-2 gap-4")}>
              <View style={cn("space-y-1.5")}>
                <Text style={cn("text-xs font-black uppercase text-stone-500 flex items-center gap-1")}>
                  <DollarSign size={12} color="#78716c" /> Preço (R$)
                </Text>
                <TextInput
                  value={productForm.price.toString()}
                  onChangeText={(text) => setProductForm((p) => ({ ...p, price: parseFloat(text) || 0 }))}
                  keyboardType="numeric"
                  style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                  required
                />
              </View>
              <View style={cn("space-y-1.5")}>
                <Text style={cn("text-xs font-black uppercase text-stone-500 flex items-center gap-1")}>
                  <Archive size={12} color="#78716c" /> Estoque
                </Text>
                <TextInput
                  value={productForm.storage.toString()}
                  onChangeText={(text) => setProductForm((p) => ({ ...p, storage: parseInt(text) || 0 }))}
                  keyboardType="numeric"
                  style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                  required
                />
              </View>
            </View>

            <View style={cn("space-y-1.5")}>
              <Text style={cn("text-xs font-black uppercase text-stone-500 flex items-center gap-1")}>
                <Tag size={12} color="#78716c" /> Categoria
              </Text>
              {/* Para Select, você precisaria de um componente de picker customizado ou de uma biblioteca */}
              <TouchableOpacity
                onPress={() => Alert.alert("Seleção de Categoria", "Implementar um Picker para categorias.")}
                style={cn("rounded-xl border-stone-200 bg-background px-3 py-2 flex flex-row items-center justify-between")}
              >
                <Text style={cn("text-foreground")}>
                  {categories?.find(c => c.id === productForm.categoryId)?.name || "Selecione uma categoria"}
                </Text>
                <ChevronDown size={16} color="#a8a29e" />
              </TouchableOpacity>
            </View>

            <View style={cn("flex flex-row items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3")}>
              <View>
                <Text style={cn("text-sm font-bold text-foreground")}>Produto Ativo</Text>
                <Text style={cn("text-xs text-stone-500")}>Visível no catálogo para clientes</Text>
              </View>
              <Switch
                checked={productForm.active}
                onCheckedChange={(v) => setProductForm((p) => ({ ...p, active: v }))}
              />
            </View>
          </ScrollView>

          <DialogFooter style={cn("pt-2 flex flex-row gap-3 px-6 pb-6")}>
            <TouchableOpacity
              onPress={closeFormModal}
              style={cn(
                "flex-1 py-2.5 rounded-xl border border-stone-200 bg-background text-stone-700 text-sm font-bold",
                { hoverBgStone50: true }
              )}
            >
              <Text style={cn("text-stone-700 text-sm font-bold text-center")}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={createProductMutation.isPending || updateProductMutation.isPending}
              style={cn(
                "flex-1 py-2.5 rounded-xl bg-stone-800 text-amber-50 text-sm font-bold flex flex-row items-center justify-center gap-2",
                { hoverBgStone900: true, disabledOpacity50: createProductMutation.isPending || updateProductMutation.isPending }
              )}
            >
              {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                <ActivityIndicator size="small" color="#fffbeb" />
              ) : editingProduct ? (
                <Text style={cn("text-amber-50 text-sm font-bold")}>Salvar Alterações</Text>
              ) : (
                <Text style={cn("text-amber-50 text-sm font-bold")}>Criar Produto</Text>
              )}
            </TouchableOpacity>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SafeAreaView>
  );
};

export default ProductManagement;