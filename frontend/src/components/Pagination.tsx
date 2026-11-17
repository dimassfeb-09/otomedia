import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  page: number;
  total: number;
  limit: number;
  onChange: (p: number) => void;
}

export const Pagination: React.FC<Props> = ({ page, total, limit, onChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <View style={styles.row}>
      <TouchableOpacity disabled={page <= 1} onPress={() => onChange(page - 1)} testID="prev-page">
        <Text style={page <= 1 ? styles.disabled : styles.link}>Prev</Text>
      </TouchableOpacity>
      <Text style={styles.info}>{page} / {totalPages}</Text>
      <TouchableOpacity disabled={page >= totalPages} onPress={() => onChange(page + 1)} testID="next-page">
        <Text style={page >= totalPages ? styles.disabled : styles.link}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', margin: 8, gap: 16 },
  link: { color: '#007bff', padding: 8 },
  disabled: { color: '#aaa', padding: 8 },
  info: { padding: 8 },
});