import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';

interface Props {
  loading: boolean;
  hasMore: boolean;
  hasItems: boolean;
}

/**
 * ListFooter keeps a fixed height so showing the loader never pushes the list
 * around (the cause of the jumpy "jedat-jedut" scroll). The spinner is only
 * revealed after a short delay and cross-fades in, so fast page loads and the
 * rapid onEndReached toggling don't flash it on and off.
 */
export const ListFooter: React.FC<Props> = ({ loading, hasMore, hasItems }) => {
  const [showSpinner, setShowSpinner] = useState(false);
  const spinnerOpacity = useRef(new Animated.Value(0)).current;
  const endOpacity = useRef(new Animated.Value(0)).current;

  // Only reveal the spinner if loading actually takes a moment.
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

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.layer, { opacity: spinnerOpacity }]} pointerEvents="none">
        <ActivityIndicator size="small" color="#2563EB" />
        <Text style={styles.label}>Memuat tugas lainnya…</Text>
      </Animated.View>

      <Animated.View style={[styles.layer, { opacity: endOpacity }]} pointerEvents="none">
        <View style={styles.endLine} />
        <Text style={styles.endText}>Semua tugas sudah dimuat</Text>
        <View style={styles.endLine} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: 64, justifyContent: 'center', alignItems: 'center' },
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  label: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },
  endLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  endText: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },
});
