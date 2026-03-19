import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { formatCurrency } from "../lib/format"; // Ajuste o caminho
import { OrderResponseDTO, OrderStatus } from "../types"; // Ajuste o caminho
import { Button } from "./Button"; // Importar o Button que criamos anteriormente

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderResponseDTO;
  onUpdateStatus: (data: { orderId: number; newStatus: OrderStatus }) => void;
  isUpdatingStatus: boolean;
}

export default function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
  isUpdatingStatus,
}: OrderDetailsModalProps) {
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.orderStatus);

  useEffect(() => {
    if (order) {
      setNewStatus(order.orderStatus);
    }
  }, [order]);

  const handleStatusChange = (value: OrderStatus) => {
    setNewStatus(value);
  };

  const handleSaveStatus = () => {
    if (order.id && newStatus !== order.orderStatus) {
      onUpdateStatus({ orderId: order.id, newStatus });
    } else {
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Detalhes do Pedido #{order.id}
            </Text>
            <Text style={styles.modalDescription}>
              Visualize e gerencie os detalhes deste pedido.
            </Text>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.section}>
              <View style={styles.summaryGrid}>
                <View>
                  <Text style={styles.label}>Email do Cliente</Text>
                  <Text style={styles.value}>{order.userEmail}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Data do Pedido</Text>
                  <Text style={styles.value}>{new Date(order.orderDate).toLocaleString()}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Preço Total</Text>
                  <Text style={styles.totalPriceValue}>{formatCurrency(order.totalPrice)}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Método de Pagamento</Text>
                  <Text style={styles.value}>{order.paymentMethod.replace(/_/g, ' ')}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Status do Pagamento</Text>
                  <Text style={styles.value}>
                    {order.payment?.paymentStatus ? order.payment.paymentStatus.replace(/_/g, ' ') : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.itemsTitle}>Itens</Text>
              <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.productColumn]}>Produto</Text>
                  <Text style={[styles.tableHeaderText, styles.qtyColumn]}>Qtd</Text>
                  <Text style={[styles.tableHeaderText, styles.priceColumn]}>Preço</Text>
                  <Text style={[styles.tableHeaderText, styles.subtotalColumn]}>Subtotal</Text>
                </View>
                {order.items.map((item) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.productColumn]}>{item.productName}</Text>
                    <Text style={[styles.tableCell, styles.qtyColumn]}>{item.quantity}</Text>
                    <Text style={[styles.tableCell, styles.priceColumn, styles.textRight]}>{formatCurrency(item.priceAtTime)}</Text>
                    <Text style={[styles.tableCell, styles.subtotalColumn, styles.textRight, styles.subtotalValue]}>{formatCurrency(item.subtotal)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.statusUpdateContainer}>
                <Text style={styles.label}>Atualizar Status</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={newStatus}
                    onValueChange={(itemValue) => handleStatusChange(itemValue as OrderStatus)}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    {Object.values(OrderStatus).map((status) => (
                      <Picker.Item key={status} label={status.replace(/_/g, ' ')} value={status} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button onPress={onClose} variant="outline" style={styles.footerButton}>
              Fechar
            </Button>
            <Button
              onPress={handleSaveStatus}
              disabled={isUpdatingStatus || newStatus === order.orderStatus}
              isLoading={isUpdatingStatus}
              style={styles.footerButton}
            >
              Salvar Status
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF', // bg-card
    borderRadius: 12, // rounded-2xl
    padding: 24, // p-6
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24, // text-2xl
    fontWeight: 'bold',
    color: '#333333', // text-foreground
    fontFamily: 'serif',
    marginBottom: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280', // text-muted-foreground
  },
  scrollView: {
    flexGrow: 1,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16, // gap-4
  },
  label: {
    fontSize: 12,
    color: '#6B7280', // text-muted-foreground
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333', // text-foreground
  },
  totalPriceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B4F4F', // text-primary
  },
  itemsTitle: {
    fontSize: 20, // text-xl
    fontWeight: 'bold',
    color: '#333333', // text-foreground
    fontFamily: 'serif',
    marginBottom: 12,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-border/50
    borderRadius: 8, // rounded-lg
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6', // bg-muted/50
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderText: {
    fontSize: 10, // text-xs
    fontWeight: '500',
    color: '#6B7280', // text-muted-foreground
    textTransform: 'uppercase',
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // divide-border/50
  },
  tableCell: {
    fontSize: 14, // text-sm
    color: '#333333', // text-foreground
    paddingHorizontal: 8,
  },
  productColumn: {
    flex: 3, // Ajuste de largura para colunas
  },
  qtyColumn: {
    flex: 1,
  },
  priceColumn: {
    flex: 2,
  },
  subtotalColumn: {
    flex: 2,
  },
  textRight: {
    textAlign: 'right',
  },
  subtotalValue: {
    fontWeight: '500',
  },
  statusUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  pickerWrapper: {
    flex: 1,
    marginLeft: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB', // border-border
    borderRadius: 8,
    backgroundColor: '#F9FAFB', // bg-background
    // Altura para o picker no Android
    ...(Platform.OS === 'android' && {
      height: 50,
      justifyContent: 'center',
    }),
  },
  picker: {
    color: '#333333', // text-foreground
    // Altura para o picker no iOS
    ...(Platform.OS === 'ios' && {
      height: 150, // Altura padrão para o Picker iOS
    }),
  },
  pickerItem: {
    fontSize: 16,
    color: '#333333',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24, // mt-6
    gap: 12, // gap-4
  },
  footerButton: {
    minWidth: 100,
  },
});