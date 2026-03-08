import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getSession } from '../../../src/api/sessions';
import { Button, Card, Input, ZarAmount, Divider } from '../../../src/components/UI';
import { Colors, Spacing, Typography } from '../../../src/components/theme';
import type { AdjustmentAllocation } from '../../../src/types';

type AllocationChoice = { label: string; value: AdjustmentAllocation };
const ALLOC_OPTIONS: AllocationChoice[] = [
  { label: 'Proportional to subtotal', value: 'Proportional' },
  { label: 'Split equally', value: 'Equal' },
];

interface AdjustmentField {
  label: string;
  key: 'tip' | 'serviceFee' | 'discount';
  allocKey: 'tipAllocation' | 'serviceFeeAllocation' | 'discountAllocation';
  hint: string;
}

const FIELDS: AdjustmentField[] = [
  { label: 'Tip', key: 'tip', allocKey: 'tipAllocation', hint: '15% is customary in SA' },
  { label: 'Service fee', key: 'serviceFee', allocKey: 'serviceFeeAllocation', hint: 'Optional restaurant levy' },
  { label: 'Discount', key: 'discount', allocKey: 'discountAllocation', hint: 'e.g. voucher, promo' },
];

export default function AdjustmentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session } = useQuery({
    queryKey: ['session', id],
    queryFn: () => getSession(id!),
  });

  const [values, setValues] = useState({
    tip: '',
    serviceFee: '',
    discount: '',
    tipAllocation: 'Proportional' as AdjustmentAllocation,
    serviceFeeAllocation: 'Equal' as AdjustmentAllocation,
    discountAllocation: 'Proportional' as AdjustmentAllocation,
  });

  const subtotal = session?.subtotal ?? 0;
  const tip = parseFloat(values.tip) || 0;
  const serviceFee = parseFloat(values.serviceFee) || 0;
  const discount = parseFloat(values.discount) || 0;
  const estimatedTotal = subtotal + tip + serviceFee - discount;

  const setVal = (key: keyof typeof values, value: string | AdjustmentAllocation) =>
    setValues(v => ({ ...v, [key]: value }));

  const proceed = () => {
    if (discount > subtotal + tip + serviceFee) {
      return Alert.alert('Invalid', 'Discount cannot exceed the bill total.');
    }
    // Pass adjustments via route params to summary/finalize
    router.push({
      pathname: `/session/${id}/summary`,
      params: {
        tip: tip.toFixed(2),
        serviceFee: serviceFee.toFixed(2),
        discount: discount.toFixed(2),
        tipAllocation: values.tipAllocation,
        serviceFeeAllocation: values.serviceFeeAllocation,
        discountAllocation: values.discountAllocation,
      },
    });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={[Typography.bodySmall, styles.hint]}>
        All fields optional. Leave at 0 if not applicable.
      </Text>

      {FIELDS.map(field => (
        <Card key={field.key}>
          <Text style={[Typography.heading3, { marginBottom: 4 }]}>{field.label}</Text>
          <Text style={[Typography.bodySmall, { marginBottom: Spacing.sm }]}>{field.hint}</Text>
          <Input
            label={`Amount (R)`}
            value={values[field.key]}
            onChangeText={t => setVal(field.key, t)}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <Text style={[Typography.bodySmall, { marginBottom: 6 }]}>Allocate:</Text>
          <View style={styles.allocRow}>
            {ALLOC_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                label={opt.label}
                variant={values[field.allocKey] === opt.value ? 'primary' : 'secondary'}
                onPress={() => setVal(field.allocKey, opt.value)}
                style={styles.allocBtn}
              />
            ))}
          </View>
        </Card>
      ))}

      <Divider />
      <View style={styles.totalRow}>
        <View>
          <Text style={Typography.bodySmall}>Subtotal</Text>
          <Text style={Typography.bodySmall}>+ Tip</Text>
          <Text style={Typography.bodySmall}>+ Service fee</Text>
          {discount > 0 && <Text style={Typography.bodySmall}>- Discount</Text>}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <ZarAmount amount={subtotal} size="sm" />
          <ZarAmount amount={tip} size="sm" />
          <ZarAmount amount={serviceFee} size="sm" />
          {discount > 0 && <ZarAmount amount={-discount} size="sm" style={{ color: Colors.success }} />}
        </View>
      </View>
      <View style={[styles.totalRow, styles.grandTotal]}>
        <Text style={Typography.heading3}>Total</Text>
        <ZarAmount amount={estimatedTotal} size="lg" />
      </View>

      <Button label="Calculate split →" onPress={proceed} style={{ marginTop: Spacing.md }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  hint: { marginBottom: Spacing.md },
  allocRow: { gap: Spacing.xs },
  allocBtn: { marginBottom: 4, paddingVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  grandTotal: { paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
});
