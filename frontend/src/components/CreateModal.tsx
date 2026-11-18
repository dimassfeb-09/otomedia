import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Easing, Keyboard, Platform } from 'react-native';
import { Task, TaskStatus } from '../types/task';
import { STATUS_LABELS, STATUS_OPTIONS } from '../constants/status';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<Task>) => Promise<void>;
}

export const CreateModal: React.FC<Props> = ({ visible, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [assignee, setAssignee] = useState('');
  const [saving, setSaving] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const height = event.endCoordinates?.height || 0;
      const duration = event.duration || 250;
      Animated.timing(translateY, {
        toValue: -height,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      const duration = event?.duration || 200;
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [translateY]);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setDescription('');
      setStatus('pending');
      setAssignee('');
    }
  }, [visible]);

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);

    try {
      await onSave({ title: title.trim(), description, status, assignee });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { transform: [{ translateY }] }]}>
        <View style={styles.card}>
          <Text style={styles.heading}>Tambah Tugas</Text>
          <Text style={styles.label}>Judul</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Judul tugas" placeholderTextColor="#94A3B8" testID="create-title" />
          <Text style={styles.label}>Deskripsi</Text>
          <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Deskripsi" placeholderTextColor="#94A3B8" testID="create-desc" />
          <Text style={styles.label}>Penanggung Jawab</Text>
          <TextInput style={styles.input} value={assignee} onChangeText={setAssignee} placeholder="Nama penanggung jawab" placeholderTextColor="#94A3B8" testID="create-assignee" />
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((statusOption) => (
              <TouchableOpacity key={statusOption} style={[styles.chip, status === statusOption && styles.active]} onPress={() => setStatus(statusOption)} testID={`create-status-${statusOption}`} activeOpacity={0.8}>
                <Text style={status === statusOption ? styles.activeText : styles.text}>{STATUS_LABELS[statusOption]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} testID="create-cancel" style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} testID="create-save" style={styles.saveBtn} activeOpacity={0.7}>
              <Text style={styles.saveText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
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
