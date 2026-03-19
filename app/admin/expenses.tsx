import React, { useState, useMemo, useRef } from "react";
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
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Wallet,
  Plus,
  Trash2,
  TrendingDown,
  Calendar,
  DollarSign,
  Receipt,
  ArrowUpRight,
  BarChart3,
  History,
  Edit3,
  X,
  Filter,
  Loader2,
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
import { BarChart } from "react-native-gifted-charts"; // Usando react-native-gifted-charts para gráficos
import { expensesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format"; // Adapte para RN se necessário
import { type ExpenseResponseDTO, type ExpenseRequestDTO, TimePeriod } from "@/types";
import { useToast } from "@/hooks/use-toast"; // Assumindo que você tem um hook de toast adaptado para RN

type FilterType = 'today' | 'yesterday' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom' | 'all';

const { width } = Dimensions.get("window");

const getTailwindStyles = (tailwindString: string) => {
  const styles: any = {};
  const parts = tailwindString.split(" ");

  parts.forEach((part) => {
    if (part.startsWith("bg-")) {
      const color = part.replace("bg-", "");
      if (color === "background") styles.backgroundColor = "#ffffff";
      else if (color === "accent") styles.backgroundColor = "#f5f5f4"; // stone-100
      else if (color === "primary") styles.backgroundColor = "#292524"; // stone-800
      else if (color === "primary/5") styles.backgroundColor = "rgba(41,37,36,0.05)";
      else if (color === "primary/10") styles.backgroundColor = "rgba(41,37,36,0.1)";
      else if (color === "primary/90") styles.backgroundColor = "rgba(41,37,36,0.9)";
      else if (color === "background/60") styles.backgroundColor = "rgba(255,255,255,0.6)";
      else if (color === "background/90") styles.backgroundColor = "rgba(255,255,255,0.9)";
      else if (color === "background/50") styles.backgroundColor = "rgba(255,255,255,0.5)";
      else if (color === "background/30") styles.backgroundColor = "rgba(255,255,255,0.3)";
      else if (color === "stone-800") styles.backgroundColor = "#292524";
      else if (color === "stone-900") styles.backgroundColor = "#1c1917";
      else if (color === "destructive/5") styles.backgroundColor = "rgba(239,68,68,0.05)";
    } else if (part.startsWith("text-")) {
      const color = part.replace("text-", "");
      if (color === "primary") styles.color = "#292524";
      else if (color === "white") styles.color = "#ffffff";
      else if (color === "muted-foreground") styles.color = "#78716c"; // stone-500
      else if (color === "foreground") styles.color = "#0c0a09"; // stone-950
      else if (color === "stone-800") styles.color = "#292524";
      else if (color === "stone-900") styles.color = "#1c1917";
      else if (color === "destructive") styles.color = "#ef4444"; // red-500
    } else if (part.startsWith("border-")) {
      const color = part.replace("border-", "");
      if (color === "border/30") styles.borderColor = "rgba(229,231,235,0.3)"; // Assuming border is stone-200
      else if (color === "border/50") styles.borderColor = "rgba(229,231,235,0.5)";
      else if (color === "primary/5") styles.borderColor = "rgba(41,37,36,0.05)";
      else if (color === "primary/10") styles.borderColor = "rgba(41,37,36,0.1)";
    } else if (part.startsWith("px-")) {
      styles.paddingHorizontal = parseInt(part.replace("px-", "")) * 4;
    } else if (part.startsWith("py-")) {
      styles.paddingVertical = parseInt(part.replace("py-", "")) * 4;
    } else if (part.startsWith("p-")) {
      styles.padding = parseInt(part.replace("p-", "")) * 4;
    } else if (part.startsWith("mt-")) {
      styles.marginTop = parseInt(part.replace("mt-", "")) * 4;
    } else if (part.startsWith("mb-")) {
      styles.marginBottom = parseInt(part.replace("mb-", "")) * 4;
    } else if (part.startsWith("gap-")) {
      styles.gap = parseInt(part.replace("gap-", "")) * 4;
    } else if (part.startsWith("h-")) {
      styles.height = parseInt(part.replace("h-", "")) * 4;
    } else if (part.startsWith("w-")) {
      styles.width = parseInt(part.replace("w-", "")) * 4;
    } else if (part.startsWith("rounded-")) {
      if (part === "rounded-full") styles.borderRadius = 9999;
      else if (part === "rounded-xl") styles.borderRadius = 12;
      else if (part === "rounded-2xl") styles.borderRadius = 16;
    } else if (part === "flex") styles.display = "flex";
    else if (part === "flex-col") styles.flexDirection = "column";
    else if (part === "flex-row") styles.flexDirection = "row";
    else if (part === "items-center") styles.alignItems = "center";
    else if (part === "justify-center") styles.justifyContent = "center";
    else if (part === "justify-between") styles.justifyContent = "space-between";
    else if (part === "flex-wrap") styles.flexWrap = "wrap";
    else if (part === "relative") styles.position = "relative";
    else if (part === "absolute") styles.position = "absolute";
    else if (part === "z-10") styles.zIndex = 10;
    else if (part === "z-20") styles.zIndex = 20;
    else if (part === "text-center") styles.textAlign = "center";
    else if (part === "text-sm") styles.fontSize = 14;
    else if (part === "text-xs") styles.fontSize = 12;
    else if (part === "text-[10px]") styles.fontSize = 10;
    else if (part === "text-lg") styles.fontSize = 18;
    else if (part === "text-xl") styles.fontSize = 20;
    else if (part === "text-2xl") styles.fontSize = 24;
    else if (part === "text-4xl") styles.fontSize = 36;
    else if (part === "font-bold") styles.fontWeight = "700";
    else if (part === "font-serif") styles.fontFamily = Platform.OS === "ios" ? "Georgia" : "serif";
    else if (part === "uppercase") styles.textTransform = "uppercase";
    else if (part === "tracking-widest") styles.letterSpacing = 1;
    else if (part === "tracking-[0.2em]") styles.letterSpacing = 2;
    else if (part === "tracking-tighter") styles.letterSpacing = -0.5;
    else if (part === "shadow-md") styles.shadowColor = "#000";
    else if (part === "shadow-md") styles.shadowOffset = { width: 0, height: 2 };
    else if (part === "shadow-md") styles.shadowOpacity = 0.1;
    else if (part === "shadow-md") styles.shadowRadius = 4;
    else if (part === "elevation-2") styles.elevation = 2; // Android shadow
    else if (part === "shadow-xl") styles.shadowColor = "#000";
    else if (part === "shadow-xl") styles.shadowOffset = { width: 0, height: 10 };
    else if (part === "shadow-xl") styles.shadowOpacity = 0.1;
    else if (part === "shadow-xl") styles.shadowRadius = 15;
    else if (part === "elevation-5") styles.elevation = 5;
    else if (part === "shadow-2xl") styles.shadowColor = "#000";
    else if (part === "shadow-2xl") styles.shadowOffset = { width: 0, height: 20 };
    else if (part === "shadow-2xl") styles.shadowOpacity = 0.25;
    else if (part === "shadow-2xl") styles.shadowRadius = 25;
    else if (part === "elevation-10") styles.elevation = 10;
    else if (part === "shadow-sm") styles.shadowColor = "#000";
    else if (part === "shadow-sm") styles.shadowOffset = { width: 0, height: 1 };
    else if (part === "shadow-sm") styles.shadowOpacity = 0.05;
    else if (part === "shadow-sm") styles.shadowRadius = 2;
    else if (part === "elevation-1") styles.elevation = 1;
    else if (part === "transition-all") styles.transitionProperty = "all";
    else if (part === "whitespace-nowrap") styles.whiteSpace = "nowrap";
    else if (part === "shrink-0") styles.flexShrink = 0;
    else if (part === "top-1/2") styles.top = "50%";
    else if (part === "-translate-y-1/2") styles.transform = [{ translateY: -10 }]; // Adjusted for RN
    else if (part === "pl-10") styles.paddingLeft = 40;
    else if (part === "italic") styles.fontStyle = "italic";
    else if (part === "opacity-0") styles.opacity = 0;
    else if (part === "group-hover:opacity-100") styles.groupHoverOpacity100 = { opacity: 1 }; // Placeholder for hover
    else if (part === "hover:bg-accent") styles.hoverBgAccent = { backgroundColor: "#f5f5f4" };
    else if (part === "hover:text-muted-foreground") styles.hoverTextMutedForeground = { color: "#78716c" };
    else if (part === "hover:bg-primary/90") styles.hoverBgPrimary90 = { backgroundColor: "rgba(41,37,36,0.9)" };
    else if (part === "hover:bg-stone-900") styles.hoverBgStone900 = { backgroundColor: "#1c1917" };
    else if (part === "hover:text-primary") styles.hoverTextPrimary = { color: "#292524" };
    else if (part === "hover:bg-primary/5") styles.hoverBgPrimary5 = { backgroundColor: "rgba(41,37,36,0.05)" };
    else if (part === "hover:text-destructive") styles.hoverTextDestructive = { color: "#ef4444" };
    else if (part === "hover:bg-destructive/5") styles.hoverBgDestructive5 = { backgroundColor: "rgba(239,68,68,0.05)" };
    else if (part === "hover:shadow-lg") styles.hoverShadowLg = { shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 };
    else if (part === "no-scrollbar") styles.overflow = "hidden"; // Simplified for RN, might need custom scrollbar component
    else if (part === "sticky") styles.position = "absolute"; // Simplified for RN, sticky behavior is complex
    else if (part === "top-24") styles.top = 96;
    else if (part === "-mt-16") styles.marginTop = -64;
    else if (part === "max-h-[700px]") styles.maxHeight = 700;
    else if (part === "overflow-y-auto") styles.overflowY = "scroll";
    else if (part === "custom-scrollbar") styles.customScrollbar = {}; // Placeholder for custom scrollbar
    else if (part === "opacity-40") styles.opacity = 0.4;
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

export default function ExpenseManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [filter, setFilter] = useState<FilterType>("this-month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: expenses, isLoading } = useQuery<ExpenseResponseDTO[]>({
    queryKey: ["expenses", filter, startDate, endDate],
    queryFn: async () => {
      switch (filter) {
        case 'today': return (await expensesApi.getExpensesForToday()).data;
        case 'yesterday': return (await expensesApi.getExpensesForYesterday()).data;
        case 'this-week': return (await expensesApi.getExpensesForThisWeek()).data;
        case 'last-week': return (await expensesApi.getExpensesForLastWeek()).data;
        case 'this-month': return (await expensesApi.getExpensesForThisMonth()).data;
        case 'last-month': return (await expensesApi.getExpensesForLastMonth()).data;
        case 'all': return (await expensesApi.getAll()).data;
        case 'custom':
          return (await expensesApi.getExpensesByPeriod(TimePeriod.CUSTOM, startDate, endDate)).data;
        default: return (await expensesApi.getExpensesForThisMonth()).data;
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ExpenseRequestDTO) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      resetForm();
      toast({ title: "Sucesso", description: "Despesa registrada no livro." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: `Falha ao registrar despesa: ${error.message}`, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: ExpenseRequestDTO }) => expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      resetForm();
      toast({ title: "Atualizado", description: "O registro foi devidamente alterado." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: `Falha ao atualizar despesa: ${error.message}`, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Removido", description: "Entrada excluída com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: `Falha ao remover despesa: ${error.message}`, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setPrice("");
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!name || !price) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }
    const payload = { name, price: parseFloat(price) };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (expense: ExpenseResponseDTO) => {
    setEditingId(expense.id);
    setName(expense.name);
    setPrice(expense.price.toString());
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const chartData = useMemo(() => {
    if (!expenses) return [];
    const groups = expenses.reduce((acc: Record<string, number>, curr) => {
      const date = new Date(curr.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      acc[date] = (acc[date] || 0) + curr.price;
      return acc;
    }, {});
    return Object.entries(groups).map(([date, amount]) => ({ value: amount, label: date }));
  }, [expenses]);

  const totalExpenses = expenses?.reduce((acc, curr) => acc + curr.price, 0) || 0;

  return (
    <SafeAreaView style={cn("min-h-screen bg-background")}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={cn("pb-24")}>
        <View style={cn("relative h-[180px] flex items-center justify-center overflow-hidden border-b border-border/30")}>
          <View style={cn("relative z-10 text-center px-4 mt-5")}>
            <Text style={cn("text-xl font-serif font-bold text-foreground tracking-tight")}>
              Gestão de Despesas
            </Text>
            <Text style={cn("text-sm text-muted-foreground mt-1")}>
              Controle seus gastos com estilo.
            </Text>
          </View>
        </View>

        <View style={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20")}>
          <View style={cn("mb-8 p-4 bg-background/60 flex flex-wrap items-center justify-between gap-4 border border-primary/5 rounded-2xl shadow-sm")}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cn("flex items-center gap-3 pb-2")}>
              <Filter size={16} color={cn("", "text-primary").color} style={cn("shrink-0")} />
              {(['today', 'this-week', 'this-month', 'all', 'custom'] as FilterType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setFilter(t)}
                  style={cn(
                    "text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-full transition-all",
                    filter === t ? "bg-primary text-white shadow-md" : "bg-transparent text-muted-foreground",
                    filter === t ? {} : { hoverBgAccent: true }
                  )}
                >
                  <Text style={cn(
                    "text-[10px] uppercase tracking-widest font-bold",
                    filter === t ? "text-white" : "text-muted-foreground"
                  )}>
                    {t === 'today' ? 'Hoje' : t === 'this-week' ? 'Semana' : t === 'this-month' ? 'Mês' : t === 'all' ? 'Tudo' : 'Personalizado'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filter === 'custom' && (
              <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={cn("flex flex-row items-center gap-2")}>
                <TextInput
                  placeholder="Data Inicial"
                  value={startDate}
                  onChangeText={setStartDate}
                  style={cn("h-8 text-xs bg-transparent border border-border/50 rounded-xl px-3 text-foreground")}
                  keyboardType="number-pad" // Use appropriate keyboard type for date input
                />
                <Text style={cn("text-muted-foreground")}>à</Text>
                <TextInput
                  placeholder="Data Final"
                  value={endDate}
                  onChangeText={setEndDate}
                  style={cn("h-8 text-xs bg-transparent border border-border/50 rounded-xl px-3 text-foreground")}
                  keyboardType="number-pad"
                />
              </Animated.View>
            )}
          </View>

          <View style={cn("grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12")}>
            <Animated.View entering={FadeIn.duration(400)} style={cn("p-8 bg-background/90 border border-primary/10 flex flex-col justify-between rounded-2xl shadow-xl")}>
              <View>
                <View style={cn("flex justify-between items-center mb-6")}>
                  <View style={cn("p-3 bg-accent rounded-xl")}>
                    <Wallet size={20} color={cn("", "text-primary").color} />
                  </View>
                  <Text style={cn("text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground")}>Status Atual</Text>
                </View>
                <Text style={cn("text-sm text-muted-foreground mb-1")}>Total no Período</Text>
                <Text style={cn("text-4xl font-serif font-bold text-foreground")}>{formatCurrency(totalExpenses)}</Text>
              </View>
              <View style={cn("mt-8 pt-6 border-t border-border/50")}>
                <View style={cn("flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-tighter")}>
                  <Calendar size={16} color={cn("", "text-primary").color} />
                  <Text style={cn("text-primary text-xs font-bold uppercase tracking-tighter")}>{expenses?.length || 0} Registros encontrados</Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={FadeIn.duration(400).delay(100)} style={cn("lg:col-span-2 p-8 bg-background/50 border border-border/50 rounded-2xl shadow-sm")}>
              <View style={cn("flex items-center justify-between mb-6")}>
                <Text style={cn("font-serif text-lg font-bold flex items-center gap-2")}>
                  <BarChart3 size={20} color={cn("", "text-primary").color} /> Fluxo de Saída
                </Text>
              </View>
              <View style={cn("h-[220px] w-full")}>
                {chartData.length > 0 ? (
                  <BarChart
                    data={chartData}
                    barWidth={35}
                    spacing={20}
                    initialSpacing={10}
                    barBorderRadius={4}
                    frontColor={cn("", "bg-primary").backgroundColor}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    xAxisColor="rgba(0,0,0,0.05)"
                    yAxisColor="rgba(0,0,0,0.05)"
                    hideRules
                    showYAxisIndices
                    yAxisLabelSuffix="R$"
                    noOfSections={4}
                    maxValue={Math.max(...chartData.map(item => item.value)) * 1.2}
                    width={width - 120} // Adjust width for padding and spacing
                  />
                ) : (
                  <View style={cn("flex-1 items-center justify-center")}>
                    <Text style={cn("text-muted-foreground text-sm")}>Sem dados para o gráfico.</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </View>

          <View style={cn("grid grid-cols-1 lg:grid-cols-12 gap-8")}>
            <Animated.View entering={SlideInDown.duration(400)} style={cn("lg:col-span-4 p-8 border border-border/50 bg-background/50 rounded-2xl shadow-2xl")}>
              <View style={cn("flex justify-between items-center mb-6")}>
                <Text style={cn("font-serif text-xl font-bold flex items-center gap-2")}>
                  {editingId ? <Edit3 size={20} color={cn("", "text-primary").color} /> : <Plus size={20} color={cn("", "text-primary").color} />}
                  <Text style={cn("text-foreground")}>{editingId ? "Editar Registro" : "Nova Anotação"}</Text>
                </Text>
                {editingId && (
                  <TouchableOpacity onPress={resetForm} style={cn("p-2 rounded-full", { hoverTextPrimary: true })}>
                    <X size={20} color={cn("", "text-muted-foreground").color} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={cn("space-y-5")}>
                <View style={cn("space-y-2")}>
                  <Text style={cn("text-[10px] uppercase tracking-widest font-bold text-muted-foreground")}>Descrição</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Ex: Jantar no Fasano"
                    style={cn("bg-transparent border border-border/50 focus:ring-1 focus:ring-primary h-12 rounded-xl px-3 text-foreground")}
                  />
                </View>
                <View style={cn("space-y-2")}>
                  <Text style={cn("text-[10px] uppercase tracking-widest font-bold text-muted-foreground")}>Valor</Text>
                  <View style={cn("relative")}>
                    <DollarSign size={16} color={cn("", "text-muted-foreground").color} style={cn("absolute left-3 top-1/2 -translate-y-1/2")} />
                    <TextInput
                      keyboardType="numeric"
                      value={price}
                      onChangeText={setPrice}
                      placeholder="0.00"
                      style={cn("pl-10 bg-transparent border border-border/50 h-12 rounded-xl px-3 text-foreground")}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={cn(
                    "w-full h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center",
                    editingId ? "bg-stone-800" : "bg-primary",
                    editingId ? { hoverBgStone900: true } : { hoverBgPrimary90: true },
                    (createMutation.isPending || updateMutation.isPending) ? { opacity: 0.5 } : {}
                  )}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={cn("text-white text-[10px] font-bold uppercase tracking-widest")}>
                      {editingId ? "Atualizar Livro" : "Confirmar Registro"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeIn.duration(400).delay(200)} style={cn("lg:col-span-8 border border-border/50 bg-background/30 rounded-2xl shadow-sm overflow-hidden")}>
              <View style={cn("p-8 border-b border-border/50 flex flex-row justify-between items-center")}>
                <View>
                  <Text style={cn("font-serif text-2xl font-bold flex items-center gap-3")}>
                    <History size={24} color={cn("", "text-primary").color} />
                    <Text style={cn("text-foreground")}>Histórico</Text>
                  </Text>
                  <Text style={cn("text-sm text-muted-foreground italic")}>Exibindo registros de: <Text style={cn("font-bold text-primary")}>{filter.replace('-', ' ')}</Text></Text>
                </View>
                <Receipt size={32} color={cn("", "text-muted-foreground/30").color} />
              </View>

              <ScrollView style={cn("p-4 md:p-8 max-h-[700px]")} contentContainerStyle={cn("space-y-4")}>
                {isLoading ? (
                  <View style={cn("flex items-center justify-center py-20")}>
                    <Loader2 size={24} color={cn("", "text-muted-foreground").color} style={cn("animate-spin")} />
                    <Text style={cn("text-muted-foreground text-sm mt-2")}>Carregando despesas...</Text>
                  </View>
                ) : expenses?.length > 0 ? (
                  expenses.map((expense) => (
                    <Animated.View
                      key={expense.id}
                      layout={Layout.springify()}
                      entering={FadeIn}
                      exiting={FadeOut}
                      style={cn("flex flex-row items-center justify-between p-5 rounded-2xl border border-border/40 bg-background/60 shadow-sm", { hoverBgBackground: true, hoverShadowLg: true })}
                    >
                      <View style={cn("flex flex-row items-center gap-5")}>
                        <View style={cn("w-10 h-10 rounded-full bg-accent flex items-center justify-center")}>
                          <ArrowUpRight size={16} color={cn("", "text-primary").color} />
                        </View>
                        <View>
                          <Text style={cn("font-bold text-stone-800")}>{expense.name}</Text>
                          <Text style={cn("text-[9px] text-muted-foreground font-bold uppercase tracking-[0.2em]")}>
                            {new Date(expense.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </Text>
                        </View>
                      </View>

                      <View style={cn("flex flex-row items-center gap-4")}>
                        <Text style={cn("font-serif text-lg font-bold text-stone-900")}>
                          {formatCurrency(expense.price)}
                        </Text>
                        <View style={cn("flex flex-row items-center gap-1 opacity-0", { groupHoverOpacity100: true })}>
                          <TouchableOpacity
                            onPress={() => handleEdit(expense)}
                            style={cn("p-2 rounded-full", { hoverTextPrimary: true, hoverBgPrimary5: true })}
                          >
                            <Edit3 size={16} color={cn("", "text-muted-foreground").color} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => deleteMutation.mutate(expense.id)}
                            style={cn("p-2 rounded-full", { hoverTextDestructive: true, hoverBgDestructive5: true })}
                          >
                            <Trash2 size={16} color={cn("", "text-muted-foreground").color} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Animated.View>
                  ))
                ) : (
                  <View style={cn("py-20 text-center opacity-40")}>
                    <Text style={cn("font-serif text-lg italic text-muted-foreground")}>Nenhum registro encontrado para este período.</Text>
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}