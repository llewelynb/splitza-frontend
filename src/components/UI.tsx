import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Spacing, Radius, Typography } from './theme';

// --- Button ---
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}
export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const bg = variant === 'primary' ? Colors.primary
    : variant === 'danger' ? Colors.error
    : variant === 'secondary' ? Colors.border
    : 'transparent';
  const color = variant === 'secondary' ? Colors.text
    : variant === 'ghost' ? Colors.primary
    : '#fff';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }, style]}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={color} />
        : <Text style={[styles.btnText, { color }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

// --- Card ---
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// --- Input ---
interface InputProps {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
  style?: ViewStyle;
  error?: string;
}
export function Input({ label, value, onChangeText, placeholder, keyboardType, multiline, style, error }: InputProps) {
  return (
    <View style={[styles.inputWrapper, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        style={[styles.input, error ? styles.inputError : undefined, multiline ? { height: 80 } : undefined]}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// --- ZAR amount display ---
export function ZarAmount({ amount, style, size = 'md' }: { amount: number; style?: TextStyle; size?: 'sm' | 'md' | 'lg' }) {
  const fontSize = size === 'lg' ? 24 : size === 'sm' ? 13 : 16;
  return (
    <Text style={[{ fontSize, fontWeight: '600', color: Colors.zar }, style]}>
      R{amount.toFixed(2)}
    </Text>
  );
}

// --- Section header ---
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={Typography.heading3}>{title}</Text>
      {action && <TouchableOpacity onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></TouchableOpacity>}
    </View>
  );
}

// --- Divider ---
export function Divider() {
  return <View style={styles.divider} />;
}

// --- Empty state ---
export function EmptyState({ message, icon }: { message: string; icon?: string }) {
  return (
    <View style={styles.empty}>
      {icon && <Text style={styles.emptyIcon}>{icon}</Text>}
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// --- Loading overlay ---
export function LoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

// --- Row between ---
export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '600' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: Spacing.sm,
  },
  inputWrapper: { marginBottom: Spacing.md },
  inputLabel: { ...Typography.bodySmall, marginBottom: Spacing.xs, fontWeight: '500' as const, color: Colors.text },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  inputError: { borderColor: Colors.error },
  errorText: { fontSize: 12, color: Colors.error, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionAction: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  empty: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.sm },
  emptyText: { ...Typography.bodySmall, textAlign: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
