import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessions, deleteSession } from '../src/api/sessions';
import { Button, Card, ZarAmount, EmptyState, LoadingOverlay } from '../src/components/UI';
import { Colors, Spacing, Typography, Radius } from '../src/components/theme';
import type { SessionSummary } from '../src/types';

const STATUS_LABEL: Record<string, string> = {
  Draft: 'Draft',
  ItemsReviewed: 'Items reviewed',
  PeopleAdded: 'People added',
  ItemsAssigned: 'Items assigned',
  Finalized: 'Finalized',
};

export default function HomeScreen() {
  const qc = useQueryClient();
  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  });

  const del = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const confirmDelete = (session: SessionSummary) => {
    Alert.alert('Delete bill?', `"${session.name}" will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(session.id) },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* Hero header */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Splitza</Text>
        <Text style={styles.heroSubtitle}>Split South African restaurant bills, stress-free.</Text>
        <Button
          label="+ New Bill"
          onPress={() => router.push('/session/new')}
          style={styles.newBtn}
        />
      </View>

      {/* Past sessions */}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {sessions.length === 0 && !isLoading && (
          <EmptyState icon="🧾" message="No bills yet.\nTap '+ New Bill' to get started." />
        )}
        {sessions.map(s => (
          <TouchableOpacity
            key={s.id}
            onPress={() => {
              if (s.status === 'Finalized') {
                router.push(`/session/${s.id}/summary`);
              } else {
                // Resume where left off
                router.push(`/session/${s.id}/review`);
              }
            }}
            onLongPress={() => confirmDelete(s)}
            activeOpacity={0.85}
          >
            <Card>
              <View style={styles.sessionRow}>
                <View style={styles.sessionInfo}>
                  <Text style={Typography.heading3}>{s.name}</Text>
                  <Text style={Typography.bodySmall}>{new Date(s.createdAt).toLocaleDateString('en-ZA')}</Text>
                </View>
                <View style={styles.sessionRight}>
                  <ZarAmount amount={s.total} size="md" />
                  <View style={[styles.badge, { backgroundColor: s.status === 'Finalized' ? Colors.success : Colors.warning }]}>
                    <Text style={styles.badgeText}>{STATUS_LABEL[s.status] ?? s.status}</Text>
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <LoadingOverlay visible={del.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.primary,
    paddingTop: 64,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  heroTitle: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 6, marginBottom: Spacing.lg },
  newBtn: { backgroundColor: '#fff', paddingVertical: 12 },
  list: { padding: Spacing.md, paddingBottom: 32 },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sessionInfo: { flex: 1, marginRight: Spacing.sm },
  sessionRight: { alignItems: 'flex-end', gap: 6 },
  badge: {
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
});
