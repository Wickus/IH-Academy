import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, List, Divider, Switch, Portal, Modal, TextInput, Snackbar, Chip } from 'react-native-paper';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/authSlice';
import { apiClient } from '@/services/api';

const CoachProfile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, currentOrganization, organizations } = useAppSelector((state) => state.auth);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [qualificationsModalVisible, setQualificationsModalVisible] = useState(false);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    bio: '',
    experience: '',
    certifications: '',
    specialties: '',
    hourlyRate: '',
  });
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [newQualification, setNewQualification] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    classReminders: true,
    scheduleChanges: true,
    newBookings: true,
    payments: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCoachProfile = async () => {
    try {
      const response = await apiClient.getCoachProfile(user?.id);
      setCoachProfile(response.data);
      setEditForm({
        bio: response.data.bio || '',
        experience: response.data.experience || '',
        certifications: response.data.certifications || '',
        specialties: response.data.specialties || '',
        hourlyRate: response.data.hourlyRate?.toString() || '',
      });
      setQualifications(response.data.qualifications || []);
    } catch (err: any) {
      console.error('Failed to load coach profile:', err);
    }
  };

  useEffect(() => {
    loadCoachProfile();
  }, [user?.id]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      await apiClient.updateCoachProfile({
        ...editForm,
        hourlyRate: parseFloat(editForm.hourlyRate) || 0,
        qualifications,
      });
      setSuccess('Profile updated successfully');
      setEditModalVisible(false);
      loadCoachProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQualification = () => {
    if (newQualification.trim() && !qualifications.includes(newQualification.trim())) {
      setQualifications(prev => [...prev, newQualification.trim()]);
      setNewQualification('');
    }
  };

  const handleRemoveQualification = (qualification: string) => {
    setQualifications(prev => prev.filter(q => q !== qualification));
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
              Edit Coach Profile
            </Text>

            <TextInput
              label="Bio"
              value={editForm.bio}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, bio: text }))}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              placeholder="Tell students about yourself..."
            />

            <TextInput
              label="Years of Experience"
              value={editForm.experience}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, experience: text }))}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., 5 years"
            />

            <TextInput
              label="Certifications"
              value={editForm.certifications}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, certifications: text }))}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
              placeholder="List your certifications..."
            />

            <TextInput
              label="Specialties"
              value={editForm.specialties}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, specialties: text }))}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Beginner training, Advanced techniques"
            />

            <TextInput
              label="Hourly Rate (R)"
              value={editForm.hourlyRate}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, hourlyRate: text }))}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              placeholder="150"
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

  const renderQualificationsModal = () => (
    <Portal>
      <Modal
        visible={qualificationsModalVisible}
        onDismiss={() => setQualificationsModalVisible(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Manage Qualifications
            </Text>

            <View style={styles.addQualificationSection}>
              <TextInput
                label="Add New Qualification"
                value={newQualification}
                onChangeText={setNewQualification}
                mode="outlined"
                style={styles.qualificationInput}
                placeholder="e.g., Certified Personal Trainer"
              />
              <Button
                mode="contained"
                onPress={handleAddQualification}
                disabled={!newQualification.trim()}
                style={[styles.addButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
              >
                Add
              </Button>
            </View>

            <View style={styles.qualificationsList}>
              {qualifications.map((qualification, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  onClose={() => handleRemoveQualification(qualification)}
                  style={styles.qualificationChip}
                >
                  {qualification}
                </Chip>
              ))}
              {qualifications.length === 0 && (
                <Text variant="bodyMedium" style={styles.emptyQualifications}>
                  No qualifications added yet. Add your certifications and achievements above.
                </Text>
              )}
            </View>

            <Button
              mode="outlined"
              onPress={() => setQualificationsModalVisible(false)}
              style={styles.modalCloseButton}
            >
              Close
            </Button>
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
              label={(user?.firstName?.[0] || user?.username?.[0] || 'C').toUpperCase()}
              style={{ backgroundColor: currentOrganization?.primaryColor || '#20366B' }}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.userName}>
                Coach {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username || 'Unknown Coach'
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
              {coachProfile?.experience && (
                <Text variant="bodySmall" style={styles.experience}>
                  {coachProfile.experience} experience
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

      {/* Coach Information */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Coach Information
          </Text>
          
          {coachProfile?.bio ? (
            <Text variant="bodyMedium" style={styles.bioText}>
              {coachProfile.bio}
            </Text>
          ) : (
            <Text variant="bodyMedium" style={styles.emptyText}>
              Add a bio to tell students about yourself
            </Text>
          )}

          <List.Item
            title="Qualifications & Certifications"
            description={`${qualifications.length} qualifications listed`}
            left={props => <List.Icon {...props} icon="school" />}
            onPress={() => setQualificationsModalVisible(true)}
          />
          
          <Divider />
          
          <List.Item
            title="Specialties"
            description={coachProfile?.specialties || 'No specialties listed'}
            left={props => <List.Icon {...props} icon="star" />}
            onPress={() => setEditModalVisible(true)}
          />
          
          <Divider />
          
          <List.Item
            title="Hourly Rate"
            description={coachProfile?.hourlyRate ? `R${coachProfile.hourlyRate}/hour` : 'Not set'}
            left={props => <List.Icon {...props} icon="currency-usd" />}
            onPress={() => setEditModalVisible(true)}
          />
        </Card.Content>
      </Card>

      {/* Organizations */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Organizations
          </Text>
          
          {organizations.map(org => (
            <View key={org.id} style={styles.organizationItem}>
              <View style={styles.orgInfo}>
                <Avatar.Text 
                  size={40} 
                  label={org.name.substring(0, 2).toUpperCase()}
                  style={{ backgroundColor: org.primaryColor || '#20366B' }}
                />
                <View style={styles.orgDetails}>
                  <Text variant="titleMedium">{org.name}</Text>
                  <Text variant="bodySmall" style={styles.orgEmail}>
                    {org.email}
                  </Text>
                </View>
              </View>
              {currentOrganization?.id === org.id && (
                <Chip mode="flat" style={styles.currentChip}>
                  Current
                </Chip>
              )}
            </View>
          ))}
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
              <Text variant="bodyLarge">Class Reminders</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Get notified before your classes start
              </Text>
            </View>
            <Switch
              value={notificationSettings.classReminders}
              onValueChange={(value) => 
                setNotificationSettings(prev => ({ ...prev, classReminders: value }))
              }
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Schedule Changes</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Notifications about class schedule updates
              </Text>
            </View>
            <Switch
              value={notificationSettings.scheduleChanges}
              onValueChange={(value) => 
                setNotificationSettings(prev => ({ ...prev, scheduleChanges: value }))
              }
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">New Bookings</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Get notified when students book your classes
              </Text>
            </View>
            <Switch
              value={notificationSettings.newBookings}
              onValueChange={(value) => 
                setNotificationSettings(prev => ({ ...prev, newBookings: value }))
              }
            />
          </View>
        </Card.Content>
      </Card>

      {/* Support & Help */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Support & Help
          </Text>
          
          <List.Item
            title="Coach Resources"
            description="Training materials and guides"
            left={props => <List.Icon {...props} icon="book-open" />}
            onPress={() => {/* Navigate to resources */}}
          />
          
          <Divider />
          
          <List.Item
            title="Contact Support"
            description="Get help with technical issues"
            left={props => <List.Icon {...props} icon="help-circle" />}
            onPress={() => {/* Navigate to support */}}
          />
          
          <Divider />
          
          <List.Item
            title="Coach Guidelines"
            description="Best practices and policies"
            left={props => <List.Icon {...props} icon="clipboard-text" />}
            onPress={() => {/* Navigate to guidelines */}}
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
      {renderQualificationsModal()}

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
  experience: {
    color: '#24D367',
    marginTop: 4,
    fontWeight: '500',
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
  bioText: {
    color: '#333',
    marginBottom: 16,
    lineHeight: 20,
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  organizationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orgDetails: {
    marginLeft: 12,
    flex: 1,
  },
  orgEmail: {
    color: '#666',
    marginTop: 2,
  },
  currentChip: {
    backgroundColor: '#24D367',
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
  logoutButton: {
    marginTop: 8,
  },
  modalContainer: {
    margin: 20,
    maxHeight: '90%',
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
  addQualificationSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  qualificationInput: {
    flex: 1,
  },
  addButton: {
    alignSelf: 'flex-end',
  },
  qualificationsList: {
    marginBottom: 16,
  },
  qualificationChip: {
    marginBottom: 8,
    marginRight: 8,
  },
  emptyQualifications: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  modalCloseButton: {
    marginTop: 16,
  },
});

export default CoachProfile;