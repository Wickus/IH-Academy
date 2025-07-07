import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, Chip, FAB, ProgressBar } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { apiClient } from '@/services/api';

interface DashboardStats {
  totalMembers: number;
  totalCoaches: number;
  totalClasses: number;
  totalRevenue: number;
  activeBookings: number;
  pendingPayments: number;
  monthlyGrowth: number;
  membershipDistribution: {
    free: number;
    basic: number;
    premium: number;
  };
}

const AdminDashboard: React.FC = () => {
  const { user, currentOrganization } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalCoaches: 0,
    totalClasses: 0,
    totalRevenue: 0,
    activeBookings: 0,
    pendingPayments: 0,
    monthlyGrowth: 0,
    membershipDistribution: { free: 0, basic: 0, premium: 0 },
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const [statsResponse, activityResponse, classesResponse] = await Promise.all([
        apiClient.getOrganizationStats(currentOrganization?.id),
        apiClient.getRecentActivity(currentOrganization?.id),
        apiClient.getClasses(currentOrganization?.id)
      ]);

      setStats(statsResponse.data || stats);
      setRecentActivity(activityResponse.data?.slice(0, 5) || []);
      
      // Filter upcoming classes (next 24 hours)
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const upcoming = classesResponse.data?.filter((cls: any) => {
        const classDate = new Date(cls.startTime);
        return classDate >= now && classDate <= tomorrow;
      }).slice(0, 3) || [];
      
      setUpcomingClasses(upcoming);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentOrganization?.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? '#24D367' : '#ef4444';
  };

  const getTotalMemberships = () => {
    return stats.membershipDistribution.free + 
           stats.membershipDistribution.basic + 
           stats.membershipDistribution.premium;
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading dashboard...</Text>
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
      {/* Header with organization info */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <Avatar.Text 
              size={60} 
              label={currentOrganization?.name.substring(0, 2).toUpperCase() || 'ORG'}
              style={{ backgroundColor: currentOrganization?.primaryColor || '#20366B' }}
            />
            <View style={styles.headerText}>
              <Text variant="headlineSmall" style={styles.organizationName}>
                {currentOrganization?.name}
              </Text>
              <Text variant="bodyMedium" style={styles.adminText}>
                Administrator Dashboard
              </Text>
              <Text variant="bodySmall" style={styles.lastUpdated}>
                Last updated: {new Date().toLocaleString()}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.metricNumber}>{stats.totalMembers}</Text>
            <Text variant="bodySmall" style={styles.metricLabel}>Total Members</Text>
            <Text variant="bodySmall" style={[styles.metricGrowth, { color: getGrowthColor(stats.monthlyGrowth) }]}>
              {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}% this month
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.metricNumber}>{stats.totalCoaches}</Text>
            <Text variant="bodySmall" style={styles.metricLabel}>Active Coaches</Text>
            <Text variant="bodySmall" style={styles.metricSubtext}>
              Teaching {stats.totalClasses} classes
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.metricNumber}>{formatCurrency(stats.totalRevenue)}</Text>
            <Text variant="bodySmall" style={styles.metricLabel}>Monthly Revenue</Text>
            <Text variant="bodySmall" style={styles.metricSubtext}>
              {stats.pendingPayments} pending payments
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.metricNumber}>{stats.activeBookings}</Text>
            <Text variant="bodySmall" style={styles.metricLabel}>Active Bookings</Text>
            <Text variant="bodySmall" style={styles.metricSubtext}>
              Across {stats.totalClasses} classes
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Membership Distribution */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Membership Distribution
          </Text>
          
          <View style={styles.membershipStats}>
            <View style={styles.membershipItem}>
              <Text variant="bodyMedium" style={styles.membershipLabel}>Free Plan</Text>
              <View style={styles.membershipBar}>
                <ProgressBar 
                  progress={stats.membershipDistribution.free / getTotalMemberships()} 
                  color="#6b7280"
                  style={styles.progressBar}
                />
                <Text variant="bodySmall" style={styles.membershipCount}>
                  {stats.membershipDistribution.free}
                </Text>
              </View>
            </View>

            <View style={styles.membershipItem}>
              <Text variant="bodyMedium" style={styles.membershipLabel}>Basic Plan</Text>
              <View style={styles.membershipBar}>
                <ProgressBar 
                  progress={stats.membershipDistribution.basic / getTotalMemberships()} 
                  color="#278DD4"
                  style={styles.progressBar}
                />
                <Text variant="bodySmall" style={styles.membershipCount}>
                  {stats.membershipDistribution.basic}
                </Text>
              </View>
            </View>

            <View style={styles.membershipItem}>
              <Text variant="bodyMedium" style={styles.membershipLabel}>Premium Plan</Text>
              <View style={styles.membershipBar}>
                <ProgressBar 
                  progress={stats.membershipDistribution.premium / getTotalMemberships()} 
                  color="#24D367"
                  style={styles.progressBar}
                />
                <Text variant="bodySmall" style={styles.membershipCount}>
                  {stats.membershipDistribution.premium}
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Upcoming Classes */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Today's Classes
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
            upcomingClasses.map((classItem: any) => (
              <View key={classItem.id} style={styles.classItem}>
                <View style={styles.classInfo}>
                  <Text variant="titleSmall" style={styles.className}>
                    {classItem.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.classDetails}>
                    🕐 {formatTime(classItem.startTime)} | 👥 {classItem.currentCapacity}/{classItem.maxCapacity}
                  </Text>
                  {classItem.location && (
                    <Text variant="bodySmall" style={styles.classDetails}>
                      📍 {classItem.location}
                    </Text>
                  )}
                </View>
                <Chip 
                  mode="flat"
                  style={[styles.classStatus, { backgroundColor: currentOrganization?.primaryColor + '20' || '#20366B20' }]}
                  textStyle={{ color: currentOrganization?.primaryColor || '#20366B' }}
                >
                  {classItem.currentCapacity >= classItem.maxCapacity ? 'Full' : 'Open'}
                </Chip>
              </View>
            ))
          ) : (
            <Text variant="bodyMedium" style={styles.emptyState}>
              No classes scheduled for today
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Recent Activity */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Recent Activity
          </Text>

          {recentActivity.length > 0 ? (
            recentActivity.map((activity: any, index: number) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityEmoji}>
                    {activity.type === 'booking' ? '📅' : 
                     activity.type === 'payment' ? '💳' : 
                     activity.type === 'member' ? '👤' : '📊'}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <Text variant="bodyMedium" style={styles.activityText}>
                    {activity.description || 'Recent activity'}
                  </Text>
                  <Text variant="bodySmall" style={styles.activityTime}>
                    {formatDate(activity.timestamp || activity.createdAt)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text variant="bodyMedium" style={styles.emptyState}>
              No recent activity
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
              icon="account-group"
            >
              Manage Members
            </Button>
            <Button 
              mode="outlined" 
              style={styles.gridButton}
              icon="account-tie"
            >
              Manage Coaches
            </Button>
            <Button 
              mode="outlined" 
              style={styles.gridButton}
              icon="calendar-plus"
            >
              Create Class
            </Button>
            <Button 
              mode="outlined" 
              style={styles.gridButton}
              icon="chart-line"
            >
              View Reports
            </Button>
            <Button 
              mode="outlined" 
              style={styles.gridButton}
              icon="cog"
            >
              Settings
            </Button>
            <Button 
              mode="outlined" 
              style={styles.gridButton}
              icon="email"
            >
              Send Message
            </Button>
          </View>
        </Card.Content>
      </Card>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
        onPress={() => {/* Navigate to quick create menu */}}
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
    marginLeft: 16,
    flex: 1,
  },
  organizationName: {
    color: '#20366B',
    fontWeight: 'bold',
  },
  adminText: {
    color: '#666',
    marginTop: 2,
  },
  lastUpdated: {
    color: '#999',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 0.48,
    elevation: 1,
    marginBottom: 8,
  },
  metricNumber: {
    textAlign: 'center',
    color: '#20366B',
    fontWeight: 'bold',
  },
  metricLabel: {
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  metricGrowth: {
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  metricSubtext: {
    textAlign: 'center',
    color: '#999',
    marginTop: 2,
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
  membershipStats: {
    gap: 12,
  },
  membershipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membershipLabel: {
    flex: 0.3,
    color: '#333',
  },
  membershipBar: {
    flex: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  membershipCount: {
    minWidth: 30,
    textAlign: 'right',
    color: '#666',
  },
  classItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    color: '#20366B',
    fontWeight: 'bold',
  },
  classDetails: {
    color: '#666',
    marginTop: 2,
  },
  classStatus: {
    height: 28,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    color: '#333',
  },
  activityTime: {
    color: '#666',
    marginTop: 2,
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

export default AdminDashboard;