import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Task, TaskStatus } from '../types/task';

interface Props {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (id: number, data: Partial<Task>) => Promise<void>;
}

export const EditModal: React.FC<Props> = ({ visible, task, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [assignee, setAssignee] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setAssignee(task.assignee);
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    try {
      await onSave(task.id, { title, description, status, assignee });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.heading}>Edit Tugas</Text>
          <Text style={styles.label}>Judul</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Judul tugas" placeholderTextColor="#94A3B8" testID="edit-title" />
          <Text style={styles.label}>Deskripsi</Text>
          <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Deskripsi" placeholderTextColor="#94A3B8" testID="edit-desc" />
          <Text style={styles.label}>Assignee</Text>
          <TextInput style={styles.input} value={assignee} onChangeText={setAssignee} placeholder="Nama assignee" placeholderTextColor="#94A3B8" testID="edit-assignee" />
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            {(['pending', 'in_progress', 'done'] as TaskStatus[]).map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, status === s && styles.active]} onPress={() => setStatus(s)} testID={`edit-status-${s}`} activeOpacity={0.8}>
                <Text style={status === s ? styles.activeText : styles.text}>{s === 'in_progress' ? 'Proses' : s === 'done' ? 'Selesai' : 'Pending'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} testID="edit-cancel" style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} testID="edit-save" style={styles.saveBtn} activeOpacity={0.7}>
              <Text style={styles.saveText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32 },
  heading: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 15, color: '#0F172A', backgroundColor: '#F8FAFC' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F1F5F9' },
  active: { backgroundColor: '#2563EB' },
  text: { color: '#475569', fontSize: 13, fontWeight: '500' },
  activeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  cancelBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  cancelText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: '#2563EB' },
  saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});