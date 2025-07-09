import React from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {Card, Title, Paragraph, Button, Chip, Divider} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '../../utils/theme';

const BookingsScreen: React.FC = () => {
  const bookings = [
    {
      id: 1,
      className: 'Swimming Lessons',
      instructor: 'Sarah Johnson',
      date: '2025-01-08',
      time: '3:00 PM',
      status: 'confirmed',
      sport: 'Swimming',
      icon: 'pool',
      location: 'Pool Area A'
    },
    {
      id: 2,
      className: 'Soccer Training',
      instructor: 'Mike Wilson',
      date: '2025-01-09',
      time: '10:00 AM',
      status: 'pending',
      sport: 'Soccer',
      icon: 'sports-soccer',
      location: 'Field 1'
    },
    {
      id: 3,
      className: 'Basketball Skills',
      instructor: 'David Chen',
      date: '2025-01-07',
      time: '5:00 PM',
      status: 'completed',
      sport: 'Basketball',
      icon: 'sports-basketball',
      location: 'Court B'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.accent;
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return theme.colors.placeholder;
      default:
        return theme.colors.placeholder;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending Payment';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {bookings.map((booking) => (
          <Card key={booking.id} style={styles.bookingCard}>
            <Card.Content>
              <View style={styles.bookingHeader}>
                <View style={styles.classInfo}>
                  <Icon name={booking.icon} size={24} color={theme.colors.primary} />
                  <View style={styles.classDetails}>
                    <Title style={styles.className}>{booking.className}</Title>
                    <Paragraph style={styles.instructorName}>
                      with {booking.instructor}
                    </Paragraph>
                  </View>
                </View>
                <Chip 
                  style={[styles.statusChip, {backgroundColor: getStatusColor(booking.status)}]}
                  textStyle={styles.statusText}
                >
                  {getStatusText(booking.status)}
                </Chip>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                  <Icon name="event" size={16} color={theme.colors.placeholder} />
                  <Paragraph style={styles.detailText}>
                    {new Date(booking.date).toLocaleDateString('en-ZA', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Paragraph>
                </View>
                
                <View style={styles.detailRow}>
                  <Icon name="schedule" size={16} color={theme.colors.placeholder} />
                  <Paragraph style={styles.detailText}>{booking.time}</Paragraph>
                </View>
                
                <View style={styles.detailRow}>
                  <Icon name="location-on" size={16} color={theme.colors.placeholder} />
                  <Paragraph style={styles.detailText}>{booking.location}</Paragraph>
                </View>
              </View>

              <View style={styles.actionSection}>
                {booking.status === 'pending' && (
                  <Button 
                    mode="contained" 
                    icon="payment"
                    style={styles.payButton}
                    buttonColor={theme.colors.accent}
                    onPress={() => {}}
                  >
                    Pay Now
                  </Button>
                )}
                
                {booking.status === 'confirmed' && (
                  <View style={styles.confirmedActions}>
                    <Button 
                      mode="outlined" 
                      icon="directions"
                      style={styles.actionButton}
                      textColor={theme.colors.primary}
                      onPress={() => {}}
                    >
                      Directions
                    </Button>
                    <Button 
                      mode="outlined" 
                      icon="cancel"
                      style={styles.actionButton}
                      textColor={theme.colors.error}
                      onPress={() => {}}
                    >
                      Cancel
                    </Button>
                  </View>
                )}

                {booking.status === 'completed' && (
                  <View style={styles.completedActions}>
                    <Button 
                      mode="outlined" 
                      icon="star"
                      style={styles.actionButton}
                      textColor={theme.colors.primary}
                      onPress={() => {}}
                    >
                      Rate Class
                    </Button>
                    <Button 
                      mode="outlined" 
                      icon="refresh"
                      style={styles.actionButton}
                      textColor={theme.colors.primary}
                      onPress={() => {}}
                    >
                      Book Again
                    </Button>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        ))}
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
  bookingCard: {
    marginBottom: 16,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  classDetails: {
    marginLeft: 12,
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  instructorName: {
    color: theme.colors.placeholder,
    fontSize: 14,
  },
  statusChip: {
    marginLeft: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 12,
  },
  bookingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: theme.colors.text,
    fontSize: 14,
  },
  actionSection: {
    marginTop: 8,
  },
  payButton: {
    alignSelf: 'flex-start',
  },
  confirmedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  completedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});

export default BookingsScreen;