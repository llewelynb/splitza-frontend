import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Alert, TextInput,
  TouchableOpacity, Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSession, addItem, updateItem, deleteItem } from '../../../src/api/sessions';
import { Button, Card, ZarAmount, SectionHeader, EmptyState, Divider, LoadingOverlay } from '../../../src/components/UI';
import { Colors, Spacing, Typography, Radius } from '../../../src/components/theme';
import type { ReceiptItem } from '../../../src/types';

interface EditState { name: string; quantity: string; unitPrice: string; }

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: session, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => getSession(id!),
  });

  const [editingItem, setEditingItem] = useState<ReceiptItem | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: '', quantity: '1', unitPrice: '' });
  const [addMode, setAddMode] = useState(false);
  const [newItem, setNewItem] = useState<EditState>({ name: '', quantity: '1', unitPrice: '' });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['session', id] });

  const updateMut = useMutation({
    mutationFn: (item: ReceiptItem) => updateItem(id!, item.id, {
      name: editState.name,
      quantity: parseFloat(editState.quantity) || 1,
      unitPrice: parseFloat(editState.unitPrice) || 0,
    }),
    onSuccess: () => { setEditingItem(null); invalidate(); },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (itemId: string) => deleteItem(id!, itemId),
    onSuccess: invalidate,
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const addMut = useMutation({
    mutationFn: () => addItem(id!, {
      name: newItem.name.trim(),
      quantity: parseFloat(newItem.quantity) || 1,
      unitPrice: parseFloat(newItem.unitPrice) || 0,
    }),
    onSuccess: () => { setAddMode(false); setNewItem({ name: '', quantity: '1', unitPrice: '' }); invalidate(); },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const startEdit = (item: ReceiptItem) => {
    setEditingItem(item);
    setEditState({ name: item.name, quantity: String(item.quantity), unitPrice: String(item.unitPrice) });
  };

  const confirmDelete = (item: ReceiptItem) => {
    Alert.alert('Delete item?', `Remove "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(item.id) },
    ]);
  };

  const renderItem = ({ item }: { item: ReceiptItem }) => (
    <Card>
      <View style={styles.itemRow}>
        <View style={{ flex: 1 }}>
          <Text style={Typography.body}>{item.name}</Text>
          <Text style={Typography.bodySmall}>Qty: {item.quantity} × R{item.unitPrice.toFixed(2)}</Text>
        </View>
        <ZarAmount amount={item.lineTotal} size="md" />
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => startEdit(item)} style={styles.actionBtn}>
          <Text style={styles.actionEdit}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.actionBtn}>
          <Text style={styles.actionDelete}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const subtotal = session?.items.reduce((s, i) => s + i.lineTotal, 0) ?? 0;

  return (
    <View style={styles.root}>
      <FlatList
        data={session?.items ?? []}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <SectionHeader
              title={`Items (${session?.items.length ?? 0})`}
              action="+ Add item"
              onAction={() => setAddMode(true)}
            />
            {session?.items.length === 0 && !isLoading && (
              <EmptyState icon="🧾" message="No items yet.\nScan a receipt or add items manually." />
            )}
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Divider />
            <View style={styles.totalRow}>
              <Text style={Typography.heading3}>Subtotal</Text>
              <ZarAmount amount={subtotal} size="lg" />
            </View>
            <Button
              label="Next: Add People →"
              onPress={() => router.push(`/session/${id}/people`)}
              disabled={!session || session.items.length === 0}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        }
        contentContainerStyle={styles.list}
      />

      {/* Edit modal */}
      <Modal visible={!!editingItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={[Typography.heading3, { marginBottom: Spacing.md }]}>Edit item</Text>
            <TextInput
              style={styles.modalInput}
              value={editState.name}
              onChangeText={t => setEditState(s => ({ ...s, name: t }))}
              placeholder="Item name"
            />
            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginRight: 8 }]}
                value={editState.quantity}
                onChangeText={t => setEditState(s => ({ ...s, quantity: t }))}
                placeholder="Qty"
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.modalInput, { flex: 2 }]}
                value={editState.unitPrice}
                onChangeText={t => setEditState(s => ({ ...s, unitPrice: t }))}
                placeholder="Unit price"
                keyboardType="decimal-pad"
              />
            </View>
            <Button
              label="Save"
              onPress={() => editingItem && updateMut.mutate(editingItem)}
              loading={updateMut.isPending}
            />
            <Button label="Cancel" variant="ghost" onPress={() => setEditingItem(null)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>

      {/* Add modal */}
      <Modal visible={addMode} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={[Typography.heading3, { marginBottom: Spacing.md }]}>Add item</Text>
            <TextInput
              style={styles.modalInput}
              value={newItem.name}
              onChangeText={t => setNewItem(s => ({ ...s, name: t }))}
              placeholder="Item name"
            />
            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginRight: 8 }]}
                value={newItem.quantity}
                onChangeText={t => setNewItem(s => ({ ...s, quantity: t }))}
                placeholder="Qty"
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.modalInput, { flex: 2 }]}
                value={newItem.unitPrice}
                onChangeText={t => setNewItem(s => ({ ...s, unitPrice: t }))}
                placeholder="Unit price (R)"
                keyboardType="decimal-pad"
              />
            </View>
            <Button
              label="Add"
              onPress={() => addMut.mutate()}
              disabled={!newItem.name.trim()}
              loading={addMut.isPending}
            />
            <Button label="Cancel" variant="ghost" onPress={() => setAddMode(false)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>

      <LoadingOverlay visible={isLoading || deleteMut.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md, paddingBottom: 40 },
  header: { marginBottom: Spacing.sm },
  footer: { marginTop: Spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 12 },
  actionBtn: { padding: 4 },
  actionEdit: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  actionDelete: { color: Colors.error, fontWeight: '600', fontSize: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: 12,
    fontSize: 16,
    marginBottom: Spacing.sm,
    color: Colors.text,
  },
  modalRow: { flexDirection: 'row' },
});
