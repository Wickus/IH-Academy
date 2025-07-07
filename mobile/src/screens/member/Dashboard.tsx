import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar } from 'react-native-paper';
import { useAppSelector } from '@/store';

const MemberDashboard: React.FC = () => {
  const { user, currentOrganization } = useAppSelector((state) => state.auth);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with organization branding */}
      {currentOrganization && (
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerContent}>
              <Avatar.Text 
                size={50} 
                label={currentOrganization.name.substring(0, 2).toUpperCase()}
                style={{ backgroundColor: currentOrganization.primaryColor || '#20366B' }}
              />
              <View style={styles.headerText}>
                <Text variant="headlineSmall" style={styles.welcomeText}>
                  Welcome back, {user?.firstName || user?.username}!
                </Text>
                <Text variant="bodyMedium" style={styles.organizationText}>
                  {currentOrganization.name}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.statNumber}>8</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Classes Booked</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.statNumber}>3</Text>
            <Text variant="bodySmall" style={styles.statLabel}>This Week</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Upcoming Classes */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Upcoming Classes
          </Text>
          <Text variant="bodyMedium" style={styles.emptyState}>
            No upcoming classes. Book a class to get started!
          </Text>
          <Button 
            mode="contained" 
            style={[styles.actionButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
          >
            Browse Classes
          </Button>
        </Card.Content>
      </Card>

      {/* Recent Activity */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Recent Activity
          </Text>
          <Text variant="bodyMedium" style={styles.emptyState}>
            Your recent bookings and activities will appear here.
          </Text>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.actionGrid}>
            <Button 
              mode="outlined" 
              style={styles.gridButton}
              icon="fitness-center"
            >
              Browse Classes
            </Button>
            <Button 
              mode="outlined" 
              style={styles.gridButton}
              icon="event-note"
            >
              My Bookings
            </Button>
            <Button 
              mode="outlined" 
              style={styles.gridButton}
              icon="message"
            >
              Messages
            </Button>
            <Button 
              mode="outlined" 
              style={styles.gridButton}
              icon="person"
            >
              Profile
            </Button>
          </View>
        </Card.Content>
      </Card>
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
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  welcomeText: {
    color: '#20366B',
    fontWeight: 'bold',
  },
  organizationText: {
    color: '#666',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    elevation: 1,
  },
  statNumber: {
    textAlign: 'center',
    color: '#20366B',
    fontWeight: 'bold',
  },
  statLabel: {
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 1,
  },
  sectionTitle: {
    color: '#20366B',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyState: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButton: {
    marginTop: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridButton: {
    flex: 0.48,
    marginBottom: 8,
  },
});

export default MemberDashboard;