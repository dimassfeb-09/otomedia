import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export const SearchInput: React.FC<Props> = ({ value, onChange, placeholder = 'Search tasks...' }) => {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      testID="search-input"
    />
  );
};

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginHorizontal: 12, marginVertical: 8, backgroundColor: '#fff' },
});