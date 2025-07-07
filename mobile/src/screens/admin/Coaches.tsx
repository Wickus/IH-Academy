import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Searchbar, Avatar, Chip, Portal, Modal, TextInput, Snackbar, Menu } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { apiClient } from '@/services/api';
import { Coach, User } from '@/types';

interface CoachWithDetails extends Coach {
  user?: User;
  totalClasses?: number;
  activeStudents?: number;
  rating?: number;
  lastActivity?: string;
}

const CoachesScreen: React.FC = () => {
  const { currentOrganization } = useAppSelector((state) => state.auth);
  const [coaches, setCoaches] = useState<CoachWithDetails[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<CoachWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoach, setSelectedCoach] = useState<CoachWithDetails | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addCoachModalVisible, setAddCoachModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    bio: '',
    specialties: '',
    hourlyRate: '',
    isActive: true,
  });

  const [newCoachForm, setNewCoachForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    bio: '',
    specialties: '',
    hourlyRate: '',
    sendInvite: true,
  });

  const loadCoaches = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await apiClient.getOrganizationCoaches(currentOrganization?.id);
      setCoaches(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load coaches');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCoaches();
  }, [currentOrganization?.id]);

  useEffect(() => {
    let filtered = coaches;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(coach =>
        coach.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.specialties?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(coach => 
        statusFilter === 'active' ? coach.isActive : !coach.isActive
      );
    }

    setFilteredCoaches(filtered);
  }, [coaches, searchQuery, statusFilter]);

  const handleViewDetails = (coach: CoachWithDetails) => {
    setSelectedCoach(coach);
    setDetailsModalVisible(true);
  };

  const handleEditCoach = (coach: CoachWithDetails) => {
    setSelectedCoach(coach);
    setEditForm({
      bio: coach.bio || '',
      specialties: coach.specialties || '',
      hourlyRate: coach.hourlyRate?.toString() || '',
      isActive: coach.isActive,
    });
    setEditModalVisible(true);
  };

  const handleUpdateCoach = async () => {
    if (!selectedCoach) return;

    try {
      await apiClient.updateCoach(selectedCoach.id, {
        ...editForm,
        hourlyRate: parseFloat(editForm.hourlyRate) || 0,
        organizationId: currentOrganization?.id,
      });

      setSuccess('Coach updated successfully');
      setEditModalVisible(false);
      setSelectedCoach(null);
      loadCoaches(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update coach');
    }
  };

  const handleInviteCoach = async () => {
    try {
      await apiClient.inviteCoach({
        ...newCoachForm,
        hourlyRate: parseFloat(newCoachForm.hourlyRate) || 0,
        organizationId: currentOrganization?.id,
      });

      setSuccess('Coach invitation sent successfully');
      setAddCoachModalVisible(false);
      setNewCoachForm({
        email: '',
        firstName: '',
        lastName: '',
        bio: '',
        specialties: '',
        hourlyRate: '',
        sendInvite: true,
      });
      loadCoaches(true);
    } catch (err: any) {
      setError(err.message || 'Failed to invite coach');
    }
  };

  const handleToggleCoachStatus = async (coachId: number, currentStatus: boolean) => {
    try {
      await apiClient.updateCoach(coachId, {
        isActive: !currentStatus,
        organizationId: currentOrganization?.id,
      });
      setSuccess(`Coach ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadCoaches(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update coach status');
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#24D367' : '#ef4444';
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <Chip
        selected={statusFilter === 'all'}
        onPress={() => setStatusFilter('all')}
        style={styles.filterChip}
      >
        All Coaches
      </Chip>
      <Chip
        selected={statusFilter === 'active'}
        onPress={() => setStatusFilter('active')}
        style={styles.filterChip}
      >
        Active
      </Chip>
      <Chip
        selected={statusFilter === 'inactive'}
        onPress={() => setStatusFilter('inactive')}
        style={styles.filterChip}
      >
        Inactive
      </Chip>
    </View>
  );

  const renderCoachCard = ({ item }: { item: CoachWithDetails }) => (
    <Card style={styles.coachCard}>
      <Card.Content>
        <View style={styles.coachHeader}>
          <View style={styles.coachInfo}>
            <Avatar.Text 
              size={40} 
              label={(item.user?.firstName?.[0] || item.user?.username?.[0] || 'C').toUpperCase()}
              style={{ backgroundColor: currentOrganization?.primaryColor || '#20366B' }}
            />
            <View style={styles.coachDetails}>
              <Text variant="titleMedium" style={styles.coachName}>
                Coach {item.user?.firstName && item.user?.lastName 
                  ? `${item.user.firstName} ${item.user.lastName}`
                  : item.user?.username || 'Unknown Coach'
                }
              </Text>
              <Text variant="bodySmall" style={styles.coachEmail}>
                {item.user?.email}
              </Text>
              <View style={styles.coachStats}>
                <Text variant="bodySmall" style={styles.statText}>
                  📚 {item.totalClasses || 0} classes
                </Text>
                <Text variant="bodySmall" style={styles.statText}>
                  👥 {item.activeStudents || 0} students
                </Text>
                {item.hourlyRate && (
                  <Text variant="bodySmall" style={styles.statText}>
                    💰 {formatCurrency(item.hourlyRate)}/hr
                  </Text>
                )}
              </View>
              {item.specialties && (
                <Text variant="bodySmall" style={styles.specialties} numberOfLines={1}>
                  🏆 {item.specialties}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.coachActions}>
            <Chip 
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.isActive) + '20' }]}
              textStyle={{ color: getStatusColor(item.isActive) }}
            >
              {getStatusLabel(item.isActive)}
            </Chip>
            
            <Menu
              visible={menuVisible[item.id] || false}
              onDismiss={() => setMenuVisible(prev => ({ ...prev, [item.id]: false }))}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(prev => ({ ...prev, [item.id]: true }))}
                  compact
                >
                  Actions
                </Button>
              }
            >
              <Menu.Item 
                onPress={() => {
                  setMenuVisible(prev => ({ ...prev, [item.id]: false }));
                  handleViewDetails(item);
                }} 
                title="View Details" 
              />
              <Menu.Item 
                onPress={() => {
                  setMenuVisible(prev => ({ ...prev, [item.id]: false }));
                  handleEditCoach(item);
                }} 
                title="Edit Coach" 
              />
              <Menu.Item 
                onPress={() => {
                  setMenuVisible(prev => ({ ...prev, [item.id]: false }));
                  handleToggleCoachStatus(item.id, item.isActive);
                }} 
                title={item.isActive ? 'Deactivate' : 'Activate'} 
              />
            </Menu>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderDetailsModal = () => (
    <Portal>
      <Modal
        visible={detailsModalVisible}
        onDismiss={() => setDetailsModalVisible(false)}
        contentContainerStyle={styles.modalContainer}
      >
        {selectedCoach && (
          <Card>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.modalTitle}>
                Coach Details
              </Text>

              <View style={styles.detailsSection}>
                <Avatar.Text 
                  size={60} 
                  label={(selectedCoach.user?.firstName?.[0] || selectedCoach.user?.username?.[0] || 'C').toUpperCase()}
                  style={{ backgroundColor: currentOrganization?.primaryColor || '#20366B', alignSelf: 'center' }}
                />
                
                <Text variant="titleLarge" style={styles.detailName}>
                  Coach {selectedCoach.user?.firstName && selectedCoach.user?.lastName 
                    ? `${selectedCoach.user.firstName} ${selectedCoach.user.lastName}`
                    : selectedCoach.user?.username || 'Unknown Coach'
                  }
                </Text>

                {selectedCoach.bio && (
                  <Text variant="bodyMedium" style={styles.detailBio}>
                    {selectedCoach.bio}
                  </Text>
                )}

                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={styles.detailLabel}>Email</Text>
                    <Text variant="bodyMedium">{selectedCoach.user?.email}</Text>
                  </View>
                  
                  {selectedCoach.user?.phone && (
                    <View style={styles.detailItem}>
                      <Text variant="bodySmall" style={styles.detailLabel}>Phone</Text>
                      <Text variant="bodyMedium">{selectedCoach.user.phone}</Text>
                    </View>
                  )}

                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={styles.detailLabel}>Status</Text>
                    <Text variant="bodyMedium">{getStatusLabel(selectedCoach.isActive)}</Text>
                  </View>

                  {selectedCoach.hourlyRate && (
                    <View style={styles.detailItem}>
                      <Text variant="bodySmall" style={styles.detailLabel}>Hourly Rate</Text>
                      <Text variant="bodyMedium">{formatCurrency(selectedCoach.hourlyRate)}</Text>
                    </View>
                  )}

                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={styles.detailLabel}>Total Classes</Text>
                    <Text variant="bodyMedium">{selectedCoach.totalClasses || 0}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={styles.detailLabel}>Active Students</Text>
                    <Text variant="bodyMedium">{selectedCoach.activeStudents || 0}</Text>
                  </View>

                  {selectedCoach.specialties && (
                    <View style={styles.detailItem}>
                      <Text variant="bodySmall" style={styles.detailLabel}>Specialties</Text>
                      <Text variant="bodyMedium">{selectedCoach.specialties}</Text>
                    </View>
                  )}

                  {selectedCoach.lastActivity && (
                    <View style={styles.detailItem}>
                      <Text variant="bodySmall" style={styles.detailLabel}>Last Active</Text>
                      <Text variant="bodyMedium">{formatDate(selectedCoach.lastActivity)}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setDetailsModalVisible(false)}
                  style={styles.modalCancelButton}
                >
                  Close
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    setDetailsModalVisible(false);
                    handleEditCoach(selectedCoach);
                  }}
                  style={[styles.modalActionButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
                >
                  Edit Coach
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </Modal>
    </Portal>
  );

  const renderEditModal = () => (
    <Portal>
      <Modal
        visible={editModalVisible}
        onDismiss={() => setEditModalVisible(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Edit Coach
            </Text>

            <TextInput
              label="Bio"
              value={editForm.bio}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, bio: text }))}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              placeholder="Coach's professional background..."
            />

            <TextInput
              label="Specialties"
              value={editForm.specialties}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, specialties: text }))}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Strength training, Youth coaching"
            />

            <TextInput
              label="Hourly Rate (R)"
              value={editForm.hourlyRate}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, hourlyRate: text }))}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              placeholder="150"
            />

            <View style={styles.statusSection}>
              <Text variant="bodyMedium" style={styles.statusLabel}>
                Coach Status:
              </Text>
              <View style={styles.statusOptions}>
                <Chip
                  selected={editForm.isActive}
                  onPress={() => setEditForm(prev => ({ ...prev, isActive: true }))}
                  style={styles.statusOption}
                >
                  Active
                </Chip>
                <Chip
                  selected={!editForm.isActive}
                  onPress={() => setEditForm(prev => ({ ...prev, isActive: false }))}
                  style={styles.statusOption}
                >
                  Inactive
                </Chip>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleUpdateCoach}
                style={[styles.modalActionButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
              >
                Save Changes
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );

  const renderAddCoachModal = () => (
    <Portal>
      <Modal
        visible={addCoachModalVisible}
        onDismiss={() => setAddCoachModalVisible(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Invite New Coach
            </Text>

            <TextInput
              label="Email Address *"
              value={newCoachForm.email}
              onChangeText={(text) => setNewCoachForm(prev => ({ ...prev, email: text }))}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.nameRow}>
              <TextInput
                label="First Name"
                value={newCoachForm.firstName}
                onChangeText={(text) => setNewCoachForm(prev => ({ ...prev, firstName: text }))}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Last Name"
                value={newCoachForm.lastName}
                onChangeText={(text) => setNewCoachForm(prev => ({ ...prev, lastName: text }))}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
            </View>

            <TextInput
              label="Bio"
              value={newCoachForm.bio}
              onChangeText={(text) => setNewCoachForm(prev => ({ ...prev, bio: text }))}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
              placeholder="Coach's professional background..."
            />

            <TextInput
              label="Specialties"
              value={newCoachForm.specialties}
              onChangeText={(text) => setNewCoachForm(prev => ({ ...prev, specialties: text }))}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Strength training, Youth coaching"
            />

            <TextInput
              label="Hourly Rate (R)"
              value={newCoachForm.hourlyRate}
              onChangeText={(text) => setNewCoachForm(prev => ({ ...prev, hourlyRate: text }))}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              placeholder="150"
            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setAddCoachModalVisible(false)}
                style={styles.modalCancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleInviteCoach}
                disabled={!newCoachForm.email.trim()}
                style={[styles.modalActionButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
              >
                Send Invitation
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No Coaches Found
      </Text>
      <Text variant="bodyLarge" style={styles.emptySubtitle}>
        {searchQuery || statusFilter !== 'all' 
          ? 'Try adjusting your filters or search query'
          : 'Start by inviting your first coach'
        }
      </Text>
      <Button 
        mode="contained" 
        onPress={() => setAddCoachModalVisible(true)}
        style={[styles.inviteButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
      >
        Invite Coach
      </Button>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading coaches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search coaches..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {renderFilterChips()}

      <FlatList
        data={filteredCoaches}
        renderItem={renderCoachCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={filteredCoaches.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadCoaches(true)}
            colors={[currentOrganization?.primaryColor || '#20366B']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      <Button
        mode="contained"
        onPress={() => setAddCoachModalVisible(true)}
        style={[styles.addButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
        icon="plus"
      >
        Invite Coach
      </Button>

      {renderDetailsModal()}
      {renderEditModal()}
      {renderAddCoachModal()}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{
          label: 'Retry',
          onPress: () => loadCoaches(),
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
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
  coachCard: {
    marginBottom: 12,
    elevation: 2,
  },
  coachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coachInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  coachDetails: {
    marginLeft: 12,
    flex: 1,
  },
  coachName: {
    color: '#20366B',
    fontWeight: 'bold',
  },
  coachEmail: {
    color: '#666',
    marginTop: 2,
  },
  coachStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statText: {
    color: '#666',
    fontSize: 12,
  },
  specialties: {
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  coachActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusChip: {
    height: 28,
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
  inviteButton: {
    paddingHorizontal: 24,
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    marginHorizontal: 16,
  },
  modalContainer: {
    margin: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    color: '#20366B',
    textAlign: 'center',
    marginBottom: 24,
  },
  detailsSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailName: {
    color: '#20366B',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  detailBio: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailGrid: {
    width: '100%',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    color: '#666',
    fontWeight: '500',
  },
  input: {
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  statusSection: {
    marginBottom: 16,
  },
  statusLabel: {
    color: '#666',
    marginBottom: 8,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalActionButton: {
    flex: 1,
  },
});

export default CoachesScreen;