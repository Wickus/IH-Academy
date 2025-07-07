import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, FAB, Portal, Modal, TextInput, Chip, Snackbar } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { apiClient } from '@/services/api';
import { Message, Organization } from '@/types';

const MessagesScreen: React.FC = () => {
  const { currentOrganization, organizations } = useAppSelector((state) => state.auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [composeModalVisible, setComposeModalVisible] = useState(false);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [composeForm, setComposeForm] = useState({
    organizationId: '',
    subject: '',
    content: '',
  });
  const [replyContent, setReplyContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadMessages = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await apiClient.getMessages();
      setMessages(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    let filtered = messages;

    switch (filter) {
      case 'sent':
        filtered = messages.filter(msg => msg.senderId === currentOrganization?.id);
        break;
      case 'received':
        filtered = messages.filter(msg => msg.recipientId === currentOrganization?.id);
        break;
      default:
        // All messages
        break;
    }

    setFilteredMessages(filtered);
  }, [messages, filter, currentOrganization?.id]);

  const handleSendMessage = async () => {
    try {
      await apiClient.sendMessage({
        organizationId: parseInt(composeForm.organizationId),
        subject: composeForm.subject,
        content: composeForm.content,
      });

      setSuccess('Message sent successfully');
      setComposeModalVisible(false);
      setComposeForm({ organizationId: '', subject: '', content: '' });
      loadMessages(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  };

  const handleReplyMessage = async () => {
    if (!selectedMessage) return;

    try {
      await apiClient.replyToMessage(selectedMessage.id, replyContent);
      setSuccess('Reply sent successfully');
      setReplyModalVisible(false);
      setReplyContent('');
      setSelectedMessage(null);
      loadMessages(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reply');
    }
  };

  const markAsRead = async (messageId: number) => {
    try {
      await apiClient.markMessageAsRead(messageId);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'read' } : msg
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to mark message as read');
    }
  };

  const getOrganizationName = (orgId: number) => {
    return organizations.find(org => org.id === orgId)?.name || 'Unknown Organization';
  };

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <Chip
        selected={filter === 'all'}
        onPress={() => setFilter('all')}
        style={styles.filterChip}
      >
        All Messages
      </Chip>
      <Chip
        selected={filter === 'received'}
        onPress={() => setFilter('received')}
        style={styles.filterChip}
      >
        Received
      </Chip>
      <Chip
        selected={filter === 'sent'}
        onPress={() => setFilter('sent')}
        style={styles.filterChip}
      >
        Sent
      </Chip>
    </View>
  );

  const renderMessageCard = ({ item }: { item: Message }) => (
    <Card 
      style={[
        styles.messageCard,
        item.status === 'unread' && styles.unreadMessage
      ]}
      onPress={() => {
        if (item.status === 'unread') markAsRead(item.id);
        setSelectedMessage(item);
        setReplyModalVisible(true);
      }}
    >
      <Card.Content>
        <View style={styles.messageHeader}>
          <View style={styles.messageInfo}>
            <Text variant="titleMedium" style={styles.messageSubject}>
              {item.subject}
            </Text>
            <Text variant="bodySmall" style={styles.messageFrom}>
              {filter === 'sent' 
                ? `To: ${getOrganizationName(item.recipientId)}`
                : `From: ${getOrganizationName(item.senderId)}`
              }
            </Text>
          </View>
          <View style={styles.messageStatus}>
            {item.status === 'unread' && (
              <Chip mode="flat" style={styles.unreadChip}>
                New
              </Chip>
            )}
            <Text variant="bodySmall" style={styles.messageDate}>
              {new Date(item.createdAt || '').toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Text variant="bodyMedium" style={styles.messagePreview} numberOfLines={2}>
          {item.content}
        </Text>

        <View style={styles.messageActions}>
          <Button
            mode="text"
            onPress={() => {
              if (item.status === 'unread') markAsRead(item.id);
              setSelectedMessage(item);
              setReplyModalVisible(true);
            }}
            compact
          >
            View Details
          </Button>
          {filter !== 'sent' && (
            <Button
              mode="text"
              onPress={() => {
                setSelectedMessage(item);
                setReplyModalVisible(true);
              }}
              compact
            >
              Reply
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderComposeModal = () => (
    <Portal>
      <Modal
        visible={composeModalVisible}
        onDismiss={() => setComposeModalVisible(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Compose Message
            </Text>

            <Text variant="bodyMedium" style={styles.fieldLabel}>
              To Organization:
            </Text>
            {/* Simple text input for organization ID - in real app would be a dropdown */}
            <TextInput
              placeholder="Organization ID"
              value={composeForm.organizationId}
              onChangeText={(text) => setComposeForm(prev => ({ ...prev, organizationId: text }))}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
            />

            <TextInput
              label="Subject"
              value={composeForm.subject}
              onChangeText={(text) => setComposeForm(prev => ({ ...prev, subject: text }))}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Message"
              value={composeForm.content}
              onChangeText={(text) => setComposeForm(prev => ({ ...prev, content: text }))}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setComposeModalVisible(false)}
                style={styles.modalCancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSendMessage}
                disabled={!composeForm.organizationId || !composeForm.subject || !composeForm.content}
                style={[styles.modalSendButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
              >
                Send Message
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );

  const renderReplyModal = () => (
    <Portal>
      <Modal
        visible={replyModalVisible}
        onDismiss={() => setReplyModalVisible(false)}
        contentContainerStyle={styles.modalContainer}
      >
        {selectedMessage && (
          <Card>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.modalTitle}>
                Message Details
              </Text>

              <View style={styles.messageDetails}>
                <Text variant="titleMedium" style={styles.detailSubject}>
                  {selectedMessage.subject}
                </Text>
                <Text variant="bodySmall" style={styles.detailFrom}>
                  From: {getOrganizationName(selectedMessage.senderId)}
                </Text>
                <Text variant="bodySmall" style={styles.detailDate}>
                  {new Date(selectedMessage.createdAt || '').toLocaleString()}
                </Text>
              </View>

              <View style={styles.messageContent}>
                <Text variant="bodyMedium">{selectedMessage.content}</Text>
              </View>

              {filter !== 'sent' && (
                <>
                  <Text variant="titleSmall" style={styles.replyTitle}>
                    Reply:
                  </Text>
                  <TextInput
                    placeholder="Type your reply..."
                    value={replyContent}
                    onChangeText={setReplyContent}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    style={styles.replyInput}
                  />
                </>
              )}

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setReplyModalVisible(false);
                    setSelectedMessage(null);
                    setReplyContent('');
                  }}
                  style={styles.modalCancelButton}
                >
                  Close
                </Button>
                {filter !== 'sent' && (
                  <Button
                    mode="contained"
                    onPress={handleReplyMessage}
                    disabled={!replyContent.trim()}
                    style={[styles.modalSendButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
                  >
                    Send Reply
                  </Button>
                )}
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
        No Messages
      </Text>
      <Text variant="bodyLarge" style={styles.emptySubtitle}>
        {filter === 'all' 
          ? 'Start a conversation with an organization'
          : filter === 'sent'
          ? 'No sent messages yet'
          : 'No received messages yet'
        }
      </Text>
      <Button 
        mode="contained" 
        onPress={() => setComposeModalVisible(true)}
        style={[styles.composeButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
      >
        Send Message
      </Button>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderFilterChips()}

      <FlatList
        data={filteredMessages}
        renderItem={renderMessageCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={filteredMessages.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadMessages(true)}
            colors={[currentOrganization?.primaryColor || '#20366B']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
        onPress={() => setComposeModalVisible(true)}
      />

      {renderComposeModal()}
      {renderReplyModal()}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{
          label: 'Retry',
          onPress: () => loadMessages(),
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
  messageCard: {
    marginBottom: 12,
    elevation: 1,
  },
  unreadMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#24D367',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messageInfo: {
    flex: 1,
    marginRight: 12,
  },
  messageSubject: {
    color: '#20366B',
    fontWeight: 'bold',
  },
  messageFrom: {
    color: '#666',
    marginTop: 2,
  },
  messageStatus: {
    alignItems: 'flex-end',
  },
  unreadChip: {
    backgroundColor: '#24D367',
    marginBottom: 4,
  },
  messageDate: {
    color: '#666',
  },
  messagePreview: {
    color: '#666',
    marginBottom: 12,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
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
  composeButton: {
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
  },
  modalTitle: {
    color: '#20366B',
    textAlign: 'center',
    marginBottom: 24,
  },
  fieldLabel: {
    marginBottom: 8,
    color: '#666',
  },
  input: {
    marginBottom: 16,
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
  modalSendButton: {
    flex: 1,
  },
  messageDetails: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  detailSubject: {
    color: '#20366B',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailFrom: {
    color: '#666',
    marginBottom: 2,
  },
  detailDate: {
    color: '#666',
  },
  messageContent: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  replyTitle: {
    color: '#20366B',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  replyInput: {
    marginBottom: 16,
  },
});

export default MessagesScreen;