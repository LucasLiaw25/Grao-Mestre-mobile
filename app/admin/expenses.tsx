import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import {
  Text,
  Surface,
  TextInput,
  Button,
  ActivityIndicator,
  IconButton,
  Portal,
  Modal,
} from "react-native-paper";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Wallet,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  DollarSign,
  ArrowUpRight,
  X,
} from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { MotiView, AnimatePresence } from "moti";
import { BarChart } from "react-native-chart-kit";

import { expensesApi } from "@/src/lib/api";
import { TimePeriod, ExpenseResponseDTO, ExpenseRequestDTO } from "@/src/types";
import { formatCurrency } from "@/src/lib/format";

const { width, height } = Dimensions.get("window");
const CHART_WIDTH = width - 40;

function getTodayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

type FilterType = "today" | "yesterday" | "this-week" | "last-week" | "this-month" | "last-month" | "custom" | "all";

const PERIOD_BUTTONS: { key: FilterType; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "this-week", label: "Semana" },
  { key: "this-month", label: "Mês" },
  { key: "all", label: "Tudo" },
  { key: "custom", label: "Personalizado" },
];

export default function ExpensesScreen() {
  const qc = useQueryClient();

  /* ------------------------- Filtros ------------------------- */
  const [period, setPeriod] = useState<FilterType>("this-month");
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());

  /* ---------------------- Estado do Formulário ------------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseResponseDTO | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  function resetForm() {
    setEditing(null);
    setName("");
    setPrice("");
  }

  /* ------------------------- Queries ------------------------- */
  const { data: expenses, isLoading } = useQuery<ExpenseResponseDTO[]>({
    queryKey: ["expenses", period, startDate, endDate],
    queryFn: async () => {
      switch (period) {
        case "today": return (await expensesApi.getExpensesForToday()).data;
        case "yesterday": return (await expensesApi.getExpensesForYesterday()).data;
        case "this-week": return (await expensesApi.getExpensesForThisWeek()).data;
        case "last-week": return (await expensesApi.getExpensesForLastWeek()).data;
        case "this-month": return (await expensesApi.getExpensesForThisMonth()).data;
        case "last-month": return (await expensesApi.getExpensesForLastMonth()).data;
        case "custom": return (await expensesApi.getExpensesByPeriod(TimePeriod.CUSTOM, startDate, endDate)).data;
        default: return (await expensesApi.getAll()).data;
      }
    },
  });

  /* ------------------------ Mutations ------------------------ */
  const createMutation = useMutation({
    mutationFn: (data: ExpenseRequestDTO) => expensesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseRequestDTO }) => expensesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });

  /* ---------------------- Dados Derivados ----------------------- */
  const total = expenses?.reduce((acc, e) => acc + e.price, 0) ?? 0;

  const chartData = useMemo(() => {
    if (!expenses) return [];
    const groups: Record<string, number> = {};
    expenses.forEach((e) => {
      const lbl = format(new Date(e.date), "dd/MM");
      groups[lbl] = (groups[lbl] || 0) + e.price;
    });
    return Object.entries(groups).map(([date, amount]) => ({ date, amount }));
  }, [expenses]);

  /* ----------------------- Handlers -------------------------- */
  const handleSave = () => {
    if (!name || !price) return;
    const payload = { name, price: parseFloat(price) };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const confirmDelete = (id: number, expenseName: string) => {
    Alert.alert(
      "Excluir Despesa",
      `Tem certeza que deseja excluir "${expenseName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => deleteMutation.mutate(id) }
      ]
    );
  };

  /* ------------------------- Render -------------------------- */
  return (
    // Wrapper pai flex: 1 para permitir o FAB fixo sobre o ScrollView
    <View style={styles.container}>
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }} // Espaço extra para o FAB não cobrir itens
        entering={FadeIn.duration(600)}
      >
        {/* HEADER */}
        <MotiView 
          from={{ opacity: 0, translateX: -10 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: 700 }}
          style={styles.header}
        >
          <Text style={styles.subtitle}>Painel Administrativo</Text>
          <Text style={styles.title}>Controle de Despesas</Text>
        </MotiView>

        {/* FILTROS */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Surface style={styles.filterCard} elevation={1}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {PERIOD_BUTTONS.map((b) => (
                <TouchableOpacity
                  key={b.key}
                  onPress={() => setPeriod(b.key)}
                  style={[styles.chip, period === b.key && styles.chipActive]}
                >
                  <Text style={[styles.chipText, period === b.key && styles.chipTextActive]}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {period === "custom" && (
              <MotiView from={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 60 }} style={styles.customRow}>
                <TextInput mode="outlined" label="Início" value={startDate} onChangeText={setStartDate} style={styles.dateInput} activeOutlineColor="#292524" />
                <TextInput mode="outlined" label="Fim" value={endDate} onChangeText={setEndDate} style={styles.dateInput} activeOutlineColor="#292524" />
                <IconButton icon={Calendar} size={22} onPress={() => qc.invalidateQueries({ queryKey: ["expenses"] })} />
              </MotiView>
            )}
          </Surface>
        </Animated.View>

        {/* CARD TOTAL */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Surface style={styles.totalCard} elevation={2}>
            <View style={styles.totalHeader}>
              <View style={styles.totalIcon}>
                <Wallet size={20} color="#7c2d12" />
              </View>
              <Text style={styles.totalLabel}>Total no Período</Text>
            </View>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            <Text style={styles.totalSub}>{expenses?.length ?? 0} registros</Text>
          </Surface>
        </Animated.View>

        {/* GRÁFICO */}
        {chartData.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <Surface style={styles.chartCard} elevation={2}>
              <Text style={styles.chartTitle}>Fluxo de Saída</Text>
              <BarChart
                data={{ labels: chartData.map((d) => d.date), datasets: [{ data: chartData.map((d) => d.amount) }] }}
                width={CHART_WIDTH}
                height={220}
                yAxisLabel="" 
                yAxisSuffix="" 
                withInnerLines={false}
                fromZero
                chartConfig={{
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  color: () => "#7c2d12",
                  labelColor: () => "#78716c",
                  barPercentage: 0.6,
                }}
                style={{ marginLeft: -10 }}
              />
            </Surface>
          </Animated.View>
        )}

        {/* LISTA DE DESPESAS */}
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#292524" />
        ) : (
          <AnimatePresence>
            {expenses?.map((e, index) => (
              <MotiView
                key={e.id}
                from={{ opacity: 0, translateY: 15 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 400, delay: 400 + (index * 80) }}
              >
                <Surface style={styles.expenseCard} elevation={1}>
                  <View style={styles.cardLeft}>
                    <View style={styles.expenseIcon}>
                      <ArrowUpRight size={16} color="#7c2d12" />
                    </View>
                    <View>
                      <Text style={styles.expenseName}>{e.name}</Text>
                      <Text style={styles.expenseDate}>{format(new Date(e.date), "dd 'de' MMMM yyyy")}</Text>
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                    <Text style={styles.expensePrice}>{formatCurrency(e.price)}</Text>
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                          setEditing(e);
                          setName(e.name);
                          setPrice(String(e.price));
                          setModalOpen(true);
                        }}
                      >
                        <Edit3 size={18} color="#44403c" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => confirmDelete(e.id, e.name)}
                      >
                        <Trash2 size={18} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Surface>
              </MotiView>
            ))}
          </AnimatePresence>
        )}
      </Animated.ScrollView>

      {/* BOTÃO FLUTUANTE - Fora do ScrollView para ficar estático e mais alto */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => {
          resetForm();
          setModalOpen(true);
        }}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={modalOpen}
          onDismiss={() => { resetForm(); setModalOpen(false); }}
          contentContainerStyle={[
            styles.modalOverlay, 
            { justifyContent: Platform.OS === 'ios' ? 'flex-end' : 'center' }
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            style={{ flex: Platform.OS === 'ios' ? 1 : 0 }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <MotiView
                from={{ translateY: height * 0.5, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 100 }}
                style={[
                  styles.modalContent,
                  // No Android, se o teclado ainda cobrir, forçamos um margem inferior
                  Platform.OS === 'android' && { marginBottom: 20 }
                ]}
              >
                <ScrollView 
                  bounces={false} 
                  showsVerticalScrollIndicator={false}
                  // Garante que o conteúdo interno possa ser rolado se o teclado for gigante
                  contentContainerStyle={{ flexGrow: 1 }}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{editing ? "Editar" : "Nova"} Despesa</Text>
                    <TouchableOpacity onPress={() => { resetForm(); setModalOpen(false); }}>
                      <X size={24} color="#44403c" />
                    </TouchableOpacity>
                  </View>

                  <View style={{ gap: 16 }}>
                    <TextInput
                      mode="outlined"
                      label="Descrição"
                      value={name}
                      onChangeText={setName}
                      activeOutlineColor="#292524"
                    />
                    <TextInput
                      mode="outlined"
                      label="Valor"
                      keyboardType="numeric"
                      value={price}
                      onChangeText={setPrice}
                      activeOutlineColor="#292524"
                      left={<TextInput.Icon icon={() => <DollarSign size={16} color="#78716c" />} />}
                    />
                    <Button
                      mode="contained"
                      onPress={handleSave}
                      style={styles.saveBtn}
                    >
                      Salvar
                    </Button>
                  </View>
                </ScrollView>
              </MotiView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </View>
  );
}

/* --------------------------- Estilos --------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafaf9" },
  header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 30 },
  subtitle: { fontSize: 12, fontWeight: "bold", color: "#78716c", textTransform: "uppercase", letterSpacing: 1 },
  title: { fontFamily: "serif", fontSize: 28, fontWeight: "bold", color: "#1c1917", marginTop: 4 },

  filterCard: { marginHorizontal: 16, padding: 16, borderRadius: 16, backgroundColor: "#ffffff", marginBottom: 20 },
  filterScroll: { gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "#e7e5e4", backgroundColor: "#fafaf9" },
  chipActive: { backgroundColor: "#292524", borderColor: "#292524" },
  chipText: { fontSize: 13, fontWeight: "bold", color: "#78716c" },
  chipTextActive: { color: "#ffffff" },
  customRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  dateInput: { flex: 1, backgroundColor: "#ffffff", height: 45 },

  totalCard: { marginHorizontal: 16, padding: 20, borderRadius: 20, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#f5f5f4", marginBottom: 20 },
  totalHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  totalIcon: { padding: 8, backgroundColor: "#fde68a", borderRadius: 10 },
  totalLabel: { fontSize: 12, fontWeight: "600", color: "#b45309", textTransform: "uppercase" },
  totalValue: { fontFamily: "serif", fontSize: 32, fontWeight: "bold", color: "#1c1917", marginTop: 6 },
  totalSub: { fontSize: 11, color: "#78716c", marginTop: 4 },

  chartCard: { marginHorizontal: 16, padding: 16, borderRadius: 20, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#f5f5f4", marginBottom: 24 },
  chartTitle: { fontFamily: "serif", fontWeight: "bold", color: "#1c1917", marginBottom: 12 },

  expenseCard: { marginHorizontal: 16, padding: 16, borderRadius: 20, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e5e4", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  expenseIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fef3c7", justifyContent: "center", alignItems: "center" },
  expenseName: { fontWeight: "bold", color: "#1c1917", fontSize: 15 },
  expenseDate: { fontSize: 11, color: "#a8a29e", marginTop: 2 },
  cardRight: { alignItems: "flex-end", gap: 4 },
  expensePrice: { fontFamily: "serif", fontSize: 18, fontWeight: "bold", color: "#1c1917" },
  actions: { flexDirection: "row", gap: 0, marginTop: -4 },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f4", 
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e7e5e4",
  },

  fab: {
    position: "absolute",
    bottom: Platform.OS === 'ios' ? 40 : 60, // Posição segura contra o botão voltar do Android
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#292524",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },

  modalOverlay: { margin: 0, justifyContent: 'flex-end', flex: 1 },
  modalContent: { backgroundColor: "#ffffff", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "serif", fontSize: 24, fontWeight: "bold", color: "#1c1917" },
  saveBtn: { borderRadius: 16, backgroundColor: "#292524", paddingVertical: 6, marginTop: 8 },
});