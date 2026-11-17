import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export const SearchInput: React.FC<Props> = ({ value, onChange, placeholder = 'Cari tugas...' }) => {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      testID="search-input"
    />
  );
};

const styles = StyleSheet.create({
  input: { marginHorizontal: 16, marginVertical: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', fontSize: 15, color: '#0F172A' },
});