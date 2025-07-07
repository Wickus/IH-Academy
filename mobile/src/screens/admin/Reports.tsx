import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, SegmentedButtons } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { apiClient } from '@/services/api';

interface ReportData {
  revenue: {
    total: number;
    monthly: number;
    weekly: number;
    daily: number;
    growth: number;
  };
  members: {
    total: number;
    new: number;
    active: number;
    churn: number;
  };
  classes: {
    total: number;
    completed: number;
    cancelled: number;
    attendance: number;
  };
  coaches: {
    total: number;
    active: number;
    avgRating: number;
    topPerformer: string;
  };
  trends: {
    popularTimes: string[];
    popularSports: string[];
    peakDays: string[];
  };
}

const ReportsScreen: React.FC = () => {
  const { currentOrganization } = useAppSelector((state) => state.auth);
  const [reportData, setReportData] = useState<ReportData>({
    revenue: { total: 0, monthly: 0, weekly: 0, daily: 0, growth: 0 },
    members: { total: 0, new: 0, active: 0, churn: 0 },
    classes: { total: 0, completed: 0, cancelled: 0, attendance: 0 },
    coaches: { total: 0, active: 0, avgRating: 0, topPerformer: '' },
    trends: { popularTimes: [], popularSports: [], peakDays: [] },
  });
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadReportData = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await apiClient.getOrganizationReports(currentOrganization?.id, selectedPeriod);
      setReportData(response.data || reportData);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [currentOrganization?.id, selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? '#24D367' : '#ef4444';
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading reports...</Text>
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
          onRefresh={() => loadReportData(true)}
          colors={[currentOrganization?.primaryColor || '#20366B']}
        />
      }
    >
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Analytics & Reports
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            {currentOrganization?.name} - Performance Overview
          </Text>
        </Card.Content>
      </Card>

      {/* Period Selector */}
      <Card style={styles.periodCard}>
        <Card.Content>
          <SegmentedButtons
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            buttons={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
            style={styles.segmentedButtons}
          />
        </Card.Content>
      </Card>

      {/* Revenue Metrics */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Revenue Analytics
          </Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={styles.metricValue}>
                {formatCurrency(reportData.revenue.total)}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Total Revenue
              </Text>
              <Text variant="bodySmall" style={[styles.metricGrowth, { color: getGrowthColor(reportData.revenue.growth) }]}>
                {formatPercentage(reportData.revenue.growth)} vs last period
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={styles.metricValue}>
                {formatCurrency(reportData.revenue.monthly)}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                This Month
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={styles.metricValue}>
                {formatCurrency(reportData.revenue.weekly)}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                This Week
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={styles.metricValue}>
                {formatCurrency(reportData.revenue.daily)}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Today
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Member Metrics */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Member Analytics
          </Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={styles.metricValue}>
                {reportData.members.total}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Total Members
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={[styles.metricValue, { color: '#24D367' }]}>
                {reportData.members.new}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                New Members
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={[styles.metricValue, { color: '#278DD4' }]}>
                {reportData.members.active}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Active Members
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={[styles.metricValue, { color: '#ef4444' }]}>
                {reportData.members.churn}%
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Churn Rate
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Class Metrics */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Class Performance
          </Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={styles.metricValue}>
                {reportData.classes.total}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Total Classes
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={[styles.metricValue, { color: '#24D367' }]}>
                {reportData.classes.completed}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Completed
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={[styles.metricValue, { color: '#ef4444' }]}>
                {reportData.classes.cancelled}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Cancelled
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={[styles.metricValue, { color: '#278DD4' }]}>
                {reportData.classes.attendance}%
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Attendance Rate
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Coach Metrics */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Coach Performance
          </Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={styles.metricValue}>
                {reportData.coaches.total}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Total Coaches
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={[styles.metricValue, { color: '#24D367' }]}>
                {reportData.coaches.active}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Active Coaches
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text variant="titleLarge" style={[styles.metricValue, { color: '#278DD4' }]}>
                {reportData.coaches.avgRating.toFixed(1)}⭐
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Avg Rating
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text variant="bodyMedium" style={[styles.metricValue, { fontSize: 16 }]}>
                {reportData.coaches.topPerformer || 'N/A'}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Top Performer
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Trends & Insights */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Trends & Insights
          </Text>
          
          <View style={styles.trendsSection}>
            <View style={styles.trendItem}>
              <Text variant="titleSmall" style={styles.trendTitle}>
                Popular Times
              </Text>
              <View style={styles.trendChips}>
                {reportData.trends.popularTimes.map((time, index) => (
                  <Chip key={index} mode="outlined" style={styles.trendChip}>
                    {time}
                  </Chip>
                ))}
                {reportData.trends.popularTimes.length === 0 && (
                  <Text variant="bodySmall" style={styles.noData}>No data available</Text>
                )}
              </View>
            </View>

            <View style={styles.trendItem}>
              <Text variant="titleSmall" style={styles.trendTitle}>
                Popular Sports
              </Text>
              <View style={styles.trendChips}>
                {reportData.trends.popularSports.map((sport, index) => (
                  <Chip key={index} mode="outlined" style={styles.trendChip}>
                    {sport}
                  </Chip>
                ))}
                {reportData.trends.popularSports.length === 0 && (
                  <Text variant="bodySmall" style={styles.noData}>No data available</Text>
                )}
              </View>
            </View>

            <View style={styles.trendItem}>
              <Text variant="titleSmall" style={styles.trendTitle}>
                Peak Days
              </Text>
              <View style={styles.trendChips}>
                {reportData.trends.peakDays.map((day, index) => (
                  <Chip key={index} mode="outlined" style={styles.trendChip}>
                    {day}
                  </Chip>
                ))}
                {reportData.trends.peakDays.length === 0 && (
                  <Text variant="bodySmall" style={styles.noData}>No data available</Text>
                )}
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Export & Actions
          </Text>
          
          <View style={styles.actionsGrid}>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="download"
            >
              Export PDF
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="microsoft-excel"
            >
              Export Excel
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="email"
            >
              Email Report
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="calendar"
            >
              Schedule Report
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  headerTitle: {
    color: '#20366B',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#666',
    marginTop: 4,
  },
  periodCard: {
    marginBottom: 16,
    elevation: 1,
  },
  segmentedButtons: {
    marginHorizontal: -4,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 1,
  },
  sectionTitle: {
    color: '#20366B',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flex: 0.48,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  metricValue: {
    color: '#20366B',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metricLabel: {
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  metricGrowth: {
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  trendsSection: {
    gap: 16,
  },
  trendItem: {
    marginBottom: 8,
  },
  trendTitle: {
    color: '#20366B',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  trendChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendChip: {
    marginBottom: 4,
  },
  noData: {
    color: '#999',
    fontStyle: 'italic',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 0.48,
    marginBottom: 8,
  },
});

export default ReportsScreen;