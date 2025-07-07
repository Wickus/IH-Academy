import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, Searchbar, Portal, Modal, Snackbar } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { apiClient } from '@/services/api';
import { Class, Sport, Booking } from '@/types';

const ClassesScreen: React.FC = () => {
  const { currentOrganization } = useAppSelector((state) => state.auth);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const [classesResponse, sportsResponse] = await Promise.all([
        apiClient.getClasses(currentOrganization?.id),
        apiClient.getSports()
      ]);

      setClasses(classesResponse.data);
      setSports(sportsResponse.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load classes');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOrganization?.id]);

  useEffect(() => {
    let filtered = classes;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(cls =>
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by sport
    if (selectedSport) {
      filtered = filtered.filter(cls => cls.sportId.toString() === selectedSport);
    }

    // Only show future classes
    filtered = filtered.filter(cls => 
      cls.startTime && new Date(cls.startTime) > new Date()
    );

    setFilteredClasses(filtered);
  }, [classes, searchQuery, selectedSport]);

  const getSportName = (sportId: number) => {
    return sports.find(s => s.id === sportId)?.name || 'Unknown Sport';
  };

  const getSportColor = (sportId: number) => {
    return sports.find(s => s.id === sportId)?.color || '#6b7280';
  };

  const handleBookClass = async (classItem: Class) => {
    try {
      setBookingLoading(true);
      
      const bookingData = {
        classId: classItem.id,
        participantName: '', // Will be filled by user profile
        participantEmail: '', // Will be filled by user profile
      };

      await apiClient.createBooking(bookingData);
      setSuccess('Class booked successfully!');
      setSelectedClass(null);
      
      // Refresh classes to update availability
      loadData(true);
    } catch (err: any) {
      setError(err.message || 'Failed to book class');
    } finally {
      setBookingLoading(false);
    }
  };

  const renderSportFilter = () => (
    <View style={styles.sportFilters}>
      <Chip
        selected={!selectedSport}
        onPress={() => setSelectedSport(null)}
        style={styles.sportChip}
      >
        All Sports
      </Chip>
      {sports.map(sport => (
        <Chip
          key={sport.id}
          selected={selectedSport === sport.id.toString()}
          onPress={() => setSelectedSport(
            selectedSport === sport.id.toString() ? null : sport.id.toString()
          )}
          style={[
            styles.sportChip,
            { backgroundColor: selectedSport === sport.id.toString() ? sport.color + '20' : undefined }
          ]}
          textStyle={{
            color: selectedSport === sport.id.toString() ? sport.color : undefined
          }}
        >
          {sport.name}
        </Chip>
      ))}
    </View>
  );

  const renderClassCard = ({ item }: { item: Class }) => (
    <Card style={styles.classCard} onPress={() => setSelectedClass(item)}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.classInfo}>
            <Text variant="titleMedium" style={styles.className}>
              {item.name}
            </Text>
            <Chip 
              mode="flat"
              style={[styles.sportChip, { backgroundColor: getSportColor(item.sportId) + '20' }]}
              textStyle={{ color: getSportColor(item.sportId) }}
            >
              {getSportName(item.sportId)}
            </Chip>
          </View>
          <Text variant="bodySmall" style={styles.price}>
            R{item.price || '0'}
          </Text>
        </View>

        {item.description && (
          <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.classDetails}>
          <Text variant="bodySmall" style={styles.detailText}>
            📅 {item.startTime && new Date(item.startTime).toLocaleDateString()}
          </Text>
          <Text variant="bodySmall" style={styles.detailText}>
            🕐 {item.startTime && new Date(item.startTime).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })} - {item.endTime && new Date(item.endTime).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          <Text variant="bodySmall" style={styles.detailText}>
            👥 {item.currentCapacity || 0}/{item.maxCapacity || 'Unlimited'} participants
          </Text>
          {item.location && (
            <Text variant="bodySmall" style={styles.detailText}>
              📍 {item.location}
            </Text>
          )}
        </View>

        <Button
          mode="contained"
          onPress={() => setSelectedClass(item)}
          style={[styles.bookButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
          disabled={item.currentCapacity >= item.maxCapacity}
        >
          {item.currentCapacity >= item.maxCapacity ? 'Class Full' : 'Book Class'}
        </Button>
      </Card.Content>
    </Card>
  );

  const renderBookingModal = () => (
    <Portal>
      <Modal
        visible={!!selectedClass}
        onDismiss={() => setSelectedClass(null)}
        contentContainerStyle={styles.modalContainer}
      >
        {selectedClass && (
          <Card>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.modalTitle}>
                Book Class
              </Text>
              
              <Text variant="titleMedium" style={styles.modalClassName}>
                {selectedClass.name}
              </Text>
              
              <Chip 
                mode="flat"
                style={[styles.modalSportChip, { backgroundColor: getSportColor(selectedClass.sportId) + '20' }]}
                textStyle={{ color: getSportColor(selectedClass.sportId) }}
              >
                {getSportName(selectedClass.sportId)}
              </Chip>

              {selectedClass.description && (
                <Text variant="bodyMedium" style={styles.modalDescription}>
                  {selectedClass.description}
                </Text>
              )}

              <View style={styles.modalDetails}>
                <Text variant="bodyMedium" style={styles.modalDetailText}>
                  📅 {selectedClass.startTime && new Date(selectedClass.startTime).toLocaleDateString()}
                </Text>
                <Text variant="bodyMedium" style={styles.modalDetailText}>
                  🕐 {selectedClass.startTime && new Date(selectedClass.startTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })} - {selectedClass.endTime && new Date(selectedClass.endTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
                <Text variant="bodyMedium" style={styles.modalDetailText}>
                  💰 R{selectedClass.price || '0'}
                </Text>
                {selectedClass.location && (
                  <Text variant="bodyMedium" style={styles.modalDetailText}>
                    📍 {selectedClass.location}
                  </Text>
                )}
              </View>

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setSelectedClass(null)}
                  style={styles.modalCancelButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleBookClass(selectedClass)}
                  loading={bookingLoading}
                  disabled={bookingLoading}
                  style={[styles.modalBookButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
                >
                  Confirm Booking
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </Modal>
    </Portal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No Classes Available
      </Text>
      <Text variant="bodyLarge" style={styles.emptySubtitle}>
        {searchQuery || selectedSport ? 'Try adjusting your filters' : 'Check back later for new classes'}
      </Text>
      {(searchQuery || selectedSport) && (
        <Button 
          mode="outlined" 
          onPress={() => {
            setSearchQuery('');
            setSelectedSport(null);
          }}
          style={styles.clearFiltersButton}
        >
          Clear Filters
        </Button>
      )}
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading classes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search classes..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {renderSportFilter()}

      <FlatList
        data={filteredClasses}
        renderItem={renderClassCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={filteredClasses.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            colors={[currentOrganization?.primaryColor || '#20366B']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {renderBookingModal()}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{
          label: 'Retry',
          onPress: () => loadData(),
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
  },
  sportFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    marginRight: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
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
    marginBottom: 4,
  },
  price: {
    color: '#24D367',
    fontWeight: 'bold',
    fontSize: 16,
  },
  description: {
    color: '#666',
    marginBottom: 12,
  },
  classDetails: {
    marginBottom: 12,
  },
  detailText: {
    color: '#666',
    marginBottom: 2,
  },
  bookButton: {
    marginTop: 8,
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
  clearFiltersButton: {
    paddingHorizontal: 24,
  },
  modalContainer: {
    margin: 20,
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
  modalSportChip: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  modalDescription: {
    color: '#666',
    marginBottom: 16,
  },
  modalDetails: {
    marginBottom: 24,
  },
  modalDetailText: {
    color: '#666',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalBookButton: {
    flex: 1,
  },
});

export default ClassesScreen;