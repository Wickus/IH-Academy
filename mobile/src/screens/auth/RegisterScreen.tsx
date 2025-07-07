import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Snackbar } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/store';
import { registerUser, clearError } from '@/store/authSlice';
import { ScreenProps } from '@/types';

const RegisterScreen: React.FC<ScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      return;
    }

    dispatch(registerUser({
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
    }));
  };

  const isFormValid = formData.username.trim() && 
                     formData.email.trim() && 
                     formData.password.length >= 6 && 
                     formData.password === formData.confirmPassword;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineLarge" style={styles.title}>
          Create Account
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Username *"
              value={formData.username}
              onChangeText={(value) => updateField('username', value)}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              label="Email Address *"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />

            <View style={styles.nameRow}>
              <TextInput
                label="First Name"
                value={formData.firstName}
                onChangeText={(value) => updateField('firstName', value)}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Last Name"
                value={formData.lastName}
                onChangeText={(value) => updateField('lastName', value)}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
            </View>

            <TextInput
              label="Password *"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              mode="outlined"
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
            />

            <TextInput
              label="Confirm Password *"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              error={formData.confirmPassword && formData.password !== formData.confirmPassword}
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading || !isFormValid}
              style={styles.registerButton}
            >
              Create Account
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.loginSection}>
          <Text variant="bodyMedium">Already have an account?</Text>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
          >
            Sign In
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={!!error}
        onDismiss={() => dispatch(clearError())}
        duration={4000}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
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
  input: {
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  registerButton: {
    marginTop: 8,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RegisterScreen;