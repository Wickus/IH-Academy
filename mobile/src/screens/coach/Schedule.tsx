import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, Portal, Modal, FAB, Snackbar } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { apiClient } from '@/services/api';
import { Class, Booking, Attendance } from '@/types';

const ScheduleScreen: React.FC = () => {
  const { user, currentOrganization } = useAppSelector((state) => state.auth);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'upcoming'>('all');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [attendanceData, setAttendanceData] = useState<{ [key: number]: Attendance[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSchedule = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await apiClient.getClasses(currentOrganization?.id);
      const coachClasses = response.data.filter(cls => cls.coachId === user?.id);
      
      // Sort by start time
      coachClasses.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      setClasses(coachClasses);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [currentOrganization?.id, user?.id]);

  useEffect(() => {
    let filtered = classes;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'today':
        filtered = classes.filter(cls => {
          const classDate = new Date(cls.startTime);
          return classDate >= today && classDate < tomorrow;
        });
        break;
      case 'week':
        filtered = classes.filter(cls => {
          const classDate = new Date(cls.startTime);
          return classDate >= today && classDate <= oneWeekFromNow;
        });
        break;
      case 'upcoming':
        filtered = classes.filter(cls => {
          const classDate = new Date(cls.startTime);
          return classDate >= now;
        });
        break;
      default:
        // All classes
        break;
    }

    setFilteredClasses(filtered);
  }, [classes, filter]);

  const loadClassAttendance = async (classId: number) => {
    try {
      const response = await apiClient.getClassAttendance(classId);
      setAttendanceData(prev => ({
        ...prev,
        [classId]: response.data
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance data');
    }
  };

  const handleOpenAttendance = (classItem: Class) => {
    setSelectedClass(classItem);
    if (!attendanceData[classItem.id]) {
      loadClassAttendance(classItem.id);
    }
    setAttendanceModalVisible(true);
  };

  const handleMarkAttendance = async (participantId: number, status: 'present' | 'absent' | 'late') => {
    if (!selectedClass) return;

    try {
      await apiClient.markAttendance({
        classId: selectedClass.id,
        participantId,
        status,
        markedBy: user?.id
      });

      // Reload attendance data
      loadClassAttendance(selectedClass.id);
      setSuccess('Attendance updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update attendance');
    }
  };

  const getClassStatusColor = (classItem: Class) => {
    const now = new Date();
    const classStart = new Date(classItem.startTime);
    const classEnd = new Date(classItem.endTime);

    if (now >= classStart && now <= classEnd) {
      return '#24D367'; // In progress
    } else if (now < classStart) {
      return '#278DD4'; // Upcoming
    } else {
      return '#6b7280'; // Completed
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <Chip
        selected={filter === 'all'}
        onPress={() => setFilter('all')}
        style={styles.filterChip}
      >
        All Classes
      </Chip>
      <Chip
        selected={filter === 'today'}
        onPress={() => setFilter('today')}
        style={styles.filterChip}
      >
        Today
      </Chip>
      <Chip
        selected={filter === 'week'}
        onPress={() => setFilter('week')}
        style={styles.filterChip}
      >
        This Week
      </Chip>
      <Chip
        selected={filter === 'upcoming'}
        onPress={() => setFilter('upcoming')}
        style={styles.filterChip}
      >
        Upcoming
      </Chip>
    </View>
  );

  const renderClassCard = ({ item }: { item: Class }) => {
    const { date, time } = formatDateTime(item.startTime);
    const endTime = formatDateTime(item.endTime).time;
    const status = getClassStatus(item);
    const statusColor = getClassStatusColor(item);

    return (
      <Card style={styles.classCard}>
        <Card.Content>
          <View style={styles.classHeader}>
            <View style={styles.classInfo}>
              <Text variant="titleMedium" style={styles.className}>
                {item.name}
              </Text>
              <Text variant="bodySmall" style={styles.classDate}>
                📅 {date}
              </Text>
              <Text variant="bodySmall" style={styles.classTime}>
                🕐 {time} - {endTime}
              </Text>
            </View>
            <Chip 
              mode="flat"
              style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
              textStyle={{ color: statusColor }}
            >
              {status}
            </Chip>
          </View>

          <View style={styles.classDetails}>
            <Text variant="bodySmall" style={styles.detailText}>
              👥 {item.currentCapacity || 0}/{item.maxCapacity} participants
            </Text>
            {item.location && (
              <Text variant="bodySmall" style={styles.detailText}>
                📍 {item.location}
              </Text>
            )}
            {item.description && (
              <Text variant="bodySmall" style={styles.detailText} numberOfLines={2}>
                📝 {item.description}
              </Text>
            )}
          </View>

          <View style={styles.classActions}>
            <Button
              mode="outlined"
              onPress={() => {/* Navigate to class details */}}
              style={styles.actionButton}
              compact
            >
              View Details
            </Button>
            {status === 'In Progress' || status === 'Completed' ? (
              <Button
                mode="contained"
                onPress={() => handleOpenAttendance(item)}
                style={[styles.actionButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
                compact
              >
                {status === 'In Progress' ? 'Take Attendance' : 'View Attendance'}
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={() => {/* Navigate to edit class */}}
                style={styles.actionButton}
                compact
              >
                Edit Class
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderAttendanceModal = () => (
    <Portal>
      <Modal
        visible={attendanceModalVisible}
        onDismiss={() => setAttendanceModalVisible(false)}
        contentContainerStyle={styles.modalContainer}
      >
        {selectedClass && (
          <Card>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.modalTitle}>
                Class Attendance
              </Text>
              
              <Text variant="titleMedium" style={styles.modalClassName}>
                {selectedClass.name}
              </Text>
              
              <Text variant="bodyMedium" style={styles.modalClassInfo}>
                📅 {formatDateTime(selectedClass.startTime).date}
              </Text>
              <Text variant="bodyMedium" style={styles.modalClassInfo}>
                🕐 {formatDateTime(selectedClass.startTime).time} - {formatDateTime(selectedClass.endTime).time}
              </Text>

              <View style={styles.attendanceList}>
                {attendanceData[selectedClass.id]?.length > 0 ? (
                  attendanceData[selectedClass.id].map((attendance, index) => (
                    <View key={index} style={styles.attendanceItem}>
                      <View style={styles.participantInfo}>
                        <Text variant="bodyLarge">{attendance.participantName}</Text>
                        <Text variant="bodySmall" style={styles.participantEmail}>
                          {attendance.participantEmail}
                        </Text>
                      </View>
                      
                      <View style={styles.attendanceActions}>
                        <Button
                          mode={attendance.status === 'present' ? 'contained' : 'outlined'}
                          onPress={() => handleMarkAttendance(attendance.participantId, 'present')}
                          style={styles.attendanceButton}
                          compact
                        >
                          Present
                        </Button>
                        <Button
                          mode={attendance.status === 'late' ? 'contained' : 'outlined'}
                          onPress={() => handleMarkAttendance(attendance.participantId, 'late')}
                          style={styles.attendanceButton}
                          compact
                        >
                          Late
                        </Button>
                        <Button
                          mode={attendance.status === 'absent' ? 'contained' : 'outlined'}
                          onPress={() => handleMarkAttendance(attendance.participantId, 'absent')}
                          style={styles.attendanceButton}
                          compact
                        >
                          Absent
                        </Button>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text variant="bodyMedium" style={styles.emptyAttendance}>
                    No participants registered for this class yet.
                  </Text>
                )}
              </View>

              <Button
                mode="outlined"
                onPress={() => setAttendanceModalVisible(false)}
                style={styles.modalCloseButton}
              >
                Close
              </Button>
            </Card.Content>
          </Card>
        )}
      </Modal>
    </Portal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No Classes Found
      </Text>
      <Text variant="bodyLarge" style={styles.emptySubtitle}>
        {filter === 'all' 
          ? 'You have no classes assigned yet'
          : filter === 'today'
          ? 'No classes scheduled for today'
          : filter === 'week'
          ? 'No classes scheduled for this week'
          : 'No upcoming classes scheduled'
        }
      </Text>
      {filter !== 'all' && (
        <Button 
          mode="outlined" 
          onPress={() => setFilter('all')}
          style={styles.showAllButton}
        >
          Show All Classes
        </Button>
      )}
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading your schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderFilterChips()}

      <FlatList
        data={filteredClasses}
        renderItem={renderClassCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={filteredClasses.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadSchedule(true)}
            colors={[currentOrganization?.primaryColor || '#20366B']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      <FAB
        icon="calendar-plus"
        style={[styles.fab, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
        onPress={() => {/* Navigate to create class */}}
      />

      {renderAttendanceModal()}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{
          label: 'Retry',
          onPress: () => loadSchedule(),
        }}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess(null)}
        duration={3000}
      >
        {success}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
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
  classCard: {
    marginBottom: 12,
    elevation: 2,
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
    marginBottom: 4,
  },
  classDate: {
    color: '#666',
    marginBottom: 2,
  },
  classTime: {
    color: '#666',
    marginBottom: 2,
  },
  statusChip: {
    height: 28,
  },
  classDetails: {
    marginBottom: 12,
  },
  detailText: {
    color: '#666',
    marginBottom: 2,
  },
  classActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
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
  showAllButton: {
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    margin: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#20366B',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalClassName: {
    color: '#20366B',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalClassInfo: {
    color: '#666',
    marginBottom: 4,
  },
  attendanceList: {
    marginTop: 16,
    marginBottom: 16,
    maxHeight: 300,
  },
  attendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  participantInfo: {
    flex: 1,
  },
  participantEmail: {
    color: '#666',
    marginTop: 2,
  },
  attendanceActions: {
    flexDirection: 'row',
    gap: 4,
  },
  attendanceButton: {
    minWidth: 60,
  },
  emptyAttendance: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 16,
  },
  modalCloseButton: {
    marginTop: 16,
  },
});

export default ScheduleScreen;