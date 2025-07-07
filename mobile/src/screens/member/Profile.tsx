import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, List, Divider, Switch, Portal, Modal, TextInput, Snackbar } from 'react-native-paper';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/authSlice';
import { apiClient } from '@/services/api';

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, currentOrganization } = useAppSelector((state) => state.auth);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    classReminders: true,
  });
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      await apiClient.updateProfile(editForm);
      setSuccess('Profile updated successfully');
      setEditModalVisible(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const renderEditModal = () => (
    <Portal>
      <Modal
        visible={editModalVisible}
        onDismiss={() => setEditModalVisible(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Edit Profile
            </Text>

            <TextInput
              label="First Name"
              value={editForm.firstName}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, firstName: text }))}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Last Name"
              value={editForm.lastName}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, lastName: text }))}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Email"
              value={editForm.email}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              label="Phone"
              value={editForm.phone}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveProfile}
                loading={isLoading}
                disabled={isLoading}
                style={[styles.modalSaveButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
              >
                Save Changes
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={80} 
              label={(user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
              style={{ backgroundColor: currentOrganization?.primaryColor || '#20366B' }}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.userName}>
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username || 'Unknown User'
                }
              </Text>
              <Text variant="bodyMedium" style={styles.userEmail}>
                {user?.email}
              </Text>
              {currentOrganization && (
                <Text variant="bodySmall" style={styles.organizationName}>
                  {currentOrganization.name}
                </Text>
              )}
            </View>
          </View>
          <Button
            mode="outlined"
            onPress={() => setEditModalVisible(true)}
            style={styles.editButton}
          >
            Edit Profile
          </Button>
        </Card.Content>
      </Card>

      {/* Account Settings */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Account Settings
          </Text>
          
          <List.Item
            title="Personal Information"
            description="Update your profile details"
            left={props => <List.Icon {...props} icon="account" />}
            onPress={() => setEditModalVisible(true)}
          />
          
          <Divider />
          
          <List.Item
            title="Payment Methods"
            description="Manage your payment options"
            left={props => <List.Icon {...props} icon="credit-card" />}
            onPress={() => {/* Navigate to payment methods */}}
          />
          
          <Divider />
          
          <List.Item
            title="Change Password"
            description="Update your account password"
            left={props => <List.Icon {...props} icon="lock" />}
            onPress={() => {/* Navigate to change password */}}
          />
        </Card.Content>
      </Card>

      {/* Notification Settings */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Notification Settings
          </Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Push Notifications</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Receive notifications on your device
              </Text>
            </View>
            <Switch
              value={notificationSettings.pushNotifications}
              onValueChange={(value) => 
                setNotificationSettings(prev => ({ ...prev, pushNotifications: value }))
              }
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Email Notifications</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Receive notifications via email
              </Text>
            </View>
            <Switch
              value={notificationSettings.emailNotifications}
              onValueChange={(value) => 
                setNotificationSettings(prev => ({ ...prev, emailNotifications: value }))
              }
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Class Reminders</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Get reminded about upcoming classes
              </Text>
            </View>
            <Switch
              value={notificationSettings.classReminders}
              onValueChange={(value) => 
                setNotificationSettings(prev => ({ ...prev, classReminders: value }))
              }
            />
          </View>
        </Card.Content>
      </Card>

      {/* Organization Info */}
      {currentOrganization && (
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Organization
            </Text>
            
            <View style={styles.organizationInfo}>
              <Avatar.Text 
                size={40} 
                label={currentOrganization.name.substring(0, 2).toUpperCase()}
                style={{ backgroundColor: currentOrganization.primaryColor || '#20366B' }}
              />
              <View style={styles.orgDetails}>
                <Text variant="titleMedium">{currentOrganization.name}</Text>
                <Text variant="bodySmall" style={styles.orgEmail}>
                  {currentOrganization.email}
                </Text>
              </View>
            </View>

            <Button
              mode="outlined"
              onPress={() => {/* Navigate to organization selector */}}
              style={styles.switchOrgButton}
            >
              Switch Organization
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Support & Help */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Support & Help
          </Text>
          
          <List.Item
            title="Help Center"
            description="Get help and find answers"
            left={props => <List.Icon {...props} icon="help-circle" />}
            onPress={() => {/* Navigate to help */}}
          />
          
          <Divider />
          
          <List.Item
            title="Contact Support"
            description="Get in touch with our team"
            left={props => <List.Icon {...props} icon="email" />}
            onPress={() => {/* Navigate to contact */}}
          />
          
          <Divider />
          
          <List.Item
            title="About"
            description="App version and information"
            left={props => <List.Icon {...props} icon="information" />}
            onPress={() => {/* Navigate to about */}}
          />
        </Card.Content>
      </Card>

      {/* Logout */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            buttonColor="#ef4444"
            icon="logout"
          >
            Sign Out
          </Button>
        </Card.Content>
      </Card>

      {renderEditModal()}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
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
  profileCard: {
    marginBottom: 16,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    color: '#20366B',
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#666',
    marginTop: 2,
  },
  organizationName: {
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  editButton: {
    alignSelf: 'flex-start',
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 1,
  },
  sectionTitle: {
    color: '#20366B',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
  },
  settingDescription: {
    color: '#666',
    marginTop: 2,
  },
  divider: {
    marginVertical: 8,
  },
  organizationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  orgDetails: {
    marginLeft: 12,
    flex: 1,
  },
  orgEmail: {
    color: '#666',
    marginTop: 2,
  },
  switchOrgButton: {
    alignSelf: 'flex-start',
  },
  logoutButton: {
    marginTop: 8,
  },
  modalContainer: {
    margin: 20,
  },
  modalTitle: {
    color: '#20366B',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalSaveButton: {
    flex: 1,
  },
});

export default ProfileScreen;