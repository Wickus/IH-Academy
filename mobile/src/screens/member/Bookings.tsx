import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, FAB, Snackbar } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { apiClient } from '@/services/api';
import { Booking, Class } from '@/types';

const BookingsScreen: React.FC = () => {
  const { currentOrganization } = useAppSelector((state) => state.auth);
  const [bookings, setBookings] = useState<(Booking & { class?: Class })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await apiClient.getBookings({
        organizationId: currentOrganization?.id
      });
      
      // Fetch class details for each booking
      const bookingsWithClasses = await Promise.all(
        response.data.map(async (booking: Booking) => {
          try {
            const classResponse = await apiClient.getClass(booking.classId);
            return { ...booking, class: classResponse.data };
          } catch {
            return booking;
          }
        })
      );

      setBookings(bookingsWithClasses);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [currentOrganization?.id]);

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await apiClient.cancelBooking(bookingId);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return '#24D367';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    return status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';
  };

  const renderBookingCard = ({ item }: { item: Booking & { class?: Class } }) => (
    <Card style={styles.bookingCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.classInfo}>
            <Text variant="titleMedium" style={styles.className}>
              {item.class?.name || 'Class Details Unavailable'}
            </Text>
            <Text variant="bodySmall" style={styles.classTime}>
              {item.class?.startTime && new Date(item.class.startTime).toLocaleDateString()} at{' '}
              {item.class?.startTime && new Date(item.class.startTime).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
          <Chip 
            mode="flat"
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {getStatusText(item.status)}
          </Chip>
        </View>

        {item.class?.description && (
          <Text variant="bodyMedium" style={styles.description}>
            {item.class.description}
          </Text>
        )}

        <View style={styles.bookingDetails}>
          <Text variant="bodySmall" style={styles.detailText}>
            Booked: {new Date(item.createdAt || '').toLocaleDateString()}
          </Text>
          {item.participantName && (
            <Text variant="bodySmall" style={styles.detailText}>
              Participant: {item.participantName}
            </Text>
          )}
        </View>

        {item.status?.toLowerCase() === 'confirmed' && (
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => handleCancelBooking(item.id)}
              style={styles.cancelButton}
              textColor="#ef4444"
            >
              Cancel Booking
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No Bookings Yet
      </Text>
      <Text variant="bodyLarge" style={styles.emptySubtitle}>
        Start by browsing and booking your first class
      </Text>
      <Button 
        mode="contained" 
        style={[styles.browseButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
      >
        Browse Classes
      </Button>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={bookings.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadBookings(true)}
            colors={[currentOrganization?.primaryColor || '#20366B']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
        onPress={() => {/* Navigate to class browser */}}
      />

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{
          label: 'Retry',
          onPress: () => loadBookings(),
        }}
      >
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  bookingCard: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
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
  description: {
    color: '#666',
    marginBottom: 12,
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailText: {
    color: '#666',
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    borderColor: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: '#20366B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default BookingsScreen;