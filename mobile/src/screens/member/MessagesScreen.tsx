import React from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {Card, Title, Paragraph, Avatar, Badge} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '../../utils/theme';

const MessagesScreen: React.FC = () => {
  const messages = [
    {
      id: 1,
      organizationName: 'KurtXtreme Sports',
      organizationLogo: null,
      subject: 'Welcome to Soccer Training!',
      preview: 'Hi! Welcome to our soccer training program. Your first class is scheduled for...',
      timestamp: '2 hours ago',
      isRead: false,
      sender: 'Coach Mike Wilson'
    },
    {
      id: 2,
      organizationName: 'Hermanus Swimming Club',
      organizationLogo: null,
      subject: 'Class Schedule Update',
      preview: 'We wanted to inform you about a schedule change for tomorrow\'s swimming lesson...',
      timestamp: '1 day ago',
      isRead: true,
      sender: 'Sarah Johnson'
    },
    {
      id: 3,
      organizationName: 'PlaySmarter Hockey Academy',
      organizationLogo: null,
      subject: 'Payment Confirmation',
      preview: 'Thank you for your payment! Your membership for this month has been confirmed...',
      timestamp: '3 days ago',
      isRead: true,
      sender: 'Admin Team'
    },
    {
      id: 4,
      organizationName: 'KurtXtreme Sports',
      organizationLogo: null,
      subject: 'New Basketball Class Available',
      preview: 'We\'re excited to announce a new basketball skills class starting next week...',
      timestamp: '1 week ago',
      isRead: false,
      sender: 'David Chen'
    }
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {messages.map((message) => (
          <Card 
            key={message.id} 
            style={[
              styles.messageCard,
              !message.isRead && styles.unreadCard
            ]}
          >
            <Card.Content>
              <View style={styles.messageHeader}>
                <View style={styles.organizationInfo}>
                  <Avatar.Text 
                    size={40}
                    label={getInitials(message.organizationName)}
                    style={[
                      styles.avatar,
                      {backgroundColor: theme.colors.primary}
                    ]}
                    labelStyle={styles.avatarLabel}
                  />
                  <View style={styles.organizationDetails}>
                    <Title style={styles.organizationName}>
                      {message.organizationName}
                    </Title>
                    <Paragraph style={styles.senderName}>
                      {message.sender}
                    </Paragraph>
                  </View>
                </View>
                
                <View style={styles.messageInfo}>
                  <Paragraph style={styles.timestamp}>
                    {message.timestamp}
                  </Paragraph>
                  {!message.isRead && (
                    <Badge style={styles.unreadBadge} />
                  )}
                </View>
              </View>

              <View style={styles.messageContent}>
                <Title style={[
                  styles.subject,
                  !message.isRead && styles.unreadSubject
                ]}>
                  {message.subject}
                </Title>
                <Paragraph style={styles.preview} numberOfLines={2}>
                  {message.preview}
                </Paragraph>
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
  messageCard: {
    marginBottom: 12,
    elevation: 1,
    backgroundColor: theme.colors.surface,
  },
  unreadCard: {
    backgroundColor: '#EBF4FF',
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  organizationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  avatarLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  organizationDetails: {
    flex: 1,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  senderName: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  messageInfo: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    width: 8,
    height: 8,
  },
  messageContent: {
    paddingLeft: 52,
  },
  subject: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  unreadSubject: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  preview: {
    fontSize: 14,
    color: theme.colors.placeholder,
    lineHeight: 20,
  },
});

export default MessagesScreen;