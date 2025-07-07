import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, Chip, FAB } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { apiClient } from '@/services/api';
import { Class, Booking } from '@/types';

const CoachDashboard: React.FC = () => {
  const { user, currentOrganization } = useAppSelector((state) => state.auth);
  const [todayClasses, setTodayClasses] = useState<Class[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<Class[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    thisWeekClasses: 0,
    attendanceRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const [classesResponse, bookingsResponse, statsResponse] = await Promise.all([
        apiClient.getClasses(currentOrganization?.id),
        apiClient.getBookings({ organizationId: currentOrganization?.id }),
        apiClient.getCoachStats(user?.id)
      ]);

      const allClasses = classesResponse.data.filter(cls => cls.coachId === user?.id);
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      // Filter today's classes
      const todaysClasses = allClasses.filter(cls => {
        const classDate = new Date(cls.startTime);
        return classDate >= startOfDay && classDate < endOfDay;
      });

      // Filter upcoming classes (next 7 days, excluding today)
      const upcoming = allClasses.filter(cls => {
        const classDate = new Date(cls.startTime);
        const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return classDate >= endOfDay && classDate <= oneWeekFromNow;
      });

      setTodayClasses(todaysClasses);
      setUpcomingClasses(upcoming.slice(0, 5)); // Show only next 5
      setRecentBookings(bookingsResponse.data.slice(0, 10));
      
      if (statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentOrganization?.id, user?.id]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getClassStatusColor = (classItem: Class) => {
    const now = new Date();
    const classStart = new Date(classItem.startTime);
    const classEnd = new Date(classItem.endTime);

    if (now >= classStart && now <= classEnd) {
      return '#24D367'; // In progress - green
    } else if (now < classStart) {
      return '#278DD4'; // Upcoming - blue
    } else {
      return '#6b7280'; // Completed - gray
    }
  };

  const getClassStatus = (classItem: Class) => {
    const now = new Date();
    const classStart = new Date(classItem.startTime);
    const classEnd = new Date(classItem.endTime);

    if (now >= classStart && now <= classEnd) {
      return 'In Progress';
    } else if (now < classStart) {
      return 'Upcoming';
    } else {
      return 'Completed';
    }
  };

  const renderClassCard = (classItem: Class, showDate = false) => (
    <Card key={classItem.id} style={styles.classCard}>
      <Card.Content>
        <View style={styles.classHeader}>
          <View style={styles.classInfo}>
            <Text variant="titleMedium" style={styles.className}>
              {classItem.name}
            </Text>
            <Text variant="bodySmall" style={styles.classTime}>
              {showDate && new Date(classItem.startTime).toLocaleDateString()} {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
            </Text>
            {!showDate && (
              <Text variant="bodySmall" style={styles.classTime}>
                {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
              </Text>
            )}
          </View>
          <Chip 
            mode="flat"
            style={[styles.statusChip, { backgroundColor: getClassStatusColor(classItem) + '20' }]}
            textStyle={{ color: getClassStatusColor(classItem) }}
          >
            {getClassStatus(classItem)}
          </Chip>
        </View>

        <View style={styles.classDetails}>
          <Text variant="bodySmall" style={styles.detailText}>
            👥 {classItem.currentCapacity || 0}/{classItem.maxCapacity} participants
          </Text>
          {classItem.location && (
            <Text variant="bodySmall" style={styles.detailText}>
              📍 {classItem.location}
            </Text>
          )}
        </View>

        <Button
          mode="outlined"
          onPress={() => {/* Navigate to class details/attendance */}}
          style={styles.classAction}
          compact
        >
          {getClassStatus(classItem) === 'In Progress' ? 'Take Attendance' : 'View Details'}
        </Button>
      </Card.Content>
    </Card>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadDashboardData(true)}
          colors={[currentOrganization?.primaryColor || '#20366B']}
        />
      }
    >
      {/* Header with coach info */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <Avatar.Text 
              size={50} 
              label={(user?.firstName?.[0] || user?.username?.[0] || 'C').toUpperCase()}
              style={{ backgroundColor: currentOrganization?.primaryColor || '#20366B' }}
            />
            <View style={styles.headerText}>
              <Text variant="headlineSmall" style={styles.welcomeText}>
                Welcome back, Coach {user?.firstName || user?.username}!
              </Text>
              <Text variant="bodyMedium" style={styles.organizationText}>
                {currentOrganization?.name}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Stats Overview */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.statNumber}>{stats.totalClasses}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Total Classes</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.statNumber}>{stats.totalStudents}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Students</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.statNumber}>{stats.thisWeekClasses}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>This Week</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Today's Classes */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Today's Classes
          </Text>
          {todayClasses.length > 0 ? (
            todayClasses.map(classItem => renderClassCard(classItem))
          ) : (
            <Text variant="bodyMedium" style={styles.emptyState}>
              No classes scheduled for today. Enjoy your day off!
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Upcoming Classes */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Upcoming Classes
            </Text>
            <Button 
              mode="text" 
              onPress={() => {/* Navigate to full schedule */}}
              compact
            >
              View All
            </Button>
          </View>
          {upcomingClasses.length > 0 ? (
            upcomingClasses.map(classItem => renderClassCard(classItem, true))
          ) : (
            <Text variant="bodyMedium" style={styles.emptyState}>
              No upcoming classes scheduled for this week.
            </Text>
          )}
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
              icon="calendar"
            >
              View Schedule
            </Button>
            <Button 
              mode="outlined" 
              style={styles.gridButton}
              icon="clock"
            >
              Set Availability
            </Button>
            <Button 
              mode="outlined" 
              style={styles.gridButton}
              icon="account-group"
            >
              Take Attendance
            </Button>
            <Button 
              mode="outlined" 
              style={styles.gridButton}
              icon="chart-line"
            >
              View Reports
            </Button>
          </View>
        </Card.Content>
      </Card>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
        onPress={() => {/* Navigate to create class or quick action */}}
      />
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
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    gap: 8,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#20366B',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  classCard: {
    marginBottom: 8,
    elevation: 1,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  classInfo: {
    flex: 1,
    marginRight: 12,
  },
  className: {
    color: '#20366B',
    fontWeight: 'bold',
  },
  classTime: {
    color: '#666',
    marginTop: 2,
  },
  statusChip: {
    height: 28,
  },
  classDetails: {
    marginBottom: 8,
  },
  detailText: {
    color: '#666',
    marginBottom: 2,
  },
  classAction: {
    alignSelf: 'flex-start',
  },
  emptyState: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 16,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default CoachDashboard;