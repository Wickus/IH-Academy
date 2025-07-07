import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Switch, Button, Snackbar, List, Divider, Dialog, Portal, TextInput } from 'react-native-paper';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/authSlice';
import { biometricService, BiometricCapabilities } from '@/services/biometrics';
import { offlineService } from '@/services/offline';
import { apiClient } from '@/services/api';

const SecuritySettings: React.FC = () => {
  const { user, currentOrganization } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities>({
    available: false,
    biometryType: null,
  });
  const [biometricLoginEnabled, setBiometricLoginEnabled] = useState(false);
  const [biometricPaymentEnabled, setBiometricPaymentEnabled] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [autoLockTime, setAutoLockTime] = useState(15); // minutes
  
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [cacheStats, setCacheStats] = useState({
    totalItems: 0,
    totalSize: '0 B',
    oldestItem: null,
    newestItem: null,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      setIsLoading(true);
      
      // Initialize biometric service
      await biometricService.initialize();
      const capabilities = biometricService.getCapabilities();
      setBiometricCapabilities(capabilities);
      
      // Load biometric settings
      const loginEnabled = await biometricService.isBiometricLoginEnabled();
      const paymentEnabled = await biometricService.isBiometricPaymentEnabled();
      setBiometricLoginEnabled(loginEnabled);
      setBiometricPaymentEnabled(paymentEnabled);
      
      // Load cache stats
      const stats = await offlineService.getCacheStats();
      setCacheStats(stats);
      
    } catch (error) {
      console.error('Failed to load security settings:', error);
      setError('Failed to load security settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLoginToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        // Test authentication before enabling
        const result = await biometricService.authenticateForLogin();
        if (!result.success) {
          setError(result.error || 'Biometric authentication failed');
          return;
        }
      }
      
      await biometricService.setBiometricLoginEnabled(enabled);
      setBiometricLoginEnabled(enabled);
      setSuccess(enabled ? 'Biometric login enabled' : 'Biometric login disabled');
    } catch (error) {
      console.error('Failed to toggle biometric login:', error);
      setError('Failed to update biometric login setting');
    }
  };

  const handleBiometricPaymentToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        // Test authentication before enabling
        const result = await biometricService.authenticateForPayment();
        if (!result.success) {
          setError(result.error || 'Biometric authentication failed');
          return;
        }
      }
      
      await biometricService.setBiometricPaymentEnabled(enabled);
      setBiometricPaymentEnabled(enabled);
      setSuccess(enabled ? 'Biometric payments enabled' : 'Biometric payments disabled');
    } catch (error) {
      console.error('Failed to toggle biometric payments:', error);
      setError('Failed to update biometric payment setting');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      
      if (passwordForm.newPassword.length < 8) {
        setError('New password must be at least 8 characters long');
        return;
      }
      
      setIsSaving(true);
      
      await apiClient.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      setChangePasswordVisible(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setSuccess('Password changed successfully');
      
    } catch (error: any) {
      setError(error.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutAllDevices = () => {
    Alert.alert(
      'Logout All Devices',
      'This will log you out of all devices. You will need to log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout All',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.logoutAllDevices();
              dispatch(logout());
              setSuccess('Logged out of all devices');
            } catch (error: any) {
              setError(error.message || 'Failed to logout all devices');
            }
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached data. You may need to reload information when offline.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await offlineService.clearCache();
              await loadSecuritySettings(); // Reload stats
              setSuccess('Cache cleared successfully');
            } catch (error) {
              setError('Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleResetBiometrics = () => {
    Alert.alert(
      'Reset Biometric Setup',
      'This will disable all biometric features and remove stored biometric data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await biometricService.resetBiometricSetup();
              setBiometricLoginEnabled(false);
              setBiometricPaymentEnabled(false);
              setSuccess('Biometric setup reset successfully');
            } catch (error) {
              setError('Failed to reset biometric setup');
            }
          },
        },
      ]
    );
  };

  const getBiometricStatusText = () => {
    if (!biometricCapabilities.available) {
      return 'Not available on this device';
    }
    return `${biometricService.getBiometricTypeName()} available`;
  };

  const autoLockOptions = [5, 15, 30, 60]; // minutes

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading security settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Biometric Authentication */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Biometric Authentication
          </Text>
          
          <Text variant="bodyMedium" style={styles.biometricStatus}>
            {getBiometricStatusText()}
          </Text>

          <List.Section>
            <List.Item
              title="Biometric Login"
              description="Use biometrics to sign in quickly and securely"
              left={() => <List.Icon icon="fingerprint" />}
              right={() => (
                <Switch
                  value={biometricLoginEnabled}
                  onValueChange={handleBiometricLoginToggle}
                  disabled={!biometricCapabilities.available}
                  color={currentOrganization?.primaryColor || '#20366B'}
                />
              )}
            />
            <Divider />

            <List.Item
              title="Biometric Payments"
              description="Authenticate payments with biometrics"
              left={() => <List.Icon icon="credit-card-check" />}
              right={() => (
                <Switch
                  value={biometricPaymentEnabled}
                  onValueChange={handleBiometricPaymentToggle}
                  disabled={!biometricCapabilities.available}
                  color={currentOrganization?.primaryColor || '#20366B'}
                />
              )}
            />
          </List.Section>

          {biometricCapabilities.available && (
            <Button
              mode="outlined"
              onPress={handleResetBiometrics}
              style={styles.resetButton}
              icon="refresh"
            >
              Reset Biometric Setup
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Password & Authentication */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Password & Authentication
          </Text>

          <List.Section>
            <List.Item
              title="Change Password"
              description="Update your account password"
              left={() => <List.Icon icon="lock-reset" />}
              right={() => <List.Icon icon="chevron-right" />}
              onPress={() => setChangePasswordVisible(true)}
            />
            <Divider />

            <List.Item
              title="Auto-Lock"
              description={`Lock app after ${autoLockTime} minutes of inactivity`}
              left={() => <List.Icon icon="lock-clock" />}
              right={() => (
                <Switch
                  value={autoLockEnabled}
                  onValueChange={setAutoLockEnabled}
                  color={currentOrganization?.primaryColor || '#20366B'}
                />
              )}
            />
          </List.Section>

          {autoLockEnabled && (
            <View style={styles.autoLockOptions}>
              <Text variant="bodyMedium" style={styles.optionLabel}>
                Auto-lock time:
              </Text>
              <View style={styles.timeOptions}>
                {autoLockOptions.map((minutes) => (
                  <Button
                    key={minutes}
                    mode={autoLockTime === minutes ? 'contained' : 'outlined'}
                    onPress={() => setAutoLockTime(minutes)}
                    style={[
                      styles.timeButton,
                      autoLockTime === minutes && { 
                        backgroundColor: currentOrganization?.primaryColor || '#20366B' 
                      }
                    ]}
                    compact
                  >
                    {minutes}m
                  </Button>
                ))}
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Session Management */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Session Management
          </Text>

          <List.Section>
            <List.Item
              title="Active Sessions"
              description="Manage your active login sessions"
              left={() => <List.Icon icon="devices" />}
              right={() => <List.Icon icon="chevron-right" />}
            />
            <Divider />

            <List.Item
              title="Logout All Devices"
              description="Sign out of all devices except this one"
              left={() => <List.Icon icon="logout-variant" />}
              right={() => <List.Icon icon="chevron-right" />}
              onPress={handleLogoutAllDevices}
            />
          </List.Section>
        </Card.Content>
      </Card>

      {/* Data & Privacy */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Data & Privacy
          </Text>

          <View style={styles.cacheInfo}>
            <Text variant="bodyMedium" style={styles.cacheTitle}>
              Offline Cache
            </Text>
            <View style={styles.cacheStats}>
              <Text variant="bodySmall">Items: {cacheStats.totalItems}</Text>
              <Text variant="bodySmall">Size: {cacheStats.totalSize}</Text>
            </View>
          </View>

          <List.Section>
            <List.Item
              title="Clear Cache"
              description="Remove all cached offline data"
              left={() => <List.Icon icon="delete-sweep" />}
              right={() => <List.Icon icon="chevron-right" />}
              onPress={handleClearCache}
            />
            <Divider />

            <List.Item
              title="Privacy Policy"
              description="Review our privacy policy"
              left={() => <List.Icon icon="shield-account" />}
              right={() => <List.Icon icon="open-in-new" />}
            />
            <Divider />

            <List.Item
              title="Terms of Service"
              description="Review terms of service"
              left={() => <List.Icon icon="file-document" />}
              right={() => <List.Icon icon="open-in-new" />}
            />
          </List.Section>
        </Card.Content>
      </Card>

      {/* Security Status */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Security Status
          </Text>

          <View style={styles.securityStatus}>
            <View style={styles.statusItem}>
              <Text variant="bodyMedium">✅ Account Verified</Text>
            </View>
            <View style={styles.statusItem}>
              <Text variant="bodyMedium">
                {biometricLoginEnabled ? '✅' : '⚠️'} Biometric Login {biometricLoginEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text variant="bodyMedium">
                {autoLockEnabled ? '✅' : '⚠️'} Auto-Lock {autoLockEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Change Password Dialog */}
      <Portal>
        <Dialog visible={changePasswordVisible} onDismiss={() => setChangePasswordVisible(false)}>
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Current Password"
              value={passwordForm.currentPassword}
              onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
              secureTextEntry
              mode="outlined"
              style={styles.passwordInput}
            />
            <TextInput
              label="New Password"
              value={passwordForm.newPassword}
              onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
              secureTextEntry
              mode="outlined"
              style={styles.passwordInput}
            />
            <TextInput
              label="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
              secureTextEntry
              mode="outlined"
              style={styles.passwordInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setChangePasswordVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleChangePassword}
              loading={isSaving}
              disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            >
              Change Password
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{
          label: 'Retry',
          onPress: () => loadSecuritySettings(),
        }}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess(null)}
        duration={3000}
      >
        {success}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    color: '#20366B',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  biometricStatus: {
    color: '#666',
    marginBottom: 16,
  },
  resetButton: {
    marginTop: 12,
  },
  autoLockOptions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  optionLabel: {
    color: '#666',
    marginBottom: 8,
  },
  timeOptions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  timeButton: {
    marginBottom: 8,
  },
  cacheInfo: {
    marginBottom: 12,
  },
  cacheTitle: {
    color: '#333',
    marginBottom: 4,
  },
  cacheStats: {
    flexDirection: 'row',
    gap: 16,
  },
  securityStatus: {
    gap: 8,
  },
  statusItem: {
    paddingVertical: 4,
  },
  passwordInput: {
    marginBottom: 12,
  },
});

export default SecuritySettings;