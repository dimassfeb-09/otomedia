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
          <Text style={styles.heading}>Edit Task</Text>
          <Text style={styles.label}>Judul</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Judul tugas" testID="edit-title" />
          <Text style={styles.label}>Deskripsi</Text>
          <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Deskripsi" testID="edit-desc" />
          <Text style={styles.label}>Assignee</Text>
          <TextInput style={styles.input} value={assignee} onChangeText={setAssignee} placeholder="Nama assignee" testID="edit-assignee" />
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            {(['pending', 'in_progress', 'done'] as TaskStatus[]).map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, status === s && styles.active]} onPress={() => setStatus(s)} testID={`edit-status-${s}`}>
                <Text style={status === s ? styles.activeText : styles.text}>{s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} testID="edit-cancel">
              <Text style={styles.link}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} testID="edit-save">
              <Text style={styles.link}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  heading: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 4, marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 8 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: { padding: 8, margin: 4, borderRadius: 16, backgroundColor: '#eee' },
  active: { backgroundColor: '#007bff' },
  text: { color: '#333' },
  activeText: { color: '#fff' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  link: { color: '#007bff', padding: 8 },
});