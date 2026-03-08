import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSession, setAllocations } from '../../../src/api/sessions';
import { Button, Card, ZarAmount, SectionHeader, Divider, LoadingOverlay } from '../../../src/components/UI';
import { Colors, Spacing, Typography, Radius } from '../../../src/components/theme';
import type { ReceiptItem, Person, AllocationType } from '../../../src/types';

type AllocationMode = 'Full' | 'EqualShare';

interface ItemAllocationState {
  mode: AllocationMode;
  selectedPersonId: string | null;    // for Full
  selectedPeopleIds: string[];        // for EqualShare
}

export default function AssignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: session, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => getSession(id!),
  });

  const [allocationStates, setAllocationStates] = useState<Record<string, ItemAllocationState>>({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: async (item: ReceiptItem) => {
      const state = allocationStates[item.id];
      if (!state) return;

      const allocations: { personId: string; allocationType: AllocationType; }[] = [];

      if (state.mode === 'Full' && state.selectedPersonId) {
        allocations.push({ personId: state.selectedPersonId, allocationType: 'Full' });
      } else if (state.mode === 'EqualShare' && state.selectedPeopleIds.length > 0) {
        for (const pid of state.selectedPeopleIds) {
          allocations.push({ personId: pid, allocationType: 'EqualShare' });
        }
      }

      if (allocations.length === 0) return;
      return setAllocations(id!, item.id, allocations);
    },
    onSuccess: () => {
      setSavingItemId(null);
      qc.invalidateQueries({ queryKey: ['session', id] });
    },
    onError: (e: Error) => { setSavingItemId(null); Alert.alert('Error', e.message); },
  });

  const getState = (itemId: string): ItemAllocationState =>
    allocationStates[itemId] ?? { mode: 'Full', selectedPersonId: null, selectedPeopleIds: [] };

  const setState = (itemId: string, update: Partial<ItemAllocationState>) =>
    setAllocationStates(prev => ({ ...prev, [itemId]: { ...getState(itemId), ...update } }));

  const people = session?.people ?? [];
  const items = session?.items ?? [];

  const allAssigned = items.every(item => {
    const existing = item.allocations.length > 0;
    const local = allocationStates[item.id];
    if (local) {
      return local.mode === 'Full' ? !!local.selectedPersonId : local.selectedPeopleIds.length > 0;
    }
    return existing;
  });

  const renderItem = ({ item }: { item: ReceiptItem }) => {
    const state = getState(item.id);
    const hasExisting = item.allocations.length > 0;
    const isModified = !!allocationStates[item.id];

    return (
      <Card>
        <View style={styles.itemHeader}>
          <View style={{ flex: 1 }}>
            <Text style={Typography.body}>{item.name}</Text>
            <Text style={Typography.bodySmall}>Qty: {item.quantity}</Text>
          </View>
          <ZarAmount amount={item.lineTotal} size="sm" />
        </View>

        {/* Mode selector */}
        <View style={styles.modeRow}>
          {(['Full', 'EqualShare'] as AllocationMode[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, state.mode === m && styles.modeBtnSelected]}
              onPress={() => setState(item.id, { mode: m, selectedPersonId: null, selectedPeopleIds: [] })}
            >
              <Text style={[styles.modeBtnText, state.mode === m && styles.modeBtnTextSelected]}>
                {m === 'Full' ? 'One person' : 'Split equally'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Person selector */}
        <View style={styles.peopleRow}>
          {people.map(person => {
            const isSelected = state.mode === 'Full'
              ? state.selectedPersonId === person.id
              : state.selectedPeopleIds.includes(person.id);

            return (
              <TouchableOpacity
                key={person.id}
                style={[styles.personChip, isSelected && styles.personChipSelected]}
                onPress={() => {
                  if (state.mode === 'Full') {
                    setState(item.id, { selectedPersonId: person.id });
                  } else {
                    const ids = state.selectedPeopleIds.includes(person.id)
                      ? state.selectedPeopleIds.filter(i => i !== person.id)
                      : [...state.selectedPeopleIds, person.id];
                    setState(item.id, { selectedPeopleIds: ids });
                  }
                }}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {person.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Save this item */}
        {isModified && (
          <Button
            label={savingItemId === item.id ? 'Saving…' : 'Save allocation'}
            variant="secondary"
            onPress={() => { setSavingItemId(item.id); saveMut.mutate(item); }}
            loading={savingItemId === item.id}
            style={{ marginTop: Spacing.sm }}
          />
        )}

        {hasExisting && !isModified && (
          <View style={styles.savedRow}>
            <Text style={[Typography.caption, { color: Colors.success }]}>
              ✓ Assigned: {item.allocations.map(a => a.personName).join(', ')}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.root}>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        ListHeaderComponent={<SectionHeader title="Assign items to people" />}
        ListFooterComponent={
          <View style={styles.footer}>
            <Divider />
            <Button
              label="Next: Adjustments →"
              onPress={() => router.push(`/session/${id}/adjustments`)}
            />
          </View>
        }
        contentContainerStyle={styles.list}
      />
      <LoadingOverlay visible={isLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md, paddingBottom: 40 },
  footer: { marginTop: Spacing.sm },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  modeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  modeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  modeBtnSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  modeBtnText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  modeBtnTextSelected: { color: Colors.primary, fontWeight: '700' },
  peopleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  personChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
  },
  personChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  chipTextSelected: { color: '#fff' },
  savedRow: { marginTop: Spacing.xs },
});
