import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const OPTIONS = ['', 'pending', 'in_progress', 'done'];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export const StatusFilter: React.FC<Props> = ({ value, onChange }) => {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt || 'all'}
          style={[styles.chip, value === opt && styles.active]}
          onPress={() => onChange(opt)}
          testID={`status-${opt || 'all'}`}
        >
          <Text style={value === opt ? styles.activeText : styles.text}>{opt || 'All'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', margin: 8 },
  chip: { padding: 8, margin: 4, borderRadius: 16, backgroundColor: '#eee' },
  active: { backgroundColor: '#007bff' },
  text: { color: '#333' },
  activeText: { color: '#fff' },
});