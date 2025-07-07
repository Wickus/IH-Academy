import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, ProgressBar, List, Chip, Snackbar, FAB } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { offlineService } from '@/services/offline';
import NetInfo from '@react-native-netinfo/netinfo';

interface SyncStats {
  pendingActions: number;
  cacheItems: number;
  cacheSize: string;
  lastSync: string | null;
  connectionStatus: boolean;
}

const OfflineSync: React.FC = () => {
  const { currentOrganization } = useAppSelector((state) => state.auth);
  const [syncStats, setSyncStats] = useState<SyncStats>({
    pendingActions: 0,
    cacheItems: 0,
    cacheSize: '0 B',
    lastSync: null,
    connectionStatus: false,
  });
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSyncStatus();
    
    // Listen for network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setSyncStats(prev => ({
        ...prev,
        connectionStatus: state.isConnected || false,
      }));
    });

    return unsubscribe;
  }, []);

  const loadSyncStatus = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      
      // Get network status
      const netState = await NetInfo.fetch();
      const isOnline = netState.isConnected || false;
      
      // Get pending actions
      const actions = offlineService.getPendingActions();
      setPendingActions(actions);
      
      // Get cache stats
      const cacheStats = await offlineService.getCacheStats();
      
      setSyncStats({
        pendingActions: actions.length,
        cacheItems: cacheStats.totalItems,
        cacheSize: cacheStats.totalSize,
        lastSync: cacheStats.newestItem,
        connectionStatus: isOnline,
      });
      
    } catch (error) {
      console.error('Failed to load sync status:', error);
      setError('Failed to load sync status');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleForceSync = async () => {
    try {
      if (!syncStats.connectionStatus) {
        setError('Cannot sync while offline');
        return;
      }
      
      setIsSyncing(true);
      await offlineService.forceSyncNow();
      await loadSyncStatus();
      setSuccess('Sync completed successfully');
    } catch (error: any) {
      setError(error.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await offlineService.clearCache();
      await loadSyncStatus();
      setSuccess('Cache cleared successfully');
    } catch (error) {
      setError('Failed to clear cache');
    }
  };

  const handleClearSyncQueue = async () => {
    try {
      await offlineService.clearSyncQueue();
      await loadSyncStatus();
      setSuccess('Sync queue cleared');
    } catch (error) {
      setError('Failed to clear sync queue');
    }
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'CREATE': return '📝';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      default: return '📋';
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'CREATE': return '#24D367';
      case 'UPDATE': return '#278DD4';
      case 'DELETE': return '#ef4444';
      default: return '#666';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getConnectionStatusColor = () => {
    return syncStats.connectionStatus ? '#24D367' : '#ef4444';
  };

  const getConnectionStatusText = () => {
    return syncStats.connectionStatus ? 'Online' : 'Offline';
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadSyncStatus(true)}
            colors={[currentOrganization?.primaryColor || '#20366B']}
          />
        }
      >
        {/* Connection Status */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.statusHeader}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Connection Status
              </Text>
              <Chip 
                mode="flat"
                style={[styles.statusChip, { backgroundColor: getConnectionStatusColor() + '20' }]}
                textStyle={{ color: getConnectionStatusColor() }}
              >
                {getConnectionStatusText()}
              </Chip>
            </View>
            
            <Text variant="bodyMedium" style={styles.statusDescription}>
              {syncStats.connectionStatus 
                ? 'Connected to internet. All features available.'
                : 'Offline mode. Some features may be limited.'
              }
            </Text>
          </Card.Content>
        </Card>

        {/* Sync Overview */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Sync Overview
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={styles.statValue}>
                  {syncStats.pendingActions}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Pending Actions
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={styles.statValue}>
                  {syncStats.cacheItems}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Cached Items
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={styles.statValue}>
                  {syncStats.cacheSize}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Cache Size
                </Text>
              </View>
            </View>

            {syncStats.lastSync && (
              <Text variant="bodySmall" style={styles.lastSync}>
                Last sync: {syncStats.lastSync}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Pending Actions */}
        {syncStats.pendingActions > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Pending Actions ({syncStats.pendingActions})
                </Text>
                <Button 
                  mode="text" 
                  onPress={handleClearSyncQueue}
                  compact
                >
                  Clear All
                </Button>
              </View>

              <Text variant="bodySmall" style={styles.sectionDescription}>
                These actions will sync automatically when connection is restored
              </Text>

              <List.Section style={styles.actionsList}>
                {pendingActions.slice(0, 5).map((action, index) => (
                  <List.Item
                    key={action.id}
                    title={`${getActionTypeIcon(action.type)} ${action.type} ${action.endpoint}`}
                    description={`Retry ${action.retryCount}/${action.maxRetries} • ${formatTimestamp(action.timestamp)}`}
                    left={() => (
                      <View style={[styles.actionDot, { backgroundColor: getActionTypeColor(action.type) }]} />
                    )}
                    titleNumberOfLines={2}
                    descriptionStyle={styles.actionDescription}
                  />
                ))}
                
                {pendingActions.length > 5 && (
                  <Text variant="bodySmall" style={styles.moreActions}>
                    + {pendingActions.length - 5} more actions
                  </Text>
                )}
              </List.Section>
            </Card.Content>
          </Card>
        )}

        {/* Sync Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Sync Actions
            </Text>

            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={handleForceSync}
                disabled={!syncStats.connectionStatus || isSyncing || syncStats.pendingActions === 0}
                loading={isSyncing}
                style={[styles.actionButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
                icon="sync"
              >
                {isSyncing ? 'Syncing...' : 'Force Sync Now'}
              </Button>

              <Button
                mode="outlined"
                onPress={handleClearCache}
                style={styles.actionButton}
                icon="delete-sweep"
              >
                Clear Cache
              </Button>
            </View>

            <Text variant="bodySmall" style={styles.actionNote}>
              Force sync will attempt to sync all pending actions immediately.
              Clear cache will remove all offline data.
            </Text>
          </Card.Content>
        </Card>

        {/* Offline Capabilities */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Offline Capabilities
            </Text>

            <List.Section>
              <List.Item
                title="Class Browsing"
                description="View cached class information"
                left={() => <List.Icon icon="calendar" />}
                right={() => <Text style={styles.featureStatus}>✅ Available</Text>}
              />
              <List.Item
                title="Booking History"
                description="View your past bookings"
                left={() => <List.Icon icon="history" />}
                right={() => <Text style={styles.featureStatus}>✅ Available</Text>}
              />
              <List.Item
                title="Messages"
                description="Read cached messages"
                left={() => <List.Icon icon="message" />}
                right={() => <Text style={styles.featureStatus}>✅ Available</Text>}
              />
              <List.Item
                title="New Bookings"
                description="Create bookings (sync when online)"
                left={() => <List.Icon icon="plus" />}
                right={() => <Text style={styles.featureStatus}>⏳ Queued</Text>}
              />
              <List.Item
                title="Profile Updates"
                description="Update profile (sync when online)"
                left={() => <List.Icon icon="account-edit" />}
                right={() => <Text style={styles.featureStatus}>⏳ Queued</Text>}
              />
            </List.Section>
          </Card.Content>
        </Card>

        {/* Tips */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Offline Tips
            </Text>

            <View style={styles.tipsList}>
              <Text variant="bodyMedium" style={styles.tip}>
                💡 Data is automatically cached when you're online for offline access
              </Text>
              <Text variant="bodyMedium" style={styles.tip}>
                📱 Actions performed offline are queued and sync automatically when connection returns
              </Text>
              <Text variant="bodyMedium" style={styles.tip}>
                🔄 Pull down to refresh and check for latest sync status
              </Text>
              <Text variant="bodyMedium" style={styles.tip}>
                ⚡ Critical actions like payments require an internet connection
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button for Quick Sync */}
      {syncStats.connectionStatus && syncStats.pendingActions > 0 && (
        <FAB
          icon="sync"
          style={[styles.fab, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
          onPress={handleForceSync}
          loading={isSyncing}
          disabled={isSyncing}
        />
      )}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{
          label: 'Retry',
          onPress: () => loadSyncStatus(),
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
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    color: '#20366B',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    height: 28,
  },
  statusDescription: {
    color: '#666',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#20366B',
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
  },
  lastSync: {
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  actionsList: {
    marginVertical: 0,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  actionDescription: {
    color: '#999',
    fontSize: 12,
  },
  moreActions: {
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  actionNote: {
    color: '#666',
    lineHeight: 18,
    textAlign: 'center',
  },
  featureStatus: {
    color: '#666',
    fontSize: 12,
  },
  tipsList: {
    gap: 8,
  },
  tip: {
    color: '#666',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default OfflineSync;