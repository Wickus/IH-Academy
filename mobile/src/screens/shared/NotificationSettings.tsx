import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Switch, Button, Snackbar, List, Divider } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { notificationService } from '@/services/notifications';
import { biometricService } from '@/services/biometrics';

interface NotificationPreferences {
  bookingReminders: boolean;
  messages: boolean;
  payments: boolean;
  general: boolean;
  reminderTime: number;
}

const NotificationSettings: React.FC = () => {
  const { currentOrganization } = useAppSelector((state) => state.auth);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    bookingReminders: true,
    messages: true,
    payments: true,
    general: true,
    reminderTime: 30,
  });
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      setIsLoading(true);
      
      // Check permission status
      const hasPermission = await notificationService.checkPermissions();
      setPermissionStatus(hasPermission ? 'granted' : 'denied');
      
      // Load preferences
      const prefs = await notificationService.getNotificationPreferences();
      setPreferences(prefs);
      
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      setError('Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const granted = await notificationService.requestPermissions();
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      if (granted) {
        setSuccess('Notification permissions granted');
      } else {
        setError('Notification permissions denied');
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
      setError('Failed to request notification permissions');
    }
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      await notificationService.updateNotificationPreferences(preferences);
      setSuccess('Notification preferences saved');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setError('Failed to save notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const testNotification = async () => {
    try {
      await notificationService.scheduleLocalNotification({
        id: `test_${Date.now()}`,
        title: 'Test Notification',
        body: 'This is a test notification from IH Academy',
        type: 'general',
        scheduledTime: new Date(Date.now() + 2000), // 2 seconds from now
      });
      setSuccess('Test notification scheduled');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setError('Failed to send test notification');
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | number) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getReminderTimeText = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes before`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} before`;
      } else {
        return `${hours}h ${remainingMinutes}m before`;
      }
    }
  };

  const reminderTimeOptions = [5, 15, 30, 60, 120, 1440]; // 5 min to 24 hours

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Permission Status */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Notification Permissions
          </Text>
          
          <View style={styles.permissionStatus}>
            <Text variant="bodyMedium" style={styles.statusText}>
              Status: {permissionStatus === 'granted' ? 'Enabled' : 'Disabled'}
            </Text>
            {permissionStatus !== 'granted' && (
              <Button
                mode="contained"
                onPress={requestPermissions}
                style={[styles.permissionButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
              >
                Enable Notifications
              </Button>
            )}
          </View>

          <Text variant="bodySmall" style={styles.permissionDescription}>
            {permissionStatus === 'granted'
              ? 'You will receive notifications based on your preferences below.'
              : 'Enable notifications to receive class reminders, messages, and important updates.'
            }
          </Text>
        </Card.Content>
      </Card>

      {/* Notification Types */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Notification Types
          </Text>

          <List.Section>
            <List.Item
              title="Class Reminders"
              description="Get notified before your upcoming classes"
              left={() => <List.Icon icon="calendar-clock" />}
              right={() => (
                <Switch
                  value={preferences.bookingReminders}
                  onValueChange={(value) => updatePreference('bookingReminders', value)}
                  color={currentOrganization?.primaryColor || '#20366B'}
                />
              )}
            />
            <Divider />

            <List.Item
              title="Messages"
              description="Notifications for new messages from organizations"
              left={() => <List.Icon icon="message-text" />}
              right={() => (
                <Switch
                  value={preferences.messages}
                  onValueChange={(value) => updatePreference('messages', value)}
                  color={currentOrganization?.primaryColor || '#20366B'}
                />
              )}
            />
            <Divider />

            <List.Item
              title="Payments"
              description="Payment confirmations and reminders"
              left={() => <List.Icon icon="credit-card" />}
              right={() => (
                <Switch
                  value={preferences.payments}
                  onValueChange={(value) => updatePreference('payments', value)}
                  color={currentOrganization?.primaryColor || '#20366B'}
                />
              )}
            />
            <Divider />

            <List.Item
              title="General Updates"
              description="Important announcements and updates"
              left={() => <List.Icon icon="bell" />}
              right={() => (
                <Switch
                  value={preferences.general}
                  onValueChange={(value) => updatePreference('general', value)}
                  color={currentOrganization?.primaryColor || '#20366B'}
                />
              )}
            />
          </List.Section>
        </Card.Content>
      </Card>

      {/* Reminder Timing */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Class Reminder Timing
          </Text>
          
          <Text variant="bodyMedium" style={styles.reminderDescription}>
            Choose when to receive reminders before your classes start
          </Text>

          <View style={styles.reminderOptions}>
            {reminderTimeOptions.map((minutes) => (
              <Button
                key={minutes}
                mode={preferences.reminderTime === minutes ? 'contained' : 'outlined'}
                onPress={() => updatePreference('reminderTime', minutes)}
                style={[
                  styles.reminderButton,
                  preferences.reminderTime === minutes && { 
                    backgroundColor: currentOrganization?.primaryColor || '#20366B' 
                  }
                ]}
                compact
              >
                {getReminderTimeText(minutes)}
              </Button>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Actions
          </Text>

          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={savePreferences}
              loading={isSaving}
              disabled={isSaving || permissionStatus !== 'granted'}
              style={[styles.actionButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
              icon="content-save"
            >
              Save Preferences
            </Button>

            <Button
              mode="outlined"
              onPress={testNotification}
              disabled={permissionStatus !== 'granted'}
              style={styles.actionButton}
              icon="bell-ring"
            >
              Test Notification
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Quick Settings
          </Text>

          <View style={styles.quickSettings}>
            <Button
              mode="outlined"
              onPress={() => {
                setPreferences({
                  bookingReminders: true,
                  messages: true,
                  payments: true,
                  general: true,
                  reminderTime: 30,
                });
              }}
              style={styles.quickButton}
            >
              Enable All
            </Button>

            <Button
              mode="outlined"
              onPress={() => {
                setPreferences({
                  bookingReminders: false,
                  messages: false,
                  payments: true, // Keep payments enabled for security
                  general: false,
                  reminderTime: 30,
                });
              }}
              style={styles.quickButton}
            >
              Essential Only
            </Button>

            <Button
              mode="outlined"
              onPress={() => {
                setPreferences({
                  bookingReminders: false,
                  messages: false,
                  payments: false,
                  general: false,
                  reminderTime: 30,
                });
              }}
              style={styles.quickButton}
            >
              Disable All
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{
          label: 'Retry',
          onPress: () => loadNotificationSettings(),
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
  permissionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    color: '#333',
  },
  permissionButton: {
    paddingHorizontal: 16,
  },
  permissionDescription: {
    color: '#666',
    lineHeight: 18,
  },
  reminderDescription: {
    color: '#666',
    marginBottom: 16,
  },
  reminderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderButton: {
    marginBottom: 8,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  quickSettings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    flex: 0.32,
    marginBottom: 8,
  },
});

export default NotificationSettings;