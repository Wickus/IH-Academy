import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const ClassesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Classes</Text>
      <Text variant="bodyMedium">Browse and book available classes</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});

export default ClassesScreen;