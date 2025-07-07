import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Searchbar, Avatar, Chip, Portal, Modal, TextInput, Snackbar, Menu } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { apiClient } from '@/services/api';
import { User, Membership } from '@/types';

interface MemberWithDetails extends User {
  membership?: Membership;
  totalBookings?: number;
  lastActivity?: string;
  joinedDate?: string;
}

const MembersScreen: React.FC = () => {
  const { currentOrganization } = useAppSelector((state) => state.auth);
  const [members, setMembers] = useState<MemberWithDetails[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberWithDetails | null>(null);
  const [membershipFilter, setMembershipFilter] = useState<'all' | 'free' | 'basic' | 'premium'>('all');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    membershipType: 'free',
  });

  const [newMemberForm, setNewMemberForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    membershipType: 'free',
    sendInvite: true,
  });

  const loadMembers = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await apiClient.getOrganizationMembers(currentOrganization?.id);
      setMembers(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load members');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [currentOrganization?.id]);

  useEffect(() => {
    let filtered = members;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(member =>
        member.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by membership type
    if (membershipFilter !== 'all') {
      filtered = filtered.filter(member => member.membership?.type === membershipFilter);
    }

    setFilteredMembers(filtered);
  }, [members, searchQuery, membershipFilter]);

  const handleViewDetails = (member: MemberWithDetails) => {
    setSelectedMember(member);
    setDetailsModalVisible(true);
  };

  const handleEditMember = (member: MemberWithDetails) => {
    setSelectedMember(member);
    setEditForm({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      email: member.email || '',
      phone: member.phone || '',
      membershipType: member.membership?.type || 'free',
    });
    setEditModalVisible(true);
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;

    try {
      await apiClient.updateMember(selectedMember.id, {
        ...editForm,
        organizationId: currentOrganization?.id,
      });

      setSuccess('Member updated successfully');
      setEditModalVisible(false);
      setSelectedMember(null);
      loadMembers(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update member');
    }
  };

  const handleAddMember = async () => {
    try {
      await apiClient.inviteMember({
        ...newMemberForm,
        organizationId: currentOrganization?.id,
      });

      setSuccess('Member invitation sent successfully');
      setAddMemberModalVisible(false);
      setNewMemberForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        membershipType: 'free',
        sendInvite: true,
      });
      loadMembers(true);
    } catch (err: any) {
      setError(err.message || 'Failed to invite member');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      await apiClient.removeMemberFromOrganization(memberId, currentOrganization?.id);
      setSuccess('Member removed successfully');
      loadMembers(true);
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    }
  };

  const getMembershipColor = (type: string) => {
    switch (type) {
      case 'free': return '#6b7280';
      case 'basic': return '#278DD4';
      case 'premium': return '#24D367';
      default: return '#6b7280';
    }
  };

  const getMembershipLabel = (type: string) => {
    switch (type) {
      case 'free': return 'Free';
      case 'basic': return 'Basic';
      case 'premium': return 'Premium';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <Chip
        selected={membershipFilter === 'all'}
        onPress={() => setMembershipFilter('all')}
        style={styles.filterChip}
      >
        All Members
      </Chip>
      <Chip
        selected={membershipFilter === 'free'}
        onPress={() => setMembershipFilter('free')}
        style={styles.filterChip}
      >
        Free
      </Chip>
      <Chip
        selected={membershipFilter === 'basic'}
        onPress={() => setMembershipFilter('basic')}
        style={styles.filterChip}
      >
        Basic
      </Chip>
      <Chip
        selected={membershipFilter === 'premium'}
        onPress={() => setMembershipFilter('premium')}
        style={styles.filterChip}
      >
        Premium
      </Chip>
    </View>
  );

  const renderMemberCard = ({ item }: { item: MemberWithDetails }) => (
    <Card style={styles.memberCard}>
      <Card.Content>
        <View style={styles.memberHeader}>
          <View style={styles.memberInfo}>
            <Avatar.Text 
              size={40} 
              label={(item.firstName?.[0] || item.username?.[0] || 'M').toUpperCase()}
              style={{ backgroundColor: currentOrganization?.primaryColor || '#20366B' }}
            />
            <View style={styles.memberDetails}>
              <Text variant="titleMedium" style={styles.memberName}>
                {item.firstName && item.lastName 
                  ? `${item.firstName} ${item.lastName}`
                  : item.username || 'Unknown Member'
                }
              </Text>
              <Text variant="bodySmall" style={styles.memberEmail}>
                {item.email}
              </Text>
              <View style={styles.memberStats}>
                <Text variant="bodySmall" style={styles.statText}>
                  📅 {item.totalBookings || 0} bookings
                </Text>
                {item.lastActivity && (
                  <Text variant="bodySmall" style={styles.statText}>
                    🕐 Active {formatDate(item.lastActivity)}
                  </Text>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.memberActions}>
            <Chip 
              mode="flat"
              style={[styles.membershipChip, { backgroundColor: getMembershipColor(item.membership?.type || 'free') + '20' }]}
              textStyle={{ color: getMembershipColor(item.membership?.type || 'free') }}
            >
              {getMembershipLabel(item.membership?.type || 'free')}
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
                  handleEditMember(item);
                }} 
                title="Edit Member" 
              />
              <Menu.Item 
                onPress={() => {
                  setMenuVisible(prev => ({ ...prev, [item.id]: false }));
                  handleRemoveMember(item.id);
                }} 
                title="Remove Member" 
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
        {selectedMember && (
          <Card>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.modalTitle}>
                Member Details
              </Text>

              <View style={styles.detailsSection}>
                <Avatar.Text 
                  size={60} 
                  label={(selectedMember.firstName?.[0] || selectedMember.username?.[0] || 'M').toUpperCase()}
                  style={{ backgroundColor: currentOrganization?.primaryColor || '#20366B', alignSelf: 'center' }}
                />
                
                <Text variant="titleLarge" style={styles.detailName}>
                  {selectedMember.firstName && selectedMember.lastName 
                    ? `${selectedMember.firstName} ${selectedMember.lastName}`
                    : selectedMember.username || 'Unknown Member'
                  }
                </Text>

                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={styles.detailLabel}>Email</Text>
                    <Text variant="bodyMedium">{selectedMember.email}</Text>
                  </View>
                  
                  {selectedMember.phone && (
                    <View style={styles.detailItem}>
                      <Text variant="bodySmall" style={styles.detailLabel}>Phone</Text>
                      <Text variant="bodyMedium">{selectedMember.phone}</Text>
                    </View>
                  )}

                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={styles.detailLabel}>Membership</Text>
                    <Text variant="bodyMedium">{getMembershipLabel(selectedMember.membership?.type || 'free')}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={styles.detailLabel}>Total Bookings</Text>
                    <Text variant="bodyMedium">{selectedMember.totalBookings || 0}</Text>
                  </View>

                  {selectedMember.joinedDate && (
                    <View style={styles.detailItem}>
                      <Text variant="bodySmall" style={styles.detailLabel}>Joined</Text>
                      <Text variant="bodyMedium">{formatDate(selectedMember.joinedDate)}</Text>
                    </View>
                  )}

                  {selectedMember.lastActivity && (
                    <View style={styles.detailItem}>
                      <Text variant="bodySmall" style={styles.detailLabel}>Last Active</Text>
                      <Text variant="bodyMedium">{formatDate(selectedMember.lastActivity)}</Text>
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
                    handleEditMember(selectedMember);
                  }}
                  style={[styles.modalActionButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
                >
                  Edit Member
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
              Edit Member
            </Text>

            <TextInput
              label="First Name"
              value={editForm.firstName}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, firstName: text }))}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Last Name"
              value={editForm.lastName}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, lastName: text }))}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Email"
              value={editForm.email}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              label="Phone"
              value={editForm.phone}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
            />

            <View style={styles.membershipSection}>
              <Text variant="bodyMedium" style={styles.membershipLabel}>
                Membership Type:
              </Text>
              <View style={styles.membershipOptions}>
                {['free', 'basic', 'premium'].map(type => (
                  <Chip
                    key={type}
                    selected={editForm.membershipType === type}
                    onPress={() => setEditForm(prev => ({ ...prev, membershipType: type }))}
                    style={styles.membershipOption}
                  >
                    {getMembershipLabel(type)}
                  </Chip>
                ))}
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
                onPress={handleUpdateMember}
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

  const renderAddMemberModal = () => (
    <Portal>
      <Modal
        visible={addMemberModalVisible}
        onDismiss={() => setAddMemberModalVisible(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Invite New Member
            </Text>

            <TextInput
              label="First Name"
              value={newMemberForm.firstName}
              onChangeText={(text) => setNewMemberForm(prev => ({ ...prev, firstName: text }))}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Last Name"
              value={newMemberForm.lastName}
              onChangeText={(text) => setNewMemberForm(prev => ({ ...prev, lastName: text }))}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Email Address *"
              value={newMemberForm.email}
              onChangeText={(text) => setNewMemberForm(prev => ({ ...prev, email: text }))}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              label="Phone"
              value={newMemberForm.phone}
              onChangeText={(text) => setNewMemberForm(prev => ({ ...prev, phone: text }))}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
            />

            <View style={styles.membershipSection}>
              <Text variant="bodyMedium" style={styles.membershipLabel}>
                Initial Membership Type:
              </Text>
              <View style={styles.membershipOptions}>
                {['free', 'basic', 'premium'].map(type => (
                  <Chip
                    key={type}
                    selected={newMemberForm.membershipType === type}
                    onPress={() => setNewMemberForm(prev => ({ ...prev, membershipType: type }))}
                    style={styles.membershipOption}
                  >
                    {getMembershipLabel(type)}
                  </Chip>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setAddMemberModalVisible(false)}
                style={styles.modalCancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleAddMember}
                disabled={!newMemberForm.email.trim()}
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
        No Members Found
      </Text>
      <Text variant="bodyLarge" style={styles.emptySubtitle}>
        {searchQuery || membershipFilter !== 'all' 
          ? 'Try adjusting your filters or search query'
          : 'Start by inviting your first member'
        }
      </Text>
      <Button 
        mode="contained" 
        onPress={() => setAddMemberModalVisible(true)}
        style={[styles.inviteButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
      >
        Invite Member
      </Button>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search members..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {renderFilterChips()}

      <FlatList
        data={filteredMembers}
        renderItem={renderMemberCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={filteredMembers.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadMembers(true)}
            colors={[currentOrganization?.primaryColor || '#20366B']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      <Button
        mode="contained"
        onPress={() => setAddMemberModalVisible(true)}
        style={[styles.addButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
        icon="plus"
      >
        Invite Member
      </Button>

      {renderDetailsModal()}
      {renderEditModal()}
      {renderAddMemberModal()}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{
          label: 'Retry',
          onPress: () => loadMembers(),
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
  memberCard: {
    marginBottom: 12,
    elevation: 2,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberDetails: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    color: '#20366B',
    fontWeight: 'bold',
  },
  memberEmail: {
    color: '#666',
    marginTop: 2,
  },
  memberStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statText: {
    color: '#666',
  },
  memberActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  membershipChip: {
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
    marginBottom: 16,
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
  membershipSection: {
    marginBottom: 16,
  },
  membershipLabel: {
    color: '#666',
    marginBottom: 8,
  },
  membershipOptions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  membershipOption: {
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

export default MembersScreen;