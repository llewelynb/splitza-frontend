import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSession, finalizeSession } from '../../../src/api/sessions';
import { Button, Card, ZarAmount, Divider, LoadingOverlay } from '../../../src/components/UI';
import { Colors, Spacing, Typography, Radius } from '../../../src/components/theme';
import { useSessionStore } from '../../../src/store/sessionStore';
import type { BillSummary, AdjustmentAllocation, PaymentMode } from '../../../src/types';

export default function SummaryScreen() {
  const { id, tip, serviceFee, discount, tipAllocation, serviceFeeAllocation, discountAllocation } =
    useLocalSearchParams<{
      id: string;
      tip?: string; serviceFee?: string; discount?: string;
      tipAllocation?: string; serviceFeeAllocation?: string; discountAllocation?: string;
    }>();

  const qc = useQueryClient();
  const setBillSummary = useSessionStore(s => s.setBillSummary);
  const [summary, setSummary] = useState<BillSummary | null>(null);

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => getSession(id!),
  });

  const finalizeMut = useMutation({
    mutationFn: () => finalizeSession(id!, {
      paymentMode: session!.paymentMode,
      tip: parseFloat(tip ?? '0'),
      serviceFee: parseFloat(serviceFee ?? '0'),
      discount: parseFloat(discount ?? '0'),
      tipAllocation: (tipAllocation ?? 'Proportional') as AdjustmentAllocation,
      serviceFeeAllocation: (serviceFeeAllocation ?? 'Equal') as AdjustmentAllocation,
      discountAllocation: (discountAllocation ?? 'Proportional') as AdjustmentAllocation,
    }),
    onSuccess: (data) => {
      setSummary(data);
      setBillSummary(data);
      qc.invalidateQueries({ queryKey: ['session', id] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (e: Error) => Alert.alert('Calculation failed', e.message),
  });

  // Auto-finalize on mount if params present
  useEffect(() => {
    if (session && tip !== undefined && !summary) {
      finalizeMut.mutate();
    }
    // If already finalized, fetch existing summary
    if (session?.status === 'Finalized' && !tip) {
      // Reconstruct from session data for already-finalized sessions
      // (A real app would store/fetch the summary; for MVP we re-compute via finalize)
      finalizeMut.mutate();
    }
  }, [session?.id]);

  const isHostPays = session?.paymentMode === 'HostPays';
  const host = session?.people.find(p => p.isHost);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Bill header */}
      <View style={styles.billHeader}>
        <Text style={styles.billTitle}>{session?.name ?? 'Bill Summary'}</Text>
        <View style={[styles.modeBadge, { backgroundColor: isHostPays ? Colors.primary : Colors.success }]}>
          <Text style={styles.modeBadgeText}>
            {isHostPays ? `Pay ${host?.name ?? 'host'}` : 'Pay restaurant directly'}
          </Text>
        </View>
      </View>

      {summary ? (
        <>
          {/* Per-person breakdown */}
          <Text style={[Typography.heading3, { marginBottom: Spacing.sm }]}>
            {isHostPays ? 'What each person owes the host' : 'What each person pays'}
          </Text>

          {summary.personTotals.map(pt => (
            <Card key={pt.personId} style={[pt.isHost && isHostPays && styles.hostCard]}>
              <View style={styles.personRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{pt.personName[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={Typography.body}>
                    {pt.personName}{pt.isHost ? ' (host)' : ''}
                  </Text>
                  <Text style={Typography.bodySmall}>
                    Items: R{pt.itemsSubtotal.toFixed(2)}
                    {pt.adjustmentsShare !== 0 ? ` · Adj: R${pt.adjustmentsShare.toFixed(2)}` : ''}
                  </Text>
                </View>
                <ZarAmount
                  amount={isHostPays && pt.isHost ? 0 : pt.total}
                  size="md"
                />
              </View>
              {isHostPays && pt.isHost && (
                <Text style={[Typography.caption, { marginTop: 4, color: Colors.primary }]}>
                  Paid the full bill — collects from others
                </Text>
              )}
            </Card>
          ))}

          <Divider />

          {/* Totals breakdown */}
          <Card>
            <Text style={[Typography.heading3, { marginBottom: Spacing.sm }]}>Bill breakdown</Text>
            {[
              ['Subtotal', summary.subtotal],
              summary.vat > 0 && ['VAT', summary.vat],
              summary.tip > 0 && ['Tip', summary.tip],
              summary.serviceFee > 0 && ['Service fee', summary.serviceFee],
              summary.discount > 0 && ['Discount', -summary.discount],
            ].filter(Boolean).map(([label, amount]) => (
              <View key={label as string} style={styles.breakdownRow}>
                <Text style={Typography.body}>{label as string}</Text>
                <ZarAmount amount={amount as number} size="sm" style={{ color: (amount as number) < 0 ? Colors.success : Colors.zar }} />
              </View>
            ))}
            <Divider />
            <View style={styles.breakdownRow}>
              <Text style={[Typography.heading3]}>Total</Text>
              <ZarAmount amount={summary.total} size="lg" />
            </View>
          </Card>

          <Button
            label="Done"
            onPress={() => router.replace('/')}
            style={{ marginTop: Spacing.md }}
          />
          <Button
            label="Start new bill"
            variant="ghost"
            onPress={() => router.replace('/session/new')}
            style={{ marginTop: Spacing.sm }}
          />
        </>
      ) : (
        <View style={styles.calculating}>
          <Text style={Typography.body}>Calculating split…</Text>
        </View>
      )}

      <LoadingOverlay visible={isLoading || finalizeMut.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 40 },
  billHeader: { alignItems: 'center', paddingVertical: Spacing.lg },
  billTitle: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  modeBadge: { borderRadius: Radius.xl, paddingHorizontal: 14, paddingVertical: 6 },
  modeBadgeText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  personRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  hostCard: { borderWidth: 2, borderColor: Colors.primary },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  calculating: { alignItems: 'center', paddingTop: 60 },
});
