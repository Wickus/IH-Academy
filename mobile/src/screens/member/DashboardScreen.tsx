import React from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {Card, Title, Paragraph, Button, Divider} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '../../utils/theme';

const DashboardScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Welcome Section */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <View style={styles.welcomeHeader}>
              <Icon name="sports" size={32} color={theme.colors.primary} />
              <View style={styles.welcomeText}>
                <Title style={styles.welcomeTitle}>Welcome to IH Academy</Title>
                <Paragraph style={styles.welcomeSubtitle}>
                  Your sports journey starts here
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, {backgroundColor: theme.colors.primary}]}>
            <Card.Content style={styles.statContent}>
              <Icon name="fitness-center" size={24} color="white" />
              <Title style={styles.statNumber}>12</Title>
              <Paragraph style={styles.statLabel}>Classes Booked</Paragraph>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, {backgroundColor: theme.colors.accent}]}>
            <Card.Content style={styles.statContent}>
              <Icon name="event" size={24} color="white" />
              <Title style={styles.statNumber}>3</Title>
              <Paragraph style={styles.statLabel}>This Week</Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Upcoming Classes */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>Upcoming Classes</Title>
              <Button 
                mode="text" 
                textColor={theme.colors.primary}
                onPress={() => {}}
              >
                View All
              </Button>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.classItem}>
              <View style={styles.classInfo}>
                <Icon name="pool" size={20} color={theme.colors.primary} />
                <View style={styles.classDetails}>
                  <Paragraph style={styles.className}>Swimming Lessons</Paragraph>
                  <Paragraph style={styles.classTime}>Today, 3:00 PM</Paragraph>
                </View>
              </View>
              <Button 
                mode="outlined" 
                compact
                buttonColor={theme.colors.surface}
                textColor={theme.colors.primary}
              >
                Details
              </Button>
            </View>

            <View style={styles.classItem}>
              <View style={styles.classInfo}>
                <Icon name="sports-soccer" size={20} color={theme.colors.primary} />
                <View style={styles.classDetails}>
                  <Paragraph style={styles.className}>Soccer Training</Paragraph>
                  <Paragraph style={styles.classTime}>Tomorrow, 10:00 AM</Paragraph>
                </View>
              </View>
              <Button 
                mode="outlined" 
                compact
                buttonColor={theme.colors.surface}
                textColor={theme.colors.primary}
              >
                Details
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Quick Actions</Title>
            <Divider style={styles.divider} />
            
            <View style={styles.actionGrid}>
              <Button 
                mode="contained" 
                icon="search"
                style={styles.actionButton}
                buttonColor={theme.colors.primary}
                onPress={() => {}}
              >
                Find Classes
              </Button>
              
              <Button 
                mode="outlined" 
                icon="message"
                style={styles.actionButton}
                textColor={theme.colors.primary}
                onPress={() => {}}
              >
                Messages
              </Button>
              
              <Button 
                mode="outlined" 
                icon="payment"
                style={styles.actionButton}
                textColor={theme.colors.primary}
                onPress={() => {}}
              >
                Payments
              </Button>
              
              <Button 
                mode="outlined" 
                icon="settings"
                style={styles.actionButton}
                textColor={theme.colors.primary}
                onPress={() => {}}
              >
                Settings
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
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
  welcomeCard: {
    marginBottom: 16,
    elevation: 2,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  welcomeSubtitle: {
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
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 4,
  },
  statLabel: {
    color: 'white',
    fontSize: 12,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  divider: {
    marginVertical: 12,
  },
  classItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  classDetails: {
    marginLeft: 12,
  },
  className: {
    fontWeight: '500',
    color: theme.colors.text,
  },
  classTime: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
});

export default DashboardScreen;