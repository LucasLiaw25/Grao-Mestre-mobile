import React, { useState, useMemo } from "react";
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { Text, Surface, ActivityIndicator, TextInput, List, Searchbar } from 'react-native-paper';
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  DollarSign, TrendingUp, TrendingDown, ShoppingBag,
  CheckCircle2, XCircle, Clock, RefreshCw, Award, Hash, Tag, CreditCard, Coffee, Search, X
} from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { MotiView } from "moti";

import { financialReportsApi, categoriesApi, productsApi } from "@/src/lib/api";
import { formatCurrency } from "@/src/lib/format";
import { TimePeriod, FinancialReportResponseDTO, CategoryResponseDTO, ProductResponseDTO } from "@/src/types";

const { width } = Dimensions.get("window");

function getTodayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

interface NormalizedTopItem { key: string; value: number; }

function normalizeTopItems(raw: unknown[]): NormalizedTopItem[] {
  return raw.map((item) => {
    const obj = item as Record<string, unknown>;
    const key = typeof obj.key === "string" ? obj.key : String(obj.key ?? obj.name ?? obj.productName ?? "—");
    const rawValue = obj.value ?? obj.revenue ?? obj.totalRevenue ?? obj.quantity ?? 0;
    const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
    return { key, value: isNaN(value) ? 0 : value };
  });
}

const PERIOD_CONFIG = [
  { value: TimePeriod.TODAY, label: "Hoje" },
  { value: TimePeriod.THIS_WEEK, label: "Esta semana" },
  { value: TimePeriod.THIS_MONTH, label: "Este mês" },
  { value: "CUSTOM", label: "Personalizado" },
];

const MetricCard = ({ label, value, sub, icon: Icon, color, trend, index = 0 }: any) => (
  <MotiView
    from={{ opacity: 0, translateY: 15 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 500, delay: index * 100 }}
  >
    <Surface style={styles.metricCard} elevation={0}>
      <View style={[styles.iconWrapper, { backgroundColor: `${color}15` }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.metricLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
      {sub && (
        <View style={styles.trendRow}>
          {trend === 'up' && <TrendingUp size={12} color="#059669" />}
          {trend === 'down' && <TrendingDown size={12} color="#dc2626" />}
          <Text style={[styles.metricSub, trend === 'up' ? {color: '#059669'} : trend === 'down' ? {color: '#dc2626'} : {}]}>
            {sub}
          </Text>
        </View>
      )}
    </Surface>
  </MotiView>
);

const RankRow = ({ rank, label, value, max, mode, index = 0 }: any) => {
  const safeValue = isNaN(value) || value == null ? 0 : value;
  const safeMax = isNaN(max) || max <= 0 ? 1 : max;
  const pct = Math.min((safeValue / safeMax) * 100, 100);

  let rankColor = "#f5f5f4";
  let rankTextColor = "#78716c";
  let barColor = "#d6d3d1";

  if (rank === 1) { rankColor = "#fef3c7"; rankTextColor = "#b45309"; barColor = "#fbbf24"; }
  else if (rank === 2) { rankColor = "#f5f5f4"; rankTextColor = "#57534e"; barColor = "#a8a29e"; }
  else if (rank === 3) { rankColor = "#ffedd5"; rankTextColor = "#c2410c"; barColor = "#fdba74"; }

  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 50 }}
    >
      <View style={styles.rankRow}>
        <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
          <Text style={[styles.rankText, { color: rankTextColor }]}>{rank}</Text>
        </View>
        <View style={styles.rankContent}>
          <View style={styles.rankHeader}>
            <Text style={styles.rankLabel} numberOfLines={1}>{label}</Text>
            <Text style={styles.rankValue}>{mode === "currency" ? formatCurrency(safeValue) : `${safeValue} un.`}</Text>
          </View>
          <View style={styles.barBackground}>
            <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
          </View>
        </View>
      </View>
    </MotiView>
  );
};

