import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import { Task } from '../types/task';
import { STATUS_COLORS, STATUS_LABELS } from '../constants/status';

interface Props {
  task: Task;
  onBack: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

const formatDate = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID');
};

export const TaskDetail: React.FC<Props> = ({ task, onBack, onEdit, onDelete }) => {
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => subscription.remove();
  }, [onBack]);

  return (
    <View style={styles.container} testID="task-detail">
      <View style={styles.header}>
        <View style={styles.backSlot}>
          <TouchableOpacity onPress={onBack} testID="detail-back" accessibilityLabel="Kembali" activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Detail Tugas</Text>
        <View style={styles.backSlot} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{task.title}</Text>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[task.status] || '#64748B' }]}>
              <Text style={styles.badgeText}>{STATUS_LABELS[task.status] || task.status}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Deskripsi</Text>
          <Text style={styles.value}>{task.description || 'Tidak ada deskripsi'}</Text>

          <Text style={styles.sectionLabel}>Penanggung Jawab</Text>
          <Text style={styles.value}>{task.assignee || 'Belum ditugaskan'}</Text>

          <Text style={styles.sectionLabel}>Dibuat</Text>
          <Text style={styles.value}>{formatDate(task.created_at)}</Text>

          <Text style={styles.sectionLabel}>Diperbarui</Text>
          <Text style={styles.value}>{formatDate(task.updated_at)}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(task)} testID="detail-edit" activeOpacity={0.7}>
            <Text style={styles.editText}>Ubah</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(task.id)} testID="detail-delete" activeOpacity={0.7}>
            <Text style={styles.deleteText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backIcon: { color: '#0F172A', fontSize: 30, fontWeight: '400', lineHeight: 32 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  backSlot: { width: 64, alignItems: 'flex-start', justifyContent: 'center' },
  content: { padding: 16, flex: 1 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', minHeight: 96 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: '#0F172A', lineHeight: 26 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 12, marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 15, color: '#0F172A', lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  editBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#2563EB' },
  editText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  deleteBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  deleteText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
