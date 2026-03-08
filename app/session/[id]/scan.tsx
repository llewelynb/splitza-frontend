import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import { scanReceipt, importOcrItems } from '../../../src/api/sessions';
import { Button, Card, ZarAmount, EmptyState, LoadingOverlay } from '../../../src/components/UI';
import { Colors, Spacing, Typography, Radius } from '../../../src/components/theme';
import { useSessionStore } from '../../../src/store/sessionStore';
import type { ParsedItem } from '../../../src/types';

export default function ScanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const setPendingOcrItems = useSessionStore(s => s.setPendingOcrItems);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<{ parsedItems: ParsedItem[]; parseSuccess: boolean } | null>(null);

  const scanMutation = useMutation({
    mutationFn: async (uri: string) => {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      return scanReceipt(base64);
    },
    onSuccess: (result) => {
      setOcrResult(result);
      setPendingOcrItems(result.parsedItems);
    },
    onError: (err: Error) => Alert.alert('Scan failed', err.message),
  });

  const importMutation = useMutation({
    mutationFn: () => importOcrItems(id!, ocrResult?.parsedItems ?? []),
    onSuccess: () => router.push(`/session/${id}/review`),
    onError: (err: Error) => Alert.alert('Import failed', err.message),
  });

  const pickImage = async (fromCamera: boolean) => {
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, base64: false })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, base64: false, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setOcrResult(null);
      scanMutation.mutate(uri);
    }
  };

  const skipToManual = () => {
    setPendingOcrItems([]);
    router.push(`/session/${id}/review`);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={[Typography.heading2, styles.title]}>Scan the receipt</Text>
      <Text style={[Typography.bodySmall, styles.subtitle]}>
        Take a clear photo of the full receipt. The app will extract items for you to review.
      </Text>

      <View style={styles.btnRow}>
        <Button label="📷  Camera" onPress={() => pickImage(true)} style={styles.half} />
        <Button label="🖼  Gallery" onPress={() => pickImage(false)} variant="secondary" style={styles.half} />
      </View>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
      )}

      {scanMutation.isPending && (
        <Card style={styles.statusCard}>
          <Text style={Typography.body}>Extracting items from receipt…</Text>
        </Card>
      )}

      {ocrResult && (
        <Card style={styles.resultCard}>
          {ocrResult.parseSuccess ? (
            <>
              <Text style={[Typography.heading3, { color: Colors.success }]}>
                ✓ {ocrResult.parsedItems.length} item{ocrResult.parsedItems.length !== 1 ? 's' : ''} found
              </Text>
              {ocrResult.parsedItems.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={[Typography.body, { flex: 1 }]}>{item.name}</Text>
                  <ZarAmount amount={item.lineTotal} size="sm" />
                </View>
              ))}
              <Button
                label="Confirm & review items"
                onPress={() => importMutation.mutate()}
                loading={importMutation.isPending}
                style={{ marginTop: Spacing.md }}
              />
              <Button
                label="Re-scan"
                variant="ghost"
                onPress={() => { setOcrResult(null); setImageUri(null); }}
                style={{ marginTop: Spacing.sm }}
              />
            </>
          ) : (
            <>
              <Text style={[Typography.heading3, { color: Colors.warning }]}>
                Could not auto-detect items
              </Text>
              <Text style={[Typography.bodySmall, { marginTop: 4 }]}>
                You can add items manually on the next screen.
              </Text>
              <Button label="Enter items manually" onPress={skipToManual} style={{ marginTop: Spacing.md }} />
            </>
          )}
        </Card>
      )}

      {!imageUri && !scanMutation.isPending && (
        <Button
          label="Skip — enter items manually"
          variant="ghost"
          onPress={skipToManual}
          style={styles.skip}
        />
      )}

      <LoadingOverlay visible={scanMutation.isPending || importMutation.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  title: { marginBottom: 4 },
  subtitle: { marginBottom: Spacing.lg },
  btnRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  half: { flex: 1 },
  preview: { width: '100%', height: 240, borderRadius: Radius.md, marginBottom: Spacing.md },
  statusCard: { alignItems: 'center', paddingVertical: Spacing.lg },
  resultCard: {},
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  skip: { marginTop: Spacing.xl },
});
