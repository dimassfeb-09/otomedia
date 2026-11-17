import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '../types/task';

interface Props {
  tasks: Task[];
  loading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

export const TaskList: React.FC<Props> = ({ tasks, loading, onEdit, onDelete }) => {
  if (loading) {
    return <Text style={styles.loading}>Loading...</Text>;
  }
  if (tasks.length === 0) {
    return <Text style={styles.empty}>No tasks found</Text>;
  }
  return (
    <View>
      {tasks.map((task) => (
        <View key={task.id} style={styles.item}>
          <View style={styles.info}>
            <Text style={styles.title}>{task.title}</Text>
            <Text style={styles.meta}>{task.status} · {task.assignee}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit(task)}>
              <Text style={styles.link}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(task.id)}>
              <Text style={styles.linkDanger}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  loading: { padding: 16, textAlign: 'center' },
  empty: { padding: 16, textAlign: 'center', color: '#666' },
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, marginHorizontal: 12, marginVertical: 6, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  info: { flex: 1 },
  title: { fontWeight: 'bold' },
  meta: { color: '#666', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 12 },
  link: { color: '#007bff' },
  linkDanger: { color: '#dc3545' },
});