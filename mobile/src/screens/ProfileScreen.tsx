import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../App';

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Profile'
>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({navigation}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+27 12 345 6789',
    emergencyContact: '+27 12 345 6790',
    medicalInfo: 'No known allergies',
  });

  const handleSave = () => {
    // TODO: Implement actual save logic
    Alert.alert('Success', 'Profile updated successfully!');
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Logout', onPress: () => navigation.replace('Login')},
      ]
    );
  };

  const stats = [
    {title: 'Classes Booked', value: '24', color: '#20366B'},
    {title: 'Hours Trained', value: '48', color: '#278DD4'},
    {title: 'Achievements', value: '5', color: '#24D367'},
  ];

  const menuItems = [
    {
      title: 'Notifications',
      subtitle: 'Manage your notifications',
      icon: '🔔',
      onPress: () => Alert.alert('Coming Soon', 'Notifications settings will be available soon'),
    },
    {
      title: 'Payment Methods',
      subtitle: 'Manage payment options',
      icon: '💳',
      onPress: () => Alert.alert('Coming Soon', 'Payment settings will be available soon'),
    },
    {
      title: 'Privacy Settings',
      subtitle: 'Control your privacy',
      icon: '🔒',
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings will be available soon'),
    },
    {
      title: 'Help & Support',
      subtitle: 'Get help when you need it',
      icon: '❓',
      onPress: () => Alert.alert('Coming Soon', 'Help & Support will be available soon'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {profile.firstName} {profile.lastName}
          </Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, {borderTopColor: stat.color}]}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editButtonText}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileForm}>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>First Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={profile.firstName}
                    onChangeText={text => setProfile({...profile, firstName: text})}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile.firstName}</Text>
                )}
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Last Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={profile.lastName}
                    onChangeText={text => setProfile({...profile, lastName: text})}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile.lastName}</Text>
                )}
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Email</Text>
              {isEditing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={profile.email}
                  onChangeText={text => setProfile({...profile, email: text})}
                  keyboardType="email-address"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.email}</Text>
              )}
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              {isEditing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={profile.phone}
                  onChangeText={text => setProfile({...profile, phone: text})}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.phone}</Text>
              )}
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Emergency Contact</Text>
              {isEditing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={profile.emergencyContact}
                  onChangeText={text => setProfile({...profile, emergencyContact: text})}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.emergencyContact}</Text>
              )}
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Medical Information</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.fieldInput, styles.textArea]}
                  value={profile.medicalInfo}
                  onChangeText={text => setProfile({...profile, medicalInfo: text})}
                  multiline
                  numberOfLines={3}
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.medicalInfo}</Text>
              )}
            </View>

            {isEditing && (
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>{item.icon}</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#20366B',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#278DD4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#20366B',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#F5F7FA',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#24D367',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIconText: {
    fontSize: 24,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  menuArrow: {
    fontSize: 20,
    color: '#20366B',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;