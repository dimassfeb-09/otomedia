import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const OPTIONS = ['', 'pending', 'in_progress', 'done'];
const LABELS: Record<string, string> = {
  '': 'Semua',
  pending: 'Pending',
  in_progress: 'Proses',
  done: 'Selesai',
};

export const StatusFilter: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt || 'all'}
          style={[styles.chip, value === opt && styles.active]}
          onPress={() => onChange(opt)}
          testID={`status-${opt || 'all'}`}
          activeOpacity={0.8}
        >
          <Text style={value === opt ? styles.activeText : styles.text}>{LABELS[opt]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingVertical: 4, paddingBottom: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  active: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  text: { color: '#475569', fontSize: 13, fontWeight: '500' },
  activeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});