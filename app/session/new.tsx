import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSession } from '../../src/api/sessions';
import { Button, Input, Card, LoadingOverlay } from '../../src/components/UI';
import { Colors, Spacing, Typography } from '../../src/components/theme';
import { Text } from 'react-native';
import type { PaymentMode } from '../../src/types';

export default function NewSessionScreen() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [hostName, setHostName] = useState('');
  const [mode, setMode] = useState<PaymentMode>('HostPays');

  const create = useMutation({
    mutationFn: () => createSession(name.trim(), mode, hostName.trim() || 'Host'),
    onSuccess: (session) => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      router.replace(`/session/${session.id}/scan`);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const canSubmit = name.trim().length > 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={[Typography.heading2, styles.label]}>Bill name</Text>
      <Text style={[Typography.bodySmall, styles.hint]}>E.g. "Harbour House dinner" or "Lunch at Willoughby's"</Text>
      <Input
        value={name}
        onChangeText={setName}
        placeholder="Bill name"
        style={styles.input}
      />

      <Input
        label="Your name (host)"
        value={hostName}
        onChangeText={setHostName}
        placeholder="Host"
        style={styles.input}
      />

      <Text style={[Typography.heading3, styles.sectionTitle]}>Payment flow</Text>

      {([
        ['HostPays', 'Pay the host', 'One person pays the restaurant. Everyone else pays them back.'],
        ['DirectToRestaurant', 'Pay the restaurant directly', 'Each person pays their own share at the restaurant.'],
      ] as [PaymentMode, string, string][]).map(([value, title, desc]) => (
        <Card key={value} style={[styles.modeCard, mode === value && styles.modeSelected]}>
          <View style={styles.modeRow}>
            <View style={[styles.radio, mode === value && styles.radioSelected]} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={[Typography.body, { fontWeight: '600' }]}>{title}</Text>
              <Text style={Typography.bodySmall}>{desc}</Text>
            </View>
          </View>
          <Button label="Select" variant={mode === value ? 'primary' : 'secondary'} onPress={() => setMode(value)} style={{ marginTop: Spacing.sm }} />
        </Card>
      ))}

      <Button
        label="Next: Scan Receipt"
        onPress={() => create.mutate()}
        disabled={!canSubmit}
        loading={create.isPending}
        style={styles.cta}
      />

      <LoadingOverlay visible={create.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  label: { marginBottom: 4 },
  hint: { marginBottom: Spacing.md },
  input: { marginBottom: Spacing.md },
  sectionTitle: { marginTop: Spacing.md, marginBottom: Spacing.sm },
  modeCard: { marginBottom: Spacing.sm },
  modeSelected: { borderWidth: 2, borderColor: Colors.primary },
  modeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, marginTop: 2 },
  radioSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  cta: { marginTop: Spacing.lg },
});
