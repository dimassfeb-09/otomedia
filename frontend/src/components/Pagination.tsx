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
      <TouchableOpacity disabled={page <= 1} onPress={() => onChange(page - 1)} testID="prev-page" style={[styles.btn, page <= 1 && styles.btnDisabled]} activeOpacity={0.7}>
        <Text style={page <= 1 ? styles.disabledText : styles.btnText}>Sebelumnya</Text>
      </TouchableOpacity>
      <Text style={styles.info}>{page} / {totalPages}</Text>
      <TouchableOpacity disabled={page >= totalPages} onPress={() => onChange(page + 1)} testID="next-page" style={[styles.btn, page >= totalPages && styles.btnDisabled]} activeOpacity={0.7}>
        <Text style={page >= totalPages ? styles.disabledText : styles.btnText}>Berikutnya</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, gap: 16 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
  disabledText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  info: { color: '#475569', fontSize: 13, fontWeight: '600' },
});