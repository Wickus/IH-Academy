import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

interface Booking {
  id: string;
  className: string;
  sport: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  price: string;
}

const BookingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Sample data - in production, this would come from API
  const bookings: Booking[] = [
    {
      id: '1',
      className: 'Morning Soccer Training',
      sport: 'Soccer',
      instructor: 'Coach Mike',
      date: '2025-07-15',
      time: '08:00',
      duration: '90 min',
      location: 'Field A',
      status: 'confirmed',
      price: 'R120',
    },
    {
      id: '2',
      className: 'Basketball Fundamentals',
      sport: 'Basketball',
      instructor: 'Coach Sarah',
      date: '2025-07-16',
      time: '10:00',
      duration: '60 min',
      location: 'Court 1',
      status: 'pending',
      price: 'R100',
    },
    {
      id: '3',
      className: 'Tennis Beginner',
      sport: 'Tennis',
      instructor: 'Coach Alex',
      date: '2025-07-10',
      time: '14:00',
      duration: '45 min',
      location: 'Court 2',
      status: 'confirmed',
      price: 'R80',
    },
    {
      id: '4',
      className: 'Swimming Lessons',
      sport: 'Swimming',
      instructor: 'Coach Emma',
      date: '2025-07-08',
      time: '16:00',
      duration: '60 min',
      location: 'Pool',
      status: 'cancelled',
      price: 'R90',
    },
  ];

  const upcomingBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    return bookingDate >= today;
  });

  const pastBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    return bookingDate < today;
  });

  const currentBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel "${booking.className}"?`,
      [
        {text: 'No', style: 'cancel'},
        {text: 'Yes, Cancel', onPress: () => cancelBooking(booking)},
      ]
    );
  };

  const cancelBooking = (booking: Booking) => {
    // TODO: Implement actual cancellation logic
    Alert.alert('Cancelled', `Your booking for "${booking.className}" has been cancelled.`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#24D367';
      case 'pending':
        return '#F57C00';
      case 'cancelled':
        return '#D32F2F';
      default:
        return '#666666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending Payment';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const renderBookingItem = ({item}: {item: Booking}) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingClassName}>{item.className}</Text>
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status)}]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.bookingInfo}>
        <Text style={styles.bookingDetail}>🏃‍♂️ {item.sport}</Text>
        <Text style={styles.bookingDetail}>👨‍🏫 {item.instructor}</Text>
        <Text style={styles.bookingDetail}>📅 {item.date}</Text>
        <Text style={styles.bookingDetail}>⏰ {item.time} ({item.duration})</Text>
        <Text style={styles.bookingDetail}>📍 {item.location}</Text>
        <Text style={styles.bookingDetail}>💰 {item.price}</Text>
      </View>

      {activeTab === 'upcoming' && item.status !== 'cancelled' && (
        <View style={styles.bookingActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(item)}>
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'upcoming' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('upcoming')}>
          <Text style={[
            styles.tabButtonText,
            activeTab === 'upcoming' && styles.tabButtonTextActive,
          ]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'past' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('past')}>
          <Text style={[
            styles.tabButtonText,
            activeTab === 'past' && styles.tabButtonTextActive,
          ]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      {currentBookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {activeTab === 'upcoming' 
              ? 'No upcoming bookings' 
              : 'No past bookings'}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {activeTab === 'upcoming' 
              ? 'Book a class to get started!' 
              : 'Your completed bookings will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentBookings}
          renderItem={renderBookingItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#20366B',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#20366B',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingClassName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bookingInfo: {
    marginBottom: 16,
  },
  bookingDetail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default BookingsScreen;