export default function ReportsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | "CUSTOM">(TimePeriod.THIS_MONTH);
  const [customStart, setCustomStart] = useState(getTodayStr());
  const [customEnd, setCustomEnd] = useState(getTodayStr());

  const isCustom = selectedPeriod === "CUSTOM";
  const effectiveStart = isCustom ? customStart : undefined;
  const effectiveEnd = isCustom ? customEnd : undefined;
  const effectivePeriod = isCustom ? TimePeriod.CUSTOM : selectedPeriod;

  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductResponseDTO | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponseDTO | null>(null);

  const { data: report, isLoading: loadingReport } = useQuery<FinancialReportResponseDTO>({
    queryKey: ["financialReport", effectivePeriod, effectiveStart, effectiveEnd],
    queryFn: async () => (await financialReportsApi.getFinancialSummary(effectivePeriod, effectiveStart, effectiveEnd)).data,
  });

  const { data: topByRevenueRaw, isLoading: loadingTopRev } = useQuery({
    queryKey: ["topRevenue", effectivePeriod, effectiveStart, effectiveEnd],
    queryFn: async () => (await financialReportsApi.getTopNProductsByRevenue(5, effectiveStart ?? getTodayStr(), effectiveEnd ?? getTodayStr())).data,
  });

  const { data: topByQtyRaw, isLoading: loadingTopQty } = useQuery({
    queryKey: ["topQty", effectivePeriod, effectiveStart, effectiveEnd],
    queryFn: async () => (await financialReportsApi.getTopNProductsByQuantitySold(5, effectiveStart ?? getTodayStr(), effectiveEnd ?? getTodayStr())).data,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesApi.getAll()).data,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await productsApi.getAll()).data,
  });

  const { data: catRevenue } = useQuery({
    queryKey: ["catRev", selectedCategory?.id, effectiveStart, effectiveEnd],
    queryFn: async () => Number((await financialReportsApi.getCategoryRevenueByPeriod(selectedCategory!.id, effectiveStart ?? getTodayStr(), effectiveEnd ?? getTodayStr())).data),
    enabled: !!selectedCategory,
  });

  const { data: catQty } = useQuery({
    queryKey: ["catQty", selectedCategory?.id, effectiveStart, effectiveEnd],
    queryFn: async () => Number((await financialReportsApi.getCategoryQuantitySoldByPeriod(selectedCategory!.id, effectiveStart ?? getTodayStr(), effectiveEnd ?? getTodayStr())).data),
    enabled: !!selectedCategory,
  });

  const { data: prodRevenue } = useQuery({
    queryKey: ["prodRev", selectedProduct?.id, effectiveStart, effectiveEnd],
    queryFn: async () => Number((await financialReportsApi.getProductRevenueByPeriod(selectedProduct!.id, effectiveStart ?? getTodayStr(), effectiveEnd ?? getTodayStr())).data),
    enabled: !!selectedProduct,
  });

  const { data: prodQty } = useQuery({
    queryKey: ["prodQty", selectedProduct?.id, effectiveStart, effectiveEnd],
    queryFn: async () => Number((await financialReportsApi.getProductQuantitySoldByPeriod(selectedProduct!.id, effectiveStart ?? getTodayStr(), effectiveEnd ?? getTodayStr())).data),
    enabled: !!selectedProduct,
  });

  const topByRevenue = useMemo(() => normalizeTopItems(topByRevenueRaw as any[] ?? []), [topByRevenueRaw]);
  const topByQty = useMemo(() => normalizeTopItems(topByQtyRaw as any[] ?? []), [topByQtyRaw]);

  const profitMargin = report && report.totalRevenue > 0 ? ((report.netProfit / report.totalRevenue) * 100).toFixed(1) : "0";
  const revenueByCategory = useMemo(() => report ? Object.entries(report.revenueByCategory).sort(([, a], [, b]) => b - a) : [], [report]);
  const revenueByPayment = useMemo(() => report ? Object.entries(report.revenueByPaymentMethod).sort(([, a], [, b]) => b - a) : [], [report]);

  const maxTopRevenue = topByRevenue[0]?.value ?? 1;
  const maxTopQty = topByQty[0]?.value ?? 1;
  const maxCatRevenue = revenueByCategory[0]?.[1] ?? 1;
  const maxPayRevenue = revenueByPayment[0]?.[1] ?? 1;

  const filteredProducts = useMemo(() => {
    if (!products || !productSearch.trim()) return [];
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 5);
  }, [products, productSearch]);

  return (
    <Animated.ScrollView style={styles.container} showsVerticalScrollIndicator={false} entering={FadeIn.duration(600)}>
      <Animated.View style={styles.header} entering={FadeInDown.duration(600)}>
        <Text style={styles.headerSubtitle}>Painel Administrativo</Text>
        <Text style={styles.headerTitle}>Relatórios Financeiros</Text>
      </Animated.View>

      <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500, delay: 200 }}>
        <Surface style={styles.filterCard} elevation={1}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodScroll}>
            {PERIOD_CONFIG.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[styles.periodChip, selectedPeriod === p.value && styles.periodChipActive]}
                onPress={() => setSelectedPeriod(p.value as any)}
              >
                <Text style={[styles.periodChipText, selectedPeriod === p.value && styles.periodChipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isCustom && (
            <View style={styles.customDateContainer}>
              <TextInput
                mode="outlined"
                label="Data Inicial (YYYY-MM-DD)"
                value={customStart}
                onChangeText={setCustomStart}
                style={styles.dateInput}
                activeOutlineColor="#292524"
              />
              <TextInput
                mode="outlined"
                label="Data Final (YYYY-MM-DD)"
                value={customEnd}
                onChangeText={setCustomEnd}
                style={styles.dateInput}
                activeOutlineColor="#292524"
              />
            </View>
          )}
        </Surface>
      </MotiView>

      {loadingReport ? (
        <ActivityIndicator size="large" color="#292524" style={{ marginVertical: 40 }} />
      ) : report ? (
        <View style={styles.metricsGrid}>
          <MetricCard index={0} label="Receita Total" value={formatCurrency(report.totalRevenue)} icon={DollarSign} color="#059669" trend="up" />
          <MetricCard index={1} label="Despesas" value={formatCurrency(report.totalExpenses)} icon={TrendingDown} color="#dc2626" trend="down" />
          <MetricCard index={2} label="Lucro Líquido" value={formatCurrency(report.netProfit)} icon={TrendingUp} color={report.netProfit >= 0 ? "#059669" : "#dc2626"} trend={report.netProfit >= 0 ? "up" : "down"} sub={`${profitMargin}% margem`} />
          <MetricCard index={3} label="Total Pedidos" value={report.totalOrders} icon={ShoppingBag} color="#292524" />
          <MetricCard index={4} label="Concluídos" value={report.completedOrders} icon={CheckCircle2} color="#059669" />
          <MetricCard index={5} label="Cancelados" value={report.canceledOrders} icon={XCircle} color="#dc2626" />
          <MetricCard index={6} label="Pendentes" value={report.pendingOrders} icon={Clock} color="#d97706" />
          <MetricCard index={7} label="Em Preparo" value={report.processingOrders} icon={RefreshCw} color="#2563eb" />
        </View>
      ) : null}

      <List.Section style={styles.accordionSection}>

        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500, delay: 400 }}>
          <List.Accordion title="Top 5 por Receita" left={props => <Award {...props} color="#292524" />} style={styles.accordionHeader} titleStyle={styles.accordionTitle}>
            <Surface style={styles.accordionContent} elevation={0}>
              {loadingTopRev ? <ActivityIndicator color="#292524" /> : topByRevenue.map((item, i) => (
                <RankRow key={i} index={i} rank={i + 1} label={item.key} value={item.value} max={maxTopRevenue} mode="currency" />
              ))}
            </Surface>
          </List.Accordion>
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500, delay: 500 }}>
          <List.Accordion title="Top 5 por Qtd. Vendida" left={props => <Hash {...props} color="#292524" />} style={styles.accordionHeader} titleStyle={styles.accordionTitle}>
            <Surface style={styles.accordionContent} elevation={0}>
              {loadingTopQty ? <ActivityIndicator color="#292524" /> : topByQty.map((item, i) => (
                <RankRow key={i} index={i} rank={i + 1} label={item.key} value={item.value} max={maxTopQty} mode="quantity" />
              ))}
            </Surface>
          </List.Accordion>
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500, delay: 600 }}>
          <List.Accordion title="Receita por Categoria" left={props => <Tag {...props} color="#292524" />} style={styles.accordionHeader} titleStyle={styles.accordionTitle}>
            <Surface style={styles.accordionContent} elevation={0}>
              {revenueByCategory.map(([name, value], i) => (
                <RankRow key={name} index={i} rank={i + 1} label={name} value={value} max={maxCatRevenue} mode="currency" />
              ))}
            </Surface>
          </List.Accordion>
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500, delay: 700 }}>
          <List.Accordion title="Receita por Pagamento" left={props => <CreditCard {...props} color="#292524" />} style={styles.accordionHeader} titleStyle={styles.accordionTitle}>
            <Surface style={styles.accordionContent} elevation={0}>
              {revenueByPayment.map(([method, value], i) => (
                <RankRow key={method} index={i} rank={i + 1} label={method.replace(/_/g, " ")} value={value} max={maxPayRevenue} mode="currency" />
              ))}
            </Surface>
          </List.Accordion>
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500, delay: 800 }}>
          <List.Accordion title="Análise de Categoria" left={props => <Tag {...props} color="#292524" />} style={styles.accordionHeader} titleStyle={styles.accordionTitle}>
            <Surface style={styles.accordionContent} elevation={0}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {categories?.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catChip, selectedCategory?.id === cat.id && styles.catChipActive]}
                    onPress={() => setSelectedCategory(selectedCategory?.id === cat.id ? null : cat)}
                  >
                    <Text style={[styles.catChipText, selectedCategory?.id === cat.id && styles.catChipTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedCategory ? (
                <View style={styles.analysisGrid}>
                  <View style={styles.analysisCard}>
                    <Text style={styles.analysisLabel}>Receita</Text>
                    <Text style={styles.analysisValue}>{catRevenue !== undefined ? formatCurrency(catRevenue) : "..."}</Text>
                  </View>
                  <View style={styles.analysisCard}>
                    <Text style={styles.analysisLabel}>Qtd. Vendida</Text>
                    <Text style={styles.analysisValue}>{catQty !== undefined ? `${catQty} un.` : "..."}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyText}>Selecione uma categoria acima.</Text>
              )}
            </Surface>
          </List.Accordion>
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500, delay: 900 }}>
          <List.Accordion title="Análise de Produto" left={props => <Coffee {...props} color="#292524" />} style={styles.accordionHeader} titleStyle={styles.accordionTitle}>
            <Surface style={styles.accordionContent} elevation={0}>
              <Searchbar
                placeholder="Buscar produto..."
                onChangeText={setProductSearch}
                value={productSearch}
                style={styles.searchBar}
                icon={() => <Search size={20} color="#78716c" />}
                clearIcon={() => <X size={20} color="#78716c" />}
              />

              {filteredProducts.length > 0 && !selectedProduct && (
                <View style={styles.searchResults}>
                  {filteredProducts.map(prod => (
                    <TouchableOpacity key={prod.id} style={styles.searchItem} onPress={() => { setSelectedProduct(prod); setProductSearch(""); }}>
                      <Text style={styles.searchItemText}>{prod.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {selectedProduct ? (
                <View style={{ marginTop: 16 }}>
                  <View style={styles.selectedProdHeader}>
                    <Text style={styles.selectedProdName}>{selectedProduct.name}</Text>
                    <TouchableOpacity onPress={() => setSelectedProduct(null)}><X size={20} color="#ef4444" /></TouchableOpacity>
                  </View>
                  <View style={styles.analysisGrid}>
                    <View style={styles.analysisCard}>
                      <Text style={styles.analysisLabel}>Receita</Text>
                      <Text style={styles.analysisValue}>{prodRevenue !== undefined ? formatCurrency(prodRevenue) : "..."}</Text>
                    </View>
                    <View style={styles.analysisCard}>
                      <Text style={styles.analysisLabel}>Qtd. Vendida</Text>
                      <Text style={styles.analysisValue}>{prodQty !== undefined ? `${prodQty} un.` : "..."}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                !productSearch && <Text style={styles.emptyText}>Busque um produto para analisar.</Text>
              )}
            </Surface>
          </List.Accordion>
        </MotiView>

      </List.Section>
      <View style={{ height: 40 }} />
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  header: { padding: 20, paddingTop: 30 },
  headerSubtitle: { fontSize: 12, fontWeight: 'bold', color: '#78716c', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontFamily: 'serif', fontSize: 28, fontWeight: 'bold', color: '#1c1917', marginTop: 4 },

  filterCard: { marginHorizontal: 16, padding: 16, borderRadius: 16, backgroundColor: '#ffffff', marginBottom: 20 },
  periodScroll: { gap: 8 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e7e5e4', backgroundColor: '#fafaf9' },
  periodChipActive: { backgroundColor: '#292524', borderColor: '#292524' },
  periodChipText: { fontSize: 13, fontWeight: 'bold', color: '#78716c' },
  periodChipTextActive: { color: '#ffffff' },
  customDateContainer: { marginTop: 16, gap: 10 },
  dateInput: { backgroundColor: '#ffffff', height: 45 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 24 },
  metricCard: { width: (width - 32) / 2 - 4, padding: 16, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f5f5f4' },
  iconWrapper: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  metricLabel: { fontSize: 11, fontWeight: 'bold', color: '#78716c', textTransform: 'uppercase', marginBottom: 4 },
  metricValue: { fontFamily: 'serif', fontSize: 20, fontWeight: 'bold', color: '#1c1917' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metricSub: { fontSize: 11, fontWeight: '600' },

  accordionSection: { paddingHorizontal: 16, gap: 12 },
  accordionHeader: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#f5f5f4' },
  accordionTitle: { fontFamily: 'serif', fontWeight: 'bold', color: '#1c1917' },
  accordionContent: { backgroundColor: '#ffffff', padding: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, marginTop: -10, borderWidth: 1, borderTopWidth: 0, borderColor: '#f5f5f4' },

  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 12, fontWeight: 'bold' },
  rankContent: { flex: 1 },
  rankHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rankLabel: { fontSize: 14, fontWeight: '600', color: '#44403c', flex: 1, marginRight: 10 },
  rankValue: { fontSize: 14, fontWeight: 'bold', color: '#1c1917' },
  barBackground: { height: 6, backgroundColor: '#f5f5f4', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },

  catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e7e5e4', marginRight: 8 },
  catChipActive: { backgroundColor: '#292524', borderColor: '#292524' },
  catChipText: { fontSize: 12, color: '#78716c', fontWeight: '600' },
  catChipTextActive: { color: '#ffffff' },

  analysisGrid: { flexDirection: 'row', gap: 10 },
  analysisCard: { flex: 1, padding: 16, backgroundColor: '#fafaf9', borderRadius: 12, borderWidth: 1, borderColor: '#e7e5e4' },
  analysisLabel: { fontSize: 11, color: '#78716c', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4 },
  analysisValue: { fontFamily: 'serif', fontSize: 18, fontWeight: 'bold', color: '#1c1917' },

  searchBar: { backgroundColor: '#fafaf9', borderRadius: 12, elevation: 0, borderWidth: 1, borderColor: '#e7e5e4', height: 50 },
  searchResults: { marginTop: 8, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e7e5e4', overflow: 'hidden' },
  searchItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  searchItemText: { fontSize: 14, color: '#44403c', fontWeight: '500' },
  selectedProdHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: 12, backgroundColor: '#f5f5f4', borderRadius: 12 },
  selectedProdName: { fontSize: 14, fontWeight: 'bold', color: '#1c1917' },

  emptyText: { textAlign: 'center', color: '#a8a29e', fontSize: 13, marginTop: 10 },
});