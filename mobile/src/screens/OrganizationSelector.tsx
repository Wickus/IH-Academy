import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, Avatar } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCurrentOrganization } from '@/store/authSlice';
import { Organization } from '@/types';

const OrganizationSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const { organizations } = useAppSelector((state) => state.auth);

  const handleSelectOrganization = (organization: Organization) => {
    dispatch(setCurrentOrganization(organization));
  };

  const renderOrganizationCard = ({ item }: { item: Organization }) => (
    <Card style={styles.organizationCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Avatar.Text 
            size={40} 
            label={item.name.substring(0, 2).toUpperCase()}
            style={{ backgroundColor: item.primaryColor || '#20366B' }}
          />
          <View style={styles.organizationInfo}>
            <Text variant="titleMedium" style={styles.organizationName}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={styles.organizationEmail}>
              {item.email}
            </Text>
          </View>
        </View>
        
        <Button
          mode="contained"
          onPress={() => handleSelectOrganization(item)}
          style={[styles.selectButton, { backgroundColor: item.primaryColor || '#20366B' }]}
        >
          Select
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Select Organization
      </Text>
      
      <Text variant="bodyLarge" style={styles.subtitle}>
        Choose which organization you'd like to access
      </Text>

      <FlatList
        data={organizations}
        renderItem={renderOrganizationCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    textAlign: 'center',
    color: '#20366B',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  listContent: {
    paddingBottom: 24,
  },
  organizationCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  organizationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  organizationName: {
    fontWeight: 'bold',
    color: '#20366B',
  },
  organizationEmail: {
    color: '#666',
    marginTop: 2,
  },
  selectButton: {
    marginTop: 8,
  },
});

export default OrganizationSelector;