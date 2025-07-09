import React from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {Card, Title, Paragraph, Button, Avatar, Divider, List} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '../../utils/theme';

const ProfileScreen: React.FC = () => {
  const user = {
    name: 'Caitlin Tudhope',
    email: 'caitlintudhope@gmail.com',
    phone: '082 966 3517',
    memberSince: 'May 2025',
    totalClasses: 12,
    organizations: 2
  };

  const menuItems = [
    {
      title: 'Edit Profile',
      icon: 'edit',
      onPress: () => {},
    },
    {
      title: 'Payment Methods',
      icon: 'payment',
      onPress: () => {},
    },
    {
      title: 'Notifications',
      icon: 'notifications',
      onPress: () => {},
    },
    {
      title: 'Organizations',
      icon: 'group',
      onPress: () => {},
    },
    {
      title: 'Help & Support',
      icon: 'help',
      onPress: () => {},
    },
    {
      title: 'Privacy Policy',
      icon: 'policy',
      onPress: () => {},
    },
    {
      title: 'Logout',
      icon: 'logout',
      onPress: () => {},
      textColor: theme.colors.error,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text 
              size={80}
              label="CT"
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
            <View style={styles.profileInfo}>
              <Title style={styles.userName}>{user.name}</Title>
              <Paragraph style={styles.userEmail}>{user.email}</Paragraph>
              <Paragraph style={styles.memberSince}>
                Member since {user.memberSince}
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="fitness-center" size={24} color={theme.colors.primary} />
              <Title style={styles.statNumber}>{user.totalClasses}</Title>
              <Paragraph style={styles.statLabel}>Classes Booked</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="group" size={24} color={theme.colors.accent} />
              <Title style={styles.statNumber}>{user.organizations}</Title>
              <Paragraph style={styles.statLabel}>Organizations</Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Contact Information */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Contact Information</Title>
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Icon name="email" size={20} color={theme.colors.placeholder} />
              <View style={styles.infoText}>
                <Paragraph style={styles.infoLabel}>Email</Paragraph>
                <Paragraph style={styles.infoValue}>{user.email}</Paragraph>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Icon name="phone" size={20} color={theme.colors.placeholder} />
              <View style={styles.infoText}>
                <Paragraph style={styles.infoLabel}>Phone</Paragraph>
                <Paragraph style={styles.infoValue}>{user.phone}</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Menu Items */}
        <Card style={styles.menuCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Settings</Title>
            <Divider style={styles.divider} />
            
            {menuItems.map((item, index) => (
              <List.Item
                key={index}
                title={item.title}
                left={() => (
                  <Icon 
                    name={item.icon} 
                    size={24} 
                    color={item.textColor || theme.colors.placeholder}
                    style={styles.menuIcon}
                  />
                )}
                right={() => (
                  <Icon 
                    name="chevron-right" 
                    size={24} 
                    color={theme.colors.placeholder}
                  />
                )}
                onPress={item.onPress}
                titleStyle={[
                  styles.menuTitle,
                  item.textColor && {color: item.textColor}
                ]}
                style={styles.menuItem}
              />
            ))}
          </Card.Content>
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Paragraph style={styles.appVersion}>
            IH Academy v1.0.0
          </Paragraph>
          <Paragraph style={styles.appCopyright}>
            © 2025 ItsHappening.Africa
          </Paragraph>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    elevation: 2,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginBottom: 16,
  },
  avatarLabel: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: theme.colors.placeholder,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  menuCard: {
    marginBottom: 16,
    elevation: 2,
  },
  menuItem: {
    paddingHorizontal: 0,
  },
  menuIcon: {
    marginLeft: 8,
    marginRight: 16,
  },
  menuTitle: {
    fontSize: 16,
    color: theme.colors.text,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appVersion: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 10,
    color: theme.colors.placeholder,
  },
});

export default ProfileScreen;