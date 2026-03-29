import React from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Text, Surface } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from "expo-router";
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Coffee, 
  Package, 
  ChevronRight 
} from "lucide-react-native";
import { MotiView } from "moti";


const COLORS = {
  background: "#fdfbf9",
  primaryText: "#1c1917",
  mutedText: "#78716c",
  brandBrown: "#9a6333",
  success: "#16a34a",
  danger: "#dc2626",
  warning: "#d97706",
  border: "#e7e5e4",
};

const STATUS_MAP = {
  success: {
    label: "Apreciação",
    title: "Pedido Confirmado.",
    description: "Seu pagamento foi processado com sucesso. Nossos mestres de torra já foram notificados e seus grãos estarão a caminho em breve.",
    icon: <CheckCircle size={64} color={COLORS.success} />,
    color: COLORS.success,
  },
  pending: {
    label: "Processamento",
    title: "Quase lá.",
    description: "Seu pedido foi registrado. Assim que o Mercado Pago confirmar a transação, iniciaremos o preparo.",
    icon: <Clock size={64} color={COLORS.warning} />,
    color: COLORS.warning,
  },
  failure: {
    label: "Transação Interrompida",
    title: "Houve um contratempo.",
    description: "O pagamento não foi aprovado. Seus itens continuam no carrinho para você tentar novamente com outro método.",
    icon: <AlertCircle size={64} color={COLORS.danger} />,
    color: COLORS.danger,
  }
};

export default function PaymentStatusScreen() {
  const router = useRouter();
  const { status } = useLocalSearchParams<{ status: 'success' | 'pending' | 'failure' }>();
  
  // Fallback para pending caso o status venha vazio
  const config = STATUS_MAP[status || 'pending'];

  const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

  return (
    <View style={styles.container}>
      <MotiView 
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 600 }}
        style={styles.content}
      >
        <Surface style={styles.card} elevation={1}>
          <View style={[styles.statusLine, { backgroundColor: config.color }]} />
          
          <Text style={styles.label}>{config.label}</Text>
          
          <View style={styles.iconWrapper}>
             {config.icon}
          </View>

          <Text style={[styles.title, { fontFamily: serifFont }]}>
            {config.title}
          </Text>

          <Text style={styles.description}>
            {config.description}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.primaryBtn}
              onPress={() => router.replace("/orders")}
            >
              <Package size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Acompanhar Pedido</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryBtn}
              onPress={() => router.replace("/products")}
            >
              <Coffee size={20} color={COLORS.primaryText} />
              <Text style={styles.secondaryBtnText}>Continuar Comprando</Text>
              <ChevronRight size={16} color={COLORS.mutedText} />
            </TouchableOpacity>
          </View>
        </Surface>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  label: {
    fontSize: 12,
    color: COLORS.mutedText,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 24,
  },
  iconWrapper: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 50,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primaryText,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: COLORS.mutedText,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryText,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
});