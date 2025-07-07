import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { ScreenProps } from '@/types';

const ForgotPasswordScreen: React.FC<ScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    setIsLoading(true);
    // TODO: Implement password reset functionality
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('Login');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Reset Password
      </Text>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="bodyLarge" style={styles.description}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button
            mode="contained"
            onPress={handleResetPassword}
            loading={isLoading}
            disabled={!email.trim() || isLoading}
            style={styles.resetButton}
          >
            Send Reset Link
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.backButton}
          >
            Back to Sign In
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    backgroundColor: '#F5F7FA',
  },
  title: {
    textAlign: 'center',
    color: '#20366B',
    fontWeight: 'bold',
    marginBottom: 32,
  },
  card: {
    marginBottom: 24,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 24,
  },
  resetButton: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'center',
  },
});

export default ForgotPasswordScreen;