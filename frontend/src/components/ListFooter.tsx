import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';

interface Props {
  loading: boolean;
  hasMore: boolean;
  hasItems: boolean;
}

export const ListFooter: React.FC<Props> = ({ loading, hasMore, hasItems }) => {
  const [showSpinner, setShowSpinner] = useState(false);
  const spinnerOpacity = useRef(new Animated.Value(0)).current;
  const endOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      setShowSpinner(false);
      return;
    }
    const timer = setTimeout(() => setShowSpinner(true), 180);
    return () => clearTimeout(timer);
  }, [loading]);

  const showEnd = !loading && !hasMore && hasItems;

  useEffect(() => {
    Animated.timing(spinnerOpacity, {
      toValue: showSpinner ? 1 : 0,
      duration: showSpinner ? 200 : 100,
      useNativeDriver: true,
    }).start();
  }, [showSpinner, spinnerOpacity]);

  useEffect(() => {
    Animated.timing(endOpacity, {
      toValue: showEnd ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [showEnd, endOpacity]);

  if (!hasItems) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.layer, { opacity: spinnerOpacity }]} pointerEvents="none">
        <View style={styles.row}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.label}>Memuat tugas lainnya…</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.layer, { opacity: endOpacity }]} pointerEvents="none">
        <View style={styles.endRow}>
          <View style={styles.endLine} />
          <Text style={styles.endText}>Tidak ada data lainnya</Text>
          <View style={styles.endLine} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 64, justifyContent: 'flex-end', alignItems: 'center' },
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },
  endRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
  endLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  endText: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },
});
