// components/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: 'default' | 'outline' | 'destructive'; 
  style?: ViewStyle; 
  textStyle?: TextStyle; 
}

export function Button({ children, onPress, disabled, isLoading, variant = 'default', style, textStyle }: ButtonProps) {
  const buttonStyles = [
    styles.buttonBase,
    variant === 'default' && styles.buttonDefault,
    variant === 'outline' && styles.buttonOutline,
    variant === 'destructive' && styles.buttonDestructive,
    disabled && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.buttonTextBase,
    variant === 'outline' && styles.buttonTextOutline,
    variant === 'destructive' && styles.buttonTextDestructive,
    disabled && styles.buttonTextDisabled,
    textStyle, 
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      style={buttonStyles}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#6B7280' : '#FFFFFF'} /> 
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100, 
  },
  buttonDefault: {
    backgroundColor: '#6B4F4F',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB', 
  },
  buttonDestructive: {
    backgroundColor: '#EF4444', 
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonTextBase: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextOutline: {
    color: '#6B7280',
  },
  buttonTextDestructive: {
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: '#A0A0A0',
  },
});