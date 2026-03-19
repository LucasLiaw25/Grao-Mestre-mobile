// components/AddressForm.tsx
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from "react-native";
import type { AddressRequestDTO, AddressResponseDTO } from "../types";
import { Button } from "./Button";

interface AddressFormProps {
  address?: AddressResponseDTO;
  userId: number;
  onSave: (data: AddressRequestDTO) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function AddressForm({ address, userId, onSave, onCancel, isSaving }: AddressFormProps) {
  const [formData, setFormData] = useState<AddressRequestDTO>({
    street: "",
    number: "",
    complement: "",
    state: "",
    city: "",
    cep: "",
    isDefault: false,
    userId: userId,
  });

  useEffect(() => {
    if (address) {
      setFormData({
        street: address.street,
        number: address.number,
        complement: address.complement || "",
        state: address.state,
        city: address.city,
        cep: address.cep,
        isDefault: address.isDefault,
        userId: address.userId,
      });
    } else {
      setFormData({
        street: "",
        number: "",
        complement: "",
        state: "",
        city: "",
        cep: "",
        isDefault: false,
        userId: userId,
      });
    }
  }, [address, userId]);

  const handleChangeText = (name: keyof AddressRequestDTO, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleSwitch = (value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isDefault: value,
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0} 
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {address ? "Editar Endereço" : "Adicionar Novo Endereço"}
          </Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Rua</Text>
              <TextInput
                style={styles.input}
                value={formData.street}
                onChangeText={(text) => handleChangeText("street", text)}
             
                placeholder="Nome da Rua"
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Número</Text>
              <TextInput
                style={styles.input}
                value={formData.number}
                onChangeText={(text) => handleChangeText("number", text)}
       
                keyboardType="numeric"
                placeholder="Número"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Complemento (Opcional)</Text>
            <TextInput
              style={styles.input}
              value={formData.complement || ""}
              onChangeText={(text) => handleChangeText("complement", text)}
              placeholder="Apartamento, Bloco, etc."
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Cidade</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => handleChangeText("city", text)}
           
                placeholder="Cidade"
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Estado (ex: SP)</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(text) => handleChangeText("state", text.toUpperCase())}
               
                maxLength={2}
                autoCapitalize="characters"
                placeholder="UF"
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>CEP</Text>
              <TextInput
                style={styles.input}
                value={formData.cep}
                onChangeText={(text) => handleChangeText("cep", text)}
            
                keyboardType="numeric"
                maxLength={9} // 00000-000
                placeholder="00000-000"
              />
            </View>
          </View>

          <View style={styles.switchContainer}>
            <Switch
              trackColor={{ false: "#767577", true: "#6B4F4F" }} 
              thumbColor={formData.isDefault ? "#F4F3F4" : "#F4F3F4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={handleToggleSwitch}
              value={formData.isDefault}
            />
            <Text style={styles.switchLabel}>Definir como endereço padrão</Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button onPress={onCancel} disabled={isSaving} variant="outline" style={styles.buttonMargin}>
              Cancelar
            </Button>
            <Button onPress={handleSubmit} disabled={isSaving} isLoading={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Endereço"}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  container: {
    marginHorizontal: 20,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333', 
    marginBottom: 20,
    fontFamily: 'serif', 
  },
  inputGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  inputWrapperThird: {
    width: '30%', 
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280', 
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB', 
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#F9FAFB', 
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 15,
    color: '#333333',
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  buttonMargin: {
    marginRight: 12,
  },
});