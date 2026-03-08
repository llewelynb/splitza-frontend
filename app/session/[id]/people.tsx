import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Alert, TextInput, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSession, addPerson, removePerson } from '../../../src/api/sessions';
import { Button, Card, SectionHeader, EmptyState, Divider, LoadingOverlay } from '../../../src/components/UI';
import { Colors, Spacing, Typography, Radius } from '../../../src/components/theme';
import type { Person } from '../../../src/types';

export default function PeopleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: session, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => getSession(id!),
  });

  const [newName, setNewName] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['session', id] });

  const addMut = useMutation({
    mutationFn: () => addPerson(id!, newName.trim()),
    onSuccess: () => { setNewName(''); invalidate(); },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const removeMut = useMutation({
    mutationFn: (personId: string) => removePerson(id!, personId),
    onSuccess: invalidate,
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const confirmRemove = (person: Person) => {
    if (person.isHost) return Alert.alert('Cannot remove host');
    Alert.alert('Remove person?', `Remove "${person.name}" from the bill?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeMut.mutate(person.id) },
    ]);
  };

  const people = session?.people ?? [];

  const renderPerson = ({ item }: { item: Person }) => (
    <Card style={styles.personCard}>
      <View style={styles.personRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <Text style={Typography.body}>{item.name}</Text>
          {item.isHost && <Text style={[Typography.caption, { color: Colors.primary }]}>Host</Text>}
        </View>
        {!item.isHost && (
          <TouchableOpacity onPress={() => confirmRemove(item)}>
            <Text style={styles.removeBtn}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={people}
        keyExtractor={p => p.id}
        renderItem={renderPerson}
        ListHeaderComponent={
          <View style={styles.header}>
            <SectionHeader title={`People (${people.length})`} />
            {people.length === 0 && (
              <EmptyState icon="👥" message="No people yet. The host is added automatically." />
            )}
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={[Typography.heading3, { marginBottom: Spacing.sm }]}>Add person</Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.nameInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Name"
                returnKeyType="done"
                onSubmitEditing={() => newName.trim() && addMut.mutate()}
              />
              <Button
                label="Add"
                onPress={() => addMut.mutate()}
                disabled={!newName.trim()}
                loading={addMut.isPending}
                style={styles.addBtn}
              />
            </View>
            <Divider />
            <Button
              label="Next: Assign Items →"
              onPress={() => router.push(`/session/${id}/assign`)}
              disabled={people.length === 0}
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
  header: { marginBottom: Spacing.sm },
  footer: { marginTop: Spacing.sm },
  personCard: { marginBottom: Spacing.xs },
  personRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  removeBtn: { color: Colors.error, fontWeight: '600', fontSize: 14 },
  addRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  addBtn: { paddingHorizontal: Spacing.lg, paddingVertical: 10 },
});
