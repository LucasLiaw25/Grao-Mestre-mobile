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
import { useQuery } from "@tanstack/react-query";
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Coffee,
  Tag,
  BarChart3,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  AlertCircle,
  Award,
  Hash,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
} from "lucide-react-native";
import { financialReportsApi, categoriesApi, productsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format"; // Adapte para RN se necessário
import type {
  TimePeriod,
  FinancialReportResponseDTO,
  CategoryResponseDTO,
  ProductResponseDTO,
} from "@/types";
import { format } from "date-fns";

function getTodayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

interface NormalizedTopItem {
  key: string;
  value: number;
}

function normalizeTopItems(raw: unknown[]): NormalizedTopItem[] {
  return raw.map((item) => {
    const obj = item as Record<string, unknown>;
    const key =
      typeof obj.key === "string"
        ? obj.key
        : String(obj.key ?? obj.name ?? obj.productName ?? "—");
    const rawValue = obj.value ?? obj.revenue ?? obj.totalRevenue ?? obj.quantity ?? 0;
    const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
    return { key, value: isNaN(value) ? 0 : value };
  });
}

const PERIOD_CONFIG: { value: TimePeriod | "CUSTOM"; label: string }[] = [
  { value: TimePeriod.TODAY, label: "Hoje" },
  { value: TimePeriod.YESTERDAY, label: "Ontem" },
  { value: TimePeriod.THIS_WEEK, label: "Esta semana" },
  { value: TimePeriod.LAST_WEEK, label: "Semana passada" },
  { value: TimePeriod.THIS_MONTH, label: "Este mês" },
  { value: TimePeriod.LAST_MONTH, label: "Mês passado" },
  { value: "CUSTOM", label: "Personalizado" },
];

const getTailwindStyles = (tailwindString: string) => {
  const styles: any = {};
  const parts = tailwindString.split(" ");

  parts.forEach((part) => {
    if (part.startsWith("bg-")) {
      const color = part.replace("bg-", "");
      if (color === "background") styles.backgroundColor = "#ffffff";
      else if (color === "card") styles.backgroundColor = "#ffffff";
      else if (color === "muted/20") styles.backgroundColor = "rgba(245,245,244,0.2)"; // Assuming muted is stone-100
      else if (color === "muted/30") styles.backgroundColor = "rgba(245,245,244,0.3)";
      else if (color === "emerald-500/10") styles.backgroundColor = "rgba(16,185,129,0.1)";
      else if (color === "red-500/10") styles.backgroundColor = "rgba(239,68,68,0.1)";
      else if (color === "primary/10") styles.backgroundColor = "rgba(41,37,36,0.1)"; // Assuming primary is stone-800
      else if (color === "green-500/10") styles.backgroundColor = "rgba(34,197,94,0.1)";
      else if (color === "amber-500/10") styles.backgroundColor = "rgba(245,158,11,0.1)";
      else if (color === "blue-500/10") styles.backgroundColor = "rgba(59,130,246,0.1)";
      else if (color === "amber-100") styles.backgroundColor = "#fde68a";
      else if (color === "stone-100") styles.backgroundColor = "#f5f5f4";
      else if (color === "orange-50") styles.backgroundColor = "#fff7ed";
      else if (color === "muted") styles.backgroundColor = "#f5f5f4";
      else if (color === "foreground") styles.backgroundColor = "#0c0a09";
      else if (color === "stone-50") styles.backgroundColor = "#fafaf9";
      else if (color === "stone-800") styles.backgroundColor = "#292524";
      else if (color === "stone-900") styles.backgroundColor = "#1c1917";
      else if (color === "amber-50") styles.backgroundColor = "#fffbeb";
      else if (color === "emerald-700") styles.backgroundColor = "#047857";
      else if (color === "emerald-50") styles.backgroundColor = "#ecfdf5";
      else if (color === "red-800") styles.backgroundColor = "#991b1b";
      else if (color === "red-50") styles.backgroundColor = "#fef2f2";
      else if (color === "emerald-100") styles.backgroundColor = "#d1fae5";
      else if (color === "red-100") styles.backgroundColor = "#fee2e2";
      else if (color === "indigo-50") styles.backgroundColor = "#eef2ff";
      else if (color === "blue-50") styles.backgroundColor = "#eff6ff";
      else if (color === "teal-50") styles.backgroundColor = "#f0fdfa";
      else if (color === "white/20") styles.backgroundColor = "rgba(255,255,255,0.2)";
      else if (color === "primary/40") styles.backgroundColor = "rgba(41,37,36,0.4)";
    } else if (part.startsWith("text-")) {
      const color = part.replace("text-", "");
      if (color === "muted-foreground") styles.color = "#78716c"; // Assuming muted-foreground is stone-500
      else if (color === "foreground") styles.color = "#0c0a09";
      else if (color === "emerald-600") styles.color = "#059669";
      else if (color === "red-500") styles.color = "#ef4444";
      else if (color === "primary") styles.color = "#292524";
      else if (color === "green-600") styles.color = "#16a34a";
      else if (color === "amber-600") styles.color = "#d97706";
      else if (color === "blue-600") styles.color = "#2563eb";
      else if (color === "amber-700") styles.color = "#b45309";
      else if (color === "stone-600") styles.color = "#57534e";
      else if (color === "orange-600") styles.color = "#ea580c";
      else if (color === "amber-50") styles.color = "#fffbeb";
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
      else if (color === "stone-400") styles.color = "#a8a29e";
      else if (color === "red-700") styles.color = "#b91c1c";
    } else if (part.startsWith("border-")) {
      const color = part.replace("border-", "");
      if (color === "border/60") styles.borderColor = "rgba(229,231,235,0.6)"; // Assuming border is stone-200
      else if (color === "border/40") styles.borderColor = "rgba(229,231,235,0.4)";
      else if (color === "border/50") styles.borderColor = "rgba(229,231,235,0.5)";
      else if (color === "foreground") styles.borderColor = "#0c0a09";
      else if (color === "foreground/30") styles.borderColor = "rgba(12,10,9,0.3)";
      else if (color === "amber-300") styles.borderColor = "#fcd34d";
      else if (color === "stone-300") styles.borderColor = "#d6d3d1";
      else if (color === "orange-200") styles.borderColor = "#fed7aa";
      else if (color === "stone-200") styles.borderColor = "#e7e5e4";
      else if (color === "stone-800") styles.borderColor = "#292524";
      else if (color === "emerald-700") styles.borderColor = "#047857";
      else if (color === "emerald-100") styles.borderColor = "#d1fae5";
      else if (color === "red-100") styles.borderColor = "#fee2e2";
      else if (color === "stone-100") styles.borderColor = "#f5f5f4";
      else if (color === "indigo-100") styles.borderColor = "#e0e7ff";
      else if (color === "blue-100") styles.borderColor = "#dbeafe";
      else if (color === "teal-100") styles.borderColor = "#ccfbf1";
      else if (color === "dashed") styles.borderStyle = "dashed";
      else if (color === "amber-100") styles.borderColor = "#fde68a";
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
    else if (part === "items-start") styles.alignItems = "flex-start";
    else if (part === "justify-center") styles.justifyContent = "center";
    else if (part === "justify-between") styles.justifyContent = "space-between";
    else if (part === "flex-wrap") styles.flexWrap = "wrap";
    else if (part === "flex-1") styles.flex = 1;
    else if (part === "shrink-0") styles.flexShrink = 0;
    else if (part === "min-h-screen") styles.minHeight = "100%";
    else if (part === "text-sm") styles.fontSize = 14;
    else if (part === "text-xs") styles.fontSize = 12;
    else if (part === "text-[11px]") styles.fontSize = 11;
    else if (part === "text-[10px]") styles.fontSize = 10;
    else if (part === "text-lg") styles.fontSize = 18;
    else if (part === "text-base") styles.fontSize = 16;
    else if (part === "text-xl") styles.fontSize = 20;
    else if (part === "text-2xl") styles.fontSize = 24;
    else if (part === "text-3xl") styles.fontSize = 30;
    else if (part === "text-4xl") styles.fontSize = 36;
    else if (part === "font-bold") styles.fontWeight = "700";
    else if (part === "font-black") styles.fontWeight = "900";
    else if (part === "font-semibold") styles.fontWeight = "600";
    else if (part === "font-medium") styles.fontWeight = "500";
    else if (part === "uppercase") styles.textTransform = "uppercase";
    else if (part === "tracking-tight") styles.letterSpacing = -0.5;
    else if (part === "tracking-wide") styles.letterSpacing = 0.25;
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
    else if (part === "hover:shadow-md") styles.hoverShadowMd = { shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 };
    else if (part === "hover:bg-muted/20") styles.hoverBgMuted20 = "rgba(245,245,244,0.2)";
    else if (part === "hover:border-foreground/30") styles.hoverBorderForeground30 = "rgba(12,10,9,0.3)";
    else if (part === "hover:text-foreground") styles.hoverTextForeground = "#0c0a09";
    else if (part === "hover:text-red-500") styles.hoverTextRed500 = "#ef4444";
    else if (part === "hover:bg-muted/50") styles.hoverBgMuted50 = "rgba(245,245,244,0.5)";
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
    else if (part === "ring-1") styles.borderWidth = 1;
    else if (part === "ring-2") styles.borderWidth = 2;
    else if (part === "ring-offset-1") styles.padding = 4; // Placeholder for ring-offset, adjust as needed
    else if (part === "leading-none") styles.lineHeight = 16; // Adjust based on font size
    else if (part === "font-mono") styles.fontFamily = Platform.OS === "ios" ? "Menlo" : "monospace";
    else if (part === "pointer-events-none") styles.pointerEvents = "none";
    else if (part === "z-20") styles.zIndex = 20;
    else if (part === "top-full") styles.top = "100%";
    else if (part === "max-h-52") styles.maxHeight = 208;
    else if (part === "max-w-[140px]") styles.maxWidth = 140;
    else if (part === "animate-pulse") styles.opacity = 0.5; // Simplified for RN
  });

  return styles;
};

const cn = (tailwindString: string, ...args: any[]) => {
  const baseStyles = getTailwindStyles(tailwindString);
  const combinedStyles = StyleSheet.create({
    dynamic: { ...baseStyles, ...Object.assign({}, ...args) },
  });
  return combinedStyles.dynamic;
};

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}> = ({ label, value, sub, icon: Icon, accent, trend, delay = 0 }) => {
  const animatedOpacity = useSharedValue(0);
  const animatedTranslateY = useSharedValue(16);

  React.useEffect(() => {
    animatedOpacity.value = withTiming(1, { duration: 350, delay: delay * 1000 });
    animatedTranslateY.value = withTiming(0, { duration: 350, delay: delay * 1000 });
  }, [delay]);

  const cardStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedOpacity.value,
      transform: [{ translateY: animatedTranslateY.value }],
    };
  });

  return (
    <Animated.View
      style={[
        cn("bg-card border border-border/60 rounded-2xl p-5 flex flex-row items-start gap-4"),
        cardStyle,
        cn({ hoverShadowMd: true }),
      ]}
    >
      <View style={cn("p-2.5 rounded-xl shrink-0", accent)}>
        <Icon size={20} color={cn("", accent).color} />
      </View>
      <View style={cn("min-w-0 flex-1")}>
        <Text style={cn("text-xs text-muted-foreground font-medium tracking-wide uppercase mb-0.5")}>
          {label}
        </Text>
        <Text style={cn("text-2xl font-bold text-foreground leading-none")}>{value}</Text>
        {sub && (
          <Text
            style={cn(
              "text-xs mt-1 flex flex-row items-center gap-1",
              trend === "up" && "text-emerald-600",
              trend === "down" && "text-red-500",
              !trend && "text-muted-foreground"
            )}
          >
            {trend === "up" && <TrendingUp size={12} color={cn("", trend === "up" && "text-emerald-600").color} />}
            {trend === "down" && <TrendingDown size={12} color={cn("", trend === "down" && "text-red-500").color} />}
            {sub}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const RankRow: React.FC<{
  rank: number;
  label: string;
  value: number;
  max: number;
  mode: "currency" | "quantity";
}> = ({ rank, label, value, max, mode }) => {
  const safeValue = isNaN(value) || value == null ? 0 : value;
  const safeMax = isNaN(max) || max <= 0 ? 1 : max;
  const pct = (safeValue / safeMax) * 100;

  const barWidth = useSharedValue(0);

  React.useEffect(() => {
    barWidth.value = withTiming(pct, { duration: 600, easing: Animated.Easing.out(Animated.Easing.ease) });
  }, [pct]);

  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      width: `${barWidth.value}%`,
    };
  });

  return (
    <View style={cn("flex flex-row items-center gap-3")}>
      <View
        style={cn(
          "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
          rank === 1 && "bg-amber-100 text-amber-700 ring-1 ring-amber-300",
          rank === 2 && "bg-stone-100 text-stone-600 ring-1 ring-stone-300",
          rank === 3 && "bg-orange-50 text-orange-600 ring-1 ring-orange-200",
          rank > 3 && "bg-muted text-muted-foreground"
        )}
      >
        <Text style={cn(
          rank === 1 && "text-amber-700",
          rank === 2 && "text-stone-600",
          rank === 3 && "text-orange-600",
          rank > 3 && "text-muted-foreground",
          "text-[11px] font-bold"
        )}>
          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
        </Text>
      </View>

      <View style={cn("flex-1 min-w-0 space-y-1")}>
        <View style={cn("flex flex-row items-center justify-between gap-2")}>
          <Text style={cn("text-sm font-medium text-foreground truncate")}>{label}</Text>
          <Text style={cn("text-sm font-bold text-foreground shrink-0")}>
            {mode === "currency" ? formatCurrency(safeValue) : `${safeValue}×`}
          </Text>
        </View>
        <View style={cn("h-1.5 bg-muted rounded-full overflow-hidden")}>
          <Animated.View
            style={[
              cn(
                "h-full rounded-full",
                rank === 1 && "bg-amber-400",
                rank === 2 && "bg-stone-400",
                rank === 3 && "bg-orange-300",
                rank > 3 && "bg-primary/40"
              ),
              animatedBarStyle,
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const Section: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}> = ({ title, icon: Icon, children, defaultOpen = true, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  const height = useSharedValue(defaultOpen ? 1 : 0);

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      height: height.value === 1 ? "auto" : 0,
      opacity: height.value,
    };
  });

  const toggleSection = () => {
    setOpen((v) => !v);
    height.value = withTiming(open ? 0 : 1, { duration: 220 });
  };

  return (
    <View style={cn("bg-card border border-border/60 rounded-2xl overflow-hidden")}>
      <TouchableOpacity
        onPress={toggleSection}
        style={cn("w-full flex flex-row items-center justify-between px-5 sm:px-6 py-4", { hoverBgMuted20: true })}
        activeOpacity={0.7}
      >
        <View style={cn("flex flex-row items-center gap-2.5")}>
          <Icon size={20} color={cn("", "text-primary").color} />
          <Text style={cn("text-base sm:text-lg font-bold text-foreground")}>{title}</Text>
          {badge !== undefined && (
            <View style={cn("text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/60")}>
              <Text style={cn("text-xs text-muted-foreground")}>{badge}</Text>
            </View>
          )}
        </View>
        {open ? (
          <ChevronUp size={16} color={cn("", "text-muted-foreground").color} />
        ) : (
          <ChevronDown size={16} color={cn("", "text-muted-foreground").color} />
        )}
      </TouchableOpacity>
      <Animated.View style={[animatedContentStyle, cn("overflow-hidden")]}>
        <View style={cn("px-5 sm:px-6 pb-5 pt-1 border-t border-border/40")}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

const SkeletonCard = () => (
  <View style={cn("bg-card border border-border/60 rounded-2xl p-5 flex flex-row items-start gap-4 animate-pulse")}>
    <View style={cn("h-10 w-10 rounded-xl bg-muted shrink-0")} />
    <View style={cn("flex-1 space-y-2")}>
      <View style={cn("h-3 w-24 bg-muted rounded")} />
      <View style={cn("h-7 w-32 bg-muted rounded")} />
    </View>
  </View>
);

export default function FinancialReport() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | "CUSTOM">(
    TimePeriod.THIS_MONTH
  );
  const [customStart, setCustomStart] = useState(getTodayStr());
  const [customEnd, setCustomEnd] = useState(getTodayStr());
  const isCustom = selectedPeriod === "CUSTOM";

  const effectiveStart = isCustom ? customStart : undefined;
  const effectiveEnd = isCustom ? customEnd : undefined;
  const effectivePeriod: TimePeriod | undefined = isCustom
    ? TimePeriod.CUSTOM
    : selectedPeriod;

  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductResponseDTO | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponseDTO | null>(null);

  const { data: report, isLoading: loadingReport, error: reportError } =
    useQuery<FinancialReportResponseDTO, Error>({
      queryKey: ["financialReport", effectivePeriod, effectiveStart, effectiveEnd],
      queryFn: async () =>
        (await financialReportsApi.getFinancialSummary(effectivePeriod, effectiveStart, effectiveEnd)).data,
      staleTime: 5 * 60 * 1000,
    });

  const { data: topByRevenueRaw, isLoading: loadingTopRevenue } =
    useQuery<unknown[], Error>({
      queryKey: ["topRevenue", effectivePeriod, effectiveStart, effectiveEnd],
      queryFn: async () => {
        const today = getTodayStr();
        const res = await financialReportsApi.getTopNProductsByRevenue(
          5,
          effectiveStart ?? today,
          effectiveEnd ?? today
        );
        return Array.isArray(res.data) ? res.data : [];
      },
      enabled: !isCustom || (!!customStart && !!customEnd),
      staleTime: 5 * 60 * 1000,
    });

  const { data: topByQtyRaw, isLoading: loadingTopQty } =
    useQuery<unknown[], Error>({
      queryKey: ["topQty", effectivePeriod, effectiveStart, effectiveEnd],
      queryFn: async () => {
        const today = getTodayStr();
        const res = await financialReportsApi.getTopNProductsByQuantitySold(
          5,
          effectiveStart ?? today,
          effectiveEnd ?? today
        );
        return Array.isArray(res.data) ? res.data : [];
      },
      enabled: !isCustom || (!!customStart && !!customEnd),
      staleTime: 5 * 60 * 1000,
    });

  const topByRevenue = useMemo(
    () => normalizeTopItems(topByRevenueRaw ?? []),
    [topByRevenueRaw]
  );

  const topByQty = useMemo(
    () => normalizeTopItems(topByQtyRaw ?? []),
    [topByQtyRaw]
  );

  const { data: categories } = useQuery<CategoryResponseDTO[], Error>({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesApi.getAll()).data,
    staleTime: 10 * 60 * 1000,
  });

  const { data: products } = useQuery<ProductResponseDTO[], Error>({
    queryKey: ["products"],
    queryFn: async () => (await productsApi.getAll()).data,
    staleTime: 10 * 60 * 1000,
  });

  const { data: categoryRevenue, isLoading: loadingCatRevenue } =
    useQuery<number, Error>({
      queryKey: ["categoryRevenue", selectedCategory?.id, effectiveStart, effectiveEnd],
      queryFn: async () => {
        const today = getTodayStr();
        const res = await financialReportsApi.getCategoryRevenueByPeriod(
          selectedCategory!.id,
          effectiveStart ?? today,
          effectiveEnd ?? today
        );
        return Number(res.data);
      },
      enabled: !!selectedCategory,
      staleTime: 5 * 60 * 1000,
    });

  const { data: categoryQty, isLoading: loadingCatQty } =
    useQuery<number, Error>({
      queryKey: ["categoryQty", selectedCategory?.id, effectiveStart, effectiveEnd],
      queryFn: async () => {
        const today = getTodayStr();
        const res = await financialReportsApi.getCategoryQuantitySoldByPeriod(
          selectedCategory!.id,
          effectiveStart ?? today,
          effectiveEnd ?? today
        );
        return Number(res.data);
      },
      enabled: !!selectedCategory,
      staleTime: 5 * 60 * 1000,
    });

  const { data: productRevenue, isLoading: loadingProdRevenue } =
    useQuery<number, Error>({
      queryKey: ["productRevenue", selectedProduct?.id, effectiveStart, effectiveEnd],
      queryFn: async () => {
        const today = getTodayStr();
        const res = await financialReportsApi.getProductRevenueByPeriod(
          selectedProduct!.id,
          effectiveStart ?? today,
          effectiveEnd ?? today
        );
        return Number(res.data);
      },
      enabled: !!selectedProduct,
      staleTime: 5 * 60 * 1000,
    });

  const { data: productQty, isLoading: loadingProdQty } =
    useQuery<number, Error>({
      queryKey: ["productQty", selectedProduct?.id, effectiveStart, effectiveEnd],
      queryFn: async () => {
        const today = getTodayStr();
        const res = await financialReportsApi.getProductQuantitySoldByPeriod(
          selectedProduct!.id,
          effectiveStart ?? today,
          effectiveEnd ?? today
        );
        return Number(res.data);
      },
      enabled: !!selectedProduct,
      staleTime: 5 * 60 * 1000,
    });

  const filteredProducts = useMemo(() => {
    if (!products || !productSearch.trim()) return products ?? [];
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  const profitMargin = report && report.totalRevenue > 0
    ? ((report.netProfit / report.totalRevenue) * 100).toFixed(1)
    : "0";

  const revenueByCategory = useMemo(
    () => report ? Object.entries(report.revenueByCategory).sort(([, a], [, b]) => b - a) : [],
    [report]
  );

  const revenueByPayment = useMemo(
    () => report ? Object.entries(report.revenueByPaymentMethod).sort(([, a], [, b]) => b - a) : [],
    [report]
  );

  const maxCatRevenue = revenueByCategory[0]?.[1] ?? 1;
  const maxTopRevenue = topByRevenue[0]?.value ?? 1;
  const maxTopQty = topByQty[0]?.value ?? 1;
  const maxPayRevenue = revenueByPayment[0]?.[1] ?? 1;

  if (reportError) {
    return (
      <SafeAreaView style={cn("min-h-screen bg-background flex items-center justify-center px-4")}>
        <View style={cn("text-center space-y-3")}>
          <AlertCircle size={40} color={cn("", "text-red-500").color} style={cn("mx-auto")} />
          <Text style={cn("text-xl font-bold text-foreground")}>Erro ao carregar relatório</Text>
          <Text style={cn("text-sm text-muted-foreground")}>Tente novamente mais tarde.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={cn("min-h-screen bg-background")}>
      <ScrollView style={cn("flex-1")} contentContainerStyle={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8")}>

        <Animated.View
          entering={FadeIn.duration(400).delay(0)}
          style={cn("flex flex-col")}
        >
          <Text style={cn("text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1")}>
            Painel Administrativo
          </Text>
          <Text style={cn("text-3xl sm:text-4xl font-bold text-foreground leading-tight")}>
            Relatórios Financeiros
          </Text>
          <Text style={cn("text-sm text-muted-foreground mt-1.5")}>
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long", day: "2-digit", month: "long", year: "numeric",
            })}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(350).delay(50)}
          style={cn("bg-card border border-border/60 rounded-2xl p-4 sm:p-5 space-y-4")}
        >
          <View style={cn("flex flex-row items-center gap-2 mb-1")}>
            <BarChart3 size={16} color={cn("", "text-primary").color} />
            <Text style={cn("text-xs font-black uppercase tracking-widest text-muted-foreground")}>
              Período de Análise
            </Text>
          </View>

          <View style={cn("flex flex-wrap gap-2")}>
            {PERIOD_CONFIG.map((p) => (
              <TouchableOpacity
                key={p.value}
                onPress={() => setSelectedPeriod(p.value)}
                style={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all",
                  selectedPeriod === p.value
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-background border-border/60 text-muted-foreground",
                  selectedPeriod === p.value ? {} : { hoverBorderForeground30: true, hoverTextForeground: true }
                )}
              >
                <Text style={cn(
                  selectedPeriod === p.value ? "text-background" : "text-muted-foreground",
                  "text-xs font-bold"
                )}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isCustom && (
            <Animated.View
              entering={SlideInDown.duration(200)}
              exiting={SlideOutDown.duration(200)}
              style={cn("overflow-hidden")}
            >
              <View style={cn("pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-4")}>
                <View style={cn("space-y-1.5")}>
                  <Text style={cn("text-xs font-bold uppercase text-muted-foreground")}>Data Inicial</Text>
                  <TextInput
                    value={customStart}
                    onChangeText={(text) => setCustomStart(text)}
                    placeholder="YYYY-MM-DD"
                    style={cn("rounded-xl bg-background border border-stone-200 px-3 py-2 text-foreground")}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={cn("space-y-1.5")}>
                  <Text style={cn("text-xs font-bold uppercase text-muted-foreground")}>Data Final</Text>
                  <TextInput
                    value={customEnd}
                    onChangeText={(text) => setCustomEnd(text)}
                    placeholder="YYYY-MM-DD"
                    style={cn("rounded-xl bg-background border border-stone-200 px-3 py-2 text-foreground")}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </Animated.View>
          )}

          <View style={cn("flex flex-row items-center gap-2")}>
            <Text style={cn("text-xs text-muted-foreground")}>Visualizando:</Text>
            <View style={cn("inline-flex items-center gap-1 text-xs font-semibold bg-muted border border-border/60 text-foreground px-2.5 py-1 rounded-full")}>
              <Text style={cn("text-xs font-semibold text-foreground")}>
                {PERIOD_CONFIG.find((p) => p.value === selectedPeriod)?.label}
              </Text>
              {isCustom && customStart && customEnd && (
                <Text style={cn("text-muted-foreground text-xs")}> — {customStart} → {customEnd}</Text>
              )}
            </View>
          </View>
        </Animated.View>

        {loadingReport ? (
          <View style={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4")}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </View>
        ) : report ? (
          <View style={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4")}>
            <MetricCard label="Receita Total" value={formatCurrency(report.totalRevenue)} icon={DollarSign} accent="bg-emerald-500/10 text-emerald-600" trend="up" delay={0} />
            <MetricCard label="Despesas" value={formatCurrency(report.totalExpenses)} icon={TrendingDown} accent="bg-red-500/10 text-red-500" trend="down" delay={0.04} />
            <MetricCard label="Lucro Líquido" value={formatCurrency(report.netProfit)} icon={TrendingUp} accent={report.netProfit >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"} trend={report.netProfit >= 0 ? "up" : "down"} sub={`${profitMargin}% de margem`} delay={0.08} />
            <MetricCard label="Total de Pedidos" value={report.totalOrders} icon={ShoppingBag} accent="bg-primary/10 text-primary" delay={0.12} />
            <MetricCard label="Concluídos" value={report.completedOrders} icon={CheckCircle2} accent="bg-green-500/10 text-green-600" delay={0.16} />
            <MetricCard label="Cancelados" value={report.canceledOrders} icon={XCircle} accent="bg-red-500/10 text-red-500" delay={0.20} />
            <MetricCard label="Pendentes" value={report.pendingOrders} icon={Clock} accent="bg-amber-500/10 text-amber-600" delay={0.24} />
            <MetricCard label="Em Preparo" value={report.processingOrders} icon={RefreshCw} accent="bg-blue-500/10 text-blue-600" delay={0.28} />
          </View>
        ) : null}

        <View style={cn("grid grid-cols-1 lg:grid-cols-2 gap-6")}>
          <Animated.View
            entering={FadeIn.duration(350).delay(100)}
            style={cn("flex-1")}
          >
            <Section title="Top 5 por Receita" icon={Award} badge={topByRevenue.length}>
              {loadingTopRevenue ? (
                <View style={cn("flex flex-row items-center justify-center py-8 gap-2 text-muted-foreground")}>
                  <ActivityIndicator size="small" color={cn("", "text-muted-foreground").color} />
                  <Text style={cn("text-sm text-muted-foreground")}>Carregando…</Text>
                </View>
              ) : topByRevenue.length > 0 ? (
                <View style={cn("space-y-4 pt-3")}>
                  {topByRevenue.map((item, i) => (
                    <RankRow
                      key={`rev-${i}-${item.key}`}
                      rank={i + 1}
                      label={item.key}
                      value={item.value}
                      max={maxTopRevenue}
                      mode="currency"
                    />
                  ))}
                </View>
              ) : (
                <Text style={cn("text-sm text-muted-foreground text-center py-8")}>Sem dados para o período.</Text>
              )}
            </Section>
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(350).delay(140)}
            style={cn("flex-1")}
          >
            <Section title="Top 5 por Qtd. Vendida" icon={Hash} badge={topByQty.length}>
              {loadingTopQty ? (
                <View style={cn("flex flex-row items-center justify-center py-8 gap-2 text-muted-foreground")}>
                  <ActivityIndicator size="small" color={cn("", "text-muted-foreground").color} />
                  <Text style={cn("text-sm text-muted-foreground")}>Carregando…</Text>
                </View>
              ) : topByQty.length > 0 ? (
                <View style={cn("space-y-4 pt-3")}>
                  {topByQty.map((item, i) => (
                    <RankRow
                      key={`qty-${i}-${item.key}`}
                      rank={i + 1}
                      label={item.key}
                      value={item.value}
                      max={maxTopQty}
                      mode="quantity"
                    />
                  ))}
                </View>
              ) : (
                <Text style={cn("text-sm text-muted-foreground text-center py-8")}>Sem dados para o período.</Text>
              )}
            </Section>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeIn.duration(350).delay(180)}
          style={cn("flex-1")}
        >
          <Section title="Receita por Categoria" icon={Tag} badge={revenueByCategory.length}>
            {loadingReport ? (
              <View style={cn("flex flex-row items-center justify-center py-8 gap-2 text-muted-foreground")}>
                <ActivityIndicator size="small" color={cn("", "text-muted-foreground").color} />
              </View>
            ) : revenueByCategory.length > 0 ? (
              <View style={cn("grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-3")}>
                {revenueByCategory.map(([name, value], i) => (
                  <RankRow key={name} rank={i + 1} label={name} value={value} max={maxCatRevenue} mode="currency" />
                ))}
              </View>
            ) : (
              <Text style={cn("text-sm text-muted-foreground text-center py-8")}>Sem dados de categorias para o período.</Text>
            )}
          </Section>
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(350).delay(220)}
          style={cn("flex-1")}
        >
          <Section title="Receita por Pagamento" icon={CreditCard} badge={revenueByPayment.length}>
            {loadingReport ? (
              <View style={cn("flex flex-row items-center justify-center py-8 gap-2 text-muted-foreground")}>
                <ActivityIndicator size="small" color={cn("", "text-muted-foreground").color} />
              </View>
            ) : revenueByPayment.length > 0 ? (
              <View style={cn("grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-3")}>
                {revenueByPayment.map(([method, value], i) => (
                  <RankRow key={method} rank={i + 1} label={method.replace(/_/g, " ")} value={value} max={maxPayRevenue} mode="currency" />
                ))}
              </View>
            ) : (
              <Text style={cn("text-sm text-muted-foreground text-center py-8")}>Sem dados de pagamento para o período.</Text>
            )}
          </Section>
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(350).delay(260)}
          style={cn("flex-1")}
        >
          <Section title="Análise de Categoria" icon={Tag} defaultOpen={false}>
            <View style={cn("pt-3 space-y-5")}>
              <View>
                <Text style={cn("text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5")}>
                  Selecionar Categoria
                </Text>
                <View style={cn("flex flex-wrap gap-2")}>
                  {categories?.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategory(selectedCategory?.id === cat.id ? null : cat)}
                      style={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                        selectedCategory?.id === cat.id
                          ? "bg-foreground text-background border-foreground"
                          : "bg-card text-muted-foreground border-border/60",
                        selectedCategory?.id === cat.id ? {} : { hoverBorderForeground30: true, hoverTextForeground: true }
                      )}
                    >
                      <Text style={cn(
                        selectedCategory?.id === cat.id ? "text-background" : "text-muted-foreground",
                        "text-xs font-semibold"
                      )}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {selectedCategory && (
                <Animated.View
                  entering={FadeIn.duration(200).delay(0)}
                  exiting={FadeOut.duration(200)}
                  style={cn("grid grid-cols-1 sm:grid-cols-2 gap-4")}
                >
                  <View style={cn("bg-muted/30 border border-border/50 rounded-2xl p-5")}>
                    <View style={cn("flex flex-row items-center gap-2 mb-3")}>
                      <View style={cn("p-2 rounded-lg bg-emerald-500/10")}>
                        <DollarSign size={16} color={cn("", "text-emerald-600").color} />
                      </View>
                      <View>
                        <Text style={cn("text-xs text-muted-foreground uppercase tracking-wide font-medium")}>Receita</Text>
                        <Text style={cn("text-[11px] text-muted-foreground truncate max-w-[140px]")}>{selectedCategory.name}</Text>
                      </View>
                    </View>
                    {loadingCatRevenue ? (
                      <View style={cn("h-8 w-28 bg-muted rounded animate-pulse")} />
                    ) : (
                      <Text style={cn("text-2xl font-bold text-foreground")}>
                        {categoryRevenue !== undefined && !isNaN(categoryRevenue)
                          ? formatCurrency(categoryRevenue)
                          : "—"}
                      </Text>
                    )}
                  </View>

                  <View style={cn("bg-muted/30 border border-border/50 rounded-2xl p-5")}>
                    <View style={cn("flex flex-row items-center gap-2 mb-3")}>
                      <View style={cn("p-2 rounded-lg bg-blue-500/10")}>
                        <Hash size={16} color={cn("", "text-blue-600").color} />
                      </View>
                      <View>
                        <Text style={cn("text-xs text-muted-foreground uppercase tracking-wide font-medium")}>Qtd. Vendida</Text>
                        <Text style={cn("text-[11px] text-muted-foreground truncate max-w-[140px]")}>{selectedCategory.name}</Text>
                      </View>
                    </View>
                    {loadingCatQty ? (
                      <View style={cn("h-8 w-16 bg-muted rounded animate-pulse")} />
                    ) : (
                      <Text style={cn("text-2xl font-bold text-foreground")}>
                        {categoryQty !== undefined && !isNaN(categoryQty)
                          ? `${categoryQty} un.`
                          : "—"}
                      </Text>
                    )}
                  </View>
                </Animated.View>
              )}

              {!selectedCategory && (
                <Text style={cn("text-xs text-muted-foreground text-center py-4")}>
                  Selecione uma categoria acima para ver a análise detalhada.
                </Text>
              )}
            </View>
          </Section>
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(350).delay(300)}
          style={cn("flex-1")}
        >
          <Section title="Análise de Produto" icon={Coffee} defaultOpen={false}>
            <View style={cn("pt-3 space-y-5")}>
              <View>
                <Text style={cn("text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5")}>
                  Buscar Produto
                </Text>
                <View style={cn("relative max-w-sm")}>
                  <Search size={16} color={cn("", "text-muted-foreground").color} style={cn("absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none")} />
                  <TextInput
                    placeholder="Nome do produto…"
                    value={productSearch}
                    onChangeText={(text) => {
                      setProductSearch(text);
                      setShowProductDropdown(true);
                      if (selectedProduct && text !== selectedProduct.name) {
                        setSelectedProduct(null);
                      }
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    style={cn("pl-9 bg-background rounded-xl border border-stone-200 px-3 py-2 text-foreground")}
                  />
                  {selectedProduct && (
                    <TouchableOpacity
                      onPress={() => { setSelectedProduct(null); setProductSearch(""); }}
                      style={cn("absolute right-3 top-1/2 -translate-y-1/2", { hoverTextForeground: true })}
                    >
                      <X size={16} color={cn("", "text-muted-foreground").color} />
                    </TouchableOpacity>
                  )}

                  {showProductDropdown && productSearch.trim() && !selectedProduct && filteredProducts.length > 0 && (
                    <Animated.View
                      entering={FadeIn.duration(150)}
                      exiting={FadeOut.duration(150)}
                      style={cn("absolute top-full mt-1.5 left-0 right-0 z-20 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto")}
                    >
                      {filteredProducts.slice(0, 8).map((prod) => (
                        <TouchableOpacity
                          key={prod.id}
                          onPress={() => {
                            setSelectedProduct(prod);
                            setProductSearch(prod.name);
                            setShowProductDropdown(false);
                          }}
                          style={cn("w-full flex flex-row items-center gap-3 px-4 py-2.5 text-left", { hoverBgMuted50: true })}
                        >
                          <View style={cn("h-6 w-6 rounded-lg bg-muted flex items-center justify-center shrink-0")}>
                            <Coffee size={14} color={cn("", "text-muted-foreground").color} />
                          </View>
                          <View style={cn("min-w-0")}>
                            <Text style={cn("text-sm font-medium text-foreground truncate")}>{prod.name}</Text>
                            <Text style={cn("text-xs text-muted-foreground")}>
                              {prod.category?.name} · {formatCurrency(prod.price)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </Animated.View>
                  )}
                </View>

                {selectedProduct && (
                  <View style={cn("flex flex-row items-center gap-2 mt-3")}>
                    <Text style={cn("text-xs text-muted-foreground")}>Analisando:</Text>
                    <View style={cn("inline-flex items-center gap-1.5 text-xs font-semibold bg-muted border border-border/60 text-foreground px-2.5 py-1 rounded-full")}>
                      <Coffee size={12} color={cn("", "text-foreground").color} />
                      <Text style={cn("text-xs font-semibold text-foreground")}>{selectedProduct.name}</Text>
                      <TouchableOpacity onPress={() => { setSelectedProduct(null); setProductSearch(""); }} style={cn("ml-0.5", { hoverTextRed500: true })}>
                        <X size={12} color={cn("", "text-foreground").color} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {selectedProduct && (
                <Animated.View
                  entering={FadeIn.duration(200).delay(0)}
                  exiting={FadeOut.duration(200)}
                  style={cn("space-y-4")}
                >
                  <View style={cn("flex flex-row items-center gap-3 bg-muted/20 border border-border/40 rounded-xl p-3")}>
                    <View style={cn("h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0")}>
                      <Coffee size={20} color={cn("", "text-muted-foreground").color} />
                    </View>
                    <View style={cn("min-w-0")}>
                      <Text style={cn("font-medium text-foreground text-sm")}>{selectedProduct.name}</Text>
                      <Text style={cn("text-xs text-muted-foreground")}>
                        {selectedProduct.category?.name} · Preço unitário: {formatCurrency(selectedProduct.price)}
                      </Text>
                    </View>
                  </View>

                  <View style={cn("grid grid-cols-1 sm:grid-cols-2 gap-4")}>
                    <View style={cn("bg-muted/30 border border-border/50 rounded-2xl p-5")}>
                      <View style={cn("flex flex-row items-center gap-2 mb-3")}>
                        <View style={cn("p-2 rounded-lg bg-emerald-500/10")}>
                          <DollarSign size={16} color={cn("", "text-emerald-600").color} />
                        </View>
                        <Text style={cn("text-xs text-muted-foreground uppercase tracking-wide font-medium")}>Receita gerada</Text>
                      </View>
                      {loadingProdRevenue ? (
                        <View style={cn("h-8 w-28 bg-muted rounded animate-pulse")} />
                      ) : (
                        <Text style={cn("text-2xl font-bold text-foreground")}>
                          {productRevenue !== undefined && !isNaN(productRevenue)
                            ? formatCurrency(productRevenue)
                            : "—"}
                        </Text>
                      )}
                    </View>

                    <View style={cn("bg-muted/30 border border-border/50 rounded-2xl p-5")}>
                      <View style={cn("flex flex-row items-center gap-2 mb-3")}>
                        <View style={cn("p-2 rounded-lg bg-blue-500/10")}>
                          <Hash size={16} color={cn("", "text-blue-600").color} />
                        </View>
                        <Text style={cn("text-xs text-muted-foreground uppercase tracking-wide font-medium")}>Unidades vendidas</Text>
                      </View>
                      {loadingProdQty ? (
                        <View style={cn("h-8 w-16 bg-muted rounded animate-pulse")} />
                      ) : (
                        <Text style={cn("text-2xl font-bold text-foreground")}>
                          {productQty !== undefined && !isNaN(productQty)
                            ? `${productQty} un.`
                            : "—"}
                        </Text>
                      )}
                    </View>
                  </View>
                </Animated.View>
              )}

              {!selectedProduct && (
                <Text style={cn("text-xs text-muted-foreground text-center py-4")}>
                  Busque e selecione um produto acima para ver sua performance.
                </Text>
              )}
            </View>
          </Section>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}